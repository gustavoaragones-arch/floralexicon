/**
 * Client-side “most clicked plant” signal for a name hub (localStorage).
 * Server render stays deterministic; hydration may reorder slightly.
 */
export const PLANT_CLICK_STORAGE_KEY = "flora_lexicon_plant_clicks_v1";

export type ClickStore = Record<string, Record<string, number>>;

export function parseClickStore(raw: string | null): ClickStore {
  if (raw == null || raw === "") return {};
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return {};
    return o as ClickStore;
  } catch {
    return {};
  }
}

/** Clicks per plant id for this normalized hub key (space-separated canonical). */
export function readClickCountsForHub(hubKey: string): Map<string, number> {
  if (typeof window === "undefined") return new Map();
  const hub = hubKey.trim().toLowerCase();
  if (!hub) return new Map();
  const all = parseClickStore(window.localStorage.getItem(PLANT_CLICK_STORAGE_KEY));
  const row = all[hub];
  const m = new Map<string, number>();
  if (!row) return m;
  for (const [pid, n] of Object.entries(row)) {
    if (typeof n === "number" && n > 0 && pid) m.set(pid, n);
  }
  return m;
}

export function recordPlantClick(hubKey: string, plantId: string): void {
  if (typeof window === "undefined") return;
  const hub = hubKey.trim().toLowerCase();
  const id = plantId.trim();
  if (!hub || !id) return;
  const all = parseClickStore(window.localStorage.getItem(PLANT_CLICK_STORAGE_KEY));
  if (!all[hub]) all[hub] = {};
  all[hub][id] = (all[hub][id] ?? 0) + 1;
  try {
    window.localStorage.setItem(PLANT_CLICK_STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* quota / private mode */
  }
}

/** Small boost (0–15) from click counts for ranking tie-breaks. */
export function behavioralBoostPercent(plantId: string, counts: Map<string, number>): number {
  const n = counts.get(plantId) ?? 0;
  return Math.min(15, n * 3);
}
