import type { NameIndexLink, Plant } from "@/lib/data";
import {
  normalizeString,
  urlSlugToCanonicalSlug,
} from "@/lib/data";
import { t, type Locale } from "@/lib/i18n";

/** Visible “also known as” links before “Show all”. */
export const MAX_VISIBLE_NAMES = 6;

/**
 * Script-only check: Latin letters plus whitespace, hyphen, apostrophe.
 * Hyphen is last in the class so it is literal (same intent as `\s-'` in invalid JS ranges).
 */
export function isLatinScript(str: string): boolean {
  return /^[\p{Script=Latin}\s'-]+$/u.test(str);
}

/**
 * Sort name chips: exact query match (label or slug), then row count, then shorter label, then A–Z.
 */
export function sortNameIndexLinksForScriptGroups(
  links: NameIndexLink[],
  queryDisplay: string,
  freq: Map<string, number>
): NameIndexLink[] {
  const queryNorm = normalizeString(queryDisplay.trim());
  const raw = queryDisplay.trim();
  const querySlugCanon = raw ? urlSlugToCanonicalSlug(raw) : "";

  const rank = (link: NameIndexLink) => {
    const labelNorm = normalizeString(link.label);
    const slugCanon = urlSlugToCanonicalSlug(link.slug);
    const hitQuery =
      (queryNorm && labelNorm === queryNorm) ||
      (querySlugCanon && slugCanon === querySlugCanon)
        ? 1
        : 0;
    const f = freq.get(slugCanon) ?? 0;
    return { hitQuery, f, len: link.label.length, label: link.label, slug: link.slug };
  };

  return [...links].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (rb.hitQuery !== ra.hitQuery) return rb.hitQuery - ra.hitQuery;
    if (rb.f !== ra.f) return rb.f - ra.f;
    if (ra.len !== rb.len) return ra.len - rb.len;
    const lab = ra.label.localeCompare(rb.label, "en", { sensitivity: "base" });
    if (lab !== 0) return lab;
    return ra.slug.localeCompare(rb.slug, "en");
  });
}

/** Human-readable bullet text for traditional `primary_uses` keys (name hub). */
export function formatHumanUseKey(lang: Locale, raw: string): string {
  const k = raw.trim().toLowerCase();
  switch (k) {
    case "tea":
      return t(lang, "hub_use_human_tea");
    case "medicinal":
      return t(lang, "hub_use_human_medicinal");
    case "ritual":
      return t(lang, "hub_use_human_ritual");
    case "culinary":
      return t(lang, "hub_use_human_culinary");
    case "aromatic":
      return t(lang, "hub_use_human_aromatic");
    default:
      return k ? k.charAt(0).toUpperCase() + k.slice(1) : "";
  }
}

/** Human-readable label for a `uses_structured` leaf (reuses `primary_uses` phrasing where keys match). */
export function formatStructuredUseTagDisplay(lang: Locale, tag: string): string {
  return formatHumanUseKey(lang, tag.trim().toLowerCase());
}

/** Up to `max` tags: all medicinal first, then culinary (for name-hub primary card). */
export function topStructuredUseTagsForPrimaryCard(plant: Plant, max = 2): string[] {
  const us = plant.uses_structured;
  const med = us.medicinal.slice(0, max);
  const need = max - med.length;
  const cul = need > 0 ? us.culinary.slice(0, need) : [];
  return [...med, ...cul].slice(0, max);
}

/** ISO 3166-1 alpha-2 → regional indicator flag emoji (empty if invalid). */
export function countryCodeToFlagEmoji(code: string): string {
  const cc = code.trim().toUpperCase();
  if (cc.length !== 2 || !/^[A-Z]{2}$/.test(cc)) return "";
  const base = 0x1f1e6;
  const a = cc.charCodeAt(0) - 0x41 + base;
  const b = cc.charCodeAt(1) - 0x41 + base;
  if (a < base || a > base + 25 || b < base || b > base + 25) return "";
  return String.fromCodePoint(a, b);
}
