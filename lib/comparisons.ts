import { getPlantById, loadNames, normalizeString } from "@/lib/data";

const PAIR_SEP = "-vs-";

/**
 * Unique pair slugs `idA-vs-idB` (sorted) for names that map to 2+ plants.
 */
export function getAllComparisonPairSlugs(): string[] {
  const pairs = new Set<string>();
  const byName = new Map<string, Set<string>>();

  for (const entry of loadNames()) {
    const key = normalizeString(entry.normalized);
    if (!key) continue;
    if (!byName.has(key)) byName.set(key, new Set());
    for (const pid of entry.plant_ids) {
      if (getPlantById(pid)) byName.get(key)!.add(pid);
    }
  }

  for (const ids of Array.from(byName.values())) {
    const arr = Array.from(ids).sort();
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        pairs.add(`${a}${PAIR_SEP}${b}`);
      }
    }
  }

  return Array.from(pairs).sort();
}

export function parseComparisonPair(pair: string): [string, string] | null {
  const idx = pair.indexOf(PAIR_SEP);
  if (idx < 0) return null;
  const a = pair.slice(0, idx);
  const b = pair.slice(idx + PAIR_SEP.length);
  if (!a || !b) return null;
  return [a, b];
}
