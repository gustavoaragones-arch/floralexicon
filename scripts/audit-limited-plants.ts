/**
 * Build `data/audit/limited-plants.json`: plants that match "limited data" / enrichment backlog rules.
 *
 * Criteria (any → listed):
 * - Ghost: referenced in `data/names.json` but no row in `data/processed/plants.json` (runtime isGhost).
 * - Empty uses: missing `uses` / `primary_uses` or non-array or length 0.
 * - If `description` exists on the record: empty or whitespace-only.
 * - If `metadata` exists on the record: null or empty object.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROCESSED_PLANTS = path.join(ROOT, "data", "processed", "plants.json");
const NAMES_JSON = path.join(ROOT, "data", "names.json");
const OUT_JSON = path.join(ROOT, "data", "audit", "limited-plants.json");

type LimitedRow = {
  plant_id: string;
  scientific_name: string;
  countries: string[];
  names: string[];
  isGhost?: boolean;
  /** Why this row was included (for backlog triage). */
  reasons: string[];
};

function readJsonArray(file: string): unknown[] {
  if (!fs.existsSync(file)) {
    console.error(`Missing file: ${file}`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (!Array.isArray(raw)) {
    console.error(`Expected JSON array in ${file}`);
    process.exit(1);
  }
  return raw;
}

function usesEmpty(p: Record<string, unknown>): boolean {
  const u = p.uses ?? p.primary_uses;
  if (!Array.isArray(u)) return true;
  return u.length === 0;
}

function descriptionEffectivelyMissing(p: Record<string, unknown>): boolean {
  if (!Object.prototype.hasOwnProperty.call(p, "description")) return false;
  const d = p.description;
  if (d == null) return true;
  if (typeof d === "string" && !d.trim()) return true;
  return false;
}

function metadataEffectivelyEmpty(p: Record<string, unknown>): boolean {
  if (!Object.prototype.hasOwnProperty.call(p, "metadata")) return false;
  const m = p.metadata;
  if (m == null) return true;
  if (typeof m === "object" && !Array.isArray(m)) {
    return Object.keys(m as object).length === 0;
  }
  return false;
}

function idFromUnderscores(id: string): string {
  const t = id.replace(/_/g, " ").trim();
  if (!t) return id;
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0).toUpperCase() + parts[0]!.slice(1)} ${parts[1]!.toLowerCase()}`;
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function collectNameIndexByPlant(): Map<
  string,
  { countries: Set<string>; displayNames: Set<string> }
> {
  const names = readJsonArray(NAMES_JSON) as Record<string, unknown>[];
  const byPlant = new Map<
    string,
    { countries: Set<string>; displayNames: Set<string> }
  >();

  for (const row of names) {
    const ids = new Set<string>();
    if (typeof row.plant_id === "string" && row.plant_id.trim()) {
      ids.add(row.plant_id.trim());
    }
    if (Array.isArray(row.plant_ids)) {
      for (const id of row.plant_ids) {
        if (typeof id === "string" && id.trim()) ids.add(id.trim());
      }
    }
    const cset = new Set<string>();
    if (Array.isArray(row.countries)) {
      for (const c of row.countries) {
        if (typeof c === "string" && c.trim()) cset.add(c.trim().toUpperCase());
      }
    }
    if (typeof row.country === "string" && row.country.trim()) {
      cset.add(row.country.trim().toUpperCase());
    }
    const display =
      typeof row.name === "string" && row.name.trim() ? row.name.trim() : "";

    for (const pid of ids) {
      let rec = byPlant.get(pid);
      if (!rec) {
        rec = { countries: new Set(), displayNames: new Set() };
        byPlant.set(pid, rec);
      }
      for (const c of cset) rec.countries.add(c);
      if (display) rec.displayNames.add(display);
    }
  }

  return byPlant;
}

function main(): void {
  const plants = readJsonArray(PROCESSED_PLANTS) as Record<string, unknown>[];
  const processedIds = new Set<string>();
  for (const p of plants) {
    if (typeof p.id === "string" && p.id.trim()) processedIds.add(p.id.trim());
  }

  const nameIndex = collectNameIndexByPlant();
  const byId = new Map<string, LimitedRow>();

  function mergeReasons(a: string[], b: string[]): string[] {
    return [...new Set([...a, ...b])].sort();
  }

  for (const p of plants) {
    const id = typeof p.id === "string" ? p.id.trim() : "";
    if (!id) continue;

    const rowReasons: string[] = [];
    const ghost = p.isGhost === true;
    if (ghost) rowReasons.push("isGhost_flag");

    if (usesEmpty(p)) rowReasons.push("no_uses");
    if (descriptionEffectivelyMissing(p)) rowReasons.push("empty_description");
    if (metadataEffectivelyEmpty(p)) rowReasons.push("empty_metadata");

    if (rowReasons.length === 0) continue;

    const countries = Array.isArray(p.countries)
      ? (p.countries as unknown[])
          .map((c) => String(c).trim().toUpperCase())
          .filter(Boolean)
      : [];
    const names = Array.isArray(p.names)
      ? (p.names as unknown[]).map((n) => String(n).trim()).filter(Boolean)
      : [];
    const sci =
      typeof p.scientific_name === "string"
        ? p.scientific_name
        : idFromUnderscores(id);

    const existing = byId.get(id);
    if (existing) {
      existing.reasons = mergeReasons(existing.reasons, rowReasons);
      existing.countries = [
        ...new Set([...existing.countries, ...countries]),
      ].sort();
      existing.names = [
        ...new Set([...existing.names, ...names]),
      ].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
      if (ghost) existing.isGhost = true;
      if (
        sci.length > existing.scientific_name.length &&
        typeof p.scientific_name === "string"
      ) {
        existing.scientific_name = sci;
      }
    } else {
      byId.set(id, {
        plant_id: id,
        scientific_name: sci,
        countries: [...new Set(countries)].sort(),
        names: [...new Set(names)].sort((a, b) =>
          a.localeCompare(b, "en", { sensitivity: "base" })
        ),
        ...(ghost ? { isGhost: true } : {}),
        reasons: rowReasons,
      });
    }
  }

  const seen = new Set(byId.keys());

  // Ghosts: in names index but not in processed plants (runtime ghost).
  for (const [pid, idx] of nameIndex) {
    if (processedIds.has(pid) || seen.has(pid)) continue;
    seen.add(pid);
    byId.set(pid, {
      plant_id: pid,
      scientific_name: idFromUnderscores(pid),
      countries: [...idx.countries].sort(),
      names: [...idx.displayNames].sort((a, b) =>
        a.localeCompare(b, "en", { sensitivity: "base" })
      ),
      isGhost: true,
      reasons: ["ghost_not_in_plants_json"],
    });
  }

  const limited = [...byId.values()].sort((a, b) =>
    a.plant_id.localeCompare(b.plant_id, "en", { sensitivity: "base" })
  );

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(limited, null, 2) + "\n", "utf-8");

  const ghostCount = limited.filter((r) => r.isGhost).length;
  const noUsesOnly = limited.filter(
    (r) => r.reasons.includes("no_uses") && r.reasons.length === 1
  ).length;
  console.log(`Limited plants: ${limited.length}`);
  console.log(`  (ghost / not in processed: ${ghostCount}, uses-only rows: ${noUsesOnly})`);
  console.log(`Wrote: ${path.relative(ROOT, OUT_JSON)}`);
}

const entry = process.argv[1];
if (entry && path.resolve(entry) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
