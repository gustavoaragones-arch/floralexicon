/**
 * Phase 5 — Layered merge (keep all work).
 *
 * BASE:   data/canonical/plants.json + data/canonical/names.json
 *         (if names missing, uses data/processed/names.json)
 * ENRICH: plants_master, names_master, disambiguation_master, conditions_master,
 *         mexico_floralexicon.json (data/raw)
 *
 * OUT:    data/merged/plants.json, data/merged/names.json
 */

import * as fs from "fs";
import * as path from "path";
import { jsonrepair } from "jsonrepair";
import {
  normalizeScientificName,
  slugifyScientific,
} from "./mergeDataset";

const ROOT = path.resolve(__dirname, "..");
const RAW = path.join(ROOT, "data", "raw");
const CANONICAL_DIR = path.join(ROOT, "data", "canonical");
const PROCESSED_NAMES_FALLBACK = path.join(ROOT, "data", "processed", "names.json");
const OUT = path.join(ROOT, "data", "merged");

type JsonRecord = Record<string, unknown>;

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

/** Binomial slug — aligns Mexico / master with canonical `id`. */
function binomialPlantId(scientific: string): string {
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

const ES_ISO = new Set([
  "AR", "BO", "CL", "CO", "CR", "CU", "DO", "EC", "ES", "GT", "HN",
  "MX", "NI", "PA", "PE", "PY", "SV", "UY", "VE",
]);

type ToxicLevel = "unknown" | "low" | "moderate" | "high" | "lethal";
const TOX_RANK: Record<ToxicLevel, number> = {
  unknown: 0,
  low: 1,
  moderate: 2,
  high: 3,
  lethal: 4,
};

type EvidLevel = "traditional" | "tramil" | "clinical";
const EVID_RANK: Record<EvidLevel, number> = {
  traditional: 0,
  tramil: 1,
  clinical: 2,
};

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

function parseEvidLevel(s: string | undefined | null): EvidLevel {
  const t = (s ?? "").toLowerCase().trim();
  if (t === "clinical" || t === "experimental") return "clinical";
  if (t === "tramil") return "tramil";
  return "traditional";
}

function maxEvid(a: EvidLevel, b: EvidLevel): EvidLevel {
  return EVID_RANK[b] > EVID_RANK[a] ? b : a;
}

function evidToConfidence(level: EvidLevel): number {
  if (level === "clinical") return 0.9;
  if (level === "tramil") return 0.65;
  return 0.35;
}

const ABORT_RE =
  /abortifacient|abortiva|abortivo|abortiv|aborto|emenagog|emmenagog|zoapatli|cihuapatli/i;

function detectAbortifacient(text: string): boolean {
  return ABORT_RE.test(text);
}

const REGION_ALIASES: Record<string, string> = {
  mexico: "MX",
  europe: "EUROPE",
  "central america": "CENTRAL_AMERICA",
  "north america": "NORTH_AMERICA",
  "south america": "SOUTH_AMERICA",
  "tropical americas": "TROPICAL_AMERICAS",
  eurasia: "EURASIA",
  asia: "ASIA",
  "north africa": "NORTH_AFRICA",
};

function normalizeRegionToken(s: string): string {
  const t = s.trim();
  if (!t) return "";
  const up = t.toUpperCase();
  if (/^[A-Z]{2}$/.test(up)) return up;
  const k = t.toLowerCase();
  return REGION_ALIASES[k] ?? t.replace(/\s+/g, "_").toUpperCase();
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

function mapCondition(
  raw: string,
  catalogIds: Set<string>,
  slugifyUnknown: (s: string) => string
): string {
  const t = raw.trim();
  if (!t) return "";
  if (catalogIds.has(t)) return t;
  const slug = slugifyUnknown(t);
  if (catalogIds.has(slug)) return slug;
  return slug;
}

function mapConditionList(
  list: unknown,
  catalogIds: Set<string>,
  slugifyUnknown: (s: string) => string
): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const x of list) {
    if (typeof x !== "string") continue;
    const id = mapCondition(x, catalogIds, slugifyUnknown);
    if (id) out.push(id);
  }
  return out;
}

