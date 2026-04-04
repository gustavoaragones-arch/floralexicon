/**
 * FloraLexicon merged dataset validation — logical consistency & quality checks.
 * Reads data/processed/plants.json (production: plants linked from names) and names.json.
 * Run merge-dataset first. Full inventory is in data/canonical/plants.json.
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

/** Match mergeDataset.normalizeScientificName (do not import mergeDataset — it runs main() on load). */
function normalizeScientificName(scientific: string): string {
  return scientific
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
const PLANTS_PATH = path.join(ROOT, "data", "processed", "plants.json");
const NAMES_PATH = path.join(ROOT, "data", "processed", "names.json");

type PlantRow = {
  id: string;
  scientific_name: string;
  names: string[];
  countries: string[];
  uses?: string[];
};

type NameRow = {
  name: string;
  normalized: string;
  plant_ids: string[];
  countries: string[];
};

/** Collapse trivial scientific-name variants (e.g. trailing "L.", rank noise) for duplicate clustering. */
function scientificDedupKey(scientific: string): string {
  let n = normalizeScientificName(scientific);
  n = n.replace(/\s+l\.?\s*$/i, "");
  n = n.replace(/\s+sp\.?\s*$/i, "");
  n = n.replace(/\s+ssp\.?\s*$/i, "");
  n = n.replace(/\s+subsp\.?\s*$/i, "");
  return n.trim();
}

function loadJson<T>(filePath: string, label: string): T {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${label}: ${filePath}`);
    console.error("Run: npm run merge-dataset");
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T;
}

const HIGH_AMBIGUITY_THRESHOLD = 3;
const LOW_COUNTRY_PLANT_COUNT = 2; // flag countries with fewer plants than this

function main() {
  const plants = loadJson<PlantRow[]>(PLANTS_PATH, "plants.json");
  const names = loadJson<NameRow[]>(NAMES_PATH, "names.json");

  const duplicateScientific: string[] = [];
  const weakNoNames: string[] = [];
  const weakNoCountries: string[] = [];
  const highAmbiguity: string[] = [];
  const unusedPlants: string[] = [];
  const lowCountryCounts: string[] = [];

  // --- 1. Duplicate scientific name variants (same dedup key, multiple plants) ---
  const bySciKey = new Map<
    string,
    { id: string; scientific_name: string }[]
  >();
  for (const p of plants) {
    const key = scientificDedupKey(p.scientific_name);
    if (!key) continue;
    let list = bySciKey.get(key);
    if (!list) {
      list = [];
      bySciKey.set(key, list);
    }
    list.push({ id: p.id, scientific_name: p.scientific_name });
  }
  for (const [key, rows] of bySciKey) {
    if (rows.length < 2) continue;
    const uniqueIds = new Set(rows.map((r) => r.id));
    if (uniqueIds.size < 2) continue;
    const lines = rows
      .map((r) => `    ${r.id}: "${r.scientific_name}"`)
      .sort()
      .join("\n");
    duplicateScientific.push(`  [${key}]\n${lines}`);
  }

  // --- 2. Empty / weak plants ---
  for (const p of plants) {
    if (!p.names || p.names.length === 0) {
      weakNoNames.push(`  ${p.id} — "${p.scientific_name}"`);
    }
    if (!p.countries || p.countries.length === 0) {
      weakNoCountries.push(`  ${p.id} — "${p.scientific_name}"`);
    }
  }

  // --- 3. High ambiguity names (>3 plants) ---
  for (const row of names) {
    const n = row.plant_ids?.length ?? 0;
    if (n > HIGH_AMBIGUITY_THRESHOLD) {
      highAmbiguity.push(
        `High ambiguity: ${row.name} → ${n} plants`
      );
    }
  }

  // --- 4. Plants never referenced in names.json plant_ids ---
  const referencedIds = new Set<string>();
  for (const row of names) {
    for (const id of row.plant_ids ?? []) {
      if (id) referencedIds.add(id);
    }
  }
  const plantIds = new Set(plants.map((p) => p.id));
  for (const id of plantIds) {
    if (!referencedIds.has(id)) {
      const p = plants.find((x) => x.id === id);
      unusedPlants.push(`  ${id} — "${p?.scientific_name ?? "?"}"`);
    }
  }

  // --- 5. Country distribution ---
  const countryPlantCount = new Map<string, number>();
  for (const p of plants) {
    for (const c of p.countries ?? []) {
      const cc = String(c).trim().toUpperCase();
      if (!cc) continue;
      countryPlantCount.set(cc, (countryPlantCount.get(cc) ?? 0) + 1);
    }
  }
  const sortedCountries = [...countryPlantCount.entries()].sort(
    (a, b) => a[0].localeCompare(b[0])
  );
  for (const [code, count] of sortedCountries) {
    if (count < LOW_COUNTRY_PLANT_COUNT) {
      lowCountryCounts.push(`  ${code}: ${count} plant(s)`);
    }
  }

  // --- 6. Console report ---
  console.log("=== FloraLexicon dataset validation ===\n");
  console.log(`Total plants:  ${plants.length}`);
  console.log(`Total names:   ${names.length}`);
  console.log(`Countries (in plant.country lists): ${countryPlantCount.size}`);
  console.log("");

  const sections: { title: string; lines: string[] }[] = [
    {
      title: `Duplicate scientific name variants (${duplicateScientific.length})`,
      lines: duplicateScientific,
    },
    {
      title: `Plants with no names (${weakNoNames.length})`,
      lines: weakNoNames,
    },
    {
      title: `Plants with no countries (${weakNoCountries.length})`,
      lines: weakNoCountries,
    },
    {
      title: `High ambiguity names — >${HIGH_AMBIGUITY_THRESHOLD} plants (${highAmbiguity.length})`,
      lines: highAmbiguity.map((l) => `  ${l}`),
    },
    {
      title: `Unused plants — not in any names.json plant_ids (${unusedPlants.length})`,
      lines: unusedPlants,
    },
    {
      title: `Low country coverage — <${LOW_COUNTRY_PLANT_COUNT} plants (${lowCountryCounts.length})`,
      lines: lowCountryCounts,
    },
  ];

  let totalIssues = 0;
  for (const { title, lines } of sections) {
    totalIssues += lines.length;
    console.log(`--- ${title} ---`);
    if (lines.length === 0) {
      console.log("  (none)\n");
    } else {
      console.log(lines.join("\n"));
      console.log("");
    }
  }

  console.log("--- Country plant counts (all) ---");
  for (const [code, count] of sortedCountries) {
    console.log(`  ${code}: ${count}`);
  }
  console.log("");

  const summary =
    totalIssues === 0
      ? "No issues in the checked categories."
      : `Found ${totalIssues} row-level findings across ${sections.filter((s) => s.lines.length > 0).length} non-empty categories.`;
  console.log(`=== Summary ===\n${summary}`);
}

main();
