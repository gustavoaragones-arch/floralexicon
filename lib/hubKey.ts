/** Canonical name-hub key: trim + lowercase (analytics, click store, comparisons). */
export function normalizeHubKey(raw: string): string {
  return raw.trim().toLowerCase();
}
