/**
 * Phase 5D — Spain ethnobotany layer on merged dataset.
 *
 * BASE:   data/merged/plants.json, data/merged/names.json
 * ENRICH: data/raw/spain_ethnobotany.json
 * OPT:    data/raw/conditions_master.json, data/raw/disambiguation_master.json
 *
 * OUT:    data/merged/plants.json, data/merged/names.json (overwrite)
 *
 * Enrich-only by binomial (plantIdFromScientific + resolveExistingPlantId).
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
const SPAIN_PATH = path.join(RAW, "spain_ethnobotany.json");
const CONDITIONS_PATH = path.join(RAW, "conditions_master.json");
const DIS_PATH = path.join(RAW, "disambiguation_master.json");

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

const NAME_WEIGHT_PRIMARY = 1.0;
const NAME_WEIGHT_ES = 0.9;

const ES_SOURCE = "Spain ethnobotany dataset";

/** Optional Spanish token → condition id (must exist in catalog or will be slugified). */
const SPANISH_CONDITION_ALIASES: Record<string, string> = {
  tos: "respiratory_support",
  cough: "respiratory_support",
  respiratoria: "respiratory_support",
  digestivo: "digestive_complaints",
  digestiva: "digestive_complaints",
  digestión: "digestive_complaints",
  digestion: "digestive_complaints",
  menstrual: "womens_health",
  embarazo: "womens_health",
  ansiedad: "anxiety_support",
  estrés: "stress_support",
  sueño: "sleep_support",
  circulación: "circulation_support",
  circulacion: "circulation_support",
  articulares: "musculoskeletal_pain",
  infecciones: "dermatologic_infection",
};

const SPAIN_BIOME_REGION: Record<string, string> = {
  mediterranean: "ES_MEDITERRANEAN",
  iberian: "ES_IBERIAN",
  andalusian: "ES_ANDALUSIAN",
  castilian: "ES_CASTILIAN",
  mediterranean_europe: "ES_MEDITERRANEAN_EU",
  spanish_traditional: "ES_TRADITIONAL",
};

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

