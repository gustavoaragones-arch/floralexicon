import { getCountryDisplayName, getCountryName } from "@/lib/countries";
import type { Locale } from "@/lib/i18n";
import type { NameEntry, Plant } from "@/lib/data";
import {
  getNamesByNormalized,
  getPlantById,
  loadNames,
  loadPlants,
  nameEntryCountries,
  resolveCanonicalNameKey,
  urlSlugToCanonicalSlug,
} from "@/lib/data";
import { parseSearchQuery } from "@/lib/searchQuery";
import { toUrlSlug } from "@/lib/toUrlSlug";
import {
  getPlantCountryCodesSorted,
} from "@/lib/geo";

export type Ambiguity = "low" | "medium" | "high";

export type AuthorityLevel = "dominant" | "strong" | "weak" | "ambiguous";

/**
 * Synthetic entry when `names.json` references a `plant_id` missing from `plants.json`.
 * Use {@link isPlaceholderPlant} / `isPlaceholder` on matches instead of duck-typing.
 */
export type PlaceholderPlant = {
  id: string;
  scientific_name: null;
  isPlaceholder: true;
};

export type RegionalPlantEntry = Plant | PlaceholderPlant;

export function isPlaceholderPlant(p: RegionalPlantEntry): p is PlaceholderPlant {
  return (
    "isPlaceholder" in p &&
    p.isPlaceholder === true &&
    p.scientific_name === null
  );
}

export type PlantNameMatch = {
  /** Present when this id exists in `plants.json`; otherwise null with {@link isPlaceholder}. */
  plant: Plant | null;
  plant_id: string;
  scientific_name: string | null;
  isPlaceholder?: boolean;
  name_entry: NameEntry;
  /** Uppercase ISO country for this association (one row per country when the entry spans several). */
  country: string;
  /** @deprecated Use {@link confidence}; kept as alias for ranking (same value). */
  relevance_score: number;
  /**
   * Multi-signal confidence score (0–1):
   * 0.4*global_agreement + 0.35*regional_strength + 0.25*name_dominance
   */
  confidence: number;
  /** Distinct-country agreement: countriesForPlant / totalCountriesForName. */
  global_agreement: number;
  /** Country-aware strength for selected region, else equals global_agreement. */
  regional_strength: number;
  /** Row dominance for this label: plantOccurrences / totalOccurrences. */
  name_dominance: number;
  /** Composite authority tier from confidence signals (set after ranking). */
  authority_level?: AuthorityLevel;
  /** Exactly one ranked row (per plant dedupe: one plant) is the page primary. */
  is_primary_authority?: boolean;
  /**
   * Gap between the primary plant’s max confidence and the best competing plant’s max (0 if none).
   * Set after ranking when the page primary is chosen.
   */
  dominance_score?: number;
  /** True when {@link dominance_score} is at least 0.15 (clear separation from the runner-up). */
  is_strong_dominance?: boolean;
};

export type ResolvedPlantContext = {
  plant: Plant | null;
  plant_id: string;
  scientific_name: string | null;
  isPlaceholder?: boolean;
  /** Distinct countries (uppercase) from matching name entries for this plant. */
  countries: string[];
  /** Composite score (see {@link PlantNameMatch.confidence}). */
  confidence: number;
  global_agreement: number;
  regional_strength: number;
  name_dominance: number;
  authority_level: AuthorityLevel;
  is_primary_authority: boolean;
  dominance_score: number;
  is_strong_dominance: boolean;
};

export type ResolvePlantNameResult = {
  query: string;
  normalized: string;
  matches: PlantNameMatch[];
  /** One row per distinct plant, match order, with aggregated countries. */
  plantContexts: ResolvedPlantContext[];
  ambiguity: Ambiguity;
};

/** Free-text search routing: indexed names always use the name hub (never disambiguation search). */
export type SearchRouteResolution =
  | { type: "name"; slug: string }
  | { type: "search" };

export function resolveSearchNavigation(rawQuery: string): SearchRouteResolution {
  const displayQuery = typeof rawQuery === "string" ? rawQuery.trim() : "";
  if (!displayQuery) return { type: "search" };

  const { nameForResolve } = parseSearchQuery(displayQuery);
  const normalizedHub = resolveCanonicalNameKey(nameForResolve);
  if (!normalizedHub) return { type: "search" };

  const nameEntries = getNamesByNormalized(normalizedHub);
  if (nameEntries.length > 0) {
    const slug = urlSlugToCanonicalSlug(toUrlSlug(normalizedHub));
    return { type: "name", slug };
  }
  return { type: "search" };
}

