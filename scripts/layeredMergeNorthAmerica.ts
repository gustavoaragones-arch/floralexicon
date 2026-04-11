/**
 * Phase 5C — North America ethnobotany layer on merged dataset.
 *
 * BASE:   data/merged/plants.json, data/merged/names.json
 * ENRICH: data/raw/na_ethnobotany.json
 * OUT:    data/merged/plants.json, data/merged/names.json (overwrite)
 *
 * Rules: enrich-only merge (no downgrades), union regions/uses/conditions,
 * max toxicity & evidence, optional sustainability + metadata.
 */

import * as fs from "fs";
import * as path from "path";
import { jsonrepair } from "jsonrepair";
import {
  normalizeScientificName,
  slugifyScientific,
} from "./mergeDataset";

const ROOT = path.resolve(__dirname, "..");
const MERGED = path.join(ROOT, "data", "merged");
const RAW = path.join(ROOT, "data", "raw");
const NA_PATH = path.join(RAW, "na_ethnobotany.json");
const CONDITIONS_PATH = path.join(RAW, "conditions_master.json");

type JsonRecord = Record<string, unknown>;

type ToxicLevel = "unknown" | "low" | "moderate" | "high" | "lethal";
const TOX_RANK: Record<ToxicLevel, number> = {
  unknown: 0,
  low: 1,
  moderate: 2,
  high: 3,
  lethal: 4,
};

type EvidLevel = "traditional" | "empirical" | "tramil" | "clinical";
const EVID_RANK: Record<EvidLevel, number> = {
  traditional: 0,
  empirical: 1,
  tramil: 2,
  clinical: 3,
};

/** Primary (Mexico / legacy merged) vs NA name rows — weighted confidence. */
const NAME_WEIGHT_PRIMARY = 1.0;
const NAME_WEIGHT_NA = 0.7;

function parseRaw(content: string, filename: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    console.warn("Repaired JSON:", filename);
    return JSON.parse(jsonrepair(content));
  }
}

function readJson(p: string, label: string): unknown {
  if (!fs.existsSync(p)) {
    console.error(`Missing ${label}: ${p}`);
    process.exit(1);
  }
  return parseRaw(fs.readFileSync(p, "utf8"), path.basename(p));
}

