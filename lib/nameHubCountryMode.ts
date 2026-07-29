import type { NameEntry } from "@/lib/data";
import {
  findNameRowsByPlantId,
  nameEntryCountries,
  nameEntryHasExplicitCountryCoverage,
  normalizeString,
} from "@/lib/data";

/** ISO 3166-1 alpha-2 → primary indexed language for controlled fallbacks (resolver + country mode). */
export const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  AR: "es",
  CL: "es",
  BO: "es",
  CO: "es",
  MX: "es",
  ES: "es",
  US: "en",
  CA: "en",
  FR: "fr",
  DE: "de",
  IT: "it",
};

/**
 * Returns lowercase BCP 47 primary language subtag when mapped; otherwise `null`
 * (explicit country rows only — no guessed language family).
 */
export function detectCountryLanguage(iso: string): string | null {
  const c = iso.trim().toUpperCase();
  if (!c) return null;
  const lang = COUNTRY_LANGUAGE_MAP[c];
  return typeof lang === "string" && lang.trim()
    ? lang.trim().toLowerCase()
    : null;
}

function isDominantInCountry(entry: NameEntry, countryIso: string): boolean {
  const c = countryIso.trim().toUpperCase();
  return (entry.dominant_in_countries ?? []).some(
    (x) => x.trim().toUpperCase() === c
  );
}

function sortForCountryMode(
  entries: NameEntry[],
  countryIso: string
): NameEntry[] {
  const c = countryIso.trim().toUpperCase();
  return [...entries].sort((a, b) => {
    const da = isDominantInCountry(a, c) ? 1 : 0;
    const db = isDominantInCountry(b, c) ? 1 : 0;
    if (db !== da) return db - da;
    const ca = a.name_country_count ?? nameEntryCountries(a).length;
    const cb = b.name_country_count ?? nameEntryCountries(b).length;
    if (cb !== ca) return cb - ca;
    const la = a.name.trim().length;
    const lb = b.name.trim().length;
    if (la !== lb) return la - lb;
    return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  });
}

export type CountryModeResolutionMode =
  | "native"
  | "language_fallback"
  | "global";

export type CountryModeNamePick = {
  mode: CountryModeResolutionMode;
  primaryLocalName: string;
  alternativeLabels: string[];
  /** True when at least one name row has explicit coverage for the country (excludes `global_fallback` only). */
  hasCountrySpecificRows: boolean;
};

function entryLanguageNorm(entry: NameEntry): string {
  return (entry.language ?? "").trim().toLowerCase();
}

function buildResult(
  entries: NameEntry[],
  countryIso: string,
  mode: CountryModeResolutionMode
): CountryModeNamePick {
  const c = countryIso.trim().toUpperCase();
  if (entries.length === 0) {
    return {
      mode,
      primaryLocalName: "",
      alternativeLabels: [],
      hasCountrySpecificRows: mode === "native",
    };
  }

  // Rank the full entry pool -- do not exclude non-primary entries, since
  // that silently dropped legitimate companion names (e.g. commercial vs.
  // pharmacopoeia register) from alternativeLabels. sortForCountryMode
  // already orders by dominance/country-count/name-length, which is enough
  // to put the best name first without discarding the rest.
  const ranked = sortForCountryMode(entries, c);
  const orderedLabels: string[] = [];
  // Two dedup checks, for two different problems:
  // 1) language-scoped key: two entries that are the same word in the SAME
  //    language are duplicates, but two entries that only look similar after
  //    diacritic-stripping (e.g. Spanish "Angelica" vs Catalan "Angelica")
  //    are genuinely different names and must not be collapsed into one.
  // 2) exact visible-string check: an unmodified international loanword
  //    (e.g. "Poria" used in both Dutch and French Belgium) can appear as
  //    two SEPARATE source entries with different language tags but
  //    identical rendered text. Showing "Poria / Poria" gives a reader zero
  //    information regardless of the language metadata behind it, so once
  //    a literal string has been shown, any further entry with that exact
  //    same visible text is skipped even if its language tag differs.
  const seenNorm = new Set<string>();
  const seenExact = new Set<string>();
  for (const e of ranked) {
    const label = e.name.trim();
    if (!label) continue;
    const nk = normalizeString(label);
    if (!nk) continue;
    const dedupeKey = `${nk}\u0000${(e.language ?? "").trim().toLowerCase()}`;
    if (seenNorm.has(dedupeKey)) continue;
    if (seenExact.has(label)) continue;
    seenNorm.add(dedupeKey);
    seenExact.add(label);
    orderedLabels.push(label);
  }

  const primaryLocalName = orderedLabels[0] ?? "";
  const alternativeLabels = orderedLabels.slice(1, 4);
  return {
    mode,
    primaryLocalName,
    alternativeLabels,
    hasCountrySpecificRows: mode === "native",
  };
}

/**
 * Picks display labels for country mode: explicit country rows first, then
 * same-language hub rows, then full hub (international) — deterministic sort
 * within each tier.
 */
export function pickCountryModeLocalNames(
  plantId: string,
  countryIso: string
): CountryModeNamePick {
  const c = countryIso.trim().toUpperCase();
  const pid = plantId.trim();
  if (!c || !pid) {
    return {
      mode: "global",
      primaryLocalName: "",
      alternativeLabels: [],
      hasCountrySpecificRows: false,
    };
  }

  const entries = findNameRowsByPlantId(pid);

  // STEP 1 — explicit country match
  const countrySpecific = entries.filter((entry) =>
    nameEntryHasExplicitCountryCoverage(entry, c)
  );

  if (countrySpecific.length > 0) {
    const result = buildResult(countrySpecific, c, "native");
    if (process.env.NODE_ENV === "development") {
      console.log({
        country: c,
        mode: result.mode,
        primary: result.primaryLocalName || undefined,
      });
    }
    return result;
  }

  // STEP 2 — language fallback (same mapped language only)
  const language = detectCountryLanguage(c);
  const sameLanguage =
    language != null
      ? entries.filter((entry) => entryLanguageNorm(entry) === language)
      : [];

  if (sameLanguage.length > 0) {
    const result = buildResult(sameLanguage, c, "language_fallback");
    if (process.env.NODE_ENV === "development") {
      console.log({
        country: c,
        mode: result.mode,
        primary: result.primaryLocalName || undefined,
      });
    }
    return result;
  }

  // STEP 3 — global fallback (never preferred)
  const result = buildResult(entries, c, "global");
  if (process.env.NODE_ENV === "development") {
    console.log({
      country: c,
      mode: result.mode,
      primary: result.primaryLocalName || undefined,
    });
  }
  return result;
}
