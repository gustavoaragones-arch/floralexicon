/**
 * Post-merge enrichment: plant-level authority, global vs per-country name dominance,
 * and cross-label variants. Reads/writes data/processed/names.json and data/names.json.
 * Writes data/audit/cross-country-names-report.md.
 *
 * Does not read or write data/raw.
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";
import type { CountryUsage } from "../lib/data";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROCESSED_NAMES = path.join(ROOT, "data", "processed", "names.json");
const DATA_NAMES = path.join(ROOT, "data", "names.json");
const PROCESSED_PLANTS = path.join(ROOT, "data", "processed", "plants.json");
const REPORT = path.join(ROOT, "data", "audit", "cross-country-names-report.md");

type PlantRow = {
  id: string;
  scientific_name: string;
  countries?: string[];
};

/** Working row while mutating; output matches NameEntry extensions in lib/data.ts */
type NameRow = {
  name: string;
  normalized: string;
  plant_ids: string[];
  countries: string[];
  country_usage?: CountryUsage[];
  language: string;
  ambiguity_level: string;
  name_country_count?: number;
  plant_country_span?: number;
  plant_authority_tier?: "standard" | "cross_regional" | "cosmopolitan";
  is_global_dominant_name?: boolean;
  dominant_in_countries?: string[];
  plant_name_variants?: string[];
  [key: string]: unknown;
};

