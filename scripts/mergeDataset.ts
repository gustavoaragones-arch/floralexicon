/**
 * FloraLexicon dataset merge pipeline (idempotent, pure Node).
 * Reads /data/raw/*.json.
 * Writes:
 *   - data/canonical/plants.json — full merged inventory (staging / future global expansion)
 *   - data/processed/plants.json — production only (plants referenced by merged names)
 *   - data/processed/names.json
 *   - data/names.json — same merged name rows as processed (full graph; not filtered)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";
import { jsonrepair } from "jsonrepair";

const ROOT = path.resolve(__dirname, "..");

type ParseRawResult = { data: unknown; repaired: boolean };

/**
 * Strict parse first; on failure repair in-memory with jsonrepair (never writes raw files).
 */
function parseRawJson(content: string, filename: string): ParseRawResult {
  try {
    return { data: JSON.parse(content), repaired: false };
  } catch {
    try {
      const repaired = jsonrepair(content);
      return { data: JSON.parse(repaired), repaired: true };
    } catch (err2) {
      console.error("Failed to repair JSON:", filename);
      throw err2;
    }
  }
}
const RAW_DIR = path.join(ROOT, "data", "raw");
const DATA_NAMES_SNAPSHOT = path.join(ROOT, "data", "names.json");

/** Consumed only by `layeredMergePhase5.ts`, not the regional canonical merge. */
const PHASE5_ENRICHMENT_ONLY = new Set([
  "plants_master.json",
  "names_master.json",
  "disambiguation_master.json",
  "conditions_master.json",
]);
const OUT_DIR = path.join(ROOT, "data", "processed");
const CANONICAL_DIR = path.join(ROOT, "data", "canonical");

// --- normalization ----------------------------------------------------------

