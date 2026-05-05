/**
 * Phase 1a canary — standalone regression test for the six (plant, country) pairs.
 * Simulates pickCountryModeLocalNames (with RC6 is_primary prefilter) directly
 * against data/processed/names.json so it can run without Next.js.
 *
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 *
 * Usage: npm run canary
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROCESSED_NAMES = path.join(ROOT, "data", "processed", "names.json");

type CountryUsage = {
  country: string;
  is_primary?: boolean;
  source?: string;
  confidence?: string;
};

type NameRow = {
  name: string;
  normalized: string;
  plant_ids: string[];
  countries: string[];
  country_usage?: CountryUsage[];
  dominant_in_countries?: string[];
  name_country_count?: number;
  language?: string;
};

function normalizeStr(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function rowCountries(row: NameRow): string[] {
  if (Array.isArray(row.country_usage) && row.country_usage.length > 0) {
    const s = new Set<string>();
    for (const u of row.country_usage) {
      const c = typeof u.country === "string" ? u.country.trim().toUpperCase() : "";
      if (c) s.add(c);
    }
    return [...s];
  }
  return (row.countries ?? []).map((c) => c.trim().toUpperCase()).filter(Boolean);
}

function hasExplicitCoverage(row: NameRow, iso: string): boolean {
  const C = iso.trim().toUpperCase();
  if (Array.isArray(row.country_usage) && row.country_usage.length > 0) {
    return row.country_usage.some(
      (u) =>
        typeof u.country === "string" &&
        u.country.trim().toUpperCase() === C &&
        u.source !== "global_fallback"
    );
  }
  return rowCountries(row).includes(C);
}

function isDominantInCountry(row: NameRow, iso: string): boolean {
  return (row.dominant_in_countries ?? []).some(
    (x) => x.trim().toUpperCase() === iso
  );
}

function sortForCountryMode(entries: NameRow[], iso: string): NameRow[] {
  return [...entries].sort((a, b) => {
    const da = isDominantInCountry(a, iso) ? 1 : 0;
    const db = isDominantInCountry(b, iso) ? 1 : 0;
    if (db !== da) return db - da;
    const ca = a.name_country_count ?? rowCountries(a).length;
    const cb = b.name_country_count ?? rowCountries(b).length;
    if (cb !== ca) return cb - ca;
    if (a.name.trim().length !== b.name.trim().length)
      return a.name.trim().length - b.name.trim().length;
    return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  });
}

/** RC6 fix: prefilter by is_primary before sort. */
function pickPrimary(rows: NameRow[], iso: string): string {
  const C = iso.trim().toUpperCase();
  const countrySpecific = rows.filter((r) => hasExplicitCoverage(r, C));
  const pool = countrySpecific.length > 0 ? countrySpecific : rows;
  const primaries = pool.filter(
    (r) => r.country_usage?.some((u) => u.country === C && u.is_primary === true)
  );
  const ranked = sortForCountryMode(primaries.length ? primaries : pool, C);
  const seen = new Set<string>();
  for (const r of ranked) {
    const label = r.name.trim();
    const nk = normalizeStr(label);
    if (!label || !nk || seen.has(nk)) continue;
    seen.add(nk);
    return label;
  }
  return "";
}

const CANARY_CASES: [string, string, string][] = [
  ["matricaria_chamomilla", "CL", "Manzanilla"],
  ["matricaria_chamomilla", "PE", "Manzanilla"],
  ["matricaria_chamomilla", "AR", "Manzanilla"],
  ["matricaria_chamomilla", "FR", "Camomille"],
  ["matricaria_chamomilla", "US", "Chamomile"],
  ["matricaria_chamomilla", "DE", "Kamille"],
];

function main() {
  const names: NameRow[] = JSON.parse(fs.readFileSync(PROCESSED_NAMES, "utf8"));

  const byPlant = new Map<string, NameRow[]>();
  for (const row of names) {
    for (const pid of row.plant_ids ?? []) {
      let list = byPlant.get(pid);
      if (!list) { list = []; byPlant.set(pid, list); }
      list.push(row);
    }
  }

  let failures = 0;
  for (const [plantId, country, expected] of CANARY_CASES) {
    const rows = byPlant.get(plantId) ?? [];
    const got = pickPrimary(rows, country);
    const pass = got === expected;
    const tag = pass ? "PASS" : "FAIL";
    console.log(`[${tag}] ${plantId} × ${country} → "${got}" (expected "${expected}")`);
    if (!pass) failures++;
  }

  if (failures > 0) {
    console.error(`\n${failures} canary case(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll canary cases passed ✓");
}

main();
