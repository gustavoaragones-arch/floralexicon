/**
 * Deduplicate `data/processed/plants.json` by `id` using the same merge rules as runtime
 * (`mergeUsesStructuredUnion` for `uses_structured`, set unions for list fields, longest
 * non-empty string for `scientific_name` / `family`).
 *
 * NOT run from the merge pipeline — manual only.
 *
 * Usage:
 *   npx tsx scripts/fix-processed-duplicates.ts           # dry-run: counts only
 *   npx tsx scripts/fix-processed-duplicates.ts --write   # backup + overwrite processed file
 *
 * Backup path: `data/processed/plants.json.backup-<ISO-timestamp>.json`
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROCESSED_PLANTS = path.join(ROOT, "data", "processed", "plants.json");

type UsesStructured = {
  medicinal: string[];
  culinary: string[];
  topical: string[];
  other: string[];
};

type PlantRow = Record<string, unknown> & {
  id?: string;
  scientific_name?: unknown;
  family?: unknown;
  names?: unknown;
  countries?: unknown;
  uses?: unknown;
  uses_structured?: unknown;
};

const BUCKETS = ["medicinal", "culinary", "topical", "other"] as const;

function emptyUsesStructured(): UsesStructured {
  return { medicinal: [], culinary: [], topical: [], other: [] };
}

function coerceUsesStructured(raw: unknown): UsesStructured {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return emptyUsesStructured();
  }
  const o = raw as Record<string, unknown>;
  const coerceArr = (x: unknown): string[] => {
    if (!Array.isArray(x)) return [];
    return x
      .map((v) => String(v).trim().toLowerCase())
      .filter(Boolean);
  };
  return {
    medicinal: [...new Set(coerceArr(o.medicinal))].sort((a, b) =>
      a.localeCompare(b)
    ),
    culinary: [...new Set(coerceArr(o.culinary))].sort((a, b) =>
      a.localeCompare(b)
    ),
    topical: [...new Set(coerceArr(o.topical))].sort((a, b) =>
      a.localeCompare(b)
    ),
    other: [...new Set(coerceArr(o.other))].sort((a, b) => a.localeCompare(b)),
  };
}

/** Same semantics as `lib/data.ts` `mergeUsesStructuredUnion`. */
function mergeUsesStructuredUnion(a: UsesStructured, b: UsesStructured): UsesStructured {
  const u = (x: string[], y: string[]) =>
    [...new Set([...x, ...y])].sort((p, q) => p.localeCompare(q));
  return {
    medicinal: u(a.medicinal, b.medicinal),
    culinary: u(a.culinary, b.culinary),
    topical: u(a.topical, b.topical),
    other: u(a.other, b.other),
  };
}

function unionStringList(rows: PlantRow[], key: "names" | "uses"): string[] {
  const s = new Set<string>();
  for (const r of rows) {
    const v = r[key];
    if (!Array.isArray(v)) continue;
    for (const x of v) {
      const t = String(x).trim();
      if (t) s.add(t);
    }
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

function unionCountries(rows: PlantRow[]): string[] {
  const s = new Set<string>();
  for (const r of rows) {
    const v = r.countries;
    if (!Array.isArray(v)) continue;
    for (const x of v) {
      const t = String(x).trim().toUpperCase();
      if (t) s.add(t);
    }
  }
  return [...s].sort((a, b) => a.localeCompare(b));
}

function longestNonEmptyString(values: unknown[]): string {
  let best = "";
  for (const v of values) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (t.length > best.length) best = t;
  }
  return best;
}

function mergeDuplicateGroup(rows: PlantRow[]): PlantRow {
  if (rows.length === 0) throw new Error("empty group");
  const id = typeof rows[0]!.id === "string" ? rows[0]!.id!.trim() : "";
  if (!id) throw new Error("missing id");

  let mergedStruct = emptyUsesStructured();
  for (const r of rows) {
    mergedStruct = mergeUsesStructuredUnion(
      mergedStruct,
      coerceUsesStructured(r.uses_structured)
    );
  }

  const out: PlantRow = {
    id,
    scientific_name: longestNonEmptyString(rows.map((r) => r.scientific_name)),
    family: longestNonEmptyString(rows.map((r) => r.family)),
    names: unionStringList(rows, "names"),
    countries: unionCountries(rows),
    uses: unionStringList(rows, "uses"),
    uses_structured: mergedStruct,
  };
  return out;
}

function readPlants(file: string): PlantRow[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(raw)) {
    console.error(`Expected JSON array in ${file}`);
    process.exit(1);
  }
  return raw as PlantRow[];
}

function main(): void {
  const write = process.argv.includes("--write");

  if (!fs.existsSync(PROCESSED_PLANTS)) {
    console.error(`Missing ${PROCESSED_PLANTS}`);
    process.exit(1);
  }

  const rows = readPlants(PROCESSED_PLANTS);
  const byId = new Map<string, PlantRow[]>();
  for (const row of rows) {
    const id = typeof row.id === "string" ? row.id.trim() : "";
    if (!id) continue;
    const list = byId.get(id);
    if (list) list.push(row);
    else byId.set(id, [row]);
  }

  let groupsWithDupes = 0;
  for (const [, g] of byId) {
    if (g.length > 1) groupsWithDupes += 1;
  }

  const mergedById = new Map<string, PlantRow>();
  for (const [id, group] of byId) {
    mergedById.set(
      id,
      group.length === 1 ? { ...group[0] } : mergeDuplicateGroup(group)
    );
  }

  const deduped: PlantRow[] = [];
  const emitted = new Set<string>();
  for (const row of rows) {
    const id = typeof row.id === "string" ? row.id.trim() : "";
    if (!id || emitted.has(id)) continue;
    deduped.push(mergedById.get(id)!);
    emitted.add(id);
  }

  const before = rows.length;
  const after = deduped.length;
  console.log(
    `Processed plants: ${before} rows → ${after} rows (${before - after} removed, ${groupsWithDupes} ids had duplicates)`
  );

  if (!write) {
    console.log("Dry-run only. Pass --write to create a backup and overwrite plants.json");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    ROOT,
    "data",
    "processed",
    `plants.json.backup-${stamp}.json`
  );
  fs.copyFileSync(PROCESSED_PLANTS, backupPath);
  console.log(`Backup: ${path.relative(ROOT, backupPath)}`);

  fs.writeFileSync(
    PROCESSED_PLANTS,
    `${JSON.stringify(deduped, null, 2)}\n`,
    "utf8"
  );
  console.log(`Wrote ${path.relative(ROOT, PROCESSED_PLANTS)}`);
}

main();
