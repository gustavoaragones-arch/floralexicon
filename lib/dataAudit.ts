/**
 * Compare normalized common-name coverage between an indexed names file
 * (e.g. data/names.json or data/processed/names.json) and all regional raw JSON sources.
 */

import * as fs from "fs";
import * as path from "path";
import { jsonrepair } from "jsonrepair";
import { normalizeString } from "@/lib/data";

const ROOT = path.resolve(process.cwd());
const RAW_DIR = path.join(ROOT, "data", "raw");
const DEFAULT_INDEXED = path.join(ROOT, "data", "processed", "names.json");
const PROCESSED_PLANTS = path.join(ROOT, "data", "processed", "plants.json");

/** Same exclusion list as scripts/mergeDataset.ts (phase-5 enrichment only). */
const PHASE5_ENRICHMENT_ONLY = new Set([
  "plants_master.json",
  "names_master.json",
  "disambiguation_master.json",
  "conditions_master.json",
]);

export type NameCoverageAudit = {
  name: string;
  normalized: string;
  plantIds: string[];
  indexedCountries: string[];
  rawCountries: string[];
  missingCountries: string[];
};

type JsonRecord = Record<string, unknown>;

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

function parseJsonFile(filePath: string): unknown {
  const text = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(jsonrepair(text));
  }
}

function coerceStringArray(u: unknown): string[] {
  if (u == null) return [];
  if (Array.isArray(u)) return u.map((x) => String(x).trim()).filter(Boolean);
  if (typeof u === "string") return [u.trim()].filter(Boolean);
  return [];
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
  return [...set];
}

function compoundDisplayParts(name: string): string[] {
  const t = name.trim();
  if (!t) return [];
  if (t.includes(" / ")) {
    const parts = t.split(" / ").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) return parts;
  }
  return [t];
}

/** Align with mergeDataset `normalizeName` + app `normalizeString` on `names.json` `normalized`. */
function mergeStyleNormalized(display: string): string {
  const folded = display
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return folded.replace(/\s+/g, "_");
}

function auditHubKey(display: string): string {
  return normalizeString(mergeStyleNormalized(display));
}

function defaultCountryIsoForSource(base: string): string | null {
  if (base === "mexico_floralexicon.json") return "MX";
  return null;
}

type RawHub = { countries: Set<string>; plantIds: Set<string>; displayNames: Set<string> };

function getOrCreateHub(
  map: Map<string, RawHub>,
  hubKey: string
): RawHub {
  let h = map.get(hubKey);
  if (!h) {
    h = { countries: new Set(), plantIds: new Set(), displayNames: new Set() };
    map.set(hubKey, h);
  }
  return h;
}

function loadMergedPlantIds(): Set<string> {
  const set = new Set<string>();
  if (!fs.existsSync(PROCESSED_PLANTS)) return set;
  try {
    const data = parseJsonFile(PROCESSED_PLANTS);
    if (!Array.isArray(data)) return set;
    for (const row of data) {
      if (!row || typeof row !== "object") continue;
      const id = (row as { id?: unknown }).id;
      if (typeof id === "string" && id.trim()) set.add(id.trim());
    }
  } catch {
    /* ignore */
  }
  return set;
}

function addRawContribution(
  map: Map<string, RawHub>,
  displayLabel: string,
  countries: string[],
  plantIds: string[],
  mergedPlantIds: Set<string>
) {
  if (
    plantIds.length > 0 &&
    !plantIds.some((id) => mergedPlantIds.has(id))
  ) {
    return;
  }
  const hubKey = auditHubKey(displayLabel);
  if (!hubKey) return;
  const hub = getOrCreateHub(map, hubKey);
  hub.displayNames.add(displayLabel.trim());
  for (const country of countries) {
    if (country) hub.countries.add(country);
  }
  for (const pid of plantIds) {
    if (pid) hub.plantIds.add(pid);
  }
}

function ingestSimpleRowRaw(
  row: JsonRecord,
  _sourceFile: string,
  map: Map<string, RawHub>,
  mergedPlantIds: Set<string>
) {
  const plantIds =
    typeof row.id === "string" && row.id.trim() ? [row.id.trim()] : [];
  const countries = countriesFromDataRow(row);
  const commons = coerceStringArray(row.common_names);
  for (const cn of commons) {
    addRawContribution(map, cn, countries, plantIds, mergedPlantIds);
  }
}

function coercePlantIdsFromNameRow(row: JsonRecord): string[] {
  const fromArr = coerceStringArray(row.plant_ids);
  const single =
    typeof row.plant_id === "string" ? row.plant_id.trim() : "";
  return [...new Set([...fromArr, ...(single ? [single] : [])])].filter(Boolean);
}

function ingestBundleRaw(
  plants: unknown[],
  names: unknown[],
  sourceFile: string,
  map: Map<string, RawHub>,
  mergedPlantIds: Set<string>
) {
  const base = path.basename(sourceFile);
  const defaultCountry = defaultCountryIsoForSource(base);

  for (const p of plants) {
    if (!p || typeof p !== "object") continue;
    const row = p as JsonRecord;
    const sci = row.scientific_name;
    if (typeof sci !== "string" || !sci.trim()) continue;
    const rawPlantId = typeof row.id === "string" ? row.id.trim() : "";
    const plantIds = rawPlantId ? [rawPlantId] : [];
    const primary =
      typeof row.common_name_primary === "string"
        ? row.common_name_primary.trim()
        : "";
    if (primary) {
      const dc = defaultCountry ? [defaultCountry] : [];
      for (const part of compoundDisplayParts(primary)) {
        addRawContribution(map, part, dc, plantIds, mergedPlantIds);
      }
    }
  }

  for (const n of names) {
    if (!n || typeof n !== "object") continue;
    const row = n as JsonRecord;
    const nm = row.name;
    if (typeof nm !== "string" || !nm.trim()) continue;
    const countries = countriesFromDataRow(row);
    const resolved = coercePlantIdsFromNameRow(row);
    if (resolved.length === 0) continue;
    for (const part of compoundDisplayParts(nm)) {
      addRawContribution(map, part, countries, resolved, mergedPlantIds);
    }
  }
}

