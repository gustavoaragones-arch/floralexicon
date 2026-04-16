/**
 * Suggest plant_id mappings for audit rows with no plant_ids in source.
 * Does NOT write to data/mappings/name-to-plant.json — human review only.
 *
 * Output bands:
 *   - auto_candidates: score >= 0.7 (unchanged safe threshold)
 *   - review_candidates: 0.5 <= score < 0.7 (human review)
 *
 * Run: npm run suggest-mappings
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NAMES_JSON = path.join(ROOT, "data", "names.json");
const AUDIT_JSON = path.join(ROOT, "data", "audit", "missing-plants.json");
const OUT_JSON = path.join(ROOT, "data", "audit", "name-mapping-suggestions.json");

const SCORE_AUTO = 0.7;
const SCORE_REVIEW_MIN = 0.5;

/** Same as `normalizeString` in `lib/data.ts` — keys align with `name-to-plant.json`. */
function normalizeString(input: string): string {
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

function underscoreNameKeyToSpaces(key: string): string {
  return key.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length;
  const n = b.length;
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j]!;
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1]! + 1, row[j]! + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[n]!;
}

/** 0–1 lexical similarity between two already-normalized strings. */
function labelSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  const dist = levenshtein(a, b);
  const lev = 1 - dist / maxLen;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length >= 3 && longer.includes(shorter)) return Math.max(lev, 0.82);
  if (shorter.length >= 4) {
    const tokensLong = longer.split(/\s+/).filter(Boolean);
    for (const t of tokensLong) {
      if (t.length >= 3 && (t === shorter || t.includes(shorter) || shorter.includes(t))) {
        return Math.max(lev, 0.78);
      }
    }
  }
  return lev;
}

type NameRow = {
  name: string;
  normalized: string;
  plant_ids: string[];
  countries: string[];
  language?: string;
  ambiguity_level?: string;
};

type AuditRow = {
  reason: string;
  name?: string;
  source?: string;
  frequency?: number;
  countries?: string[];
};

type ScoreBreakdown = {
  /** Best lexical match (0–1) between the missing label and indexed name rows. */
  name_similarity: number;
  /** Geographic match vs audit row countries (0–1). */
  country_overlap: number;
  /** How common this plant_id is across the full names graph (0–1). */
  frequency: number;
  /** Distinct indexed display names linked to this plant in the match set (0–1). */
  variant_coverage: number;
};

type Suggestion = {
  plant_id: string;
  score: number;
  countries_overlap: string[];
  matched_names: string[];
  total_occurrences: number;
  score_breakdown: ScoreBreakdown;
};

type OutputFile = {
  auto_candidates: Record<string, Suggestion[]>;
  review_candidates: Record<string, Suggestion[]>;
};

