/**
 * Normalize `data/raw/canada.json` and split legacy `data/raw/usa.json` into
 * `usa_plants.json` (plant array) + `usa_names.json` ({ plants: [], names } bundle)
 * so they match FloraLexicon raw ingestion shapes and `mergeDataset.ts` rules.
 *
 * Run: npx tsx scripts/normalizeRawNorthAmerica.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";
import {
  normalizeName,
  normalizeScientificName,
  slugifyScientific,
} from "./mergeDataset";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW = path.join(ROOT, "data", "raw");

const CANADA_IN = path.join(RAW, "canada.json");
const USA_LEGACY = path.join(RAW, "usa.json");
const CANADA_OUT = CANADA_IN;
const USA_PLANTS_OUT = path.join(RAW, "usa_plants.json");
const USA_NAMES_OUT = path.join(RAW, "usa_names.json");

type JsonRecord = Record<string, unknown>;

type RawPlantOut = {
  scientific_name: string;
  family: string;
  country: "CA" | "US";
  common_names: string[];
  uses: string[];
};

type CountryUsageEntry = {
  country: string;
  is_primary: boolean;
  confidence: "high" | "medium" | "low";
};

type RawNameOut = {
  name: string;
  normalized: string;
  plant_ids: string[];
  language: string;
  script: string;
  country_usage: CountryUsageEntry[];
};

function coerceStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

function coerceUses(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  const out = new Set<string>();
  for (const x of arr) {
    const s = String(x).trim().toLowerCase();
    if (s) out.add(s);
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}

/** Accept CA / US only for these regional files. */
function coerceRegionIso(
  raw: unknown,
  expected: "CA" | "US"
): "CA" | "US" | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().toUpperCase();
  if (!t) return null;
  if (t === "USA" || t === "U.S.A." || t === "UNITED STATES") return "US";
  if (t === "CANADA") return "CA";
  if (t === "US" || t === "CA") return t;
  return null;
}