/** Binomial slug — same rule as layeredMergePhase5. */
function plantIdFromScientific(scientific: string): string {
  const n = normalizeScientificName(scientific);
  const tok = n.split(/\s+/).filter(Boolean);
  const binom = tok.length >= 2 ? `${tok[0]} ${tok[1]}` : tok[0] ?? "";
  return binom.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function normalizedNameKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s*\/\s*/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function displayNameLower(name: string): string {
  return name.trim().toLowerCase();
}

const NA_REGION_MAP: Record<string, string[]> = {
  NE: ["US_NE"],
  SE: ["US_SE"],
  SW: ["US_SW"],
  GP: ["US_GP"],
  PNW: ["US_PNW"],
  RC: ["US_RC"],
  AK: ["US_AK"],
  CA: ["US_CA"],
  NA: ["US", "CA"],
};

function mapNARegions(codes: unknown): string[] {
  if (!Array.isArray(codes)) return [];
  const out = new Set<string>();
  for (const c of codes) {
    if (typeof c !== "string") continue;
    const k = c.trim().toUpperCase();
    const mapped = NA_REGION_MAP[k];
    if (mapped) for (const x of mapped) out.add(x);
    else out.add(k);
  }
  return [...out];
}

/** Derive ISO countries from regional tokens (US_* → US; standalone CA → Canada). */
function inferCountriesFromNARegions(regionCodes: string[]): Set<string> {
  const countries = new Set<string>();
  for (const r of regionCodes) {
    const u = r.trim().toUpperCase();
    if (u === "CA") countries.add("CA");
    else if (u === "US" || u.startsWith("US_")) countries.add("US");
  }
  return countries;
}

function parseToxicLevel(s: string | undefined | null): ToxicLevel {
  const t = (s ?? "").toLowerCase().trim();
  if (t === "lethal") return "lethal";
  if (t === "high") return "high";
  if (t === "moderate" || t === "medium") return "moderate";
  if (t === "low") return "low";
  if (t === "none" || t === "minimal") return "low";
  return "unknown";
}

function maxToxic(a: ToxicLevel, b: ToxicLevel): ToxicLevel {
  return TOX_RANK[b] > TOX_RANK[a] ? b : a;
}

function parseEvidLevelMerged(raw: string | undefined | null): EvidLevel {
  const t = (raw ?? "").toLowerCase().trim();
  if (t === "clinical" || t === "experimental") return "clinical";
  if (t === "tramil") return "tramil";
  if (t === "empirical") return "empirical";
  return "traditional";
}

function maxEvid(a: EvidLevel, b: EvidLevel): EvidLevel {
  return EVID_RANK[b] > EVID_RANK[a] ? b : a;
}

function evidToConfidence(level: EvidLevel): number {
  if (level === "clinical") return 0.9;
  if (level === "tramil") return 0.65;
  if (level === "empirical") return 0.5;
  return 0.35;
}

function mergeNotes(a: string | null, b: string | null): string | null {
  const parts = [a, b].filter((x): x is string => !!x && x.trim().length > 0);
  if (parts.length === 0) return null;
  return [...new Set(parts.map((p) => p.trim()))].join(" | ").slice(0, 4000);
}

const ABORT_RE =
  /abortifacient|abortiva|abortivo|abortiv|aborto|emenagog|emmenagog|pregnancy|pregnant/i;

function parseSafetyText(safety: string): {
  level: ToxicLevel;
  types: Set<string>;
  contraindications: string[];
  lookalike: boolean;
  notes: string;
} {
  const s = (safety ?? "").trim();
  const lower = s.toLowerCase();
  let level: ToxicLevel = "unknown";
  if (/\bTOXIC\b|\blethal\b|strongly toxic|alkaloid.*toxic/i.test(s)) {
    if (/\blethal\b|deadly|fatal/i.test(lower)) level = "lethal";
    else level = maxToxic(level, "high");
  }
  if (/toxic internally|toxic in large|poison/i.test(lower)) {
    level = maxToxic(level, "high");
  }
  if (/generally safe|rare allergic|may slow absorption/i.test(lower) && level === "unknown") {
    level = "low";
  }

  const types = new Set<string>();
  if (ABORT_RE.test(s)) types.add("abortifacient");
  if (/emmenagog|uterine stimul/i.test(lower)) types.add("emmenagogue");

  const contraindications: string[] = [];
  if (/pregnancy|pregnant|not for pregnancy|avoid.*pregnancy/i.test(s)) {
    contraindications.push("pregnancy");
  }
  if (/blood thinner|anticoagul/i.test(lower)) contraindications.push("anticoagulant_interaction");
  if (/liver|hepatotoxic/i.test(lower)) contraindications.push("liver_caution");

  const lookalike = /do not confuse|look-?alike|lookalike|misidentif/i.test(s);

  return { level, types, contraindications, lookalike, notes: s };
}

function harvestToSustainability(
  harvest_status: unknown,
  harvest_notes: unknown
): { status: "safe" | "caution" | "at-risk"; notes: string | null } | null {
  const st = typeof harvest_status === "string" ? harvest_status.toLowerCase().trim() : "";
  const notes = typeof harvest_notes === "string" ? harvest_notes.trim() : null;
  if (st === "at-risk") return { status: "at-risk", notes: notes || null };
  if (st === "caution") return { status: "caution", notes: notes || null };
  if (st === "safe") return { status: "safe", notes: notes || null };
  return null;
}

function normalizeUses(traditional: string): string[] {
  const t = traditional.toLowerCase();
  const out = new Set<string>();
  if (/medicinal|immune|tonic|adaptogen|antimicrobial|analgesic|digestive/i.test(t)) {
    out.add("medicinal");
  }
  if (/tea|decoction|infusion|tisane|brew/i.test(t)) out.add("tea");
  if (/culinary|food|beverage/i.test(t)) out.add("culinary");
  if (/ritual|ceremon/i.test(t)) out.add("ritual");
  if (/topical|poultice|skin|wound/i.test(t)) out.add("topical");
  if (out.size === 0) out.add("medicinal");
  return [...out];
}

function buildConditionCatalog(data: unknown): {
  ids: Set<string>;
  slugifyUnknown: (s: string) => string;
} {
  const ids = new Set<string>();
  const o = data as JsonRecord;
  const arr = o.conditions;
  if (Array.isArray(arr)) {
    for (const row of arr) {
      if (row && typeof row === "object" && typeof (row as JsonRecord).id === "string") {
        ids.add(String((row as JsonRecord).id).trim());
      }
    }
  }
  return {
    ids,
    slugifyUnknown: (s: string) =>
      s
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 80) || "unknown_condition",
  };
}

