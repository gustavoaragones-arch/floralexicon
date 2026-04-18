import type { NameEntry } from "@/lib/data";
import { nameEntryCountries, normalizeString } from "@/lib/data";

function isDominantInCountry(entry: NameEntry, countryIso: string): boolean {
  const c = countryIso.trim().toUpperCase();
  return (entry.dominant_in_countries ?? []).some((x) => x.trim().toUpperCase() === c);
}

/**
 * Labels used for a plant in a given country (from name index rows), ranked for
 * “what people say there” without language inference.
 */
export function pickCountryModeLocalNames(
  entries: readonly NameEntry[],
  plantId: string,
  countryIso: string
): { primaryLocalName: string; alternativeLabels: string[] } {
  const c = countryIso.trim().toUpperCase();
  const pid = plantId.trim();
  if (!c || !pid) return { primaryLocalName: "", alternativeLabels: [] };

  const filtered = entries.filter(
    (e) => e.plant_ids.includes(pid) && nameEntryCountries(e).includes(c)
  );
  if (filtered.length === 0) {
    return { primaryLocalName: "", alternativeLabels: [] };
  }

  const ranked = [...filtered].sort((a, b) => {
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
  return { primaryLocalName, alternativeLabels };
}