/** ISO list for a row: prefer `country_usage`, else legacy `countries`. */
function rowCountryIsos(row: NameRow): string[] {
  if (Array.isArray(row.country_usage) && row.country_usage.length > 0) {
    const s = new Set<string>();
    for (const u of row.country_usage) {
      const c =
        typeof u.country === "string" ? u.country.trim().toUpperCase() : "";
      if (c) s.add(c);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }
  const from = Array.isArray(row.countries) ? row.countries : [];
  return from
    .map((c) => String(c).trim().toUpperCase())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function stripLegacyAuthorityFields(row: NameRow) {
  const legacy = [
    "plant_country_span",
    "lexicon_authority_tier",
    "plant_authority_tier",
    "dominant_common_name_for_plant",
    "is_global_dominant_name",
    "plant_name_variants",
    "name_country_count",
    "dominant_in_countries",
  ] as const;
  for (const k of legacy) delete row[k];
}

function tierForSpan(span: number): "standard" | "cross_regional" | "cosmopolitan" {
  if (span >= 15) return "cosmopolitan";
  if (span >= 3) return "cross_regional";
  return "standard";
}

/**
 * Score for choosing the dominant label for `(plant_id, country)`.
 * +2 when the row lists that country (required for candidates, keeps explicit weight);
 * hub breadth as a soft signal; slight preference for shorter display labels.
 */
function regionalRowScore(row: NameRow, countryIso: string): number {
  const C = countryIso.trim().toUpperCase();
  const codes = rowCountryIsos(row);
  const listsC = codes.some((c) => c === C) ? 2 : 0;
  return listsC + codes.length * 0.3 - row.name.length * 0.01;
}

/** Per-country dominant: highest {@link regionalRowScore}, then shorter `name`, then `normalized`. */
function pickRegionalWinner(rows: NameRow[], country: string): NameRow | null {
  const C = country.trim().toUpperCase();
  const candidates = rows.filter(
    (r) => r.plant_ids[0] && rowCountryIsos(r).some((c) => c === C)
  );
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => {
    const sb = regionalRowScore(b, C);
    const sa = regionalRowScore(a, C);
    if (sb !== sa) return sb - sa;
    if (a.name.length !== b.name.length) return a.name.length - b.name.length;
    return a.normalized.localeCompare(b.normalized, "en", { sensitivity: "base" });
  })[0]!;
}

function main() {
  const names = JSON.parse(fs.readFileSync(PROCESSED_NAMES, "utf8")) as NameRow[];
  const plants: PlantRow[] = JSON.parse(
    fs.readFileSync(PROCESSED_PLANTS, "utf8")
  ) as PlantRow[];

  const plantById = new Map<string, PlantRow>();
  for (const p of plants) {
    if (p.id) plantById.set(p.id, p);
  }

  const spanByPlant = new Map<string, Set<string>>();
  for (const p of plants) {
    const s = new Set<string>();
    for (const c of p.countries ?? []) {
      const u = String(c).trim().toUpperCase();
      if (u) s.add(u);
    }
    spanByPlant.set(p.id, s);
  }
  for (const row of names) {
    for (const pid of row.plant_ids) {
      let set = spanByPlant.get(pid);
      if (!set) {
        set = new Set();
        spanByPlant.set(pid, set);
      }
      for (const c of rowCountryIsos(row)) {
        const u = String(c).trim().toUpperCase();
        if (u) set.add(u);
      }
    }
  }

  const namesByPlant = new Map<string, NameRow[]>();
  for (const row of names) {
    const pid = row.plant_ids[0];
    if (!pid) continue;
    let list = namesByPlant.get(pid);
    if (!list) {
      list = [];
      namesByPlant.set(pid, list);
    }
    list.push(row);
  }

  /** Global dominant: max countries on hub, then shorter name, then normalized (span ≥ 3 only). */
  const globalDominantKey = new Set<string>();
  const globalDominantNormalizedByPlant = new Map<string, string>();
  for (const [pid, rows] of namesByPlant) {
    const span = spanByPlant.get(pid)?.size ?? 0;
    if (span < 3) continue;
    let best = rows[0]!;
    let bestN = rowCountryIsos(best).length;
    for (const r of rows) {
      const n = rowCountryIsos(r).length;
      if (n > bestN) {
        best = r;
        bestN = n;
      } else if (n === bestN) {
        if (r.name.length < best.name.length) best = r;
        else if (r.name.length === best.name.length && r.normalized < best.normalized)
          best = r;
      }
    }
    globalDominantKey.add(`${pid}\0${best.normalized}`);
    globalDominantNormalizedByPlant.set(pid, best.normalized);
  }

  /** Per (plant_id, country ISO): winning row.normalized */
  const regionalWinnerNormalized = new Map<string, string>();
  for (const [pid, rows] of namesByPlant) {
    const countries = spanByPlant.get(pid);
    if (!countries) continue;
    for (const C of countries) {
      const w = pickRegionalWinner(rows, C);
      if (w) regionalWinnerNormalized.set(`${pid}\0${C}`, w.normalized);
    }
  }

  /** row -> countries where this row is regional winner */
  const dominantInByRow = new Map<NameRow, Set<string>>();
  for (const row of names) {
    dominantInByRow.set(row, new Set());
  }
  for (const [key, norm] of regionalWinnerNormalized) {
    const [pid, C] = key.split("\0");
    const rows = namesByPlant.get(pid!);
    if (!rows) continue;
    const winner = rows.find((r) => r.normalized === norm);
    if (!winner) continue;
    dominantInByRow.get(winner)!.add(C!);
  }

  const seenComposite = new Set<string>();
  for (const row of names) {
    const pid = row.plant_ids[0];
    if (!pid) continue;
    const span = spanByPlant.get(pid)?.size ?? 0;
    const comp = `${row.normalized}\0${pid}`;
    if (seenComposite.has(comp)) {
      throw new Error(`Duplicate normalized+plant_id: ${comp}`);
    }
    seenComposite.add(comp);

    stripLegacyAuthorityFields(row);

    row.name_country_count = rowCountryIsos(row).length;
    row.countries = rowCountryIsos(row);

    if (span >= 3) {
      row.plant_country_span = span;
      row.plant_authority_tier = tierForSpan(span);
      row.is_global_dominant_name = globalDominantKey.has(`${pid}\0${row.normalized}`);
      const siblings = namesByPlant.get(pid) ?? [];
      const variants = new Set<string>();
      for (const o of siblings) {
        if (o.normalized === row.normalized) continue;
        if (o.name.trim()) variants.add(o.name.trim());
      }
      if (variants.size > 0) {
        row.plant_name_variants = [...variants].sort((a, b) =>
          a.localeCompare(b, "en", { sensitivity: "base" })
        );
      }
    }

    const dset = dominantInByRow.get(row);
    const dlist = dset && dset.size > 0 ? [...dset].sort((a, b) => a.localeCompare(b)) : [];
    row.dominant_in_countries = dlist;
  }

  /** Mismatch: country where regional winner ≠ global dominant (plants with span ≥ 3). */
  type Mismatch = {
    plant_id: string;
    scientific_name: string;
    country: string;
    global_label: string;
    regional_label: string;
  };
  const mismatches: Mismatch[] = [];
  for (const [pid, rows] of namesByPlant) {
    const span = spanByPlant.get(pid)?.size ?? 0;
    if (span < 3) continue;
    const gNorm = globalDominantNormalizedByPlant.get(pid);
    if (!gNorm) continue;
    const globalRow = rows.find((r) => r.normalized === gNorm);
    const globalLabel = globalRow?.name ?? gNorm;
    const countries = [...(spanByPlant.get(pid) ?? [])].sort();
    for (const C of countries) {
      const rNorm = regionalWinnerNormalized.get(`${pid}\0${C}`);
      if (!rNorm || rNorm === gNorm) continue;
      const regRow = rows.find((r) => r.normalized === rNorm);
      mismatches.push({
        plant_id: pid,
        scientific_name: plantById.get(pid)?.scientific_name ?? pid,
        country: C,
        global_label: globalLabel,
        regional_label: regRow?.name ?? rNorm,
      });
    }
  }
  mismatches.sort((a, b) => {
    if (a.plant_id !== b.plant_id) return a.plant_id.localeCompare(b.plant_id);
    return a.country.localeCompare(b.country);
  });

  /** Same normalized slug → multiple species */
  const hubToPlants = new Map<string, Set<string>>();
  const hubToSci = new Map<string, Map<string, string>>();
  for (const row of names) {
    const hub = row.normalized;
    let set = hubToPlants.get(hub);
    if (!set) {
      set = new Set();
      hubToPlants.set(hub, set);
    }
    for (const pid of row.plant_ids) {
      set.add(pid);
      const pr = plantById.get(pid);
      if (!hubToSci.has(hub)) hubToSci.set(hub, new Map());
      hubToSci.get(hub)!.set(pid, pr?.scientific_name ?? pid);
    }
  }
  const conflicts: {
    normalized: string;
    displaySample: string;
    plant_ids: string[];
    scientific_names: string[];
  }[] = [];
  for (const [hub, ids] of hubToPlants) {
    if (ids.size <= 1) continue;
    const sci = hubToSci.get(hub)!;
    const plant_ids = [...ids].sort();
    const sample = names.find((r) => r.normalized === hub)?.name ?? hub;
    conflicts.push({
      normalized: hub,
      displaySample: sample,
      plant_ids,
      scientific_names: plant_ids.map((id) => sci.get(id) ?? id),
    });
  }
  conflicts.sort((a, b) => b.plant_ids.length - a.plant_ids.length);

  const topPlants = [...spanByPlant.entries()]
    .map(([id, set]) => ({
      id,
      span: set.size,
      scientific_name: plantById.get(id)?.scientific_name ?? id,
    }))
    .filter((x) => x.span >= 1)
    .sort((a, b) => b.span - a.span)
    .slice(0, 50);

  const multiCountryPlants = [...spanByPlant.entries()].filter(
    ([, s]) => s.size >= 3
  ).length;

  let orphanNameRows = 0;
  for (const row of names) {
    const pid = row.plant_ids[0];
    if (pid && !plantById.has(pid)) orphanNameRows++;
  }

  const mismatchSummary = new Map<string, number>();
  for (const m of mismatches) {
    mismatchSummary.set(m.plant_id, (mismatchSummary.get(m.plant_id) ?? 0) + 1);
  }
  const topMismatchPlants = [...mismatchSummary.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);

  const report = [
    "# Cross-country name authority report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Name rows: **${names.length}**`,
    `- Plants (processed): **${plants.length}**`,
    `- Plants with ≥3 distinct countries (union names + plant regions): **${multiCountryPlants}**`,
    `- Name hubs where the same \`normalized\` slug maps to **>1** species: **${conflicts.length}**`,
    `- Orphan name rows (plant_id missing from processed plants): **${orphanNameRows}**`,
    `- Country-level vs global dominant mismatches (rows): **${mismatches.length}**`,
    "",
    "## Canonical scientific_name consistency",
    "",
    `- Each name row carries a single primary \`plant_id\`; that id is present in \`data/processed/plants.json\` with one \`scientific_name\` per id (merge pipeline invariant).`,
    "",
    "## Top 50 plants by country coverage",
    "",
    "| Rank | plant_id | countries | scientific_name |",
    "| ---: | --- | ---: | --- |",
    ...topPlants.map(
      (r, i) =>
        `| ${i + 1} | \`${r.id}\` | ${r.span} | ${r.scientific_name.replace(/\|/g, "\\|")} |`
    ),
    "",
    "## Top mismatches between global dominant vs regional dominant",
    "",
    "For each plant with ≥3 countries, the **global** dominant label is the hub with the widest geographic footprint (`country_usage` or legacy `countries`; then shorter name). The **regional** dominant for ISO `C` is the row among those listing `C` with highest score: `+2` if `C` is present, `+ 0.3 × hub width`, `- 0.01 × label.length`; ties → shorter `name`, then `normalized`.",
    "",
    "### Plants with the most mismatching countries",
    "",
    "| plant_id | mismatching countries |",
    "| --- | ---: |",
    ...(topMismatchPlants.length
      ? topMismatchPlants.map(([id, n]) => `| \`${id}\` | ${n} |`)
      : ["| _(none)_ | 0 |"]),
    "",
    "### Sample rows (first 40)",
    "",
    mismatches.length === 0
      ? "_No mismatches: for every country on multi-country plants, the regional dominant label matches the global dominant._\n"
      : [
          "| plant_id | country | global label | regional label |",
          "| --- | --- | --- | --- |",
          ...mismatches.slice(0, 40).map(
            (m) =>
              `| \`${m.plant_id}\` | ${m.country} | ${String(m.global_label).replace(/\|/g, "\\|")} | ${String(m.regional_label).replace(/\|/g, "\\|")} |`
          ),
          ...(mismatches.length > 40
            ? [`| … | (${mismatches.length - 40} more) | | |`]
            : []),
        ].join("\n"),
    "",
    "## Same common-name hub → different species (conflicts)",
    "",
    conflicts.length
      ? [
          "These hubs intentionally keep multiple rows (disambiguation in UI). Listed for QA.",
          "",
          "| normalized | example label | #species | scientific_names |",
          "| --- | --- | ---: | --- |",
          ...conflicts.slice(0, 80).map((c) => {
            const sci = c.scientific_names.join("; ");
            return `| \`${c.normalized}\` | ${String(c.displaySample).replace(/\|/g, "\\|")} | ${c.plant_ids.length} | ${sci.replace(/\|/g, "\\|")} |`;
          }),
          ...(conflicts.length > 80
            ? [`| … | (${conflicts.length - 80} more) | | |`]
            : []),
        ].join("\n")
      : "_None — every normalized slug maps to at most one species._",
    "",
    "## Row fields (processed + bundled names)",
    "",
    "**Plant-level** (when `plant_country_span` ≥ 3):",
    "",
    "- `plant_country_span`: distinct ISO codes for the plant (names ∪ `plants.json` regions).",
    "- `plant_authority_tier`: `cross_regional` if span ≥ 3; `cosmopolitan` if span ≥ 15.",
    "- `plant_name_variants`: other indexed labels for the same plant.",
    "",
    "**Name-level** (all rows):",
    "",
    "- `name_country_count`: number of distinct ISO codes on this hub row (`country_usage` or `countries`).",
    "- `is_global_dominant_name`: true on one row per multi-country plant (widest hub coverage).",
    "- `dominant_in_countries`: ISO list where this row wins the per-country competition for that plant.",
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, report, "utf8");

  const out = JSON.stringify(names, null, 2) + "\n";
  fs.writeFileSync(PROCESSED_NAMES, out, "utf8");
  fs.writeFileSync(DATA_NAMES, out, "utf8");

  console.log(`Wrote ${PROCESSED_NAMES}`);
  console.log(`Wrote ${DATA_NAMES}`);
  console.log(`Wrote ${REPORT}`);
  console.log(
    `Multi-country plants (≥3): ${multiCountryPlants}; hub conflicts: ${conflicts.length}; global/regional mismatches: ${mismatches.length}`
  );
}

main();