function extractConditions(
  traditional: string,
  catalogIds: Set<string>,
  slugifyUnknown: (s: string) => string
): string[] {
  const t = traditional.toLowerCase();
  const found: string[] = [];
  const tryAdd = (phrase: string) => {
    const id = catalogIds.has(phrase) ? phrase : slugifyUnknown(phrase);
    if (id && !found.includes(id)) {
      found.push(id);
      catalogIds.add(id);
    }
  };
  if (/cold|flu|fever|cough/i.test(t)) tryAdd("respiratory_support");
  if (/digest|diarr|nausea|stomach/i.test(t)) tryAdd("digestive_complaints");
  if (/menstru|menopaus|women|childbirth|uterine/i.test(t)) tryAdd("womens_health");
  if (/wound|infection|skin|snake/i.test(t)) tryAdd("dermatologic_infection");
  if (/rheumat|arthr|pain/i.test(t)) tryAdd("musculoskeletal_pain");
  return found;
}

type WorkPlant = {
  plant_id: string;
  scientific_name: string;
  family: string;
  names: Set<string>;
  countries: Set<string>;
  regions: Set<string>;
  uses: Set<string>;
  conditions: Set<string>;
  toxicity: {
    level: ToxicLevel;
    type: Set<string>;
    notes: string | null;
    contraindications: Set<string>;
  };
  evidence: { level: EvidLevel; source: string; confidence: number };
  sustainability: { status: "safe" | "caution" | "at-risk"; notes: string | null } | null;
  metadata: JsonRecord;
  lookalikeRisk: boolean;
  mexicoNameHighAmbiguity: boolean;
  /** NA (or other) enrichment with subnational region codes — ranking hint. */
  geoPrecision: "regional" | "national" | null;
};