type InternalPlant = {
  plant_id: string;
  scientific_name: string;
  family: string;
  names: string[];
  countries: string[];
  uses: string[];
  conditions: Set<string>;
  toxicity: { level: ToxicLevel; type: Set<string>; notes: string | null };
  evidence: { level: EvidLevel; source: string; confidence: number };
  enrichmentRegions: Set<string>;
  lookalikeRisk: boolean;
  mexicoNameHighAmbiguity: boolean;
};

function emptyEnrichment(): InternalPlant["toxicity"] & {
  evidence: InternalPlant["evidence"];
} {
  return {
    level: "unknown" as ToxicLevel,
    type: new Set<string>(),
    notes: null as string | null,
    evidence: { level: "traditional" as EvidLevel, source: "", confidence: 0 },
  };
}

function fromCanonicalRow(p: {
  id: string;
  scientific_name: string;
  family: string;
  names: string[];
  countries: string[];
  uses: string[];
}): InternalPlant {
  const e = emptyEnrichment();
  const regions = new Set<string>();
  for (const c of p.countries) {
    const u = c.trim().toUpperCase();
    if (u) regions.add(u);
  }
  return {
    plant_id: p.id,
    scientific_name: p.scientific_name.trim(),
    family: p.family || "",
    names: [...p.names],
    countries: p.countries.map((c) => c.trim().toUpperCase()).filter(Boolean),
    uses: [...p.uses],
    conditions: new Set(),
    toxicity: { level: e.level, type: e.type, notes: e.notes },
    evidence: { ...e.evidence },
    enrichmentRegions: regions,
    lookalikeRisk: false,
    mexicoNameHighAmbiguity: false,
  };
}

function mergeNotes(a: string | null, b: string | null): string | null {
  const parts = [a, b].filter((x): x is string => !!x && x.trim().length > 0);
  if (parts.length === 0) return null;
  return [...new Set(parts.map((p) => p.trim()))].join(" | ").slice(0, 4000);
}

function mergeEnrichmentPlant(target: InternalPlant, src: InternalPlant): void {
  target.scientific_name =
    target.scientific_name.length <= src.scientific_name.length
      ? target.scientific_name
      : src.scientific_name;
  if (src.family) target.family = src.family;
  for (const c of src.conditions) target.conditions.add(c);
  target.toxicity.level = maxToxic(target.toxicity.level, src.toxicity.level);
  for (const t of src.toxicity.type) target.toxicity.type.add(t);
  target.toxicity.notes = mergeNotes(target.toxicity.notes, src.toxicity.notes);
  target.evidence.level = maxEvid(target.evidence.level, src.evidence.level);
  target.evidence.confidence = Math.max(
    target.evidence.confidence,
    src.evidence.confidence
  );
  if (src.evidence.source) {
    const parts = [target.evidence.source, src.evidence.source]
      .filter(Boolean)
      .join("; ")
      .split("; ")
      .map((s) => s.trim())
      .filter(Boolean);
    target.evidence.source = [...new Set(parts)].join("; ");
  }
  for (const r of src.enrichmentRegions) target.enrichmentRegions.add(r);
  target.lookalikeRisk = target.lookalikeRisk || src.lookalikeRisk;
  target.mexicoNameHighAmbiguity =
    target.mexicoNameHighAmbiguity || src.mexicoNameHighAmbiguity;
}

/** Resolve enrichment row to existing canonical id or new binomial id. */
function resolvePlantId(
  byId: Map<string, InternalPlant>,
  scientific: string,
  explicitId?: string
): string {
  if (explicitId && byId.has(explicitId)) return explicitId;
  const b = binomialPlantId(scientific);
  if (byId.has(b)) return b;
  const full = slugifyScientific(scientific);
  if (byId.has(full)) return full;
  for (const [id, p] of byId) {
    if (binomialPlantId(p.scientific_name) === b) return id;
  }
  return b;
}