/** Primary key for plants: lowercase, trimmed, collapsed spaces. */
export function normalizeScientificName(scientific: string): string {
  return scientific
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Stable plant id from scientific name (genus + species epithet only).
 * Drops trailing authority tokens (e.g. "L.", "Medikus") so regional files
 * that spell the same binomial with/without authors share one id.
 */
export function slugifyScientific(scientific: string): string {
  const n = normalizeScientificName(scientific);
  const parts = n.split(/\s+/).filter(Boolean);
  const base =
    parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0] ?? n;
  return base.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

/**
 * Common-name key: lowercase, accents stripped (NFD), trimmed, single spaces.
 * Output `normalized` uses underscores (stable, URL-friendly) to match site slugs.
 */
export function normalizeName(name: string): string {
  const folded = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return folded.replace(/\s+/g, "_");
}

/** Human-readable key for namesMap (space-separated, same folding as above minus underscore step). */
function normalizeNameKeyForMap(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Same rules as `normalizeString` in `lib/data.ts` (keys in
 * `data/mappings/name-to-plant.json` must match this output).
 */
function normalizeStringForMapping(input: string): string {
  if (input == null || typeof input !== "string") return "";
  const folded = input
    .trim()
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!folded) return "";
  return folded.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const MAPPINGS_DIR = path.join(ROOT, "data", "mappings");
const NAME_TO_PLANT_JSON = path.join(MAPPINGS_DIR, "name-to-plant.json");

let nameToPlantMap: Record<string, string> = Object.create(null);
let nameToPlantMapLoaded = false;

function loadNameToPlantMappings(): void {
  if (nameToPlantMapLoaded) return;
  nameToPlantMapLoaded = true;
  if (!fs.existsSync(NAME_TO_PLANT_JSON)) return;
  try {
    const raw = JSON.parse(fs.readFileSync(NAME_TO_PLANT_JSON, "utf8"));
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
    const o = raw as Record<string, unknown>;
    const next: Record<string, string> = Object.create(null);
    for (const [k, v] of Object.entries(o)) {
      if (k.startsWith("_")) continue;
      if (typeof v !== "string" || !v.trim()) continue;
      const nk = normalizeStringForMapping(k);
      if (!nk) continue;
      next[nk] = v.trim();
    }
    nameToPlantMap = next;
  } catch {
    console.warn("[name-to-plant.json] invalid JSON, skip mappings");
  }
}

// --- country ISO ------------------------------------------------------------

const COUNTRY_ALIASES: Record<string, string> = {
  peru: "PE",
  perú: "PE",
  ecuador: "EC",
  colombia: "CO",
  chile: "CL",
  argentina: "AR",
  bolivia: "BO",
  brazil: "BR",
  brasil: "BR",
  paraguay: "PY",
  uruguay: "UY",
  venezuela: "VE",
  mexico: "MX",
  méxico: "MX",
  spain: "ES",
  españa: "ES",
  "united states": "US",
  usa: "US",
  "u.s.a.": "US",
  "united kingdom": "GB",
  uk: "GB",
  canada: "CA",
  france: "FR",
  portugal: "PT",
};

function normalizeCountry(raw: string | undefined | null): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  const upper = t.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  const k = t
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return COUNTRY_ALIASES[k] ?? COUNTRY_ALIASES[t.toLowerCase()] ?? null;
}

type JsonRecord = Record<string, unknown>;

// --- aggregation types ------------------------------------------------------

type PlantAgg = {
  scientific_name: string;
  id: string;
  family?: string;
  names: Set<string>;
  countries: Set<string>;
  uses: Set<string>;
};

type NameAgg = {
  /** `normalizeNameKeyForMap` key (space-separated, accent-folded). */
  mapKey: string;
  /** Canonical plant slug for this name row. */
  plant_id: string;
  displayNames: Set<string>;
  countries: Set<string>;
  /** Raw JSON source basenames that contributed this row (for audit / backlog). */
  sources: Set<string>;
  /** Max ambiguity rank seen when merging sources (0 = low …). */
  ambiguityRank: number;
  /** First-seen contributor language; `en` wins when multiple sources disagree. */
  language?: string;
};

/** Name rows with no plant_id / plant_ids in source (merge continues; row not added to namesMap). */
type MissingNoPlantIdEvent = {
  name: string;
  source: string;
  countries: string[];
};

const missingNoPlantIdEvents: MissingNoPlantIdEvent[] = [];

function coerceUses(u: unknown): string[] {
  if (u == null) return [];
  if (Array.isArray(u)) {
    return u.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof u === "string") {
    return u
      .split(/[,;|]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function coerceStringArray(u: unknown): string[] {
  if (u == null) return [];
  if (Array.isArray(u)) return u.map((x) => String(x).trim()).filter(Boolean);
  if (typeof u === "string") return [u.trim()].filter(Boolean);
  return [];
}

// --- merge state ------------------------------------------------------------

const plantsMap = new Map<string, PlantAgg>();
const namesMap = new Map<string, NameAgg>();
/** raw plant id from file -> canonical slug id */
const idAlias = new Map<string, string>();

let plantsMergedCount = 0;
let namesMergedCount = 0;
let unknownCountries = 0;
let filesLoaded = 0;

type SourceLoadStatus = "ok" | "repaired" | "skip-json" | "skip-shape";
const loadedSources: { file: string; status: SourceLoadStatus }[] = [];

function getOrCreatePlant(
  normSci: string,
  scientificDisplay: string,
  rawId?: string
): PlantAgg {
  const id = slugifyScientific(scientificDisplay);
  if (rawId) registerAlias(rawId, id);

  let agg = plantsMap.get(normSci);
  if (!agg) {
    agg = {
      scientific_name: scientificDisplay.trim(),
      id,
      names: new Set(),
      countries: new Set(),
      uses: new Set(),
    };
    plantsMap.set(normSci, agg);
    return agg;
  }
  plantsMergedCount++;
  if (scientificDisplay.trim().length > agg.scientific_name.length) {
    agg.scientific_name = scientificDisplay.trim();
  }
  return agg;
}

function registerAlias(rawId: string | undefined, canonId: string) {
  if (!rawId || !canonId) return;
  if (rawId === canonId) return;
  idAlias.set(rawId, canonId);
}

function resolvePlantId(rawId: string): string {
  return idAlias.get(rawId) ?? rawId;
}

function ambiguityRankFromRow(row: unknown): number {
  if (!row || typeof row !== "object") return 0;
  const o = row as JsonRecord;
  const raw = o.ambiguity_level ?? o.ambiguity;
  const l = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  if (l === "low") return 0;
  if (l === "medium") return 1;
  if (l === "high") return 2;
  if (l === "lethal") return 3;
  return 0;
}

function ambiguityLevelFromRank(r: number): string {
  if (r >= 2) return "high";
  if (r >= 1) return "medium";
  return "low";
}

/** Multi-label cells in regional bundles (e.g. Mexico INPI): split on ` / `. */
function compoundDisplayParts(name: string): string[] {
  const t = name.trim();
  if (!t) return [];
  if (t.includes(" / ")) {
    const parts = t.split(" / ").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }
  return [t];
}

function isoTokensFromField(v: unknown): string[] {
  if (typeof v !== "string" || !v.trim()) return [];
  const t = v.trim().toUpperCase();
  if (/^[A-Z]{2}(-[A-Z]{2})+$/.test(t)) {
    return t.split("-").filter((c) => /^[A-Z]{2}$/.test(c));
  }
  const n = normalizeCountry(v);
  return n ? [n] : [];
}

function countriesFromDataRow(row: JsonRecord): string[] {
  const set = new Set<string>();
  for (const c of isoTokensFromField(row.country)) set.add(c);
  for (const c of isoTokensFromField(row.country_iso)) set.add(c);
  if (Array.isArray(row.country_usage)) {
    for (const cu of row.country_usage) {
      if (!cu || typeof cu !== "object" || Array.isArray(cu)) continue;
      const cc = (cu as JsonRecord).country;
      if (typeof cc !== "string") continue;
      const n = normalizeCountry(cc.trim());
      if (n) set.add(n);
    }
  }
  return [...set];
}

function coercePlantIdsFromRow(row: JsonRecord): string[] {
  const fromArr = coerceStringArray(row.plant_ids);
  const single =
    typeof row.plant_id === "string" ? row.plant_id.trim() : "";
  const merged = [...fromArr, ...(single ? [single] : [])];
  return [...new Set(merged.map((id) => resolvePlantId(id)).filter(Boolean))];
}

/** Default ISO when a bundle lists plants with local ids but no per-plant country (e.g. Mexico). */
function defaultCountryIsoForSource(base: string): string | null {
  if (base === "mexico_floralexicon.json") return "MX";
  return null;
}

function languageFromContributor(
  prev: string | undefined,
  rowSource: unknown
): string | undefined {
  if (!rowSource || typeof rowSource !== "object" || Array.isArray(rowSource)) {
    return prev;
  }
  const row = rowSource as JsonRecord;
  const raw = row.language;
  if (typeof raw !== "string" || !raw.trim()) return prev;
  const next = raw.trim().toLowerCase();
  if (next === "en") return "en";
  if (!prev) return next;
  if (prev === "en") return "en";
  return prev;
}

function mergeNameForPlant(
  mapKey: string,
  displayName: string,
  plantId: string,
  countries: string[],
  rowAmbiguitySource?: unknown,
  sourceFile?: string
) {
  const canon = resolvePlantId(plantId);
  if (!canon) return;
  const compoundKey = `${mapKey}\0${canon}`;
  const ar = ambiguityRankFromRow(rowAmbiguitySource);
  let agg = namesMap.get(compoundKey);
  if (!agg) {
    agg = {
      mapKey,
      plant_id: canon,
      displayNames: new Set(),
      countries: new Set(),
      sources: new Set(),
      ambiguityRank: ar,
    };
    namesMap.set(compoundKey, agg);
  } else {
    namesMergedCount++;
    if (ar > agg.ambiguityRank) agg.ambiguityRank = ar;
  }
  if (displayName.trim()) agg.displayNames.add(displayName.trim());
  for (const c of countries) {
    if (c) agg.countries.add(c);
  }
  if (sourceFile?.trim()) agg.sources.add(sourceFile.trim());
  agg.language = languageFromContributor(agg.language, rowAmbiguitySource);
}

// --- parsers ----------------------------------------------------------------

/**
 * Seed `plantsMap` from `data/canonical/plants.json` before raw sources so manual
 * inventory rows (and id aliases) participate in the same merge as regional JSON.
 */
function ingestCanonicalPlantRecord(row: JsonRecord, sourceFile: string) {
  const sci = row.scientific_name;
  if (typeof sci !== "string" || !sci.trim()) return;
  const rawId = typeof row.id === "string" ? row.id.trim() : undefined;
  const plant = getOrCreatePlant(normalizeScientificName(sci), sci.trim(), rawId);
  const canonId = plant.id;

  if (typeof row.family === "string" && row.family.trim()) {
    if (!plant.family) plant.family = row.family.trim();
  }

  const countriesList: string[] = [];
  if (Array.isArray(row.countries)) {
    for (const c of row.countries) {
      const n = normalizeCountry(String(c));
      if (n) {
        plant.countries.add(n);
        countriesList.push(n);
      }
    }
  }
  for (const c of countriesFromDataRow(row)) {
    if (c) {
      plant.countries.add(c);
      if (!countriesList.includes(c)) countriesList.push(c);
    }
  }

  for (const u of coerceUses(row.uses ?? row.primary_uses)) {
    plant.uses.add(u.toLowerCase());
  }

  const nameList =
    coerceStringArray(row.names).length > 0
      ? coerceStringArray(row.names)
      : coerceStringArray(row.common_names);
  for (const cn of nameList) {
    const t = cn.trim();
    if (!t) continue;
    plant.names.add(t);
    const mapKey = normalizeNameKeyForMap(t);
    mergeNameForPlant(mapKey, t, canonId, countriesList, row, sourceFile);
  }
}

function ingestCanonicalPlantsBaseline() {
  const p = path.join(CANONICAL_DIR, "plants.json");
  if (!fs.existsSync(p)) return;
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    console.warn("[canonical/plants.json] invalid JSON, skip baseline seed");
    return;
  }
  if (!Array.isArray(data)) {
    console.warn("[canonical/plants.json] expected array, skip baseline seed");
    return;
  }
  const base = "canonical/plants.json";
  for (const row of data) {
    if (row && typeof row === "object") {
      ingestCanonicalPlantRecord(row as JsonRecord, base);
    }
  }
}

/** Raw keys that disagree with {@link slugifyScientific} but are already in names.json. */
function bootstrapPlantIdAliases() {
  registerAlias("tropaelum_majus", "tropaeolum_majus");
  registerAlias("pluchoea_carolinensis", "pluchea_carolinensis");
}

/** FloraLexicon v2 raw: `{ "plants": [ { scientific_name, family, country, common_names, uses } ] }` */
function ingestPlantRecord(record: unknown, sourceFile: string) {
  if (!record || typeof record !== "object") return;
  const row = record as JsonRecord;
  const scientific_name = row.scientific_name;
  const family = row.family;
  const common_names = row.common_names;
  const uses = row.uses;

  if (typeof scientific_name !== "string" || !scientific_name.trim()) {
    console.warn(`[${sourceFile}] invalid plant record`, record);
    return;
  }
  if (!Array.isArray(common_names) || common_names.length === 0) {
    console.warn(`[${sourceFile}] invalid plant record`, record);
    return;
  }

  const countriesRow = countriesFromDataRow(row);
  if (countriesRow.length === 0) {
    if (
      (row.country != null && String(row.country).trim()) ||
      (row.country_iso != null && String(row.country_iso).trim())
    ) {
      unknownCountries++;
      console.warn(
        `[${sourceFile}] unknown country/country_iso: ${String(row.country ?? row.country_iso)}`
      );
    }
    console.warn(`[${sourceFile}] invalid plant record`, record);
    return;
  }

  const normSci = normalizeScientificName(scientific_name);
  const rawPlantId =
    typeof row.id === "string" ? row.id.trim() : undefined;
  const plant = getOrCreatePlant(normSci, scientific_name.trim(), rawPlantId);
  const plantId = plant.id;

  if (typeof family === "string" && family.trim()) {
    if (!plant.family) plant.family = family.trim();
  }
  for (const c of countriesRow) plant.countries.add(c);
  for (const u of coerceUses(uses ?? row.primary_uses)) {
    plant.uses.add(u.toLowerCase());
  }

  for (const name of common_names) {
    const cn = String(name).trim();
    if (!cn) continue;
    plant.names.add(cn);
    const mapKey = normalizeNameKeyForMap(cn);
    mergeNameForPlant(mapKey, cn, plantId, countriesRow, row, sourceFile);
  }
}

function ingestSimpleRow(row: JsonRecord, sourceFile: string) {
  const sci = row.scientific_name;
  if (typeof sci !== "string" || !sci.trim()) {
    console.warn(`[${sourceFile}] skip row: missing scientific_name`);
    return;
  }
  const normSci = normalizeScientificName(sci);
  const rawPlantId = typeof row.id === "string" ? row.id.trim() : undefined;
  const plant = getOrCreatePlant(normSci, sci, rawPlantId);
  const canonId = plant.id;

  if (typeof row.family === "string" && row.family.trim()) {
    if (!plant.family) plant.family = row.family.trim();
  }

  const countriesRow = countriesFromDataRow(row);
  for (const c of countriesRow) plant.countries.add(c);
  if (
    countriesRow.length === 0 &&
    ((row.country != null && String(row.country).trim()) ||
      (row.country_iso != null && String(row.country_iso).trim()))
  ) {
    unknownCountries++;
    console.warn(
      `[${sourceFile}] unknown country/country_iso: ${String(row.country ?? row.country_iso)}`
    );
  }

  for (const u of coerceUses(row.uses ?? row.primary_uses)) {
    plant.uses.add(u.toLowerCase());
  }

  const commons = coerceStringArray(row.common_names);
  for (const cn of commons) {
    plant.names.add(cn);
    const mapKey = normalizeNameKeyForMap(cn);
    mergeNameForPlant(mapKey, cn, canonId, countriesRow, row, sourceFile);
  }
}

function ingestBundle(
  plants: unknown[],
  names: unknown[],
  sourceFile: string
) {
  const base = path.basename(sourceFile);
  const defaultCountry = defaultCountryIsoForSource(base);

  for (const p of plants) {
    if (!p || typeof p !== "object") continue;
    const row = p as JsonRecord;
    const sci = row.scientific_name;
    if (typeof sci !== "string" || !sci.trim()) continue;
    const normSci = normalizeScientificName(sci);
    const rawPlantId = typeof row.id === "string" ? row.id.trim() : undefined;
    const plant = getOrCreatePlant(normSci, sci, rawPlantId);
    const canonId = plant.id;

    if (typeof row.family === "string" && row.family.trim()) {
      if (!plant.family) plant.family = row.family.trim();
    }

    for (const u of coerceUses(row.primary_uses ?? row.uses)) {
      plant.uses.add(u.toLowerCase());
    }

    const primary =
      typeof row.common_name_primary === "string"
        ? row.common_name_primary.trim()
        : "";
    if (primary) {
      const iso = defaultCountry;
      for (const part of compoundDisplayParts(primary)) {
        const mapKey = normalizeNameKeyForMap(part);
        mergeNameForPlant(
          mapKey,
          part,
          canonId,
          iso ? [iso] : [],
          row,
          base
        );
      }
    }
  }

  for (const n of names) {
    if (!n || typeof n !== "object") continue;
    const row = n as JsonRecord;
    const nm = row.name;
    if (typeof nm !== "string" || !nm.trim()) continue;

    const countriesRow = countriesFromDataRow(row);
    if (
      countriesRow.length === 0 &&
      ((row.country != null && String(row.country).trim()) ||
        (row.country_iso != null && String(row.country_iso).trim()))
    ) {
      unknownCountries++;
      console.warn(
        `[${sourceFile}] unknown country/country_iso on name "${nm}": ${String(row.country ?? row.country_iso)}`
      );
    }

    const resolved = coercePlantIdsFromRow(row);
    if (resolved.length === 0) {
      loadNameToPlantMappings();
      const lookupKey = normalizeStringForMapping(nm.trim());
      const mappedRaw =
        lookupKey && lookupKey in nameToPlantMap ? nameToPlantMap[lookupKey] : undefined;
      const mappedCanon = mappedRaw ? resolvePlantId(mappedRaw.trim()) : undefined;

      if (mappedCanon) {
        const normSci = findNormSciByCanonicalId(mappedCanon);
        if (normSci) {
          console.log(`[mapped] "${nm}" → ${mappedCanon}`);
          for (const part of compoundDisplayParts(nm)) {
            const mapKey = normalizeNameKeyForMap(part);
            mergeNameForPlant(mapKey, part, mappedCanon, countriesRow, row, base);
          }
          const plant = plantsMap.get(normSci);
          if (plant) {
            for (const part of compoundDisplayParts(nm)) {
              plant.names.add(part.trim());
            }
            for (const c of countriesRow) plant.countries.add(c);
          }
          continue;
        }
        console.warn(
          `[mapping] skip "${nm}": plant_id "${mappedCanon}" not in merged plants yet (${sourceFile})`
        );
      }

      console.warn(
        `[${sourceFile}] name "${nm}": missing plant_ids / plant_id (recorded in data/audit/missing-plants.json)`
      );
      missingNoPlantIdEvents.push({
        name: nm.trim(),
        source: base,
        countries: [...countriesRow],
      });
      continue;
    }

    for (const part of compoundDisplayParts(nm)) {
      const mapKey = normalizeNameKeyForMap(part);
      for (const pid of resolved) {
        mergeNameForPlant(mapKey, part, pid, countriesRow, row, base);
      }
    }

    for (const pid of resolved) {
      const normSci = findNormSciByCanonicalId(pid);
      if (!normSci) continue;
      const plant = plantsMap.get(normSci);
      if (plant) {
        for (const part of compoundDisplayParts(nm)) {
          plant.names.add(part.trim());
        }
        for (const c of countriesRow) plant.countries.add(c);
      }
    }
  }
}

function findNormSciByCanonicalId(canonId: string): string | null {
  for (const [norm, agg] of plantsMap) {
    if (agg.id === canonId) return norm;
  }
  return null;
}

/** Backfill plant.names and plant.countries from aggregated name rows (cross-file safe). */
function syncNamesIntoPlants() {
  for (const agg of namesMap.values()) {
    const display = stableNameDisplay(agg);
    const norm = findNormSciByCanonicalId(agg.plant_id);
    if (!norm) continue;
    const plant = plantsMap.get(norm);
    if (!plant) continue;
    if (display) plant.names.add(display);
    for (const c of agg.countries) {
      plant.countries.add(c);
    }
  }
}

function ingestFile(filePath: string) {
  const base = path.basename(filePath);
  const text = fs.readFileSync(filePath, "utf8");
  let data: unknown;
  let repaired = false;
  try {
    const parsed = parseRawJson(text, base);
    data = parsed.data;
    repaired = parsed.repaired;
  } catch (e) {
    console.warn(`[${base}] invalid JSON, skip:`, e);
    loadedSources.push({ file: base, status: "skip-json" });
    return;
  }

  if (Array.isArray(data)) {
    for (const row of data) {
      if (row && typeof row === "object") {
        ingestSimpleRow(row as JsonRecord, base);
      }
    }
    loadedSources.push({ file: base, status: repaired ? "repaired" : "ok" });
    filesLoaded++;
    return;
  }

  if (data && typeof data === "object") {
    const o = data as JsonRecord;
    const plants = o.plants;
    const names = o.names;
    if (Array.isArray(plants) && Array.isArray(names)) {
      ingestBundle(plants, names, base);
      loadedSources.push({ file: base, status: repaired ? "repaired" : "ok" });
      filesLoaded++;
      return;
    }
    if (Array.isArray(plants)) {
      for (const record of plants) {
        ingestPlantRecord(record, base);
      }
      loadedSources.push({ file: base, status: repaired ? "repaired" : "ok" });
      filesLoaded++;
      return;
    }
    if (Array.isArray(o.records)) {
      for (const row of o.records) {
        if (row && typeof row === "object") {
          ingestSimpleRow(row as JsonRecord, base);
        }
      }
      loadedSources.push({ file: base, status: repaired ? "repaired" : "ok" });
      filesLoaded++;
      return;
    }
  }

  console.warn(
    `[${base}] unrecognized shape (expected array, {plants,names}, {plants}, or {records}); skip`
  );
  loadedSources.push({ file: base, status: "skip-shape" });
}

// --- output -----------------------------------------------------------------

function stableNameDisplay(agg: NameAgg): string {
  return Array.from(agg.displayNames).sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  )[0] ?? "";
}

/**
 * True when a later raw file (e.g. `*_resolved.json` with `ingestPlantRecord`) already
 * linked this label to a plant for at least one of the same countries.
 */
function nameEventCoveredByNamesMap(ev: MissingNoPlantIdEvent): boolean {
  const evMapKey = normalizeNameKeyForMap(ev.name);
  for (const agg of namesMap.values()) {
    if (agg.mapKey !== evMapKey) continue;
    if (ev.countries.length === 0) {
      if (agg.countries.size > 0) return true;
      continue;
    }
    for (const c of ev.countries) {
      const u = c.trim().toUpperCase();
      if (u && agg.countries.has(u)) return true;
    }
  }
  return false;
}

/** Drop stale `no plant_ids` backlog rows superseded by resolved plant rows. */
function pruneMissingNoPlantIdEventsResolvedByNamesMap(): number {
  const before = missingNoPlantIdEvents.length;
  const kept = missingNoPlantIdEvents.filter(
    (ev) => !nameEventCoveredByNamesMap(ev)
  );
  missingNoPlantIdEvents.length = 0;
  missingNoPlantIdEvents.push(...kept);
  return before - kept.length;
}

/** Written to `data/audit/missing-plants.json`; sorted by frequency then country spread. */
type MissingPlantAuditRow = {
  reason: "orphan_plant_id" | "no_plant_ids_in_row";
  frequency: number;
  countrySpread: number;
  plant_id?: string;
  /** Example display name (orphan) or row label (no ids). */
  name?: string;
  /** Primary source basename for no-plant-id rows. */
  source?: string;
  /** Contributing raw files. */
  sources: string[];
  countries: string[];
};

function buildMissingPlantsAudit(
  validPlantIds: Set<string>
): MissingPlantAuditRow[] {
  const orphanByPid = new Map<
    string,
    {
      count: number;
      countries: Set<string>;
      sources: Set<string>;
      names: Set<string>;
    }
  >();

  for (const agg of namesMap.values()) {
    if (validPlantIds.has(agg.plant_id)) continue;
    const display = stableNameDisplay(agg);
    let rec = orphanByPid.get(agg.plant_id);
    if (!rec) {
      rec = {
        count: 0,
        countries: new Set(),
        sources: new Set(),
        names: new Set(),
      };
      orphanByPid.set(agg.plant_id, rec);
    }
    rec.count++;
    for (const c of agg.countries) {
      if (c) rec.countries.add(c);
    }
    for (const s of agg.sources) {
      if (s) rec.sources.add(s);
    }
    if (display) rec.names.add(display);
  }

  const noIdByKey = new Map<
    string,
    { count: number; countries: Set<string>; source: string; name: string }
  >();
  for (const ev of missingNoPlantIdEvents) {
    const key = `${ev.source}\0${ev.name}`;
    let rec = noIdByKey.get(key);
    if (!rec) {
      rec = {
        count: 0,
        countries: new Set(),
        source: ev.source,
        name: ev.name,
      };
      noIdByKey.set(key, rec);
    }
    rec.count++;
    for (const c of ev.countries) {
      if (c) rec.countries.add(c);
    }
  }

  const rows: MissingPlantAuditRow[] = [];

  for (const [plant_id, r] of orphanByPid) {
    const names = [...r.names].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" })
    );
    rows.push({
      reason: "orphan_plant_id",
      plant_id,
      name: names[0],
      frequency: r.count,
      countrySpread: r.countries.size,
      sources: [...r.sources].sort((a, b) => a.localeCompare(b)),
      countries: [...r.countries].sort((a, b) => a.localeCompare(b)),
    });
  }

  for (const rec of noIdByKey.values()) {
    rows.push({
      reason: "no_plant_ids_in_row",
      name: rec.name,
      source: rec.source,
      frequency: rec.count,
      countrySpread: rec.countries.size,
      sources: [rec.source],
      countries: [...rec.countries].sort((a, b) => a.localeCompare(b)),
    });
  }

  rows.sort((a, b) => {
    if (b.frequency !== a.frequency) return b.frequency - a.frequency;
    if (b.countrySpread !== a.countrySpread)
      return b.countrySpread - a.countrySpread;
    const ka = a.plant_id ?? `${a.source ?? ""}:${a.name ?? ""}`;
    const kb = b.plant_id ?? `${b.source ?? ""}:${b.name ?? ""}`;
    return ka.localeCompare(kb, "en", { sensitivity: "base" });
  });

  return rows;
}

type PreMergeSnapshot = {
  plantCount: number;
  nameCount: number;
  countries: Set<string>;
  normalizedHubs: Set<string>;
};

function loadPreMergeSnapshot(): PreMergeSnapshot {
  const countries = new Set<string>();
  const normalizedHubs = new Set<string>();
  let plantCount = 0;
  let nameCount = 0;

  const plantsPath = path.join(CANONICAL_DIR, "plants.json");
  if (fs.existsSync(plantsPath)) {
    try {
      const data: unknown = JSON.parse(fs.readFileSync(plantsPath, "utf8"));
      if (Array.isArray(data)) {
        plantCount = data.length;
        for (const p of data) {
          if (!p || typeof p !== "object" || Array.isArray(p)) continue;
          const row = p as { countries?: unknown };
          if (!Array.isArray(row.countries)) continue;
          for (const c of row.countries) {
            if (typeof c === "string" && c.trim()) {
              countries.add(c.trim().toUpperCase());
            }
          }
        }
      }
    } catch {
      /* first run or corrupt file */
    }
  }

  if (fs.existsSync(DATA_NAMES_SNAPSHOT)) {
    try {
      const data: unknown = JSON.parse(
        fs.readFileSync(DATA_NAMES_SNAPSHOT, "utf8")
      );
      if (Array.isArray(data)) {
        nameCount = data.length;
        for (const row of data) {
          if (!row || typeof row !== "object" || Array.isArray(row)) continue;
          const n = (row as { normalized?: unknown }).normalized;
          if (typeof n === "string" && n.trim()) {
            normalizedHubs.add(n.trim());
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  return { plantCount, nameCount, countries, normalizedHubs };
}

function logPostMergeSummary(
  pre: PreMergeSnapshot,
  plantsCanonical: { countries: string[] }[],
  namesOut: { normalized: string }[]
): void {
  const newCountryCodes = new Set<string>();
  for (const p of plantsCanonical) {
    for (const c of p.countries) {
      const u = c.trim().toUpperCase();
      if (u && !pre.countries.has(u)) newCountryCodes.add(u);
    }
  }
  const addedCountries = [...newCountryCodes].sort();

  const plantAfter = plantsCanonical.length;
  const nameAfter = namesOut.length;
  const dPlants = plantAfter - pre.plantCount;
  const dNames = nameAfter - pre.nameCount;

  console.log("");
  console.log("--- Merge summary (vs disk before this run) ---");
  console.log(
    `Countries added: ${addedCountries.length}${
      addedCountries.length ? ` — ${addedCountries.join(", ")}` : ""
    }`
  );
  console.log(
    `Total plants (canonical): ${pre.plantCount} → ${plantAfter} (${dPlants >= 0 ? "+" : ""}${dPlants})`
  );
  console.log(
    `Total names (rows): ${pre.nameCount} → ${nameAfter} (${dNames >= 0 ? "+" : ""}${dNames})`
  );

  const newHubRowCounts = new Map<string, number>();
  for (const row of namesOut) {
    if (pre.normalizedHubs.has(row.normalized)) continue;
    newHubRowCounts.set(
      row.normalized,
      (newHubRowCounts.get(row.normalized) ?? 0) + 1
    );
  }
  const topHubs = [...newHubRowCounts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], "en", { sensitivity: "base" });
  });

  if (topHubs.length > 0) {
    console.log("Top 10 new name hubs (by new name rows):");
    for (const [hub, cnt] of topHubs.slice(0, 10)) {
      console.log(`  ${hub} — ${cnt} row(s)`);
    }
  } else if (pre.normalizedHubs.size > 0) {
    console.log("Top 10 new name hubs: (none — no new normalized hubs)");
  }
}

function writeOutputs(preMerge: PreMergeSnapshot) {
  const validPlantIds = new Set(
    Array.from(plantsMap.values()).map((p) => p.id)
  );

  const plantsCanonical = Array.from(plantsMap.values())
    .map((p) => ({
      id: p.id,
      scientific_name: p.scientific_name,
      ...(p.family ? { family: p.family } : {}),
      names: Array.from(p.names).sort((a, b) =>
        a.localeCompare(b, "en", { sensitivity: "base" })
      ),
      countries: Array.from(p.countries).sort(),
      uses: Array.from(p.uses).sort(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  let namesWithOrphanPlantId = 0;
  const namesOut = Array.from(namesMap.values())
    .map((agg) => {
      const name = stableNameDisplay(agg);
      if (!name) return null;
      if (!validPlantIds.has(agg.plant_id)) {
        namesWithOrphanPlantId += 1;
      }
      return {
        name,
        normalized: normalizeName(name),
        plant_ids: [agg.plant_id],
        countries: Array.from(agg.countries).sort(),
        language: agg.language ?? "es",
        ambiguity_level: ambiguityLevelFromRank(agg.ambiguityRank),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .filter((row) => row.countries.length > 0)
    .sort((a, b) => {
      const byName = a.normalized.localeCompare(b.normalized, "en", {
        sensitivity: "base",
      });
      if (byName !== 0) return byName;
      return a.plant_ids[0]!.localeCompare(b.plant_ids[0]!);
    });

  const activePlantIds = new Set<string>();
  for (const row of namesOut) {
    for (const id of row.plant_ids) activePlantIds.add(id);
  }
  const plantsProduction = plantsCanonical.filter((p) =>
    activePlantIds.has(p.id)
  );
  const inactiveCount = plantsCanonical.length - plantsProduction.length;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(CANONICAL_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(CANONICAL_DIR, "plants.json"),
    JSON.stringify(plantsCanonical, null, 2) + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "plants.json"),
    JSON.stringify(plantsProduction, null, 2) + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "names.json"),
    JSON.stringify(namesOut, null, 2) + "\n",
    "utf8"
  );

  const DATA_NAMES = path.join(ROOT, "data", "names.json");
  fs.writeFileSync(
    DATA_NAMES,
    JSON.stringify(namesOut, null, 2) + "\n",
    "utf8"
  );

  const prunedMissing = pruneMissingNoPlantIdEventsResolvedByNamesMap();
  if (prunedMissing > 0) {
    console.log(
      `[merge] Pruned ${prunedMissing} no-plant-id audit row(s) now satisfied by merged names (e.g. *_resolved.json)`
    );
  }

  const missingPlantsAudit = buildMissingPlantsAudit(validPlantIds);
  const AUDIT_DIR = path.join(ROOT, "data", "audit");
  const MISSING_PLANTS_JSON = path.join(AUDIT_DIR, "missing-plants.json");
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
  fs.writeFileSync(
    MISSING_PLANTS_JSON,
    JSON.stringify(missingPlantsAudit, null, 2) + "\n",
    "utf8"
  );

  const duplicateEvents = plantsMergedCount + namesMergedCount;
  console.log("--- FloraLexicon merge complete ---");
  if (loadedSources.length > 0) {
    console.log("Raw JSON sources:");
    for (const { file, status } of loadedSources) {
      const suffix =
        status === "ok"
          ? ""
          : status === "repaired"
            ? " (repaired)"
            : status === "skip-json"
              ? " [invalid JSON, skipped]"
              : " [unrecognized shape, skipped]";
      console.log(`  ${file}${suffix}`);
    }
  }
  console.log(`Raw JSON files loaded: ${filesLoaded}`);
  console.log(`Total plants (canonical / merged): ${plantsCanonical.length}`);
  console.log(`Production plants (active — in processed names): ${plantsProduction.length}`);
  console.log(`Inactive plants (canonical only, staging): ${inactiveCount}`);
  console.log(`Total unique names: ${namesOut.length}`);
  console.log(`Merge events (duplicate keys collapsed): ${duplicateEvents}`);
  console.log(`  (plants merged: ${plantsMergedCount}, name keys merged: ${namesMergedCount})`);
  if (unknownCountries > 0) {
    console.log(`Unknown country warnings: ${unknownCountries}`);
  }
  if (namesWithOrphanPlantId > 0) {
    console.log(
      `Names referencing plant_ids not in merged plants (kept in names.json; see audit): ${namesWithOrphanPlantId}`
    );
  }
  if (missingNoPlantIdEvents.length > 0) {
    console.log(
      `Name rows skipped (no plant_ids in source), recorded in audit: ${missingNoPlantIdEvents.length}`
    );
  }
  console.log(`Wrote: data/audit/missing-plants.json (${missingPlantsAudit.length} backlog rows)`);
  const top = missingPlantsAudit.slice(0, 20);
  if (top.length > 0) {
    console.log("Top missing plants to resolve:");
    for (const row of top) {
      const head =
        row.reason === "orphan_plant_id"
          ? `plant_id=${row.plant_id}${row.name ? ` (${row.name})` : ""}`
          : `name="${row.name}" source=${row.source}`;
      console.log(
        `  — ${head} | freq=${row.frequency} countries=${row.countrySpread}`
      );
    }
  }
  console.log(`Wrote: data/canonical/plants.json`);
  console.log(`Wrote: data/processed/plants.json`);
  console.log(`Wrote: data/processed/names.json`);
  console.log(`Wrote: data/names.json (${namesOut.length} rows, full merge)`);

  logPostMergeSummary(preMerge, plantsCanonical, namesOut);
}

// --- main -------------------------------------------------------------------

function main() {
  const preMerge = loadPreMergeSnapshot();

  if (!fs.existsSync(RAW_DIR)) {
    console.error(`Missing directory: ${RAW_DIR}`);
    process.exit(1);
  }
  const files = fs
    .readdirSync(RAW_DIR)
    .filter((f) => f.endsWith(".json") && !PHASE5_ENRICHMENT_ONLY.has(f))
    .map((f) => path.join(RAW_DIR, f))
    .sort((a, b) => {
      const ba = path.basename(a);
      const bb = path.basename(b);
      const pa = ba.endsWith("_resolved.json") ? 0 : 1;
      const pb = bb.endsWith("_resolved.json") ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return a.localeCompare(b, "en", { sensitivity: "base" });
    });

  if (files.length === 0) {
    console.error(`No JSON files in ${RAW_DIR}`);
    process.exit(1);
  }

  bootstrapPlantIdAliases();
  ingestCanonicalPlantsBaseline();
  loadNameToPlantMappings();

  for (const f of files) {
    ingestFile(f);
  }

  syncNamesIntoPlants();
  writeOutputs(preMerge);
}

const entryScript = process.argv[1];
if (
  entryScript &&
  path.resolve(entryScript) === path.resolve(fileURLToPath(import.meta.url))
) {
  main();
}