function dedupePipeNotes(s: string | null): string | null {
  if (!s?.trim()) return null;
  const segs = s
    .split(/\s*\|\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  return [...new Set(segs)].join(" | ").slice(0, 4000);
}

const ABORT_RE =
  /abortifacient|abortiva|abortivo|abortiv|aborto|emenagog|emmenagog/i;

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

const MAX_CONDITION_ID_LEN = 48;

function mapConditionToken(
  raw: string,
  catalogIds: Set<string>,
  slugifyUnknown: (s: string) => string
): string {
  const t = raw.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (!t || t.length > MAX_CONDITION_ID_LEN) return "";
  const alias = SPANISH_CONDITION_ALIASES[t];
  if (alias && catalogIds.has(alias)) return alias;
  if (alias) {
    catalogIds.add(alias);
    return alias;
  }
  if (catalogIds.has(t)) return t;
  const slug = slugifyUnknown(t);
  if (slug.length > MAX_CONDITION_ID_LEN) return "";
  if (!catalogIds.has(slug)) catalogIds.add(slug);
  return slug;
}

/** Heuristic condition extraction from Spanish / mixed traditional use text. */
function extractConditionsFromSpainText(
  text: string,
  catalogIds: Set<string>,
  slugifyUnknown: (s: string) => string
): string[] {
  const t = text.toLowerCase();
  const found: string[] = [];
  const add = (phrase: string) => {
    const p = phrase.trim();
    if (!p || p.length > MAX_CONDITION_ID_LEN) return;
    const id = mapConditionToken(p, catalogIds, slugifyUnknown);
    if (id && !found.includes(id)) found.push(id);
  };
  for (const word of t.split(/[^a-záéíóúñü]+/i)) {
    if (word.length < 3) continue;
    const id = SPANISH_CONDITION_ALIASES[word];
    if (id) add(id);
  }
  if (/tos|cough|respirator/i.test(t)) add("respiratory_support");
  if (/digest|digestivo|digestiva|estómago|estomago/i.test(t)) add("digestive_complaints");
  if (/menstru|embarazo|uterin|emmenagog/i.test(t)) add("womens_health");
  if (/infecci|respiratoria|pecho|tos\b/i.test(t)) add("respiratory_support");
  if (/ansiedad|estrés|estres|sueño|sueno|calm/i.test(t)) add("anxiety_support");
  if (
    /articul|circul|muscular|rheum|artritis|lumbago/i.test(t) ||
    /\bdolor(es)?\b.*(articul|muscular|lumbar|rheum)/i.test(t)
  ) {
    add("musculoskeletal_pain");
  }
  if (/piel|herida|infecci/i.test(t)) add("dermatologic_infection");
  return found;
}

function normalizeUsesFromText(traditional: string): string[] {
  const t = traditional.toLowerCase();
  const out = new Set<string>();
  if (/medicinal|immune|tonic|digest|respir|infecci|ansiedad|dolor/i.test(t)) {
    out.add("medicinal");
  }
  if (/tea|decoction|infusion|tisane|brew|infusión/i.test(t)) out.add("tea");
  if (/culinary|food|beverage|culinari/i.test(t)) out.add("culinary");
  if (/ritual|ceremon/i.test(t)) out.add("ritual");
  if (/topical|poultice|skin|wound|tópico/i.test(t)) out.add("topical");
  if (out.size === 0) out.add("medicinal");
  return [...out];
}

function parseSpainSafetyStrings(
  toxicity_level: string | undefined,
  contras: unknown
): {
  level: ToxicLevel;
  types: Set<string>;
  contraSet: Set<string>;
  notes: string[];
} {
  let level = parseToxicLevel(toxicity_level);
  const types = new Set<string>();
  const contraSet = new Set<string>();
  const notes: string[] = [];
  const parts: string[] = [];
  if (Array.isArray(contras)) {
    for (const c of contras) {
      if (typeof c === "string" && c.trim()) {
        parts.push(c.trim());
        const low = c.toLowerCase();
        if (/embarazo|pregnancy|lactancia|embaraz/i.test(low)) {
          contraSet.add("pregnancy");
        }
        if (/tóxico|toxico|toxic/i.test(low)) {
          level = maxToxic(level, "high");
        }
        if (ABORT_RE.test(c)) types.add("abortifacient");
      }
    }
  }
  if (parts.length) notes.push(parts.join("; "));
  return { level, types, contraSet, notes };
}

function mapSpainGeoRegions(row: JsonRecord): string[] {
  const out = new Set<string>();
  out.add("ES");
  const biomes = row.biomes as unknown[] | undefined;
  if (Array.isArray(biomes)) {
    for (const b of biomes) {
      if (typeof b !== "string") continue;
      const k = b.toLowerCase().trim();
      const code = SPAIN_BIOME_REGION[k] ?? `ES_${k.toUpperCase().replace(/\s+/g, "_")}`;
      out.add(code);
    }
  }
  const cult = row.cultural_regions as unknown[] | undefined;
  if (Array.isArray(cult)) {
    for (const b of cult) {
      if (typeof b !== "string") continue;
      const k = b.toLowerCase().trim();
      const code = SPAIN_BIOME_REGION[k] ?? `ES_${k.toUpperCase().replace(/\s+/g, "_")}`;
      out.add(code);
    }
  }
  const countries = row.countries as unknown[] | undefined;
  if (Array.isArray(countries)) {
    for (const c of countries) {
      if (typeof c === "string" && c.trim()) out.add(c.trim().toUpperCase());
    }
  }
  return [...out];
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

function applySpainAbortifacientTaxa(p: WorkPlant): void {
  const id = p.plant_id.toLowerCase();
  if (
    /^ruta_/.test(id) ||
    id === "artemisia_absinthium" ||
    id === "artemisia_abrotanum" ||
    id === "mentha_pulegium" ||
    id === "chelidonium_majus"
  ) {
    p.toxicity.type.add("abortifacient");
  }
}

function workPlantFromSpainNew(row: JsonRecord, plant_id: string): WorkPlant {
  const scientific_name = String(row.scientific_name ?? "").trim();
  const family = String(row.family ?? "").trim();
  const names = new Set<string>();
  const countries = new Set<string>(["ES"]);
  const regions = new Set<string>(["ES"]);
  for (const o of (row.origin_regions as unknown[]) ?? []) {
    if (typeof o === "string" && o.trim()) regions.add(o.trim().toUpperCase());
  }
  const uses = new Set<string>();
  for (const u of (row.primary_uses as unknown[]) ?? []) {
    if (typeof u === "string" && u.trim()) uses.add(u.trim().toLowerCase());
  }
  const conditions = new Set<string>();
  const genus = String(row.genus ?? "").trim();
  const rank = String(row.rank ?? "").trim();
  const native_status = String(row.native_status ?? "").trim();
  const plant_type = String(row.plant_type ?? "").trim();

  const wp: WorkPlant = {
    plant_id,
    scientific_name,
    family,
    names,
    countries,
    regions,
    uses,
    conditions,
    toxicity: {
      level: "low",
      type: new Set(),
      notes: null,
      contraindications: new Set(),
    },
    evidence: {
      level: "traditional",
      source: "Spain_ethnobotany",
      confidence: 0.5,
    },
    sustainability: null,
    metadata: {
      genus,
      rank,
      native_status,
      plant_type,
      es_source: ES_SOURCE,
    },
    lookalikeRisk: false,
    mexicoNameHighAmbiguity: false,
    geoPrecision: "regional",
  };
  applySpainAbortifacientTaxa(wp);
  return wp;
}

function mergeSpainPlantRow(target: WorkPlant, row: JsonRecord): void {
  target.countries.add("ES");
  for (const o of (row.origin_regions as unknown[]) ?? []) {
    if (typeof o === "string" && o.trim()) target.regions.add(o.trim().toUpperCase());
  }
  for (const u of (row.primary_uses as unknown[]) ?? []) {
    if (typeof u === "string" && u.trim()) target.uses.add(u.trim().toLowerCase());
  }
  target.metadata.es_source = ES_SOURCE;
  if (typeof row.native_status === "string" && row.native_status.trim()) {
    target.metadata.native_status_es = row.native_status.trim();
  }
  if (typeof row.plant_type === "string" && row.plant_type.trim()) {
    target.metadata.plant_type_es = row.plant_type.trim();
  }

  const spainEvid = parseEvidLevelMerged("traditional");
  target.evidence.level = maxEvid(target.evidence.level, spainEvid);
  target.evidence.confidence = Math.max(target.evidence.confidence, 0.5, evidToConfidence(spainEvid));
  const src = "Spain_ethnobotany";
  target.evidence.source = target.evidence.source
    ? [...new Set(target.evidence.source.split("; ").concat(src))].join("; ")
    : src;

  const sus = harvestToSustainability(row.harvest_status, row.harvest_notes);
  if (sus) target.sustainability = mergeSustainability(target.sustainability, sus);

  target.geoPrecision = "regional";
  applySpainAbortifacientTaxa(target);
}

function mergeSpainUseCategories(
  target: WorkPlant,
  categories: unknown,
  catalogIds: Set<string>,
  slugifyUnknown: (s: string) => string
): void {
  if (!categories || typeof categories !== "object") return;
  for (const [, arr] of Object.entries(categories as JsonRecord)) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const u = item as JsonRecord;
      const useText = typeof u.use === "string" ? u.use : "";
      if (!useText.trim()) continue;
      for (const x of normalizeUsesFromText(useText)) target.uses.add(x);
      for (const c of extractConditionsFromSpainText(useText, catalogIds, slugifyUnknown)) {
        if (c.length <= MAX_CONDITION_ID_LEN && /^[a-z0-9_]+$/.test(c)) {
          target.conditions.add(c);
        }
      }
      if (
        /menstru|uterin|emmenagog/i.test(useText) &&
        !/articul|artritis|muscular|lumbago|rheum/i.test(useText)
      ) {
        target.conditions.delete("musculoskeletal_pain");
      }
      const ev = parseEvidLevelMerged(typeof u.evidence_level === "string" ? u.evidence_level : "traditional");
      target.evidence.level = maxEvid(target.evidence.level, ev);
      target.evidence.confidence = Math.max(
        target.evidence.confidence,
        evidToConfidence(ev),
        0.5
      );
    }
  }
}