function internalFromMasterRow(
  r: JsonRecord,
  catalogIds: Set<string>,
  slugifyUnknown: (s: string) => string
): InternalPlant {
  const sci = String(r.scientific_name ?? "");
  const id = String(r.id ?? binomialPlantId(sci));
  const family = String(r.family ?? "");
  const p: InternalPlant = {
    plant_id: id,
    scientific_name: sci.trim(),
    family,
    names: [],
    countries: [],
    uses: [],
    conditions: new Set(),
    toxicity: { level: "unknown", type: new Set(), notes: null },
    evidence: { level: "traditional", source: "", confidence: 0 },
    enrichmentRegions: new Set(),
    lookalikeRisk: false,
    mexicoNameHighAmbiguity: false,
  };
  for (const c of mapConditionList(r.conditions, catalogIds, slugifyUnknown)) {
    p.conditions.add(c);
    catalogIds.add(c);
  }
  const tox = r.toxicity;
  if (tox && typeof tox === "object") {
    const t = tox as JsonRecord;
    p.toxicity.level = parseToxicLevel(typeof t.level === "string" ? t.level : undefined);
    if (Array.isArray(t.type)) {
      for (const x of t.type) {
        if (typeof x === "string") p.toxicity.type.add(x);
      }
    }
    p.toxicity.notes = typeof t.notes === "string" ? t.notes : null;
  }
  const ev = r.evidence;
  if (ev && typeof ev === "object") {
    const e = ev as JsonRecord;
    p.evidence.level = parseEvidLevel(typeof e.level === "string" ? e.level : undefined);
    p.evidence.confidence = Math.max(
      p.evidence.confidence,
      evidToConfidence(p.evidence.level)
    );
  }
  return p;
}

