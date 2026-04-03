import { getCountryDisplayName, getCountryName } from "@/lib/countries";
import type { Locale } from "@/lib/i18n";
import type { NameEntry, Plant } from "@/lib/data";
import {
  getNamesByNormalized,
  getPlantById,
  loadNames,
  loadPlants,
  resolveCanonicalNameKey,
} from "@/lib/data";
import { getPlantCountryCodesSorted } from "@/lib/geo";

export type Ambiguity = "low" | "medium" | "high";

export type PlantNameMatch = {
  plant: Plant;
  name_entry: NameEntry;
  /** Uppercase `name_entry.country` for disambiguation UI. */
  country: string;
  relevance_score: number;
};

export type ResolvedPlantContext = {
  plant: Plant;
  /** Distinct countries (uppercase) from matching name entries for this plant. */
  countries: string[];
};

export type ResolvePlantNameResult = {
  query: string;
  normalized: string;
  matches: PlantNameMatch[];
  /** One row per distinct plant, match order, with aggregated countries. */
  plantContexts: ResolvedPlantContext[];
  ambiguity: Ambiguity;
};

function ambiguityLevelOrder(level: string): number {
  const l = level.toLowerCase();
  if (l === "low") return 0;
  if (l === "medium") return 1;
  if (l === "high") return 2;
  return 3;
}

function countryMatches(entry: NameEntry, country?: string): boolean {
  if (!country || typeof country !== "string") return false;
  const want = country.trim().toUpperCase();
  if (!want) return false;
  return entry.country.trim().toUpperCase() === want;
}

function collectMatches(nameEntries: NameEntry[]): PlantNameMatch[] {
  const raw: PlantNameMatch[] = [];
  for (const entry of nameEntries) {
    const seenIds = new Set<string>();
    for (const pid of entry.plant_ids) {
      if (!pid || seenIds.has(pid)) continue;
      seenIds.add(pid);
      const plant = getPlantById(pid);
      if (!plant) continue;
      raw.push({
        plant,
        name_entry: entry,
        country: entry.country.trim().toUpperCase(),
        relevance_score: 0,
      });
    }
  }
  return raw;
}

