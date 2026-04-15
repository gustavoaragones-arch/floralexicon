import { countryCodeToUrlSlug, countryMap } from "@/lib/countries";
import {
  getNameEntryUrlSlug,
  loadNames,
  loadPlants,
  type NameIndexLink,
  type Plant,
} from "@/lib/data";
import { locales, type Locale } from "@/lib/i18n";
import { getMergedPlantRow } from "@/lib/plantDetailData";

/** ISO codes that appear on at least one slim-index plant in merged `countries`. */
export function getCountryCodesWithIndexedPlants(): string[] {
  const codes = new Set<string>();
  for (const p of loadPlants()) {
    const m = getMergedPlantRow(p.id);
    for (const c of m?.countries ?? []) {
      const u = c.trim().toUpperCase();
      if (u.length >= 2) codes.add(u);
    }
  }
  return [...codes]
    .filter((c) => Boolean(countryMap[c] || /^[A-Z]{2}$/.test(c)))
    .sort((a, b) => a.localeCompare(b));
}

/** Slim-index plants whose merged row lists `iso` in `countries`. */
export function getPlantsForCountry(iso: string): Plant[] {
  const want = iso.trim().toUpperCase();
  if (!want) return [];
  return loadPlants()
    .filter((p) => {
      const m = getMergedPlantRow(p.id);
      return (m?.countries ?? []).some((c) => c.trim().toUpperCase() === want);
    })
    .sort((a, b) => a.scientific_name.localeCompare(b.scientific_name, "en"));
}

/** Name hubs with at least one record in `names` for this ISO country. */
export function getNameLinksForCountry(iso: string, limit = 48): NameIndexLink[] {
  const want = iso.trim().toUpperCase();
  if (!want) return [];
  const bySlug = new Map<string, string>();
  for (const e of loadNames()) {
    if (e.country.trim().toUpperCase() !== want) continue;
    const slug = getNameEntryUrlSlug(e);
    if (!slug) continue;
    const label = e.name.trim() || slug;
    if (!bySlug.has(slug)) bySlug.set(slug, label);
  }
  return [...bySlug.entries()]
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, "en", { sensitivity: "base" })
    )
    .slice(0, limit);
}

export function generateHerbCountryStaticParams(): { lang: Locale; country: string }[] {
  const codes = getCountryCodesWithIndexedPlants();
  return locales.flatMap((lang) =>
    codes.map((iso) => ({ lang, country: countryCodeToUrlSlug(iso) }))
  );
}