function ingestMexicoIntoMap(
  data: unknown,
  byId: Map<string, InternalPlant>,
  mxToSlug: Map<string, string>,
  catalogIds: Set<string>,
  slugifyUnknown: (s: string) => string
): void {
  const o = data as JsonRecord;

  for (const row of (o.plants as unknown[]) ?? []) {
    if (!row || typeof row !== "object") continue;
    const r = row as JsonRecord;
    const sci = typeof r.scientific_name === "string" ? r.scientific_name : "";
    const mxId = typeof r.id === "string" ? r.id.trim() : "";
    if (!sci || !mxId) continue;
    const key = resolvePlantId(byId, sci);
    mxToSlug.set(mxId, key);
    const src: InternalPlant = {
      plant_id: key,
      scientific_name: sci.trim(),
      family: typeof r.family === "string" ? r.family : "",
      names: [],
      countries: [],
      uses: [],
      conditions: new Set(),
      toxicity: { level: "unknown", type: new Set(), notes: null },
      evidence: { level: "traditional", source: "", confidence: 0 },
      enrichmentRegions: new Set(["MX"]),
      lookalikeRisk: false,
      mexicoNameHighAmbiguity: false,
    };
    if (Array.isArray(r.origin_regions)) {
      for (const x of r.origin_regions) {
        if (typeof x === "string") {
          const tok = normalizeRegionToken(x);
          if (tok) src.enrichmentRegions.add(tok);
        }
      }
    }
    const notes = typeof r.notes === "string" ? r.notes : "";
    if (notes && detectAbortifacient(notes)) src.toxicity.type.add("abortifacient");
    if (/clinical/i.test(notes)) {
      src.evidence.level = maxEvid(src.evidence.level, "clinical");
      src.evidence.confidence = Math.max(
        src.evidence.confidence,
        evidToConfidence("clinical")
      );
    }
    if (Array.isArray(r.sources)) {
      src.evidence.source = (r.sources as unknown[])
        .filter((x): x is string => typeof x === "string")
        .join("; ");
    }
    const existing = byId.get(key);
    if (existing) mergeEnrichmentPlant(existing, src);
    else byId.set(key, src);
  }

  for (const row of (o.safety as unknown[]) ?? []) {
    if (!row || typeof row !== "object") continue;
    const s = row as JsonRecord;
    const mxPid = typeof s.plant_id === "string" ? s.plant_id.trim() : "";
    const slug = mxToSlug.get(mxPid);
    if (!slug) continue;
    const p = byId.get(slug);
    if (!p) continue;
    const level = parseToxicLevel(
      typeof s.toxicity_level === "string" ? s.toxicity_level : undefined
    );
    p.toxicity.level = maxToxic(p.toxicity.level, level);
    const contra = typeof s.contraindications === "string" ? s.contraindications : "";
    const sn = typeof s.notes === "string" ? s.notes : "";
    if (detectAbortifacient(contra) || detectAbortifacient(sn)) {
      p.toxicity.type.add("abortifacient");
    }
    p.toxicity.notes = mergeNotes(p.toxicity.notes, contra || null);
    p.toxicity.notes = mergeNotes(p.toxicity.notes, sn || null);
    if (s.lookalike_risk === true) p.lookalikeRisk = true;
  }

  for (const row of (o.uses as unknown[]) ?? []) {
    if (!row || typeof row !== "object") continue;
    const u = row as JsonRecord;
    const mxPid = typeof u.plant_id === "string" ? u.plant_id.trim() : "";
    const slug = mxToSlug.get(mxPid);
    if (!slug) continue;
    const p = byId.get(slug);
    if (!p) continue;
    const evl = typeof u.evidence_level === "string" ? u.evidence_level : "";
    const tramil = typeof u.tramil_note === "string" && u.tramil_note.trim().length > 0;
    let level: EvidLevel = "traditional";
    if (tramil || /tramil/i.test(String(u.tramil_note ?? ""))) level = "tramil";
    if (evl === "clinical" || /clinical/i.test(evl)) level = "clinical";
    if (evl === "empirical" || evl === "traditional") level = maxEvid(level, "traditional");
    p.evidence.level = maxEvid(p.evidence.level, level);
    p.evidence.confidence = Math.max(p.evidence.confidence, evidToConfidence(level));
    const ind = typeof u.indication === "string" ? u.indication : "";
    if (ind) {
      const cond = mapCondition(ind.slice(0, 120), catalogIds, slugifyUnknown);
      if (cond) {
        p.conditions.add(cond);
        catalogIds.add(cond);
      }
    }
  }

  for (const row of (o.names as unknown[]) ?? []) {
    if (!row || typeof row !== "object") continue;
    const n = row as JsonRecord;
    const mxPid = typeof n.plant_id === "string" ? n.plant_id.trim() : "";
    const slug = mxToSlug.get(mxPid);
    if (!slug) continue;
    const p = byId.get(slug);
    if (!p) continue;
    const amb = typeof n.ambiguity_level === "string" ? n.ambiguity_level.toLowerCase() : "";
    if (amb === "high") p.mexicoNameHighAmbiguity = true;
  }
}

type RawNameRow = {
  name: string;
  normalized: string;
  plant_id: string;
  lang: string;
  region: string;
  sourceAmbiguity?: string;
};

type DisambigEntry = {
  byPlant: Map<string, number>;
  ambiguity: string;
};

