/**
 * Canonical normalized name-map key (space-separated, accent-folded) →
 * URL path segment for `/name/[slug]` (hyphens).
 *
 * Shared by client navigation and server routing so slug rules stay in one place.
 */
export function toUrlSlug(normalized: string): string {
  return normalized.replace(/\s+/g, "-");
}