function workPlantFromMerged(row: JsonRecord): WorkPlant {
  const plant_id = String(row.plant_id ?? "").trim();
  const scientific_name = String(row.scientific_name ?? "").trim();
  const family = String(row.family ?? "").trim();
  const names = new Set<string>();
  for (const x of (row.names as unknown[]) ?? []) {
    if (typeof x === "string" && x.trim()) names.add(x.trim());
  }
  const countries = new Set<string>();
  for (const x of (row.countries as unknown[]) ?? []) {
    if (typeof x === "string" && x.trim()) countries.add(x.trim().toUpperCase());
  }
  const regions = new Set<string>();
  for (const x of (row.regions as unknown[]) ?? []) {
    if (typeof x === "string" && x.trim()) regions.add(x.trim().toUpperCase());
  }
  const uses = new Set<string>();
  for (const x of (row.uses as unknown[]) ?? []) {
    if (typeof x === "string" && x.trim()) uses.add(x.trim());
  }
  const conditions = new Set<string>();
  for (const x of (row.conditions as unknown[]) ?? []) {
    if (typeof x === "string" && x.trim()) conditions.add(x.trim());
  }
  const tox = row.toxicity as JsonRecord | undefined;
  const level = parseToxicLevel(typeof tox?.level === "string" ? tox.level : undefined);
  const types = new Set<string>();
  if (Array.isArray(tox?.type)) {
    for (const x of tox!.type as unknown[]) {
      if (typeof x === "string") types.add(x);
    }
  }
  const contraindications = new Set<string>();
  if (tox && typeof tox === "object" && Array.isArray((tox as JsonRecord).contraindications)) {
    for (const x of (tox as JsonRecord).contraindications as unknown[]) {
      if (typeof x === "string" && x.trim()) contraindications.add(x.trim());
    }
  }
  const ev = row.evidence as JsonRecord | undefined;
  const evidLevel = parseEvidLevelMerged(typeof ev?.level === "string" ? ev.level : undefined);
  const confidence =
    typeof ev?.confidence === "number" ? ev.confidence : evidToConfidence(evidLevel);
  const source = typeof ev?.source === "string" ? ev.source : "";

  let sustainability: WorkPlant["sustainability"] = null;
  const sus = row.sustainability as JsonRecord | undefined;
  if (sus && typeof sus.status === "string") {
    const st = sus.status.toLowerCase();
    if (st === "safe" || st === "caution" || st === "at-risk") {
      sustainability = {
        status: st as "safe" | "caution" | "at-risk",
        notes: typeof sus.notes === "string" ? sus.notes : null,
      };
    }
  }

  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? { ...(row.metadata as JsonRecord) }
      : {};

  let geoPrecision: WorkPlant["geoPrecision"] = null;
  const gp = row.geo_precision;
  if (gp === "regional" || gp === "national") geoPrecision = gp;

  return {
    plant_id,
    scientific_name,
    family,
    names,
    countries,
    regions,
    uses,
    conditions,
    toxicity: {
      level,
      type: types,
      notes: typeof tox?.notes === "string" ? tox.notes : null,
      contraindications,
    },
    evidence: {
      level: evidLevel,
      source,
      confidence,
    },
    sustainability,
    metadata,
    lookalikeRisk: row.lookalike_risk === true,
    mexicoNameHighAmbiguity: false,
    geoPrecision,
  };
}

function mergeSustainability(
  a: WorkPlant["sustainability"],
  b: WorkPlant["sustainability"]
): WorkPlant["sustainability"] {
  if (!a) return b;
  if (!b) return a;
  const rank = { safe: 0, caution: 1, "at-risk": 2 };
  const pick = rank[b.status] > rank[a.status] ? b : a;
  const other = pick === a ? b : a;
  return {
    status: pick.status,
    notes: mergeNotes(pick.notes, other.notes),
  };
}

function mergeWorkFromNA(
  target: WorkPlant,
  na: JsonRecord,
  catalogIds: Set<string>,
  slugifyUnknown: (s: string) => string
): void {
  const sci = String(na.scientific_name ?? "").trim();
  if (sci && sci.length > target.scientific_name.length) {
    target.scientific_name = sci;
  }
  const fam = String(na.family ?? "").trim();
  if (fam) target.family = fam;

  const trad = String(na.traditional_uses ?? "");
  for (const u of normalizeUses(trad)) target.uses.add(u);
  for (const c of extractConditions(trad, catalogIds, slugifyUnknown)) {
    target.conditions.add(c);
  }

  const naMappedRegions = mapNARegions(na.regions);
  for (const r of naMappedRegions) {
    target.regions.add(r);
  }
  for (const c of inferCountriesFromNARegions(naMappedRegions)) {
    target.countries.add(c);
  }
  target.geoPrecision = "regional";

  const safetyStr = String(na.safety ?? "");
  const parsed = parseSafetyText(safetyStr);
  target.toxicity.level = maxToxic(target.toxicity.level, parsed.level);
  for (const ty of parsed.types) target.toxicity.type.add(ty);
  for (const c of parsed.contraindications) target.toxicity.contraindications.add(c);
  target.toxicity.notes = mergeNotes(target.toxicity.notes, parsed.notes || null);
  target.lookalikeRisk = target.lookalikeRisk || parsed.lookalike;

  const naEvid = parseEvidLevelMerged(String(na.evidence_level ?? ""));
  target.evidence.level = maxEvid(target.evidence.level, naEvid);
  target.evidence.confidence = Math.max(
    target.evidence.confidence,
    evidToConfidence(naEvid)
  );
  const src = "NA_ethnobotany";
  target.evidence.source = target.evidence.source
    ? [...new Set(target.evidence.source.split("; ").concat(src))].join("; ")
    : src;

  const sus = harvestToSustainability(na.harvest_status, na.harvest_notes);
  if (sus) {
    target.sustainability = mergeSustainability(target.sustainability, sus);
  }

  const nations = na.nations_documented;
  const indig: string[] = [];
  if (Array.isArray(nations)) {
    for (const x of nations) {
      if (typeof x === "string" && x.trim()) indig.push(x.trim());
    }
  }
  if (indig.length) {
    const prev = (target.metadata.indigenous_nations as string[]) ?? [];
    target.metadata.indigenous_nations = [...new Set([...prev, ...indig])];
  }
  if (typeof na.native_status === "string") {
    target.metadata.native_status_na = na.native_status;
  }
  if (typeof na.harvest_status === "string") {
    target.metadata.harvest_status = na.harvest_status;
  }
  target.metadata.na_source = "na_ethnobotany_v1";

  for (const cn of (na.common_names as unknown[]) ?? []) {
    if (typeof cn === "string" && cn.trim()) target.names.add(cn.trim());
  }
}

