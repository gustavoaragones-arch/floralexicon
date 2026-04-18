/**
 * Scan `data/processed/plants.json` for duplicate `id` values and write a JSON report.
 *
 * Manual: `npx tsx scripts/audit-processed-duplicates.ts`
 * Output: `data/audit/processed-duplicates-report.json`
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROCESSED_PLANTS = path.join(ROOT, "data", "processed", "plants.json");
const OUT_REPORT = path.join(ROOT, "data", "audit", "processed-duplicates-report.json");

type PlantRow = Record<string, unknown>;

function readPlants(file: string): PlantRow[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(raw)) {
    console.error(`Expected JSON array in ${file}`);
    process.exit(1);
  }
  return raw as PlantRow[];
}

/** Stable string for equality: missing vs empty array vs content. */
function normField(key: string, v: unknown): string {
  if (v === undefined) return "__undefined__";
  if (key === "countries" && Array.isArray(v)) {
    const xs = v
      .map((x) => String(x).trim().toUpperCase())
      .filter(Boolean);
    return JSON.stringify([...new Set(xs)].sort((a, b) => a.localeCompare(b)));
  }
  if ((key === "names" || key === "uses") && Array.isArray(v)) {
    const xs = v.map((x) => String(x).trim()).filter(Boolean);
    return JSON.stringify([...new Set(xs)].sort((a, b) => a.localeCompare(b)));
  }
  if (key === "uses_structured" && v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const buckets = ["medicinal", "culinary", "topical", "other"] as const;
    const norm: Record<string, string[]> = {};
    for (const b of buckets) {
      const arr = o[b];
      const xs = Array.isArray(arr)
        ? arr.map((x) => String(x).trim().toLowerCase()).filter(Boolean)
        : [];
      norm[b] = [...new Set(xs)].sort((a, b) => a.localeCompare(b));
    }
    return JSON.stringify(norm);
  }
  if (typeof v === "string") return JSON.stringify(v.trim());
  return JSON.stringify(v);
}

function fieldPreviews(
  key: string,
  rows: PlantRow[],
  maxPreviews = 3
): { distinctCount: number; previews: string[] } {
  const seen = new Set<string>();
  const previews: string[] = [];
  for (const row of rows) {
    const raw = row[key];
    const label =
      key === "uses_structured" && raw && typeof raw === "object"
        ? JSON.stringify(raw)
        : typeof raw === "string"
          ? raw.slice(0, 120)
          : JSON.stringify(raw);
    const n = normField(key, raw);
    if (seen.has(n)) continue;
    seen.add(n);
    if (previews.length < maxPreviews) previews.push(label.slice(0, 400));
  }
  return { distinctCount: seen.size, previews };
}

function main(): void {
  if (!fs.existsSync(PROCESSED_PLANTS)) {
    console.error(`Missing ${PROCESSED_PLANTS}`);
    process.exit(1);
  }

  const rows = readPlants(PROCESSED_PLANTS);
  const byId = new Map<string, { index: number; row: PlantRow }[]>();

  rows.forEach((row, index) => {
    const id = typeof row.id === "string" ? row.id.trim() : "";
    if (!id) return;
    const list = byId.get(id);
    const entry = { index, row };
    if (list) list.push(entry);
    else byId.set(id, [entry]);
  });

  const duplicateEntries: {
    id: string;
    rowCount: number;
    rowIndices: number[];
    differingFields: string[];
    fieldDetails: Record<
      string,
      { distinctCount: number; previews: string[] }
    >;
  }[] = [];

  let duplicateExtraRows = 0;

  for (const [id, group] of byId) {
    if (group.length < 2) continue;
    duplicateExtraRows += group.length - 1;

    const allKeys = new Set<string>();
    for (const { row } of group) {
      for (const k of Object.keys(row)) allKeys.add(k);
    }

    const differingFields: string[] = [];
    const fieldDetails: Record<
      string,
      { distinctCount: number; previews: string[] }
    > = {};

    for (const key of [...allKeys].sort((a, b) => a.localeCompare(b))) {
      const norms = new Set(group.map(({ row }) => normField(key, row[key])));
      if (norms.size > 1) {
        differingFields.push(key);
        fieldDetails[key] = fieldPreviews(
          key,
          group.map((g) => g.row)
        );
      }
    }

    duplicateEntries.push({
      id,
      rowCount: group.length,
      rowIndices: group.map((g) => g.index),
      differingFields,
      fieldDetails,
    });
  }

  duplicateEntries.sort((a, b) => a.id.localeCompare(b.id));

  const report = {
    generatedAt: new Date().toISOString(),
    sourcePath: path.relative(ROOT, PROCESSED_PLANTS),
    totalRows: rows.length,
    uniqueIds: byId.size,
    duplicateIdCount: duplicateEntries.length,
    duplicateExtraRows,
    duplicates: duplicateEntries,
  };

  fs.mkdirSync(path.dirname(OUT_REPORT), { recursive: true });
  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2), "utf8");

  console.log(
    `Wrote ${path.relative(ROOT, OUT_REPORT)} (${duplicateEntries.length} duplicate ids, ${duplicateExtraRows} extra rows)`
  );
}

main();
