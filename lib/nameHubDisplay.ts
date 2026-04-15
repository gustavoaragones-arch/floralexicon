import type { NameIndexLink } from "@/lib/data";
import { t, type Locale } from "@/lib/i18n";

/** Visible “also known as” links before “Show all”. */
export const MAX_VISIBLE_NAMES = 6;

/** True if every character is in the ASCII range (rough EN/international vs accented labels). */
export function isAsciiOnlyLabel(label: string): boolean {
  if (!label.trim()) return true;
  for (let i = 0; i < label.length; i++) {
    if (label.charCodeAt(i) > 0x7f) return false;
  }
  return true;
}

export function partitionNameLinksByAscii(
  names: NameIndexLink[]
): { ascii: NameIndexLink[]; nonAscii: NameIndexLink[] } {
  const ascii: NameIndexLink[] = [];
  const nonAscii: NameIndexLink[] = [];
  const seen = new Set<string>();
  for (const n of names) {
    if (seen.has(n.slug)) continue;
    seen.add(n.slug);
    (isAsciiOnlyLabel(n.label) ? ascii : nonAscii).push(n);
  }
  return { ascii, nonAscii };
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