function workPlantFromNA(
  na: JsonRecord,
  plant_id: string,
  catalogIds: Set<string>,
  slugifyUnknown: (s: string) => string
): WorkPlant {
  const scientific_name = String(na.scientific_name ?? "").trim();
  const family = String(na.family ?? "").trim();
  const names = new Set<string>();
  for (const cn of (na.common_names as unknown[]) ?? []) {
    if (typeof cn === "string" && cn.trim()) names.add(cn.trim());
  }
  const trad = String(na.traditional_uses ?? "");
  const uses = new Set(normalizeUses(trad));
  const conditions = new Set(
    extractConditions(trad, catalogIds, slugifyUnknown)
  );
  const safetyStr = String(na.safety ?? "");
  const parsed = parseSafetyText(safetyStr);
  const naEvid = parseEvidLevelMerged(String(na.evidence_level ?? ""));
  const sus = harvestToSustainability(na.harvest_status, na.harvest_notes);

  const nations = na.nations_documented;
  const indig: string[] = [];
  if (Array.isArray(nations)) {
    for (const x of nations) {
      if (typeof x === "string" && x.trim()) indig.push(x.trim());
    }
  }

  const naMapped = mapNARegions(na.regions);
  const regions = new Set(naMapped);
  const countries = inferCountriesFromNARegions(naMapped);

  return {
    plant_id,
    scientific_name,
    family,
    names,
    countries,
    regions,
    uses,
    conditions,
    toxicity: {
      level: parsed.level === "unknown" ? "low" : parsed.level,
      type: parsed.types,
      notes: parsed.notes || null,
      contraindications: new Set(parsed.contraindications),
    },
    evidence: {
      level: naEvid,
      source: "NA_ethnobotany",
      confidence: evidToConfidence(naEvid),
    },
    sustainability: sus,
    metadata: {
      indigenous_nations: indig,
      native_status: na.native_status,
      harvest_status: na.harvest_status,
      na_source: "na_ethnobotany_v1",
    },
    lookalikeRisk: parsed.lookalike,
    mexicoNameHighAmbiguity: false,
    geoPrecision: "regional",
  };
}

function resolveExistingPlantId(byId: Map<string, WorkPlant>, scientific: string): string | null {
  const want = plantIdFromScientific(scientific);
  if (byId.has(want)) return want;
  const full = slugifyScientific(scientific);
  if (byId.has(full)) return full;
  for (const [id, p] of byId) {
    if (plantIdFromScientific(p.scientific_name) === want) return id;
  }
  return null;
}

