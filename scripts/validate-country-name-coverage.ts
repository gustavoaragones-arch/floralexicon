/**
 * Quality-aware (plant, country) coverage vs name index rows.
 *
 * Classifies each pair: explicit | fallback_only | missing
 * Writes:
 *   - data/audit/missing-country-names.json (summary + all pairs with status)
 *   - data/audit/country-enrichment-priority.json (research prioritization)
 *
 * Usage:
 *   npx tsx scripts/validate-country-name-coverage.ts
 *   npm run ci:coverage   # same script; fails on missing or fallback-only pairs
 *   npx tsx scripts/validate-country-name-coverage.ts --fix   # dev-only: inject global_fallback (still fails ci:coverage)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";
import type { CountryUsage, NameEntry } from "../lib/data";
import {
  nameEntryCountries,
  nameEntryHasExplicitCountryCoverage,
} from "../lib/data";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROCESSED_PLANTS = path.join(ROOT, "data", "processed", "plants.json");
const PROCESSED_NAMES = path.join(ROOT, "data", "processed", "names.json");
const DATA_NAMES = path.join(ROOT, "data", "names.json");
const AUDIT_DIR = path.join(ROOT, "data", "audit");
const AUDIT_OUT = path.join(AUDIT_DIR, "missing-country-names.json");
const PRIORITY_OUT = path.join(AUDIT_DIR, "country-enrichment-priority.json");

type PlantRow = {
  id: string;
  scientific_name?: string;
  countries?: string[];
};

type NameRow = {
  name: string;
  normalized: string;
  plant_ids: string[];
  countries: string[];
  country_usage?: CountryUsage[];
  is_global_dominant_name?: boolean;
  name_country_count?: number;
  [key: string]: unknown;
};

export type CoverageStatus = "explicit" | "fallback_only" | "missing";

export type CoveragePairRow = {
  plant_id: string;
  scientific_name?: string;
  country: string;
  status: CoverageStatus;
  /** Distinct `country_usage.source` values on rows covering this pair (audit only). */
  sources?: string[];
};

export type CoverageSummary = {
  total_pairs: number;
  explicit: number;
  fallback_only: number;
  missing: number;
};

function rowHasCountry(name: NameRow, country: string): boolean {
  const C = country.trim().toUpperCase();
  return nameEntryCountries(name as NameEntry).includes(C);
}

function rowCountryCount(name: NameRow): number {
  return nameEntryCountries(name as NameEntry).length;
}