function dedupeMatches(matches: PlantNameMatch[]): PlantNameMatch[] {
  const seen = new Set<string>();
  const out: PlantNameMatch[] = [];
  for (const m of matches) {
    const key = `${m.name_entry.language}\0${m.name_entry.country}\0${m.name_entry.name}\0${m.plant.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

function sortMatches(
  matches: PlantNameMatch[],
  country?: string
): PlantNameMatch[] {
  const c = country?.trim();
  return [...matches].sort((a, b) => {
    if (c) {
      const aHit = countryMatches(a.name_entry, c);
      const bHit = countryMatches(b.name_entry, c);
      if (aHit !== bHit) return aHit ? -1 : 1;
    }

    const ambA = ambiguityLevelOrder(a.name_entry.ambiguity_level);
    const ambB = ambiguityLevelOrder(b.name_entry.ambiguity_level);
    if (ambA !== ambB) return ambA - ambB;

    const sci = a.plant.scientific_name.localeCompare(b.plant.scientific_name);
    if (sci !== 0) return sci;

    return a.name_entry.name.localeCompare(b.name_entry.name);
  });
}

function buildPlantContexts(
  sorted: PlantNameMatch[],
  lang: Locale = "en"
): ResolvedPlantContext[] {
  const names = loadNames();
  const order: string[] = [];
  const seen = new Set<string>();

  for (const m of sorted) {
    const id = m.plant.id;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
  }

  return order.map((id) => {
    const plant = sorted.find((x) => x.plant.id === id)!.plant;
    const countries = getPlantCountryCodesSorted(id, names, lang);
    return { plant, countries };
  });
}

function resolveAmbiguity(matches: PlantNameMatch[]): Ambiguity {
  if (matches.length === 0) return "low";

  const plantIds = new Set(matches.map((m) => m.plant.id));
  if (plantIds.size > 1) return "high";

  const countries = new Set(
    matches.map((m) => m.name_entry.country.trim().toUpperCase()).filter(Boolean)
  );
  if (plantIds.size === 1 && countries.size > 1) return "medium";

  return "low";
}

function resolvePlantNameCore(
  input: string,
  country?: string,
  lang: Locale = "en"
): ResolvePlantNameResult {
  const query = typeof input === "string" ? input : "";
  const normalized = resolveCanonicalNameKey(query);
  const nameEntries = normalized ? getNamesByNormalized(normalized) : [];

  const collected = collectMatches(nameEntries);
  const deduped = dedupeMatches(collected);
  const sorted = sortMatches(deduped, country);
  const ambiguity = resolveAmbiguity(sorted);

  const n = sorted.length;
  const matches: PlantNameMatch[] = sorted.map((m, i) => ({
    plant: m.plant,
    name_entry: m.name_entry,
    country: m.country,
    relevance_score: n > 0 ? n - i : 0,
  }));

  const plantContexts = buildPlantContexts(matches, lang);

  return {
    query,
    normalized,
    matches,
    plantContexts,
    ambiguity,
  };
}

/**
 * Resolve free-text plant name input to plant entities with deterministic ranking.
 */
export function resolvePlantName(
  input: string,
  country?: string,
  lang: Locale = "en"
): ResolvePlantNameResult {
  return resolvePlantNameCore(input, country, lang);
}

/**
 * Same as {@link resolvePlantName} but only matches name records for the given
 * ISO country (for `/name/[slug]/[country]` geo pages).
 */
export function resolvePlantNameForCountryRoute(
  slugInput: string,
  countryCode: string,
  lang: Locale = "en"
): ResolvePlantNameResult | null {
  const want = countryCode.trim().toUpperCase();
  if (!want) return null;

  const full = resolvePlantNameCore(slugInput, want, lang);
  const filtered = full.matches.filter((m) => m.country === want);
  if (filtered.length === 0) return null;

  const sorted = sortMatches(filtered, want);
  const ambiguity = resolveAmbiguity(sorted);
  const n = sorted.length;
  const matches: PlantNameMatch[] = sorted.map((m, i) => ({
    plant: m.plant,
    name_entry: m.name_entry,
    country: m.country,
    relevance_score: n > 0 ? n - i : 0,
  }));
  const plantContexts = buildPlantContexts(matches, lang);

  return {
    query: full.query,
    normalized: full.normalized,
    matches,
    plantContexts,
    ambiguity,
  };
}

export function getPlantByRouteId(routeId: string): Plant | undefined {
  return getPlantById(routeId);
}

export function getAllPlantRouteIds(): string[] {
  return loadPlants().map((p) => p.id);
}

export function resolveEntryPlants(entry: NameEntry): Plant[] {
  const out: Plant[] = [];
  const seen = new Set<string>();
  for (const id of entry.plant_ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const p = getPlantById(id);
    if (p) out.push(p);
  }
  return out;
}

export function getNameEntriesForSlug(slug: string): NameEntry[] {
  return getNamesByNormalized(resolveCanonicalNameKey(slug));
}

export type RegionalPlantRow = {
  countryCode: string;
  countryLabel: string;
  plants: Plant[];
};

/** One row per country present in matches, with distinct plants for hub “regional meaning”. */
export function buildRegionalPlantRows(matches: PlantNameMatch[]): RegionalPlantRow[] {
  const byCountry = new Map<string, Map<string, Plant>>();
  for (const m of matches) {
    const code = m.country?.trim().toUpperCase();
    if (!code) continue;
    if (!byCountry.has(code)) byCountry.set(code, new Map());
    byCountry.get(code)!.set(m.plant.id, m.plant);
  }

  return Array.from(byCountry.entries())
    .map(([countryCode, plantById]) => ({
      countryCode,
      countryLabel: getCountryName(countryCode),
      plants: Array.from(plantById.values()).sort((a, b) =>
        a.scientific_name.localeCompare(b.scientific_name)
      ),
    }))
    .sort((a, b) =>
      a.countryLabel.localeCompare(b.countryLabel, "en", { sensitivity: "base" })
    );
}

/** Sort regional rows by how often each country appears in the name hub, then by label. */
export function sortRegionalPlantRows(
  rows: RegionalPlantRow[],
  hubCountryFreq: Map<string, number>,
  lang: Locale
): RegionalPlantRow[] {
  return [...rows].sort((a, b) => {
    const fa = hubCountryFreq.get(a.countryCode) ?? 0;
    const fb = hubCountryFreq.get(b.countryCode) ?? 0;
    if (fb !== fa) return fb - fa;
    return getCountryDisplayName(a.countryCode, lang).localeCompare(
      getCountryDisplayName(b.countryCode, lang),
      lang === "es" ? "es" : "en",
      { sensitivity: "base" }
    );
  });
}
