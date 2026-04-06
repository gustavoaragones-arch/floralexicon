/**
 * FloraLexicon dataset merge pipeline (idempotent, pure Node).
 * Reads /data/raw/*.json.
 * Writes:
 *   - data/canonical/plants.json — full merged inventory (staging / future global expansion)
 *   - data/processed/plants.json — production only (plants referenced by merged names)
 *   - data/processed/names.json
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

/** Stable plant id from scientific name. */
export function slugifyScientific(scientific: string): string {
  const n = normalizeScientificName(scientific);
  return n.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
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
  displayNames: Set<string>;
  plant_ids: Set<string>;
  countries: Set<string>;
};

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

function mergeNameMapKey(
  mapKey: string,
  displayName: string,
  plantIds: string[],
  countries: string[]
) {
  let agg = namesMap.get(mapKey);
  if (!agg) {
    agg = {
      displayNames: new Set(),
      plant_ids: new Set(),
      countries: new Set(),
    };
    namesMap.set(mapKey, agg);
  } else {
    namesMergedCount++;
  }
  if (displayName.trim()) agg.displayNames.add(displayName.trim());
  for (const pid of plantIds) {
    const c = resolvePlantId(pid);
    if (c) agg.plant_ids.add(c);
  }
  for (const c of countries) {
    if (c) agg.countries.add(c);
  }
}

// --- parsers ----------------------------------------------------------------

type JsonRecord = Record<string, unknown>;

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

  const country = normalizeCountry(
    typeof row.country === "string" ? row.country : undefined
  );
  if (country) plant.countries.add(country);
  else if (row.country != null && String(row.country).trim()) {
    unknownCountries++;
    console.warn(`[${sourceFile}] unknown country: ${String(row.country)}`);
  }

  for (const u of coerceUses(row.uses ?? row.primary_uses)) {
    plant.uses.add(u.toLowerCase());
  }

  const commons = coerceStringArray(row.common_names);
  for (const cn of commons) {
    plant.names.add(cn);
    const iso = country;
    const mapKey = normalizeNameKeyForMap(cn);
    mergeNameMapKey(
      mapKey,
      cn,
      [canonId],
      iso ? [iso] : []
    );
  }
}

function ingestBundle(
  plants: unknown[],
  names: unknown[],
  sourceFile: string
) {
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
  }

  for (const n of names) {
    if (!n || typeof n !== "object") continue;
    const row = n as JsonRecord;
    const nm = row.name;
    if (typeof nm !== "string" || !nm.trim()) continue;

    const country = normalizeCountry(
      typeof row.country === "string" ? row.country : undefined
    );
    if (!country && row.country != null && String(row.country).trim()) {
      unknownCountries++;
      console.warn(`[${sourceFile}] unknown country on name "${nm}": ${String(row.country)}`);
    }

    const pids = coerceStringArray(row.plant_ids);
    const resolved = pids.map(resolvePlantId).filter(Boolean);

    const mapKey = normalizeNameKeyForMap(nm);
    mergeNameMapKey(mapKey, nm, resolved, country ? [country] : []);

    for (const pid of resolved) {
      const normSci = findNormSciByCanonicalId(pid);
      if (!normSci) continue;
      const plant = plantsMap.get(normSci);
      if (plant) {
        plant.names.add(nm.trim());
        if (country) plant.countries.add(country);
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
    for (const pid of agg.plant_ids) {
      const norm = findNormSciByCanonicalId(pid);
      if (!norm) continue;
      const plant = plantsMap.get(norm);
      if (!plant) continue;
      if (display) plant.names.add(display);
      for (const c of agg.countries) {
        plant.countries.add(c);
      }
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

  console.warn(`[${base}] unrecognized shape (expected array, {plants,names}, or {records}); skip`);
  loadedSources.push({ file: base, status: "skip-shape" });
}

// --- output -----------------------------------------------------------------

function stableNameDisplay(agg: NameAgg): string {
  return Array.from(agg.displayNames).sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  )[0] ?? "";
}

function writeOutputs() {
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

  let orphanNamePlantLinks = 0;
  const namesOut = Array.from(namesMap.entries())
    .map(([, agg]) => {
      const name = stableNameDisplay(agg);
      const rawIds = Array.from(agg.plant_ids);
      const plant_ids = rawIds.filter((id) => validPlantIds.has(id));
      orphanNamePlantLinks += rawIds.length - plant_ids.length;
      return {
        name,
        normalized: normalizeName(name),
        plant_ids,
        countries: Array.from(agg.countries).sort(),
      };
    })
    .filter((row) => row.name && row.plant_ids.length > 0)
    .sort((a, b) =>
      a.normalized.localeCompare(b.normalized, "en", { sensitivity: "base" })
    );

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
  console.log(`Production plants (active — in names.json): ${plantsProduction.length}`);
  console.log(`Inactive plants (canonical only, staging): ${inactiveCount}`);
  console.log(`Total unique names: ${namesOut.length}`);
  console.log(`Merge events (duplicate keys collapsed): ${duplicateEvents}`);
  console.log(`  (plants merged: ${plantsMergedCount}, name keys merged: ${namesMergedCount})`);
  if (unknownCountries > 0) {
    console.log(`Unknown country warnings: ${unknownCountries}`);
  }
  if (orphanNamePlantLinks > 0) {
    console.log(
      `Orphan plant_id references dropped from names: ${orphanNamePlantLinks}`
    );
  }
  console.log(`Wrote: data/canonical/plants.json`);
  console.log(`Wrote: data/processed/plants.json`);
  console.log(`Wrote: data/processed/names.json`);
}

// --- main -------------------------------------------------------------------

function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error(`Missing directory: ${RAW_DIR}`);
    process.exit(1);
  }
  const files = fs
    .readdirSync(RAW_DIR)
    .filter((f) => f.endsWith(".json") && !PHASE5_ENRICHMENT_ONLY.has(f))
    .map((f) => path.join(RAW_DIR, f))
    .sort();

  if (files.length === 0) {
    console.error(`No JSON files in ${RAW_DIR}`);
    process.exit(1);
  }

  for (const f of files) {
    ingestFile(f);
  }

  syncNamesIntoPlants();
  writeOutputs();
}

const entryScript = process.argv[1];
if (
  entryScript &&
  path.resolve(entryScript) === path.resolve(fileURLToPath(import.meta.url))
) {
  main();
}