function workToOutput(p: WorkPlant): JsonRecord {
  let toxLevel = p.toxicity.level;
  if (toxLevel === "unknown") toxLevel = "low";
  const out: JsonRecord = {
    plant_id: p.plant_id,
    scientific_name: p.scientific_name,
    family: p.family,
    names: [...p.names].sort((a, b) => a.localeCompare(b, "en")),
    countries: [...p.countries].sort(),
    uses: [...p.uses].sort(),
    conditions: [...p.conditions].sort(),
    toxicity: {
      level: toxLevel,
      type: [...p.toxicity.type].sort(),
      notes: p.toxicity.notes,
    },
    evidence: {
      level: p.evidence.level,
      source: p.evidence.source || "layered merge",
      confidence: Math.min(
        1,
        Math.max(0, p.evidence.confidence, evidToConfidence(p.evidence.level))
      ),
    },
    regions: [...p.regions].sort(),
  };
  if (p.toxicity.contraindications.size > 0) {
    (out.toxicity as JsonRecord).contraindications = [
      ...p.toxicity.contraindications,
    ].sort();
  }
  if (p.lookalikeRisk) out.lookalike_risk = true;
  if (p.sustainability) {
    out.sustainability = {
      status: p.sustainability.status,
      notes: p.sustainability.notes,
    };
  }
  if (Object.keys(p.metadata).length > 0) out.metadata = p.metadata;
  if (p.geoPrecision) out.geo_precision = p.geoPrecision;
  return out;
}

type RawNameRow = {
  name: string;
  normalized: string;
  plant_id: string;
  lang: string;
  region: string;
  sourceAmbiguity?: string;
  /** Weight for hub confidence (primary 1.0, NA 0.7). */
  weight: number;
};

type DisambigEntry = {
  byPlant: Map<string, number>;
  ambiguity: string;
};

function loadDisambiguation(
  data: unknown,
  aliasToCanon: Map<string, string>
): Map<string, DisambigEntry> {
  const m = new Map<string, DisambigEntry>();
  const o = data as JsonRecord;
  const arr = o.disambiguation;
  if (!Array.isArray(arr)) return m;
  for (const row of arr) {
    if (!row || typeof row !== "object") continue;
    const r = row as JsonRecord;
    const q = typeof r.query === "string" ? r.query : "";
    if (!q.trim()) continue;
    const queryNorm = normalizedNameKey(q);
    const byPlant = new Map<string, number>();
    const results = r.results;
    if (Array.isArray(results)) {
      for (const x of results) {
        if (!x || typeof x !== "object") continue;
        const e = x as JsonRecord;
        let pid = typeof e.plant_id === "string" ? e.plant_id.trim() : "";
        pid = aliasToCanon.get(pid) ?? pid;
        const conf = typeof e.confidence === "number" ? e.confidence : 0;
        if (pid) byPlant.set(pid, conf);
      }
    }
    const amb = typeof r.ambiguity === "string" ? r.ambiguity : "low";
    m.set(queryNorm, { byPlant, ambiguity: amb });
  }
  return m;
}

