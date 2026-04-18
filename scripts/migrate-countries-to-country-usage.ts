/**
 * One-time / idempotent migration: derive `country_usage` from legacy `countries`
 * on each name row. Keeps `countries` in sync as a sorted ISO list for older tools.
 *
 * Reads & writes:
 *   - data/processed/names.json
 *   - data/names.json
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROCESSED_NAMES = path.join(ROOT, "data", "processed", "names.json");
const DATA_NAMES = path.join(ROOT, "data", "names.json");

type CountryUsage = {
  country: string;
  is_primary?: boolean;
  confidence?: "high" | "medium" | "low";
  source?: "wikidata" | "paper" | "manual" | "global_fallback";
};

type NameRow = {
  countries?: string[];
  country_usage?: CountryUsage[];
  country?: string;
  name_country_count?: number;
  [key: string]: unknown;
};

function legacyCountryIsos(row: NameRow): string[] {
  const s = new Set<string>();
  if (Array.isArray(row.countries)) {
    for (const c of row.countries) {
      const u = typeof c === "string" ? c.trim().toUpperCase() : "";
      if (u) s.add(u);
    }
  }
  if (typeof row.country === "string" && row.country.trim()) {
    s.add(row.country.trim().toUpperCase());
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

function usageFromCountries(codes: string[]): CountryUsage[] {
  return codes.map((country) => ({
    country,
    is_primary: true,
    confidence: "medium" as const,
  }));
}

function migrateRows(names: NameRow[]): { changed: number } {
  let changed = 0;
  for (const row of names) {
    if (Array.isArray(row.country_usage) && row.country_usage.length > 0) {
      continue;
    }

    const codes = legacyCountryIsos(row);
    if (codes.length === 0) continue;

    row.country_usage = usageFromCountries(codes);
    row.countries = [...codes];
    row.name_country_count = codes.length;
    changed++;
  }
  return { changed };
}

function main() {
  for (const p of [PROCESSED_NAMES, DATA_NAMES]) {
    if (!fs.existsSync(p)) {
      console.error(`Missing ${p}. Run: npm run merge-dataset`);
      process.exit(1);
    }
  }

  const names = JSON.parse(
    fs.readFileSync(PROCESSED_NAMES, "utf8")
  ) as NameRow[];
  const { changed } = migrateRows(names);
  const out = JSON.stringify(names, null, 2) + "\n";
  fs.writeFileSync(PROCESSED_NAMES, out, "utf8");
  fs.writeFileSync(DATA_NAMES, out, "utf8");
  console.log(
    `migrate-countries-to-country-usage: updated ${changed} name row(s); wrote processed + data names.json`
  );
}

main();