function ambiguityLevelOrder(level: string): number {
  const l = level.toLowerCase();
  if (l === "low") return 0;
  if (l === "medium") return 1;
  if (l === "high") return 2;
  return 3;
}

function makePlaceholderPlant(pid: string): PlaceholderPlant {
  return { id: pid, scientific_name: null, isPlaceholder: true };
}

function collectMatches(nameEntries: NameEntry[]): PlantNameMatch[] {
  const raw: PlantNameMatch[] = [];
  for (const entry of nameEntries) {
    const seenIds = new Set<string>();
    for (const pid of entry.plant_ids) {
      if (!pid || seenIds.has(pid)) continue;
      seenIds.add(pid);
      const plant = getPlantById(pid);
      const resolvedPlant = plant ?? null;
      const scientific_name = plant?.scientific_name ?? null;
      const isPlaceholder = !plant;
      const codes = nameEntryCountries(entry);
      if (codes.length === 0) {
        raw.push({
          plant: resolvedPlant,
          plant_id: pid,
          scientific_name,
          isPlaceholder,
          name_entry: entry,
          country: "",
          relevance_score: 0,
          confidence: 0,
          global_agreement: 0,
          regional_strength: 0,
          name_dominance: 0,
        });
        continue;
      }
      for (const code of codes) {
        raw.push({
          plant: resolvedPlant,
          plant_id: pid,
          scientific_name,
          isPlaceholder,
          name_entry: entry,
          country: code,
          relevance_score: 0,
          confidence: 0,
          global_agreement: 0,
          regional_strength: 0,
          name_dominance: 0,
        });
      }
    }
  }
  return raw;
}