function ingestFileRaw(
  filePath: string,
  map: Map<string, RawHub>,
  mergedPlantIds: Set<string>
) {
  const base = path.basename(filePath);
  if (PHASE5_ENRICHMENT_ONLY.has(base)) return;

  let data: unknown;
  try {
    data = parseJsonFile(filePath);
  } catch {
    return;
  }

  if (Array.isArray(data)) {
    for (const row of data) {
      if (row && typeof row === "object") {
        ingestSimpleRowRaw(row as JsonRecord, base, map, mergedPlantIds);
      }
    }
    return;
  }

  if (data && typeof data === "object") {
    const o = data as JsonRecord;
    const plants = o.plants;
    const names = o.names;
    if (Array.isArray(plants) && Array.isArray(names)) {
      ingestBundleRaw(plants, names, filePath, map, mergedPlantIds);
      return;
    }
    if (Array.isArray(o.records)) {
      for (const row of o.records) {
        if (row && typeof row === "object") {
          ingestSimpleRowRaw(row as JsonRecord, base, map, mergedPlantIds);
        }
      }
    }
  }
}

function buildRawMap(mergedPlantIds: Set<string>): Map<string, RawHub> {
  const map = new Map<string, RawHub>();
  if (!fs.existsSync(RAW_DIR)) return map;
  const files = fs
    .readdirSync(RAW_DIR)
    .filter((f) => f.endsWith(".json") && !PHASE5_ENRICHMENT_ONLY.has(f))
    .map((f) => path.join(RAW_DIR, f))
    .sort();
  for (const f of files) {
    ingestFileRaw(f, map, mergedPlantIds);
  }
  return map;
}

type IndexedRow = {
  name?: string;
  normalized?: string;
  countries?: unknown;
  country?: unknown;
  plant_ids?: unknown;
};

function buildIndexedMap(indexedPath: string): Map<string, RawHub> {
  const map = new Map<string, RawHub>();
  if (!fs.existsSync(indexedPath)) return map;
  const data = parseJsonFile(indexedPath);
  if (!Array.isArray(data)) return map;
  for (const row of data as IndexedRow[]) {
    if (!row || typeof row !== "object") continue;
    const norm = typeof row.normalized === "string" ? row.normalized : "";
    const hubKey = normalizeString(norm);
    if (!hubKey) continue;
    const hub = getOrCreateHub(map, hubKey);
    const label = typeof row.name === "string" ? row.name : norm;
    hub.displayNames.add(label.trim());

    const countries: string[] = [];
    if (Array.isArray(row.countries)) {
      for (const c of row.countries) {
        const u = String(c).trim().toUpperCase();
        if (u) countries.push(u);
      }
    }
    for (const c of countriesFromDataRow(row as JsonRecord)) {
      countries.push(c);
    }
    for (const c of countries) hub.countries.add(c);

    if (Array.isArray(row.plant_ids)) {
      for (const pid of row.plant_ids) {
        const id = String(pid).trim();
        if (id) hub.plantIds.add(id);
      }
    }
  }
  return map;
}

/**
 * @param indexedNamesPath - JSON array of name rows (relative to repo root or absolute).
 *   Defaults to `data/processed/names.json` when present, else `data/names.json`.
 */
export function auditNameCoverage(indexedNamesPath?: string): NameCoverageAudit[] {
  let resolvedIndexed: string;
  if (indexedNamesPath && indexedNamesPath.trim()) {
    resolvedIndexed = path.isAbsolute(indexedNamesPath)
      ? indexedNamesPath
      : path.join(ROOT, indexedNamesPath);
  } else if (fs.existsSync(DEFAULT_INDEXED)) {
    resolvedIndexed = DEFAULT_INDEXED;
  } else {
    resolvedIndexed = path.join(ROOT, "data", "names.json");
  }

  const mergedPlantIds = loadMergedPlantIds();
  const rawMap = buildRawMap(mergedPlantIds);
  const indexedMap = buildIndexedMap(resolvedIndexed);
  const out: NameCoverageAudit[] = [];

  for (const [hubKey, rawHub] of rawMap) {
    const indexedHub = indexedMap.get(hubKey);
    const indexedCountries = indexedHub
      ? [...indexedHub.countries].sort((a, b) => a.localeCompare(b))
      : [];
    const rawCountries = [...rawHub.countries].sort((a, b) => a.localeCompare(b));
    const indexedSet = new Set(indexedCountries);
    const missingCountries = rawCountries.filter((c) => !indexedSet.has(c));
    if (missingCountries.length === 0) continue;

    const name =
      [...rawHub.displayNames].sort((a, b) =>
        a.localeCompare(b, "en", { sensitivity: "base" })
      )[0] ?? hubKey;

    out.push({
      name,
      normalized: hubKey,
      plantIds: [...rawHub.plantIds].sort((a, b) => a.localeCompare(b)),
      indexedCountries,
      rawCountries,
      missingCountries,
    });
  }

  out.sort(
    (a, b) =>
      b.missingCountries.length - a.missingCountries.length ||
      a.normalized.localeCompare(b.normalized)
  );
  return out;
}

/** Distinct normalized name hubs observed across raw regional files. */
export function countRawNormalizedHubs(): number {
  return buildRawMap(loadMergedPlantIds()).size;
}
