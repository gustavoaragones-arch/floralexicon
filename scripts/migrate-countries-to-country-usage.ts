/**
 * One-time / idempotent migration: derive `country_usage` from legacy `countries`
 * on each name row. Keeps `countries` in sync as a sorted ISO list for older tools.
 *
 * For newly created `country_usage` entries (no `country_usage` yet):
 * - `language === "en"` and country outside primary Anglophone markets → `global_reuse`
 * - otherwise → `local_ethnobotany`
 *
 * Additionally, any existing `country_usage` item with **no** `source` field gets the
 * same inference (never overwrites a non-empty `source`).
 *
 * Reads & writes:
 *   - data/processed/names.json
 *   - data/names.json
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";
import type { CountryUsageSource } from "../lib/data";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROCESSED_NAMES = path.join(ROOT, "data", "processed", "names.json");
const DATA_NAMES = path.join(ROOT, "data", "names.json");

type CountryUsage = {
  country: string;
  is_primary?: boolean;
  confidence?: "high" | "medium" | "low";
  source?: CountryUsageSource;
};

type NameRow = {
  countries?: string[];
  country_usage?: CountryUsage[];
  country?: string;
  name_country_count?: number;
  language?: string;
  [key: string]: unknown;
};

/** Primary Anglophone ISO markets (outside → `global_reuse` when row language is `en`). */
const ANGLOPHONE_PRIMARY = new Set([
  "US",
  "CA",
  "GB",
  "IE",
  "AU",
  "NZ",
]);

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

function inferCountryUsageSource(
  row: NameRow,
  countryIso: string
): "global_reuse" | "local_ethnobotany" {
  const lang =
    typeof row.language === "string" ? row.language.trim().toLowerCase() : "";
  const C = countryIso.trim().toUpperCase();
  const inferredIsReuse = lang === "en" && !ANGLOPHONE_PRIMARY.has(C);
  return inferredIsReuse ? "global_reuse" : "local_ethnobotany";
}

function usageFromCountries(row: NameRow, codes: string[]): CountryUsage[] {
  return codes.map((country) => ({
    country,
    is_primary: true,
    confidence: "medium" as const,
    source: inferCountryUsageSource(row, country),
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

    row.country_usage = usageFromCountries(row, codes);
    row.countries = [...codes];
    row.name_country_count = codes.length;
    changed++;
  }
  return { changed };
}

/** Set `source` on `country_usage` entries that omit it (preserves any existing `source`). */
function backfillUsageSources(names: NameRow[]): { changed: number } {
  let changed = 0;
  for (const row of names) {
    if (!Array.isArray(row.country_usage) || row.country_usage.length === 0) {
      continue;
    }
    let touched = false;
    for (const u of row.country_usage) {
      if (u.source != null) continue;
      if (typeof u.country !== "string" || !u.country.trim()) continue;
      u.source = inferCountryUsageSource(row, u.country);
      touched = true;
    }
    if (touched) changed++;
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
  const { changed: created } = migrateRows(names);
  const { changed: backfilled } = backfillUsageSources(names);
  const out = JSON.stringify(names, null, 2) + "\n";
  fs.writeFileSync(PROCESSED_NAMES, out, "utf8");
  fs.writeFileSync(DATA_NAMES, out, "utf8");
  console.log(
    `migrate-countries-to-country-usage: created country_usage on ${created} row(s); backfilled source on ${backfilled} row(s); wrote processed + data names.json`
  );
}

main();