function main() {
  const plantsPath = path.join(MERGED, "plants.json");
  const namesPath = path.join(MERGED, "names.json");

  const plantsBase = readJson(plantsPath, "merged plants") as unknown[];
  const namesBase = readJson(namesPath, "merged names") as unknown[];

  let conditionsData: unknown = { conditions: [] };
  if (fs.existsSync(CONDITIONS_PATH)) {
    conditionsData = readJson(CONDITIONS_PATH, "conditions_master");
  }
  const { ids: catalogIds, slugifyUnknown } = buildConditionCatalog(conditionsData);

  const naData = readJson(NA_PATH, "na_ethnobotany") as JsonRecord;
  const naPlants = (naData.plants as unknown[]) ?? [];

  const plantsBefore = plantsBase.length;
  const namesBefore = namesBase.length;

  const byId = new Map<string, WorkPlant>();
  for (const row of plantsBase) {
    if (!row || typeof row !== "object") continue;
    const p = workPlantFromMerged(row as JsonRecord);
    if (p.plant_id) byId.set(p.plant_id, p);
  }

  let newPlants = 0;
  const enrichedIds = new Set<string>();

  for (const row of naPlants) {
    if (!row || typeof row !== "object") continue;
    const na = row as JsonRecord;
    const sci = String(na.scientific_name ?? "").trim();
    if (!sci) continue;
    const existingId = resolveExistingPlantId(byId, sci);
    const id = existingId ?? plantIdFromScientific(sci);
    if (existingId) {
      mergeWorkFromNA(byId.get(existingId)!, na, catalogIds, slugifyUnknown);
      enrichedIds.add(existingId);
    } else {
      byId.set(id, workPlantFromNA(na, id, catalogIds, slugifyUnknown));
      newPlants++;
    }
  }
  const enrichedPlants = enrichedIds.size;

  const rawNames: RawNameRow[] = [];

  for (const row of namesBase) {
    if (!row || typeof row !== "object") continue;
    const r = row as JsonRecord;
    const display = typeof r.name === "string" ? r.name : "";
    const norm =
      typeof r.normalized === "string" && r.normalized.trim()
        ? String(r.normalized).trim()
        : normalizedNameKey(display);
    const pid = typeof r.plant_id === "string" ? r.plant_id.trim() : "";
    if (!display || !pid) continue;
    const lang = typeof r.lang === "string" ? r.lang : "en";
    const region =
      typeof r.region === "string" && r.region.trim()
        ? r.region.trim().toLowerCase()
        : "global";
    rawNames.push({
      name: displayNameLower(display),
      normalized: norm,
      plant_id: pid,
      lang,
      region,
      sourceAmbiguity:
        typeof r.sourceAmbiguity === "string" ? r.sourceAmbiguity : undefined,
      weight: NAME_WEIGHT_PRIMARY,
    });
  }

  for (const row of naPlants) {
    if (!row || typeof row !== "object") continue;
    const na = row as JsonRecord;
    const sci = String(na.scientific_name ?? "").trim();
    if (!sci) continue;
    const existingId = resolveExistingPlantId(byId, sci);
    const id = existingId ?? plantIdFromScientific(sci);
    if (!byId.has(id)) continue;

    for (const cn of (na.common_names as unknown[]) ?? []) {
      if (typeof cn !== "string" || !cn.trim()) continue;
      const nm = displayNameLower(cn);
      const norm = normalizedNameKey(cn);
      rawNames.push({
        name: nm,
        normalized: norm,
        plant_id: id,
        lang: "en",
        region: "us",
        weight: NAME_WEIGHT_NA,
      });
      rawNames.push({
        name: nm,
        normalized: norm,
        plant_id: id,
        lang: "en",
        region: "ca",
        weight: NAME_WEIGHT_NA,
      });
    }
  }

  const dedupeKey = (r: RawNameRow) =>
    `${r.normalized}\0${r.plant_id}\0${r.name}\0${r.lang}\0${r.region}`;
  const seen = new Set<string>();
  const uniqueRaw: RawNameRow[] = [];
  for (const r of rawNames) {
    const k = dedupeKey(r);
    if (seen.has(k)) continue;
    seen.add(k);
    uniqueRaw.push(r);
  }

  const plantIdSet = new Set(byId.keys());
  const groupCounts = new Map<string, Map<string, number>>();
  for (const r of uniqueRaw) {
    if (!plantIdSet.has(r.plant_id)) continue;
    if (!groupCounts.has(r.normalized)) groupCounts.set(r.normalized, new Map());
    const g = groupCounts.get(r.normalized)!;
    const w = r.weight > 0 ? r.weight : NAME_WEIGHT_PRIMARY;
    g.set(r.plant_id, (g.get(r.plant_id) ?? 0) + w);
  }

  const disPath = path.join(RAW, "disambiguation_master.json");
  const disMap = fs.existsSync(disPath)
    ? loadDisambiguation(readJson(disPath, "disambiguation_master"), new Map())
    : new Map<string, DisambigEntry>();

  const namesOut: JsonRecord[] = [];
  const ambiguityClusterIds = new Set<string>();
  const highRiskClusters = new Set<string>();

  for (const r of uniqueRaw) {
    if (!plantIdSet.has(r.plant_id)) continue;
    const g = groupCounts.get(r.normalized);
    if (!g) continue;
    const distinctPlants = new Set(g.keys()).size;
    const totalRows = [...g.values()].reduce((a, b) => a + b, 0);
    const c = g.get(r.plant_id) ?? 0;

    const dis = disMap.get(r.normalized);
    let confidence: number;
    let ambiguity: string;
    let cluster: string | undefined;

    if (dis && dis.byPlant.size > 0 && dis.byPlant.has(r.plant_id)) {
      confidence = dis.byPlant.get(r.plant_id)!;
      ambiguity =
        dis.ambiguity === "high" ? "high" : distinctPlants > 1 ? "high" : "low";
    } else if (distinctPlants > 1) {
      ambiguity = "high";
      cluster = `amb_${r.normalized}`;
      ambiguityClusterIds.add(cluster);
      confidence = totalRows > 0 ? Math.round((c / totalRows) * 1000) / 1000 : 0;
    } else {
      ambiguity = "low";
      confidence = 1;
    }

    if (dis && dis.ambiguity === "high" && !cluster && distinctPlants > 1) {
      cluster = `amb_${r.normalized}`;
      ambiguityClusterIds.add(cluster);
    }

    const plant = byId.get(r.plant_id)!;
    let risk: string | undefined;
    if (plant.toxicity.level === "lethal") risk = "lethal";
    else if (plant.toxicity.level === "high") risk = "high";
    else if (
      plant.mexicoNameHighAmbiguity &&
      plant.lookalikeRisk &&
      r.sourceAmbiguity?.toLowerCase() === "high"
    ) {
      risk = "high";
    }

    if (cluster && risk) highRiskClusters.add(cluster);

    const row: JsonRecord = {
      name: r.name,
      normalized: r.normalized,
      plant_id: r.plant_id,
      lang: r.lang,
      region: r.region,
      ambiguity,
      confidence,
    };
    if (cluster) row.cluster = cluster;
    if (risk) row.risk = risk;
    namesOut.push(row);
  }

  namesOut.sort((a, b) => {
    const na = String(a.normalized);
    const nb = String(b.normalized);
    if (na !== nb) return na.localeCompare(nb);
    return String(a.plant_id).localeCompare(String(b.plant_id));
  });

  const plantsOut = [...byId.values()]
    .map(workToOutput)
    .sort((a, b) => String(a.plant_id).localeCompare(String(b.plant_id)));

  fs.mkdirSync(MERGED, { recursive: true });
  fs.writeFileSync(
    path.join(MERGED, "plants.json"),
    JSON.stringify(plantsOut, null, 2) + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(MERGED, "names.json"),
    JSON.stringify(namesOut, null, 2) + "\n",
    "utf8"
  );

  let lethal = 0;
  let abort = 0;
  let sustainAtRisk = 0;
  for (const p of byId.values()) {
    if (p.toxicity.level === "lethal") lethal++;
    if (p.toxicity.type.has("abortifacient")) abort++;
    if (p.sustainability?.status === "at-risk") sustainAtRisk++;
  }

  console.log("\nNorth America integration summary:\n");
  console.log(`Plants before:     ${plantsBefore}`);
  console.log(`Plants after:      ${plantsOut.length}`);
  console.log(`New plants added:  ${newPlants}`);
  console.log(`Plants enriched:   ${enrichedPlants}`);
  console.log("");
  console.log(`Names before:      ${namesBefore}`);
  console.log(`Names after:       ${namesOut.length}`);
  console.log("");
  console.log(`Ambiguity clusters (distinct): ${ambiguityClusterIds.size}`);
  console.log(`High-risk clusters (toxic):    ${highRiskClusters.size}`);
  console.log("");
  console.log(`Plants with lethal toxicity:        ${lethal}`);
  console.log(`Plants with abortifacient flags:    ${abort}`);
  console.log(`Plants with sustainability at-risk: ${sustainAtRisk}`);
  console.log("");
  console.log("Wrote: data/merged/plants.json");
  console.log("Wrote: data/merged/names.json");
}

main();
