import { resolveCanonicalNameKey, type NameEntry } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import { getCountryDisplayName } from "@/lib/countries";

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
