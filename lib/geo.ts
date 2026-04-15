import { resolveCanonicalNameKey, type NameEntry } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { getCountryDisplayName } from "@/lib/countries";

/** Country labels for UI: map ISO codes to full names via {@link getCountryDisplayName}. */
export { getCountryDisplayName, joinCountryNames } from "@/lib/countries";

/** Confidence badge: "Most likely match" when coverage is at or above this share. */
export const CONFIDENCE_MOST_LIKELY_MIN = 0.7;
/** Confidence badge: "Strong regional signal" from this share up to (but not including) {@link CONFIDENCE_MOST_LIKELY_MIN}. */
export const CONFIDENCE_STRONG_REGIONAL_MIN = 0.4;

export type NameHubConfidenceTier = "most_likely" | "strong_regional" | "none";

export function getNameHubConfidenceTier(confidence: number): NameHubConfidenceTier {
  if (confidence >= CONFIDENCE_MOST_LIKELY_MIN) return "most_likely";
  if (confidence >= CONFIDENCE_STRONG_REGIONAL_MIN) return "strong_regional";
  return "none";
}

export type NameHubPlantConfidence = {
  /** Distinct countries where this name links to this plant / all distinct countries for this name hub. */
  confidence: number;
  countriesForPlant: number;
  totalCountriesForName: number;
};

/**
 * For a canonical name hub, count distinct countries per plant (name + plant co-occur in a name row)
 * and compute confidence = countriesForPlant / totalCountriesForName for that hub.
 */
export function getNameHubPlantConfidenceMap(
  canonicalHubKey: string,
  names: readonly NameEntry[]
): Map<string, NameHubPlantConfidence> {
  const hub = canonicalHubKey.trim();
  const allCountries = new Set<string>();
  const plantToCountries = new Map<string, Set<string>>();

  for (const entry of names) {
    if (resolveCanonicalNameKey(entry.normalized) !== hub) continue;
    const code = entry.country?.trim().toUpperCase();
    if (!code) continue;
    allCountries.add(code);
    for (const pid of entry.plant_ids) {
      const id = typeof pid === "string" ? pid.trim() : "";
      if (!id) continue;
      let set = plantToCountries.get(id);
      if (!set) {
        set = new Set();
        plantToCountries.set(id, set);
      }
      set.add(code);
    }
  }

  const denom = allCountries.size;
  const out = new Map<string, NameHubPlantConfidence>();

  for (const [plantId, set] of plantToCountries) {
    const num = set.size;
    out.set(plantId, {
      confidence: denom > 0 ? num / denom : 0,
      countriesForPlant: num,
      totalCountriesForName: denom,
    });
  }
  return out;
}

/**
 * Count how many name records (rows in names.json) mention `plantId` in a given country.
 */
export function aggregateCountryFrequencyForPlant(
  plantId: string,
  names: readonly NameEntry[]
): Map<string, number> {
  const freq = new Map<string, number>();
  const id = plantId.trim();
  if (!id) return freq;

  for (const entry of names) {
    if (!entry.plant_ids.includes(id)) continue;
    const code = entry.country?.trim().toUpperCase();
    if (!code) continue;
    freq.set(code, (freq.get(code) ?? 0) + 1);
  }
  return freq;
}

/** All distinct ISO country codes for a plant, sorted by record frequency then label. */
export function getPlantCountryCodesSorted(
  plantId: string,
  names: readonly NameEntry[],
  lang: Locale = "en"
): string[] {
  const freq = aggregateCountryFrequencyForPlant(plantId, names);
  return sortCountryCodesByFrequencyThenLabel(freq, lang);
}

/**
 * All name rows whose canonical key matches `canonicalNormalizedKey` contribute countries.
 */
export function aggregateCountryFrequencyForNameHub(
  canonicalNormalizedKey: string,
  names: readonly NameEntry[]
): Map<string, number> {
  const freq = new Map<string, number>();
  const hub = canonicalNormalizedKey.trim();
  if (!hub) return freq;

  for (const entry of names) {
    const k = resolveCanonicalNameKey(entry.normalized);
    if (k !== hub) continue;
    const code = entry.country?.trim().toUpperCase();
    if (!code) continue;
    freq.set(code, (freq.get(code) ?? 0) + 1);
  }
  return freq;
}

export function getNameHubCountryCodesSorted(
  canonicalNormalizedKey: string,
  names: readonly NameEntry[],
  lang: Locale
): string[] {
  const freq = aggregateCountryFrequencyForNameHub(
    canonicalNormalizedKey,
    names
  );
  return sortCountryCodesByFrequencyThenLabel(freq, lang);
}

export function sortCountryCodesByFrequencyThenLabel(
  freq: Map<string, number>,
  lang: Locale
): string[] {
  const codes = Array.from(freq.keys());
  return codes.sort((a, b) => {
    const fa = freq.get(a) ?? 0;
    const fb = freq.get(b) ?? 0;
    if (fb !== fa) return fb - fa;
    return getCountryDisplayName(a, lang).localeCompare(
      getCountryDisplayName(b, lang),
      lang === "es" ? "es" : "en",
      { sensitivity: "base" }
    );
  });
}
