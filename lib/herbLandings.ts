import { countryCodeToUrlSlug, countryMap } from "@/lib/countries";
import {
  getNameEntryUrlSlug,
  resolveCanonicalNameKey,
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

/** Distinct use labels for a country, ranked by number of plants. */
export function getUseCountsForCountry(iso: string): { use: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const plant of getPlantsForCountry(iso)) {
    for (const raw of plant.primary_uses) {
      const use = raw.trim().toLowerCase();
      if (!use) continue;
      counts.set(use, (counts.get(use) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([use, count]) => ({ use, count }))
    .sort((a, b) => b.count - a.count || a.use.localeCompare(b.use, "en"));
}

export type QueryStaticParam = {
  query: string;
  nameSlug: string;
  countryIso: string;
};

/**
 * Top long-tail query combinations in the form "{name}-in-{country}".
 * Picks top names per country by record frequency in `names.json`.
 */
export function getTopNameCountryQueryParams(limitPerCountry = 24): QueryStaticParam[] {
  const byCountryThenName = new Map<string, Map<string, number>>();
  for (const row of loadNames()) {
    const country = row.country.trim().toUpperCase();
    if (!country) continue;
    const canonical = resolveCanonicalNameKey(row.normalized);
    if (!canonical) continue;
    const nameSlug = canonical.replace(/\s+/g, "-");
    let perName = byCountryThenName.get(country);
    if (!perName) {
      perName = new Map<string, number>();
      byCountryThenName.set(country, perName);
    }
    perName.set(nameSlug, (perName.get(nameSlug) ?? 0) + 1);
  }

  const out: QueryStaticParam[] = [];
  for (const [countryIso, perName] of byCountryThenName) {
    const topNames = [...perName.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"))
      .slice(0, limitPerCountry)
      .map(([nameSlug]) => nameSlug);
    const countrySlug = countryCodeToUrlSlug(countryIso);
    for (const nameSlug of topNames) {
      out.push({
        query: `${nameSlug}-in-${countrySlug}`,
        nameSlug,
        countryIso,
      });
    }
  }
  return out.sort((a, b) => a.query.localeCompare(b.query, "en"));
}
