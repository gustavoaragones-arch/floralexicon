import usesTaxonomy from "@/data/taxonomy/uses.json";

/**
 * URL helpers for taxonomy use tags (`uses_structured` leaves).
 * Paths are locale-relative segments; wrap with {@link localePath}.
 */
export function slugifyUseTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function getUsePath(tag: string): `/uses/${string}` {
  const slug = slugifyUseTag(tag);
  return `/uses/${slug}` as `/uses/${string}`;
}

/** Distinct URL slugs for every leaf in `data/taxonomy/uses.json`. */
export function getAllUseTaxonomySlugs(): string[] {
  const o = usesTaxonomy as Record<string, unknown>;
  const set = new Set<string>();
  for (const arr of Object.values(o)) {
    if (!Array.isArray(arr)) continue;
    for (const tag of arr) {
      const s = slugifyUseTag(String(tag));
      if (s) set.add(s);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Resolve a route slug to the canonical lowercase taxonomy tag, or null if unknown. */
export function canonicalTagFromUseSlug(slug: string): string | null {
  const norm = slug.trim().toLowerCase();
  if (!norm) return null;
  const o = usesTaxonomy as Record<string, string[]>;
  for (const arr of Object.values(o)) {
    if (!Array.isArray(arr)) continue;
    for (const tag of arr) {
      if (slugifyUseTag(tag) === norm) return tag;
    }
  }
  return null;
}