function dedupeMatches(matches: PlantNameMatch[]): PlantNameMatch[] {
  const seen = new Set<string>();
  const out: PlantNameMatch[] = [];
  for (const m of matches) {
    const key = `${m.name_entry.language}\0${m.country}\0${m.name_entry.name}\0${m.plant_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

function scientificSortKey(m: PlantNameMatch): string {
  return (m.scientific_name ?? "\uFFFF").toLowerCase();
}

function sortMatches(
  matches: PlantNameMatch[]
): PlantNameMatch[] {
  return [...matches].sort((a, b) => {
    const cb = b.confidence;
    const ca = a.confidence;
    if (cb !== ca) return cb - ca;
    // Tie-break on name_dominance before regional_strength for stable canonical ordering.
    if (b.name_dominance !== a.name_dominance) {
      return b.name_dominance - a.name_dominance;
    }
    if (b.regional_strength !== a.regional_strength) {
      return b.regional_strength - a.regional_strength;
    }

    const ambA = ambiguityLevelOrder(a.name_entry.ambiguity_level);
    const ambB = ambiguityLevelOrder(b.name_entry.ambiguity_level);
    if (ambA !== ambB) return ambA - ambB;

    const sci = scientificSortKey(a).localeCompare(scientificSortKey(b));
    if (sci !== 0) return sci;

    return a.name_entry.name.localeCompare(b.name_entry.name);
  });
}

export function classifyAuthority(match: PlantNameMatch): {
  authority_level: AuthorityLevel;
} {
  const { confidence, global_agreement, name_dominance } = match;
  if (confidence >= 0.85 && global_agreement >= 0.7 && name_dominance >= 0.6) {
    return { authority_level: "dominant" };
  }
  if (confidence >= 0.7 && name_dominance >= 0.5) {
    return { authority_level: "strong" };
  }
  if (confidence >= 0.5) {
    return { authority_level: "weak" };
  }
  return { authority_level: "ambiguous" };
}

function maxConfidenceByPlant(sorted: PlantNameMatch[]): Map<string, number> {
  const maxByPlant = new Map<string, number>();
  for (const m of sorted) {
    const prev = maxByPlant.get(m.plant_id) ?? 0;
    if (m.confidence > prev) maxByPlant.set(m.plant_id, m.confidence);
  }
  return maxByPlant;
}

/**
 * Primary plant’s best confidence minus the strongest other plant’s best confidence
 * (equivalent to `m.confidence - nextBest` when the list is one row per plant sorted by confidence).
 */
function dominanceVersusBestOther(
  sorted: PlantNameMatch[],
  primaryPlantId: string
): { dominance_score: number; is_strong_dominance: boolean } {
  const maxByPlant = maxConfidenceByPlant(sorted);
  const primaryMax = maxByPlant.get(primaryPlantId) ?? 0;
  let bestOther = 0;
  for (const [pid, c] of maxByPlant) {
    if (pid === primaryPlantId) continue;
    if (c > bestOther) bestOther = c;
  }
  const dominance_score = primaryMax - bestOther;
  return {
    dominance_score,
    is_strong_dominance: dominance_score >= 0.15,
  };
}

/** After ranking: attach authority tiers and mark exactly one primary row (per ranked list). */
function enrichMatchesWithAuthority(sorted: PlantNameMatch[]): PlantNameMatch[] {
  const enriched = sorted.map((m) => {
    const { authority_level } = classifyAuthority(m);
    return { ...m, authority_level, is_primary_authority: false };
  });
  const primaryIdx = enriched.findIndex((m) => m.authority_level === "dominant");
  const idx = primaryIdx >= 0 ? primaryIdx : 0;
  const primaryPlantId = enriched[idx]!.plant_id;
  const { dominance_score, is_strong_dominance } = dominanceVersusBestOther(
    sorted,
    primaryPlantId
  );
  return enriched.map((m, i) => ({
    ...m,
    dominance_score,
    is_strong_dominance,
    is_primary_authority: i === idx,
  }));
}

function buildPlantContexts(
  sorted: PlantNameMatch[],
  lang: Locale = "en"
): ResolvedPlantContext[] {
  const names = loadNames();
  const order: string[] = [];
  const seen = new Set<string>();

  for (const m of sorted) {
    const id = m.plant_id;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
  }

  return order.map((id) => {
    const m =
      sorted.find(
        (x) => x.plant_id === id && x.is_primary_authority === true
      ) ?? sorted.find((x) => x.plant_id === id)!;
    const countries = getPlantCountryCodesSorted(id, names, lang);
    const confidence = m.confidence;
    const authority_level = m.authority_level ?? "ambiguous";
    const is_primary_authority = m.is_primary_authority === true;
    const dominance_score = m.dominance_score ?? 0;
    const is_strong_dominance = m.is_strong_dominance ?? false;
    return {
      plant: m.plant,
      plant_id: id,
      scientific_name: m.scientific_name,
      isPlaceholder: m.isPlaceholder,
      countries,
      confidence,
      global_agreement: m.global_agreement,
      regional_strength: m.regional_strength,
      name_dominance: m.name_dominance,
      authority_level,
      is_primary_authority,
      dominance_score,
      is_strong_dominance,
    };
  });
}

type ConfidenceParts = {
  confidence: number;
  global_agreement: number;
  regional_strength: number;
  name_dominance: number;
};

function buildConfidenceByPlant(
  nameEntries: NameEntry[],
  selectedCountry?: string
): Map<string, ConfidenceParts> {
  const byPlant = new Map<string, ConfidenceParts>();
  const totalOccurrences = nameEntries.length;
  const allCountries = new Set<string>();
  for (const entry of nameEntries) {
    for (const c of nameEntryCountries(entry)) {
      if (c) allCountries.add(c);
    }
  }
  const totalCountriesForName = allCountries.size;
  const selected = selectedCountry?.trim().toUpperCase();
  const totalCountryOccurrences = selected
    ? nameEntries.filter((e) => nameEntryCountries(e).includes(selected)).length
    : 0;

  const allPlantIds = new Set<string>();
  for (const entry of nameEntries) {
    for (const pid of entry.plant_ids) {
      if (pid) allPlantIds.add(pid);
    }
  }

  for (const pid of allPlantIds) {
    const countriesForPlant = new Set<string>();
    let plantOccurrences = 0;
    let plantCountryOccurrences = 0;
    for (const entry of nameEntries) {
      const hasPlant = entry.plant_ids.includes(pid);
      if (!hasPlant) continue;
      plantOccurrences++;
      const codes = nameEntryCountries(entry);
      for (const c of codes) {
        if (c) countriesForPlant.add(c);
      }
      if (selected && codes.includes(selected)) {
        plantCountryOccurrences++;
      }
    }

    const global_agreement =
      totalCountriesForName > 0 ? countriesForPlant.size / totalCountriesForName : 0;
    const name_dominance =
      totalOccurrences > 0 ? plantOccurrences / totalOccurrences : 0;
    const regional_strength = selected
      ? totalCountryOccurrences > 0
        ? plantCountryOccurrences / totalCountryOccurrences
        : 0
      : global_agreement;
    const confidence =
      0.4 * global_agreement +
      0.35 * regional_strength +
      0.25 * name_dominance;

    byPlant.set(pid, {
      confidence,
      global_agreement,
      regional_strength,
      name_dominance,
    });
  }

  return byPlant;
}

function resolveAmbiguity(matches: PlantNameMatch[]): Ambiguity {
  if (matches.length === 0) return "low";

  const plantIds = new Set(matches.map((m) => m.plant_id));
  if (plantIds.size > 1) return "high";

  const countries = new Set(
    matches.map((m) => m.country.trim().toUpperCase()).filter(Boolean)
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
  const confidenceByPlant = buildConfidenceByPlant(nameEntries, country);

  const collected = collectMatches(nameEntries);
  const deduped = dedupeMatches(collected);
  const withConfidence: PlantNameMatch[] = deduped.map((m) => {
    const c = confidenceByPlant.get(m.plant_id);
    return {
      ...m,
      relevance_score: c?.confidence ?? 0,
      confidence: c?.confidence ?? 0,
      global_agreement: c?.global_agreement ?? 0,
      regional_strength: c?.regional_strength ?? 0,
      name_dominance: c?.name_dominance ?? 0,
    };
  });
  const sorted = sortMatches(withConfidence);
  const matches = enrichMatchesWithAuthority(sorted);
  const ambiguity = resolveAmbiguity(matches);

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
 * Same ranking as {@link resolvePlantName} → `plantContexts`: highest confidence first.
 */
export function getRankedPlantIdsWithConfidence(
  input: string,
  country?: string,
  lang: Locale = "en"
): { plant_id: string; confidence: number }[] {
  return resolvePlantName(input, country, lang).plantContexts.map((c) => ({
    plant_id: c.plant_id,
    confidence: c.confidence,
  }));
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

  const sorted = sortMatches(filtered);
  const matches = enrichMatchesWithAuthority(sorted);
  const ambiguity = resolveAmbiguity(matches);
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

/** Every plant id on the entry, using a placeholder when missing from `plants.json`. */
export function resolveEntryPlants(entry: NameEntry): RegionalPlantEntry[] {
  const out: RegionalPlantEntry[] = [];
  const seen = new Set<string>();
  for (const id of entry.plant_ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const p = getPlantById(id);
    if (p) out.push(p);
    else out.push(makePlaceholderPlant(id));
  }
  return out;
}

export function getNameEntriesForSlug(slug: string): NameEntry[] {
  return getNamesByNormalized(resolveCanonicalNameKey(slug));
}

export type RegionalPlantRow = {
  countryCode: string;
  countryLabel: string;
  plants: RegionalPlantEntry[];
};

/** One row per country present in matches, with distinct plants for hub “regional meaning”. */
export function buildRegionalPlantRows(matches: PlantNameMatch[]): RegionalPlantRow[] {
  const byCountry = new Map<string, Map<string, RegionalPlantEntry>>();
  for (const m of matches) {
    const code = m.country?.trim().toUpperCase();
    if (!code) continue;
    if (!byCountry.has(code)) byCountry.set(code, new Map());
    const entry: RegionalPlantEntry =
      m.plant ??
      makePlaceholderPlant(m.plant_id);
    byCountry.get(code)!.set(m.plant_id, entry);
  }

  return Array.from(byCountry.entries())
    .map(([countryCode, plantById]) => ({
      countryCode,
      countryLabel: getCountryName(countryCode),
      plants: Array.from(plantById.values()).sort((a, b) => {
        const sa = isPlaceholderPlant(a) ? "\uFFFF" : a.scientific_name;
        const sb = isPlaceholderPlant(b) ? "\uFFFF" : b.scientific_name;
        return sa.localeCompare(sb);
      }),
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
