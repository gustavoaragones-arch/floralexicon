import type { NameEntry } from "@/lib/data";
import {
  findNameRowsByPlantId,
  nameEntryCountries,
  nameEntryHasExplicitCountryCoverage,
  normalizeString,
} from "@/lib/data";

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

export type CountryModeNamePick = {
  primaryLocalName: string;
  alternativeLabels: string[];
  /** True when at least one name row has explicit coverage for the country (excludes `global_fallback` only). */
  hasCountrySpecificRows: boolean;
};

/**
 * Picks display labels for country mode: prefers rows that include the selected
 * country; if none exist, falls back to all indexed name rows for the plant
 * (same sort keys, honest UI via {@link CountryModeNamePick.hasCountrySpecificRows}).
 */
export function pickCountryModeLocalNames(
  plantId: string,
  countryIso: string
): CountryModeNamePick {
  const c = countryIso.trim().toUpperCase();
  const pid = plantId.trim();
  if (!c || !pid) {
    return {
      primaryLocalName: "",
      alternativeLabels: [],
      hasCountrySpecificRows: false,
    };
  }

  const plantNameEntries = findNameRowsByPlantId(pid);
  const countrySpecific = plantNameEntries.filter((e) =>
    nameEntryHasExplicitCountryCoverage(e, c)
  );
  const globalNames = plantNameEntries;
  const effectiveNames =
    countrySpecific.length > 0 ? countrySpecific : globalNames;

  if (effectiveNames.length === 0) {
    return {
      primaryLocalName: "",
      alternativeLabels: [],
      hasCountrySpecificRows: countrySpecific.length > 0,
    };
  }

  const ranked = sortForCountryMode(effectiveNames, c);
  const orderedLabels: string[] = [];
  const seenNorm = new Set<string>();
  for (const e of ranked) {
    const label = e.name.trim();
    if (!label) continue;
    const nk = normalizeString(label);
    if (!nk) continue;
    if (seenNorm.has(nk)) continue;
    seenNorm.add(nk);
    orderedLabels.push(label);
  }

  const primaryLocalName = orderedLabels[0] ?? "";
  const alternativeLabels = orderedLabels.slice(1, 4);
  return {
    primaryLocalName,
    alternativeLabels,
    hasCountrySpecificRows: countrySpecific.length > 0,
  };
}