function mergeSpainSafetyBlock(
  target: WorkPlant,
  block: JsonRecord
): void {
  const parsed = parseSpainSafetyStrings(
    typeof block.toxicity_level === "string" ? block.toxicity_level : undefined,
    block.contraindications
  );
  target.toxicity.level = maxToxic(target.toxicity.level, parsed.level);
  for (const t of parsed.types) target.toxicity.type.add(t);
  for (const c of parsed.contraSet) target.toxicity.contraindications.add(c);
  if (parsed.notes.length) {
    const chunk = parsed.notes.join(" | ");
    const prev = String(target.toxicity.notes ?? "");
    if (chunk && !prev.includes(chunk)) {
      target.toxicity.notes = mergeNotes(target.toxicity.notes, chunk);
    }
  }
  applySpainAbortifacientTaxa(target);
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
      notes: dedupePipeNotes(p.toxicity.notes),
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

/** Drop slugified free-text mistaken for condition IDs (legacy / edge cases). */
function scrubOversizedConditionIds(p: WorkPlant): void {
  for (const c of [...p.conditions]) {
    if (c.length > MAX_CONDITION_ID_LEN) p.conditions.delete(c);
  }
}

function validateOutputs(
  plantsOut: JsonRecord[],
  namesOut: JsonRecord[]
): void {
  const ids = new Set<string>();
  for (const p of plantsOut) {
    const id = String(p.plant_id ?? "");
    if (!id) throw new Error("Plant missing plant_id");
    if (ids.has(id)) throw new Error(`Duplicate plant_id: ${id}`);
    ids.add(id);
  }
  const nameKeys = new Set<string>();
  for (const n of namesOut) {
    const pid = String(n.plant_id ?? "");
    if (!ids.has(pid)) throw new Error(`Orphan plant_id in names: ${pid} (${n.name})`);
    const k = `${n.normalized}\0${pid}\0${String(n.lang)}\0${String(n.region)}`;
    if (nameKeys.has(k)) throw new Error(`Duplicate name row: ${k}`);
    nameKeys.add(k);
  }
  console.log("Validation OK: no duplicate plants, no orphan names, no duplicate name keys.");
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

  const spainRoot = readJson(SPAIN_PATH, "spain_ethnobotany") as JsonRecord;
  const spainPlants = (spainRoot.plants as unknown[]) ?? [];
  const spainNames = (spainRoot.names as unknown[]) ?? [];
  const spainUses = (spainRoot.uses as unknown[]) ?? [];
  const spainSafety = (spainRoot.safety as unknown[]) ?? [];
  const spainGeo = (spainRoot.geo_distribution as unknown[]) ?? [];

  const plantsBefore = plantsBase.length;
  const namesBefore = namesBase.length;

  const byId = new Map<string, WorkPlant>();
  for (const row of plantsBase) {
    if (!row || typeof row !== "object") continue;
    const p = workPlantFromMerged(row as JsonRecord);
    if (p.plant_id) byId.set(p.plant_id, p);
  }

  const spainFileIdToResolved = new Map<string, string>();
  let newPlants = 0;

  for (const row of spainPlants) {
    if (!row || typeof row !== "object") continue;
    const sr = row as JsonRecord;
    const sci = String(sr.scientific_name ?? "").trim();
    if (!sci) continue;
    const sid = String(sr.id ?? "").trim();
    const resolved = resolveExistingPlantId(byId, sci) ?? plantIdFromScientific(sci);
    if (sid) spainFileIdToResolved.set(sid, resolved);

    if (!byId.has(resolved)) {
      byId.set(resolved, workPlantFromSpainNew(sr, resolved));
      newPlants++;
    }
    mergeSpainPlantRow(byId.get(resolved)!, sr);
  }

  const resolveSpainRef = (rawId: string): string | undefined => {
    const k = rawId.trim();
    return spainFileIdToResolved.get(k) ?? (byId.has(k) ? k : undefined);
  };

  for (const row of spainUses) {
    if (!row || typeof row !== "object") continue;
    const u = row as JsonRecord;
    const sid = String(u.plant_id ?? "").trim();
    const resolved = resolveSpainRef(sid);
    if (!resolved || !byId.has(resolved)) continue;
    const target = byId.get(resolved)!;
    mergeSpainUseCategories(target, u.categories, catalogIds, slugifyUnknown);
    target.metadata.es_source = ES_SOURCE;
  }

  for (const row of spainSafety) {
    if (!row || typeof row !== "object") continue;
    const s = row as JsonRecord;
    const sid = String(s.plant_id ?? "").trim();
    const resolved = resolveSpainRef(sid);
    if (!resolved || !byId.has(resolved)) continue;
    mergeSpainSafetyBlock(byId.get(resolved)!, s);
    byId.get(resolved)!.metadata.es_source = ES_SOURCE;
  }

  for (const row of spainGeo) {
    if (!row || typeof row !== "object") continue;
    const g = row as JsonRecord;
    const sid = String(g.plant_id ?? "").trim();
    const resolved = resolveSpainRef(sid);
    if (!resolved || !byId.has(resolved)) continue;
    const target = byId.get(resolved)!;
    for (const r of mapSpainGeoRegions(g)) {
      target.regions.add(r);
    }
    target.countries.add("ES");
    target.geoPrecision = "regional";
    target.metadata.es_source = ES_SOURCE;
  }

  const enrichedIds = new Set(spainFileIdToResolved.values());

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

  for (const row of spainNames) {
    if (!row || typeof row !== "object") continue;
    const n = row as JsonRecord;
    const display = typeof n.name === "string" ? n.name : "";
    if (!display.trim()) continue;
    const pids = (n.plant_ids as unknown[]) ?? [];
    const primarySpainId = typeof pids[0] === "string" ? pids[0].trim() : "";
    const resolved = resolveSpainRef(primarySpainId);
    if (!resolved || !byId.has(resolved)) continue;

    const rawNorm = typeof n.normalized === "string" ? n.normalized : display;
    const norm = normalizedNameKey(rawNorm);
    const nm = displayNameLower(display);
    rawNames.push({
      name: nm,
      normalized: norm,
      plant_id: resolved,
      lang: "es",
      region: "es",
      weight: NAME_WEIGHT_ES,
      sourceAmbiguity:
        typeof n.ambiguity_level === "string" ? n.ambiguity_level : undefined,
    });
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

  for (const [, g] of groupCounts) {
    if (new Set(g.keys()).size > 1) {
      for (const pid of g.keys()) {
        const p = byId.get(pid);
        if (p) p.lookalikeRisk = true;
      }
    }
  }

  const disMap = fs.existsSync(DIS_PATH)
    ? loadDisambiguation(readJson(DIS_PATH, "disambiguation_master"), new Map())
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

  for (const p of byId.values()) scrubOversizedConditionIds(p);

  const plantsOut = [...byId.values()]
    .map(workToOutput)
    .sort((a, b) => String(a.plant_id).localeCompare(String(b.plant_id)));

  validateOutputs(plantsOut, namesOut);

  fs.mkdirSync(MERGED, { recursive: true });
  fs.writeFileSync(plantsPath, JSON.stringify(plantsOut, null, 2) + "\n", "utf8");
  fs.writeFileSync(namesPath, JSON.stringify(namesOut, null, 2) + "\n", "utf8");

  console.log("\nSpain ethnobotany integration summary:\n");
  console.log(`Plants before:     ${plantsBefore}`);
  console.log(`Plants after:      ${plantsOut.length}`);
  console.log(`New plants added:  ${newPlants}`);
  console.log(`Spain-linked IDs:  ${enrichedIds.size}`);
  console.log("");
  console.log(`Names before:      ${namesBefore}`);
  console.log(`Names after:       ${namesOut.length}`);
  console.log("");
  console.log(`Ambiguity clusters: ${ambiguityClusterIds.size}`);
  console.log(`High-risk clusters: ${highRiskClusters.size}`);
  console.log("");
  console.log("Wrote: data/merged/plants.json");
  console.log("Wrote: data/merged/names.json");
}

main();