function sanitizePlantSlug(id: string): string {
  return id
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function normalizeCountryUsage(
  raw: unknown,
  expected: "US"
): CountryUsageEntry[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: CountryUsageEntry[] = [];
  for (const cu of raw) {
    if (!cu || typeof cu !== "object" || Array.isArray(cu)) continue;
    const o = cu as JsonRecord;
    const c = coerceRegionIso(o.country, expected);
    if (!c || c !== expected) continue;
    const ip = Boolean(o.is_primary);
    const confRaw =
      typeof o.confidence === "string" ? o.confidence.toLowerCase() : "";
    const confidence: CountryUsageEntry["confidence"] =
      confRaw === "medium" || confRaw === "low" ? confRaw : "high";
    out.push({ country: c, is_primary: ip, confidence });
  }
  return out.length ? out : null;
}

function normalizePlantRow(
  row: JsonRecord,
  expectedCountry: "CA" | "US"
): RawPlantOut | null {
  const sciRaw = row.scientific_name;
  if (typeof sciRaw !== "string" || !sciRaw.trim()) return null;

  const scientific_name = sciRaw.trim();
  const slug = slugifyScientific(scientific_name);
  if (!slug) return null;

  const country = coerceRegionIso(row.country, expectedCountry);
  if (!country || country !== expectedCountry) return null;

  const family =
    typeof row.family === "string" && row.family.trim()
      ? row.family.trim()
      : "";
  if (!family) return null;

  const commonSet = new Set<string>();
  for (const cn of coerceStringArray(row.common_names)) {
    const t = cn.trim();
    if (t) commonSet.add(t);
  }
  const common_names = [...commonSet];
  if (common_names.length === 0) return null;

  const uses = coerceUses(row.uses ?? row.primary_uses);

  return {
    scientific_name,
    family,
    country,
    common_names,
    uses,
  };
}

function dedupePlants(plants: RawPlantOut[]): RawPlantOut[] {
  const map = new Map<string, RawPlantOut>();
  for (const p of plants) {
    const key = `${normalizeScientificName(p.scientific_name)}|${p.country}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...p, common_names: [...p.common_names], uses: [...p.uses] });
      continue;
    }
    const names = new Set([...prev.common_names, ...p.common_names]);
    const uses = new Set([...prev.uses, ...p.uses]);
    map.set(key, {
      ...prev,
      common_names: [...names].sort((a, b) =>
        a.localeCompare(b, "en", { sensitivity: "base" })
      ),
      uses: [...uses].sort((a, b) => a.localeCompare(b)),
    });
  }
  return [...map.values()].sort((a, b) => {
    const c = a.country.localeCompare(b.country);
    if (c !== 0) return c;
    return normalizeScientificName(a.scientific_name).localeCompare(
      normalizeScientificName(b.scientific_name)
    );
  });
}

function normalizeNameRow(row: JsonRecord): RawNameOut | null {
  const nm = row.name;
  if (typeof nm !== "string" || !nm.trim()) return null;

  const name = nm.trim();
  const idsRaw = coerceStringArray(row.plant_ids);
  const plant_ids = [...new Set(idsRaw.map(sanitizePlantSlug))].filter(Boolean);
  if (plant_ids.length === 0) return null;

  const language =
    typeof row.language === "string" && row.language.trim()
      ? row.language.trim()
      : "en";
  const script =
    typeof row.script === "string" && row.script.trim()
      ? row.script.trim()
      : "latin";

  const country_usage = normalizeCountryUsage(row.country_usage, "US");
  if (!country_usage) return null;

  return {
    name,
    normalized: normalizeName(name),
    plant_ids,
    language,
    script,
    country_usage,
  };
}

function validateOutput(
  label: string,
  plants: RawPlantOut[],
  expected: "CA" | "US"
): void {
  const seen = new Set<string>();
  for (const p of plants) {
    if (p.country !== expected) {
      throw new Error(`[${label}] invalid country on ${p.scientific_name}`);
    }
    if (p.common_names.length === 0) {
      throw new Error(`[${label}] empty common_names on ${p.scientific_name}`);
    }
    const k = `${normalizeScientificName(p.scientific_name)}|${p.country}`;
    if (seen.has(k)) {
      throw new Error(`[${label}] duplicate plant key ${k}`);
    }
    seen.add(k);
    const slug = slugifyScientific(p.scientific_name);
    if (!slug) throw new Error(`[${label}] empty slug for ${p.scientific_name}`);
  }
}

function main(): void {
  if (!fs.existsSync(CANADA_IN)) {
    console.error(`Missing ${CANADA_IN}`);
    process.exit(1);
  }

  const canadaRaw = JSON.parse(fs.readFileSync(CANADA_IN, "utf8"));
  if (!Array.isArray(canadaRaw)) {
    console.error("canada.json: expected array");
    process.exit(1);
  }

  const canadaPlants: RawPlantOut[] = [];
  for (const row of canadaRaw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const p = normalizePlantRow(row as JsonRecord, "CA");
    if (p) canadaPlants.push(p);
  }
  const canadaOut = dedupePlants(canadaPlants);
  validateOutput("canada", canadaOut, "CA");
  fs.writeFileSync(
    CANADA_OUT,
    JSON.stringify(canadaOut, null, 2) + "\n",
    "utf8"
  );
  console.log(`Wrote ${canadaOut.length} plant(s) → ${path.relative(ROOT, CANADA_OUT)}`);

  if (!fs.existsSync(USA_LEGACY)) {
    console.warn(`No ${path.relative(ROOT, USA_LEGACY)} — skip USA split.`);
    return;
  }

  const usaRaw = JSON.parse(fs.readFileSync(USA_LEGACY, "utf8"));
  if (!Array.isArray(usaRaw)) {
    console.error("usa.json: expected array");
    process.exit(1);
  }

  const usaPlants: RawPlantOut[] = [];
  const usaNames: RawNameOut[] = [];

  for (const row of usaRaw) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const rec = row as JsonRecord;
    if (typeof rec.scientific_name === "string" && rec.scientific_name.trim()) {
      const p = normalizePlantRow(rec, "US");
      if (p) usaPlants.push(p);
      continue;
    }
    if (typeof rec.name === "string" && rec.name.trim()) {
      const n = normalizeNameRow(rec);
      if (n) usaNames.push(n);
    }
  }

  const usaPlantsOut = dedupePlants(usaPlants);
  validateOutput("usa_plants", usaPlantsOut, "US");

  usaNames.sort((a, b) => {
    const by = a.normalized.localeCompare(b.normalized, "en", {
      sensitivity: "base",
    });
    if (by !== 0) return by;
    return a.plant_ids.join(",").localeCompare(b.plant_ids.join(","));
  });

  fs.writeFileSync(
    USA_PLANTS_OUT,
    JSON.stringify(usaPlantsOut, null, 2) + "\n",
    "utf8"
  );
  console.log(
    `Wrote ${usaPlantsOut.length} plant(s) → ${path.relative(ROOT, USA_PLANTS_OUT)}`
  );

  const bundle = { plants: [] as unknown[], names: usaNames };
  fs.writeFileSync(
    USA_NAMES_OUT,
    JSON.stringify(bundle, null, 2) + "\n",
    "utf8"
  );
  console.log(
    `Wrote ${usaNames.length} name row(s) → ${path.relative(ROOT, USA_NAMES_OUT)} (bundle)`
  );

  fs.unlinkSync(USA_LEGACY);
  console.log(`Removed legacy ${path.relative(ROOT, USA_LEGACY)}`);
}

const entry = process.argv[1];
if (entry && path.resolve(entry) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