function isNameRow(x: unknown): x is NameRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    typeof o.normalized === "string" &&
    Array.isArray(o.plant_ids) &&
    o.plant_ids.every((p) => typeof p === "string") &&
    Array.isArray(o.countries)
  );
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function main() {
  if (!fs.existsSync(NAMES_JSON)) {
    console.error(`Missing ${NAMES_JSON}`);
    process.exit(1);
  }
  if (!fs.existsSync(AUDIT_JSON)) {
    console.error(`Missing ${AUDIT_JSON}`);
    process.exit(1);
  }

  const namesList = JSON.parse(fs.readFileSync(NAMES_JSON, "utf8")) as unknown[];
  const nameRows = namesList.filter(isNameRow);

  const audit = JSON.parse(fs.readFileSync(AUDIT_JSON, "utf8")) as AuditRow[];
  const missing = audit.filter(
    (r) => r.reason === "no_plant_ids_in_row" && typeof r.name === "string" && r.name.trim()
  );

  /** plant_id -> count of name rows in full graph (frequency proxy). */
  const plantRowCount = new Map<string, number>();
  for (const row of nameRows) {
    for (const pid of row.plant_ids) {
      plantRowCount.set(pid, (plantRowCount.get(pid) ?? 0) + 1);
    }
  }
  const maxPlantRows = Math.max(1, ...plantRowCount.values());

  const auto_candidates: Record<string, Suggestion[]> = {};
  const review_candidates: Record<string, Suggestion[]> = {};

  for (const miss of missing) {
    const rawLabel = miss.name!.trim();
    const missKey = normalizeString(rawLabel);
    if (!missKey) continue;

    const missingCountries = new Set(
      (miss.countries ?? []).map((c) => String(c).trim().toUpperCase()).filter(Boolean)
    );

    type Agg = {
      simSum: number;
      bestSim: number;
      matchedNames: Set<string>;
      overlapUnion: Set<string>;
      hitRows: number;
    };
    const byPlant = new Map<string, Agg>();

    for (const row of nameRows) {
      const n1 = normalizeString(row.name);
      const n2 = normalizeString(underscoreNameKeyToSpaces(row.normalized));
      const sim = Math.max(
        labelSimilarity(missKey, n1),
        labelSimilarity(missKey, n2),
        missKey.length >= 4 && n1.includes(missKey) ? 0.8 : 0,
        missKey.length >= 4 && n2.includes(missKey) ? 0.8 : 0
      );
      if (sim < 0.55) continue;

      for (const pid of row.plant_ids) {
        if (!pid) continue;
        let agg = byPlant.get(pid);
        if (!agg) {
          agg = {
            simSum: 0,
            bestSim: 0,
            matchedNames: new Set(),
            overlapUnion: new Set(),
            hitRows: 0,
          };
          byPlant.set(pid, agg);
        }
        agg.simSum += sim;
        if (sim > agg.bestSim) agg.bestSim = sim;
        agg.matchedNames.add(row.name.trim());
        agg.hitRows += 1;
        if (missingCountries.size > 0) {
          for (const c of row.countries) {
            const u = String(c).trim().toUpperCase();
            if (u && missingCountries.has(u)) agg.overlapUnion.add(u);
          }
        }
      }
    }

    const autoList: Suggestion[] = [];
    const reviewList: Suggestion[] = [];

    for (const [plant_id, agg] of byPlant) {
      const variantCount = agg.matchedNames.size;
      const variantScore = Math.min(1, variantCount / 2);

      let countryScore: number;
      if (missingCountries.size === 0) {
        countryScore = 0.48;
      } else {
        const ratio = agg.overlapUnion.size / missingCountries.size;
        countryScore =
          ratio > 0 ? ratio : agg.bestSim >= 0.78 ? Math.min(0.62, agg.bestSim * 0.72) : 0;
      }

      const freqNorm = Math.min(1, plantRowCount.get(plant_id)! / maxPlantRows);

      /** Unchanged composite (same weights as before this refactor). */
      const score =
        0.26 * variantScore +
        0.28 * countryScore +
        0.2 * freqNorm +
        0.26 * agg.bestSim;

      if (score < SCORE_REVIEW_MIN) continue;

      const countries_overlap = [...agg.overlapUnion].sort((a, b) => a.localeCompare(b));
      const matched_names = [...agg.matchedNames].sort((a, b) =>
        a.localeCompare(b, "en", { sensitivity: "base" })
      );

      const score_breakdown: ScoreBreakdown = {
        name_similarity: round3(agg.bestSim),
        country_overlap: round3(countryScore),
        frequency: round3(freqNorm),
        variant_coverage: round3(variantScore),
      };

      const sug: Suggestion = {
        plant_id,
        score: round3(score),
        countries_overlap,
        matched_names,
        total_occurrences: agg.hitRows,
        score_breakdown,
      };

      if (score >= SCORE_AUTO) autoList.push(sug);
      else reviewList.push(sug);
    }

    autoList.sort((a, b) => b.score - a.score);
    reviewList.sort((a, b) => b.score - a.score);

    if (autoList.length > 0) auto_candidates[missKey] = autoList.slice(0, 12);
    if (reviewList.length > 0) review_candidates[missKey] = reviewList.slice(0, 12);
  }

  const out: OutputFile = { auto_candidates, review_candidates };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2) + "\n", "utf8");

  const autoKeys = Object.keys(auto_candidates).length;
  const reviewKeys = Object.keys(review_candidates).length;
  const autoRows = Object.values(auto_candidates).reduce((n, a) => n + a.length, 0);
  const reviewRows = Object.values(review_candidates).reduce((n, a) => n + a.length, 0);

  console.log(`Wrote ${OUT_JSON}`);
  console.log(`  auto_candidates (score≥${SCORE_AUTO}): ${autoKeys} labels, ${autoRows} rows`);
  console.log(
    `  review_candidates (${SCORE_REVIEW_MIN}≤score<${SCORE_AUTO}): ${reviewKeys} labels, ${reviewRows} rows`
  );
  if (autoKeys > 0) {
    const sample = Object.entries(auto_candidates)
      .slice(0, 3)
      .map(([k, v]) => `  — ${k} → ${v[0]?.plant_id} (${v[0]?.score})`)
      .join("\n");
    console.log("Sample (auto):\n" + sample);
  }
}

main();