function loadDisambiguation(data: unknown, aliasToCanon: Map<string, string>): Map<string, DisambigEntry> {
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

function finalizePlant(p: InternalPlant): JsonRecord {
  let toxLevel = p.toxicity.level;
  if (toxLevel === "unknown") toxLevel = "low";
  const allRegions = new Set<string>();
  for (const c of p.countries) allRegions.add(c);
  for (const r of p.enrichmentRegions) allRegions.add(r);
  return {
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
    regions: [...allRegions].sort(),
  };
}

function main() {
  const canonicalPlantsPath = path.join(CANONICAL_DIR, "plants.json");
  let canonicalNamesPath = path.join(CANONICAL_DIR, "names.json");
  if (!fs.existsSync(canonicalNamesPath)) {
    console.warn(
      `No data/canonical/names.json — using ${PROCESSED_NAMES_FALLBACK} as names BASE`
    );
    canonicalNamesPath = PROCESSED_NAMES_FALLBACK;
  }

  const conditionsData = readJson(path.join(RAW, "conditions_master.json"), "conditions_master");
  const { ids: catalogIds, slugifyUnknown } = buildConditionCatalog(conditionsData);

  const plantsBase = readJson(canonicalPlantsPath, "canonical plants") as unknown[];
  const namesBase = readJson(canonicalNamesPath, "canonical/processed names") as unknown[];

  const plantsMaster = readJson(path.join(RAW, "plants_master.json"), "plants_master");
  const namesMaster = readJson(path.join(RAW, "names_master.json"), "names_master");
  const disData = readJson(path.join(RAW, "disambiguation_master.json"), "disambiguation_master");
  const mexico = readJson(path.join(RAW, "mexico_floralexicon.json"), "mexico");

  const byId = new Map<string, InternalPlant>();
  for (const row of plantsBase) {
    if (!row || typeof row !== "object") continue;
    const p = row as JsonRecord;
    const id = typeof p.id === "string" ? p.id.trim() : "";
    if (!id) continue;
    byId.set(
      id,
      fromCanonicalRow({
        id,
        scientific_name: String(p.scientific_name ?? ""),
        family: String(p.family ?? ""),
        names: Array.isArray(p.names) ? (p.names as string[]).filter((x) => typeof x === "string") : [],
        countries: Array.isArray(p.countries)
          ? (p.countries as string[]).filter((x) => typeof x === "string")
          : [],
        uses: Array.isArray(p.uses) ? (p.uses as string[]).filter((x) => typeof x === "string") : [],
      })
    );
  }

  console.log(`BASE canonical plants loaded: ${byId.size}`);

  const aliasToCanon = new Map<string, string>();
  for (const row of (plantsMaster as JsonRecord).plants as unknown[] ?? []) {
    if (!row || typeof row !== "object") continue;
    const r = row as JsonRecord;
    const sci = typeof r.scientific_name === "string" ? r.scientific_name : "";
    if (!sci) continue;
    const rawId = typeof r.id === "string" ? r.id.trim() : "";
    const canonId = resolvePlantId(byId, sci, rawId || undefined);
    if (rawId && rawId !== canonId) aliasToCanon.set(rawId, canonId);
    const chunk = internalFromMasterRow(r, catalogIds, slugifyUnknown);
    chunk.plant_id = canonId;
    const existing = byId.get(canonId);
    if (existing) mergeEnrichmentPlant(existing, chunk);
    else byId.set(canonId, chunk);
  }

  console.log(`After plants_master: ${byId.size} plants`);

  const rawNames: RawNameRow[] = [];

  for (const row of namesBase) {
    if (!row || typeof row !== "object") continue;
    const r = row as JsonRecord;
    const display = typeof r.name === "string" ? r.name : "";
    const norm =
      typeof r.normalized === "string" && r.normalized.trim()
        ? r.normalized.trim()
        : normalizedNameKey(display);
    const pids = Array.isArray(r.plant_ids) ? r.plant_ids : [];
    const countries = Array.isArray(r.countries)
      ? (r.countries as string[]).filter((x) => typeof x === "string" && x.trim())
      : [];
    const countryList = countries.length ? countries : [""];
    for (const pid of pids) {
      if (typeof pid !== "string" || !pid.trim()) continue;
      if (!byId.has(pid)) continue;
      for (const c of countryList) {
        const region = c ? c.trim().toLowerCase() : "global";
        const lang = c && ES_ISO.has(c.trim().toUpperCase()) ? "es" : "en";
        rawNames.push({
          name: displayNameLower(display),
          normalized: norm,
          plant_id: pid.trim(),
          lang,
          region,
        });
      }
    }
  }

  console.log(`Names from BASE (expanded): ${rawNames.length}`);

  for (const row of (namesMaster as JsonRecord).names as unknown[] ?? []) {
    if (!row || typeof row !== "object") continue;
    const r = row as JsonRecord;
    const nm = typeof r.name === "string" ? r.name : "";
    let pid = typeof r.plant_id === "string" ? r.plant_id.trim() : "";
    if (!nm || !pid) continue;
    pid = aliasToCanon.get(pid) ?? pid;
    if (!byId.has(pid)) continue;
    const lang = typeof r.lang === "string" ? r.lang : "es";
    const region = typeof r.region === "string" ? r.region.toLowerCase() : "mx";
    rawNames.push({
      name: displayNameLower(nm),
      normalized: normalizedNameKey(nm),
      plant_id: pid,
      lang,
      region,
    });
  }

  const mxToSlug = new Map<string, string>();
  ingestMexicoIntoMap(mexico, byId, mxToSlug, catalogIds, slugifyUnknown);

  console.log(`After Mexico plants: ${byId.size} plants`);

  for (const row of ((mexico as JsonRecord).names as unknown[]) ?? []) {
    if (!row || typeof row !== "object") continue;
    const r = row as JsonRecord;
    const mxPid = typeof r.plant_id === "string" ? r.plant_id.trim() : "";
    const slug = mxToSlug.get(mxPid);
    if (!slug || !byId.has(slug)) continue;
    const nm = typeof r.name === "string" ? r.name : "";
    if (!nm.trim()) continue;
    const lang = typeof r.language === "string" ? r.language : "es";
    const iso = typeof r.country_iso === "string" ? r.country_iso.toLowerCase() : "mx";
    const amb = typeof r.ambiguity_level === "string" ? r.ambiguity_level : undefined;
    rawNames.push({
      name: displayNameLower(nm),
      normalized: normalizedNameKey(nm),
      plant_id: slug,
      lang,
      region: iso,
      sourceAmbiguity: amb,
    });
  }

  const disMap = loadDisambiguation(disData, aliasToCanon);

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

  const groupCounts = new Map<string, Map<string, number>>();
  for (const r of uniqueRaw) {
    if (!groupCounts.has(r.normalized)) groupCounts.set(r.normalized, new Map());
    const g = groupCounts.get(r.normalized)!;
    g.set(r.plant_id, (g.get(r.plant_id) ?? 0) + 1);
  }

  const plantIdSet = new Set(byId.keys());
  const namesOut: JsonRecord[] = [];

  for (const r of uniqueRaw) {
    if (!plantIdSet.has(r.plant_id)) {
      console.warn(`Drop name (unknown plant_id): ${r.name} → ${r.plant_id}`);
      continue;
    }
    const g = groupCounts.get(r.normalized)!;
    const distinctPlants = new Set(g.keys()).size;
    const totalRows = [...g.values()].reduce((a, b) => a + b, 0);

    const dis = disMap.get(r.normalized);
    let confidence: number;
    let ambiguity: string;
    let cluster: string | undefined;

    if (dis && dis.byPlant.size > 0 && dis.byPlant.has(r.plant_id)) {
      confidence = dis.byPlant.get(r.plant_id)!;
      ambiguity = dis.ambiguity === "high" ? "high" : distinctPlants > 1 ? "high" : "low";
    } else if (distinctPlants > 1) {
      ambiguity = "high";
      cluster = `amb_${r.normalized}`;
      const c = g.get(r.plant_id) ?? 0;
      confidence = totalRows > 0 ? c / totalRows : 0;
    } else {
      ambiguity = "low";
      confidence = 1;
    }

    if (dis && dis.ambiguity === "high" && !cluster && distinctPlants > 1) {
      cluster = `amb_${r.normalized}`;
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

    const row: JsonRecord = {
      name: r.name,
      normalized: r.normalized,
      plant_id: r.plant_id,
      lang: r.lang,
      region: r.region,
      ambiguity,
      confidence: Math.round(confidence * 1000) / 1000,
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

  const plantsOut = [...byId.values()].map(finalizePlant).sort((a, b) =>
    String(a.plant_id).localeCompare(String(b.plant_id))
  );

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(
    path.join(OUT, "plants.json"),
    JSON.stringify(plantsOut, null, 2) + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(OUT, "names.json"),
    JSON.stringify(namesOut, null, 2) + "\n",
    "utf8"
  );

  console.log("--- Layered Phase 5 merge complete ---");
  console.log(`Plants: ${plantsOut.length}`);
  console.log(`Names:  ${namesOut.length}`);
  console.log(`Wrote:  data/merged/plants.json`);
  console.log(`Wrote:  data/merged/names.json`);
}

main();