function usageSourcesForPair(
  plantId: string,
  country: string,
  names: NameRow[]
): string[] {
  const C = country.trim().toUpperCase();
  const set = new Set<string>();
  for (const n of names) {
    if (!n.plant_ids.includes(plantId)) continue;
    const u = n.country_usage;
    if (!Array.isArray(u)) continue;
    for (const cu of u) {
      if (typeof cu.country !== "string") continue;
      if (cu.country.trim().toUpperCase() !== C) continue;
      const s = cu.source;
      if (typeof s === "string" && s.trim()) set.add(s.trim());
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Exclusive partition of an explicit (plant, country) pair by coarse source tag. */
function explicitSourcePartition(
  plantId: string,
  country: string,
  names: NameRow[]
): "local_ethnobotany" | "global_reuse" | "other_explicit" {
  const C = country.trim().toUpperCase();
  const entries = names.filter(
    (n) => n.plant_ids.includes(plantId) && rowHasCountry(n, C)
  );
  let hasLocal = false;
  let hasReuse = false;
  for (const n of entries) {
    const u = n.country_usage;
    if (!Array.isArray(u)) continue;
    for (const cu of u) {
      if (typeof cu.country !== "string" || cu.country.trim().toUpperCase() !== C) {
        continue;
      }
      if (cu.source === "local_ethnobotany") hasLocal = true;
      if (cu.source === "global_reuse") hasReuse = true;
    }
  }
  if (hasLocal) return "local_ethnobotany";
  if (hasReuse) return "global_reuse";
  return "other_explicit";
}

function classifyPair(
  plantId: string,
  country: string,
  names: NameRow[]
): CoverageStatus {
  const C = country.trim().toUpperCase();
  const entries = names.filter(
    (n) => n.plant_ids.includes(plantId) && rowHasCountry(n, C)
  );

  if (entries.length === 0) return "missing";

  const hasExplicit = entries.some((e) =>
    nameEntryHasExplicitCountryCoverage(e as NameEntry, C)
  );
  if (hasExplicit) return "explicit";

  const hasFallback = entries.some((e) => {
    const u = e.country_usage;
    if (!Array.isArray(u)) return false;
    return u.some(
      (c) =>
        typeof c.country === "string" &&
        c.country.trim().toUpperCase() === C &&
        c.source === "global_fallback"
    );
  });
  if (hasFallback) return "fallback_only";

  return "explicit";
}

function buildCoveragePairs(
  plants: PlantRow[],
  names: NameRow[]
): { pairs: CoveragePairRow[]; summary: CoverageSummary } {
  const pairs: CoveragePairRow[] = [];
  let explicit = 0;
  let fallback_only = 0;
  let missing = 0;

  for (const p of plants) {
    const pid = p.id?.trim();
    if (!pid) continue;
    const countries = (p.countries ?? [])
      .map((c) => String(c).trim().toUpperCase())
      .filter(Boolean);
    for (const country of countries) {
      const status = classifyPair(pid, country, names);
      const sources = usageSourcesForPair(pid, country, names);
      pairs.push({
        plant_id: pid,
        scientific_name: p.scientific_name,
        country,
        status,
        ...(sources.length > 0 ? { sources } : {}),
      });
      if (status === "explicit") explicit++;
      else if (status === "fallback_only") fallback_only++;
      else missing++;
    }
  }

  return {
    pairs,
    summary: {
      total_pairs: pairs.length,
      explicit,
      fallback_only,
      missing,
    },
  };
}

function pickFallbackTarget(rows: NameRow[]): NameRow | null {
  const dom = rows.find((r) => r.is_global_dominant_name === true);
  if (dom) return dom;
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => rowCountryCount(b) - rowCountryCount(a))[0]!;
}

function injectCoverage(
  names: NameRow[],
  plantId: string,
  country: string
): boolean {
  const C = country.trim().toUpperCase();
  const rows = names.filter(
    (n) => n.plant_ids.includes(plantId) && rowHasCountry(n, C)
  );
  if (rows.length > 0) return false;

  const forPlant = names.filter((n) => n.plant_ids.includes(plantId));
  const target = pickFallbackTarget(forPlant);
  if (!target) return false;

  const usage: CountryUsage[] = Array.isArray(target.country_usage)
    ? [...target.country_usage]
    : nameEntryCountries(target as NameEntry).map((cc) => ({
        country: cc,
        is_primary: true,
        confidence: "medium" as const,
      }));

  if (
    usage.some(
      (u) =>
        typeof u.country === "string" &&
        u.country.trim().toUpperCase() === C
    )
  ) {
    return false;
  }

  usage.push({
    country: C,
    is_primary: false,
    confidence: "low",
    source: "global_fallback",
  });
  target.country_usage = usage;
  const sorted = [
    ...new Set(
      usage.map((u) =>
        typeof u.country === "string" ? u.country.trim().toUpperCase() : ""
      )
    ),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  target.countries = sorted;
  target.name_country_count = sorted.length;
  return true;
}

function buildEnrichmentPriority(
  pairs: CoveragePairRow[],
  names: NameRow[]
): {
  plants_ranked_by_fallback_country_count: {
    plant_id: string;
    scientific_name?: string;
    fallback_only_countries: string[];
    count: number;
  }[];
  countries_ranked_by_fallback_load: {
    country: string;
    explicit_pairs: number;
    fallback_only_pairs: number;
    missing_pairs: number;
    fallback_share_of_non_missing: number;
  }[];
  countries_coverage_by_source: {
    country: string;
    explicit: number;
    global_reuse: number;
    local_ethnobotany: number;
    other_explicit: number;
  }[];
} {
  const byPlant = new Map<
    string,
    { scientific_name?: string; fallbackCountries: Set<string> }
  >();
  const byCountry = new Map<
    string,
    { explicit: number; fallback_only: number; missing: number }
  >();

  for (const pr of pairs) {
    if (!byCountry.has(pr.country)) {
      byCountry.set(pr.country, { explicit: 0, fallback_only: 0, missing: 0 });
    }
    const ca = byCountry.get(pr.country)!;
    if (pr.status === "explicit") ca.explicit++;
    else if (pr.status === "fallback_only") ca.fallback_only++;
    else ca.missing++;

    if (pr.status === "fallback_only") {
      if (!byPlant.has(pr.plant_id)) {
        byPlant.set(pr.plant_id, {
          scientific_name: pr.scientific_name,
          fallbackCountries: new Set(),
        });
      }
      byPlant.get(pr.plant_id)!.fallbackCountries.add(pr.country);
    }
  }

  const plants_ranked_by_fallback_country_count = [...byPlant.entries()]
    .map(([plant_id, v]) => ({
      plant_id,
      scientific_name: v.scientific_name,
      fallback_only_countries: [...v.fallbackCountries].sort((a, b) =>
        a.localeCompare(b)
      ),
      count: v.fallbackCountries.size,
    }))
    .sort((a, b) => b.count - a.count);

  const countries_ranked_by_fallback_load = [...byCountry.entries()]
    .map(([country, v]) => {
      const nonMissing = v.explicit + v.fallback_only;
      const fallback_share_of_non_missing =
        nonMissing > 0 ? v.fallback_only / nonMissing : 0;
      return {
        country,
        explicit_pairs: v.explicit,
        fallback_only_pairs: v.fallback_only,
        missing_pairs: v.missing,
        fallback_share_of_non_missing,
      };
    })
    .sort((a, b) => {
      if (b.fallback_only_pairs !== a.fallback_only_pairs) {
        return b.fallback_only_pairs - a.fallback_only_pairs;
      }
      return b.fallback_share_of_non_missing - a.fallback_share_of_non_missing;
    });

  const sourceByCountry = new Map<
    string,
    {
      explicit: number;
      global_reuse: number;
      local_ethnobotany: number;
      other_explicit: number;
    }
  >();

  for (const pr of pairs) {
    if (pr.status !== "explicit") continue;
    if (!sourceByCountry.has(pr.country)) {
      sourceByCountry.set(pr.country, {
        explicit: 0,
        global_reuse: 0,
        local_ethnobotany: 0,
        other_explicit: 0,
      });
    }
    const row = sourceByCountry.get(pr.country)!;
    row.explicit++;
    const part = explicitSourcePartition(pr.plant_id, pr.country, names);
    if (part === "local_ethnobotany") row.local_ethnobotany++;
    else if (part === "global_reuse") row.global_reuse++;
    else row.other_explicit++;
  }

  const countries_coverage_by_source = [...sourceByCountry.entries()]
    .map(([country, v]) => ({
      country,
      explicit: v.explicit,
      global_reuse: v.global_reuse,
      local_ethnobotany: v.local_ethnobotany,
      other_explicit: v.other_explicit,
    }))
    .sort((a, b) => a.country.localeCompare(b.country));

  return {
    plants_ranked_by_fallback_country_count,
    countries_ranked_by_fallback_load,
    countries_coverage_by_source,
  };
}

function main() {
  const fix = process.argv.includes("--fix");

  const plants = JSON.parse(
    fs.readFileSync(PROCESSED_PLANTS, "utf8")
  ) as PlantRow[];
  const namesPath = fs.existsSync(PROCESSED_NAMES)
    ? PROCESSED_NAMES
    : DATA_NAMES;
  const names = JSON.parse(fs.readFileSync(namesPath, "utf8")) as NameRow[];

  let { pairs, summary } = buildCoveragePairs(plants, names);
  let fixed = 0;

  if (fix) {
    const seen = new Set<string>();
    for (const pr of pairs) {
      if (pr.status !== "missing") continue;
      const key = `${pr.plant_id}\0${pr.country}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (injectCoverage(names, pr.plant_id, pr.country)) fixed++;
    }
    ({ pairs, summary } = buildCoveragePairs(plants, names));
  }

  const priority = buildEnrichmentPriority(pairs, names);

  fs.mkdirSync(AUDIT_DIR, { recursive: true });
  fs.writeFileSync(
    AUDIT_OUT,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        fix_mode: fix,
        summary,
        pairs,
        ...(fix ? { injected_country_rows: fixed } : {}),
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  fs.writeFileSync(
    PRIORITY_OUT,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        ...priority,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(`Wrote ${AUDIT_OUT}`);
  console.log(`Wrote ${PRIORITY_OUT}`);
  console.log(
    `Coverage: explicit=${summary.explicit} fallback_only=${summary.fallback_only} missing=${summary.missing} (total_pairs=${summary.total_pairs})`
  );

  if (fix) {
    const out = JSON.stringify(names, null, 2) + "\n";
    fs.writeFileSync(PROCESSED_NAMES, out, "utf8");
    fs.writeFileSync(DATA_NAMES, out, "utf8");
    console.log(
      `--fix: injected coverage on ${fixed} row update(s); synced names.json`
    );
  }

  let failed = false;
  if (summary.missing > 0) {
    console.error(
      "❌ Missing country coverage detected. Enrich raw inputs (see docs/data-quality.md)."
    );
    failed = true;
  }
  if (summary.fallback_only > 0) {
    console.error(
      "❌ Fallback-only coverage detected (not allowed). Remove global_fallback rows or add explicit coverage."
    );
    failed = true;
  }
  if (failed) process.exit(1);
}

main();
