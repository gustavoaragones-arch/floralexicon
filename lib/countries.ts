import type { Locale } from "@/lib/i18n";

export const countryMap: Record<string, string> = {
  AR: "Argentina",
  BO: "Bolivia",
  CL: "Chile",
  CO: "Colombia",
  EC: "Ecuador",
  ES: "Spain",
  GB: "United Kingdom",
  MX: "Mexico",
  PE: "Peru",
  US: "United States",
  UY: "Uruguay",
  VE: "Venezuela",
};

function englishNameToUrlSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Build reverse lookup: url slug (peru, ecuador) → ISO code. */
function buildSlugToCode(): Map<string, string> {
  const m = new Map<string, string>();
  for (const [code, name] of Object.entries(countryMap)) {
    m.set(englishNameToUrlSlug(name), code);
  }
  m.set("usa", "US");
  m.set("uk", "GB");
  m.set("united-states", "US");
  m.set("united-kingdom", "GB");
  return m;
}

const urlSlugToCountryCodeMap = buildSlugToCode();

/** URL segment for /name/[slug]/[country] (e.g. peru, ecuador). */
export function countryCodeToUrlSlug(code: string): string {
  const k = code.trim().toUpperCase();
  const name = countryMap[k];
  if (name) return englishNameToUrlSlug(name);
  return k.toLowerCase();
}

/** Resolve geo URL segment to ISO country code. */
export function urlSlugToCountryCode(slug: string): string | undefined {
  const s = slug.trim().toLowerCase();
  const fromMap = urlSlugToCountryCodeMap.get(s);
  if (fromMap) return fromMap;
  if (s.length === 2 && /^[a-z]{2}$/.test(s)) return s.toUpperCase();
  return undefined;
}

/** Legacy `?country=` query: ISO code or English URL slug (e.g. PE, peru). */
export function resolveCountryFromQueryParam(raw: string): string | undefined {
  const s = raw.trim();
  if (!s) return undefined;
  if (/^[a-zA-Z]{2}$/.test(s)) {
    const code = s.toUpperCase();
    return countryMap[code] ? code : undefined;
  }
  return urlSlugToCountryCode(s);
}

export function getCountryName(code: string): string {
  const k = code.trim().toUpperCase();
  return countryMap[k] || code.trim();
}

/** Full country name for UI, localized (EN/ES) via Intl with map fallback. */
export function getCountryDisplayName(code: string, lang: Locale): string {
  const k = code.trim().toUpperCase();
  if (!k) return "";
  try {
    const loc = lang === "es" ? "es" : "en";
    const dn = new Intl.DisplayNames([loc], { type: "region" });
    const n = dn.of(k);
    if (n) return n;
  } catch {
    /* non-ISO codes */
  }
  return countryMap[k] || k;
}

/**
 * Join codes in array order (e.g. already sorted by frequency) — dedupes preserving first occurrence.
 */
export function joinCountryNames(codes: string[], lang: Locale): string {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const c of codes) {
    const k = c.trim().toUpperCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    order.push(k);
  }
  return order.map((code) => getCountryDisplayName(code, lang)).join(", ");
}

/** ISO codes: dedupe, sort by localized display name, join. */
export function formatCountryList(codes: string[], lang: Locale = "en"): string {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const c of codes) {
    const k = c.trim().toUpperCase();
    if (k && !seen.has(k)) {
      seen.add(k);
      keys.push(k);
    }
  }
  keys.sort((a, b) =>
    getCountryDisplayName(a, lang).localeCompare(
      getCountryDisplayName(b, lang),
      lang === "es" ? "es" : "en",
      { sensitivity: "base" }
    )
  );
  return keys.map((code) => getCountryDisplayName(code, lang)).join(", ");
}

/**
 * Plant origin / region strings: dedupe, sort by display label, map through {@link getCountryName}
 * (ISO codes become names; other strings pass through).
 */
export function formatRegionList(regions: string[]): string {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const r of regions) {
    const t = r.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    items.push(t);
  }
  items.sort((a, b) => getCountryName(a).localeCompare(getCountryName(b), "en"));
  return items.map((r) => getCountryName(r)).join(", ");
}
