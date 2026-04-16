import { countryCodeToUrlSlug } from "@/lib/countries";
import { toUrlSlug } from "@/lib/toUrlSlug";
import nameVariantsJson from "@/data/nameVariants.json";
import plantsJson from "@/data/plants.json";
import namesJson from "@/data/names.json";

export type Plant = {
  id: string;
  scientific_name: string;
  family: string;
  genus: string;
  rank: string;
  origin_regions: string[];
  plant_type: string;
  primary_uses: string[];
  /**
   * Synthetic plant built from `names.json` when this `id` is referenced but missing from `plants.json`.
   * Prefer {@link getPlantById} which returns ghosts automatically when name rows exist.
   */
  isGhost?: boolean;
};

export type NameEntry = {
  name: string;
  normalized: string;
  language: string;
  /**
   * Legacy single-country field; kept populated (first sorted ISO code) for older call sites.
   * Prefer {@link nameEntryCountries}.
   */
  country: string;
  /** Distinct ISO codes where this name–plant row appears across merged sources (uppercase, sorted). */
  countries: string[];
  plant_ids: string[];
  ambiguity_level: string;
};

/** O(1) lookup by plant `id`. */
export const plantMap = new Map<string, Plant>();
/** Normalized name key → name entries (same key as `normalizeString`). */
export const nameMap = new Map<string, NameEntry[]>();

let plantsList: Plant[] = [];
let namesList: NameEntry[] = [];
let indexesBuilt = false;

/** Memoized synthetic plants for orphan `plant_id`s (see {@link buildGhostPlant}). */
const ghostPlantCache = new Map<string, Plant>();

function clearGhostPlantCache(): void {
  ghostPlantCache.clear();
}

function isPlantRecord(x: unknown): x is Plant {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.scientific_name === "string" &&
    typeof o.family === "string" &&
    typeof o.genus === "string" &&
    typeof o.rank === "string" &&
    Array.isArray(o.origin_regions) &&
    typeof o.plant_type === "string" &&
    Array.isArray(o.primary_uses)
  );
}

/** ISO country codes attached to a name row (multi-country aware). */
export function nameEntryCountries(entry: NameEntry): string[] {
  if (Array.isArray(entry.countries) && entry.countries.length > 0) {
    return [...entry.countries];
  }
  const c = entry.country?.trim().toUpperCase();
  return c ? [c] : [];
}

function coalesceNameRecord(raw: Record<string, unknown>): NameEntry | null {
  if (typeof raw.name !== "string" || typeof raw.normalized !== "string") {
    return null;
  }

  const plantIds = new Set<string>();
  if (typeof raw.plant_id === "string" && raw.plant_id.trim()) {
    plantIds.add(raw.plant_id.trim());
  }
  if (Array.isArray(raw.plant_ids)) {
    for (const id of raw.plant_ids) {
      if (typeof id === "string" && id.trim()) plantIds.add(id.trim());
    }
  }
  const plant_ids = [...plantIds];
  if (plant_ids.length === 0) return null;

  const cset = new Set<string>();
  if (Array.isArray(raw.countries)) {
    for (const c of raw.countries) {
      if (typeof c === "string" && c.trim()) cset.add(c.trim().toUpperCase());
    }
  }
  if (typeof raw.country === "string" && raw.country.trim()) {
    cset.add(raw.country.trim().toUpperCase());
  }
  const countries = [...cset].sort((a, b) => a.localeCompare(b));
  if (countries.length === 0) return null;

  const language =
    typeof raw.language === "string" && raw.language.trim()
      ? raw.language
      : "es";
  const ambiguity_level =
    typeof raw.ambiguity_level === "string" && raw.ambiguity_level.trim()
      ? raw.ambiguity_level
      : "low";

  return {
    name: raw.name,
    normalized: raw.normalized,
    language,
    country: countries[0] ?? "",
    countries,
    plant_ids,
    ambiguity_level,
  };
}

/**
 * Lowercase, trim, strip accents, collapse whitespace.
 * Hyphens become spaces so URL slugs like "dog-rose" match normalized "dog rose".
 */
export function normalizeString(input: string): string {
  if (input == null || typeof input !== "string") return "";
  const folded = input
    .trim()
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!folded) return "";
  return folded
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type NameVariantsFile = { aliases?: Record<string, string> };

/** Maps variant normalized keys → canonical nameMap key (also normalized). */
function buildNameAliasToCanonical(): Map<string, string> {
  const raw = nameVariantsJson as NameVariantsFile;
  const map = new Map<string, string>();
  for (const [variant, canonical] of Object.entries(raw.aliases ?? {})) {
    const vk = normalizeString(variant);
    const ck = normalizeString(canonical);
    if (vk && ck) map.set(vk, ck);
  }
  return map;
}

const nameAliasToCanonical = buildNameAliasToCanonical();

/**
 * Resolve free text or URL slug segment to the canonical nameMap key
 * (normalized, space-separated). Applies accent folding + variant aliases.
 */
export function resolveCanonicalNameKey(input: string): string {
  const base = normalizeString(input);
  if (!base) return "";
  return nameAliasToCanonical.get(base) ?? base;
}

/** Canonical hyphenated URL slug for a name topic (for links & metadata). */
export function urlSlugToCanonicalSlug(urlSlug: string): string {
  const key = resolveCanonicalNameKey(urlSlug);
  if (!key) return urlSlug.trim().toLowerCase();
  return toUrlSlug(key);
}

function validateDataset(plants: Plant[], names: NameEntry[]): void {
  for (const p of plants) {
    if (plantMap.has(p.id)) {
      console.warn(
        `[FloraLexicon] Duplicate plant id "${p.id}" — later row overwrites earlier in the map.`
      );
    }
    plantMap.set(p.id, p);
  }

  for (const entry of names) {
    if (!entry.normalized?.trim()) {
      console.warn(
        `[FloraLexicon] Missing or empty normalized field for name entry "${entry.name}"`
      );
    } else {
      const canon = normalizeString(entry.normalized);
      if (canon && entry.normalized !== canon) {
        console.warn(
          `[FloraLexicon] normalized not canonical for "${entry.name}": stored "${entry.normalized}", expected "${canon}" (per normalizeString)`
        );
      }
    }

    for (const pid of entry.plant_ids) {
      if (!plantMap.has(pid)) {
        console.warn(
          `[FloraLexicon] Missing plant_id "${pid}" referenced by "${entry.name}" (${nameEntryCountries(entry).join(", ")})`
        );
      }
    }
  }
}

function buildNameMap(names: NameEntry[]): void {
  nameMap.clear();
  for (const n of names) {
    const key = normalizeString(n.normalized);
    if (!key) continue;
    const bucket = nameMap.get(key);
    if (bucket) bucket.push(n);
    else nameMap.set(key, [n]);
  }
}

function buildIndexes(plants: Plant[], names: NameEntry[]): void {
  plantMap.clear();
  nameMap.clear();
  clearGhostPlantCache();

  validateDataset(plants, names);
  buildNameMap(names);
}

function ensureIndexes(): void {
  if (indexesBuilt) return;

  const rawPlants = Array.isArray(plantsJson) ? plantsJson : [];
  const rawNames = Array.isArray(namesJson) ? namesJson : [];

  plantsList = rawPlants.filter(isPlantRecord);
  namesList = rawNames
    .map((x) =>
      x && typeof x === "object"
        ? coalesceNameRecord(x as Record<string, unknown>)
        : null
    )
    .filter((e): e is NameEntry => e != null);

  buildIndexes(plantsList, namesList);
  indexesBuilt = true;
}

export function loadPlants(): readonly Plant[] {
  ensureIndexes();
  return plantsList;
}

export function loadNames(): readonly NameEntry[] {
  ensureIndexes();
  return namesList;
}

/**
 * All name index rows that reference `plantId` (for ghost / audit tooling).
 */
export function findNameRowsByPlantId(plantId: string): NameEntry[] {
  const want = plantId.trim();
  if (!want) return [];
  ensureIndexes();
  return namesList.filter((e) => e.plant_ids.includes(want));
}

function extractNamesFromRows(rows: NameEntry[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const n = r.name?.trim();
    if (n) set.add(n);
  }
  return [...set].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );
}

function extractCountriesFromRows(rows: NameEntry[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    for (const c of nameEntryCountries(r)) {
      if (c) set.add(c);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Synthetic `Plant` for ids present in `names.json` but not yet in `plants.json`.
 * Uses regional name rows only — no manual curation required.
 */
export function buildGhostPlant(plant_id: string, nameRows: NameEntry[]): Plant {
  const id = plant_id.trim();
  const working = id.replace(/_/g, " ").trim() || id;
  const parts = working.split(/\s+/).filter(Boolean);
  const genus = parts[0] ? parts[0]!.charAt(0).toUpperCase() + parts[0]!.slice(1) : "";
  const scientific_name =
    parts.length >= 2
      ? `${parts[0]!.charAt(0).toUpperCase() + parts[0]!.slice(1)} ${parts[1]!.toLowerCase()}`
      : working.charAt(0).toUpperCase() + working.slice(1);

  return {
    id,
    scientific_name,
    family: "",
    genus: genus || "—",
    rank: "species",
    origin_regions: [],
    plant_type: "species",
    primary_uses: [],
    isGhost: true,
  };
}

/**
 * O(1) by plant id for curated `plants.json` rows; otherwise a memoized {@link buildGhostPlant}
 * when `names.json` still references the id, or `undefined` if nothing is known.
 */
export function getPlantById(id: string): Plant | undefined {
  if (!id || typeof id !== "string") return undefined;
  ensureIndexes();
  const hit = plantMap.get(id);
  if (hit) return hit;
  const cached = ghostPlantCache.get(id);
  if (cached) return cached;
  const relatedRows = findNameRowsByPlantId(id);
  if (relatedRows.length === 0) return undefined;
  const ghost = buildGhostPlant(id, relatedRows);
  ghostPlantCache.set(id, ghost);
  return ghost;
}

/**
 * O(1) map lookup by normalized name key (input is normalized via normalizeString).
 * Returns a new array (may be empty). Never null.
 */
export function getNamesByNormalized(normalized: string): NameEntry[] {
  ensureIndexes();
  const key = normalizeString(normalized);
  if (!key) return [];
  const found = nameMap.get(key);
  return found ? [...found] : [];
}

/** URL segments for static /name/[slug] generation (hyphens; lookup via normalizeString). */
export function getAllNameUrlSlugs(): string[] {
  ensureIndexes();
  return Array.from(nameMap.keys(), (k) => toUrlSlug(k));
}

/** Canonical name slugs plus variant spellings/plurals for static generation. */
export function getAllNameUrlSlugsIncludingVariants(): string[] {
  ensureIndexes();
  const set = new Set(getAllNameUrlSlugs());
  Array.from(nameAliasToCanonical.keys()).forEach((variantKey) => {
    set.add(toUrlSlug(variantKey));
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "en"));
}

/** Canonical `nameMap` key → path segment for `/name/[slug]`. */
export function normalizedKeyToUrlSlug(normalizedKey: string): string {
  return toUrlSlug(normalizedKey);
}

/** URL slug for a name entry (matches static routes + resolver). */
export function getNameEntryUrlSlug(entry: NameEntry): string {
  const key = normalizeString(entry.normalized);
  if (!key) return "";
  return normalizedKeyToUrlSlug(key);
}

export type NameIndexLink = { slug: string; label: string };

/**
 * Other indexed names that reference this plant (excludes the current `/name/[slug]` page).
 */
export function getOtherNamesForSamePlant(
  plantId: string,
  excludeNameSlug: string
): NameIndexLink[] {
  if (!plantId) return [];
  ensureIndexes();

  const excludeCanonical = urlSlugToCanonicalSlug(excludeNameSlug);

  const bySlug = new Map<string, string>();
  for (const entry of namesList) {
    if (!entry.plant_ids.includes(plantId)) continue;
    const slug = getNameEntryUrlSlug(entry);
    if (!slug) continue;
    if (urlSlugToCanonicalSlug(slug) === excludeCanonical) continue;
    const label = entry.name.trim() || slug;
    if (!bySlug.has(slug)) bySlug.set(slug, label);
  }

  return Array.from(bySlug.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, "en", { sensitivity: "base" })
    );
}

/** All indexed names that reference this plant (deduped by name slug). */
export function getAlsoKnownAsLinks(plantId: string): NameIndexLink[] {
  if (!plantId) return [];
  ensureIndexes();

  const bySlug = new Map<string, string>();
  for (const entry of namesList) {
    if (!entry.plant_ids.includes(plantId)) continue;
    const slug = getNameEntryUrlSlug(entry);
    if (!slug) continue;
    const label = entry.name.trim() || slug;
    if (!bySlug.has(slug)) bySlug.set(slug, label);
  }

  return Array.from(bySlug.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, "en", { sensitivity: "base" })
    );
}

/** Count `names.json` rows (country rows) per canonical name URL slug for this plant. */
function nameSlugFrequencyForPlant(plantId: string): Map<string, number> {
  const freq = new Map<string, number>();
  const id = plantId.trim();
  if (!id) return freq;
  ensureIndexes();
  for (const entry of namesList) {
    if (!entry.plant_ids.includes(id)) continue;
    const slug = getNameEntryUrlSlug(entry);
    if (!slug) continue;
    const key = urlSlugToCanonicalSlug(slug);
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  return freq;
}

/**
 * Collapse labels that fold to the same string (accents/spacing) while keeping
 * a single display label (prefer higher row frequency, then longer label).
 */
function dedupeNameIndexLinksByNormalizedLabel(
  links: NameIndexLink[],
  freq: Map<string, number>
): NameIndexLink[] {
  const byNorm = new Map<string, NameIndexLink>();
  for (const link of links) {
    const nk = normalizeString(link.label);
    if (!nk) continue;
    const prev = byNorm.get(nk);
    if (!prev) {
      byNorm.set(nk, link);
      continue;
    }
    const fNew = freq.get(urlSlugToCanonicalSlug(link.slug)) ?? 0;
    const fOld = freq.get(urlSlugToCanonicalSlug(prev.slug)) ?? 0;
    const pick =
      fNew !== fOld
        ? fNew > fOld
          ? link
          : prev
        : link.label.length !== prev.label.length
          ? link.label.length > prev.label.length
            ? link
            : prev
          : link.label.localeCompare(prev.label, "en", { sensitivity: "base" }) < 0
            ? link
            : prev;
    byNorm.set(nk, pick);
  }
  return [...byNorm.values()];
}

function sortNameIndexLinksForPlantPage(
  links: NameIndexLink[],
  plantId: string,
  options?: { pageNameSlug?: string; queryDisplay?: string }
): NameIndexLink[] {
  const freq = nameSlugFrequencyForPlant(plantId);
  const pageCanon =
    options?.pageNameSlug && options.pageNameSlug.trim()
      ? urlSlugToCanonicalSlug(options.pageNameSlug)
      : "";
  const queryNorm = options?.queryDisplay
    ? normalizeString(options.queryDisplay.trim())
    : "";

  const rawQueryDisplay = options?.queryDisplay?.trim() ?? "";
  const querySlugCanon = rawQueryDisplay
    ? urlSlugToCanonicalSlug(rawQueryDisplay)
    : "";

  const rank = (link: NameIndexLink) => {
    const labelNorm = normalizeString(link.label);
    const slugCanon = urlSlugToCanonicalSlug(link.slug);
    const hitQueryLabel = queryNorm && labelNorm === queryNorm ? 4 : 0;
    const hitQuerySlug =
      querySlugCanon && slugCanon === querySlugCanon ? 4 : 0;
    const hitQuery = Math.max(hitQueryLabel, hitQuerySlug);
    const hitPage = pageCanon && slugCanon === pageCanon ? 2 : 0;
    const f = freq.get(slugCanon) ?? 0;
    return { hitQuery, hitPage, f, label: link.label, slug: link.slug };
  };

  return [...links].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (rb.hitQuery !== ra.hitQuery) return rb.hitQuery - ra.hitQuery;
    if (rb.hitPage !== ra.hitPage) return rb.hitPage - ra.hitPage;
    if (rb.f !== ra.f) return rb.f - ra.f;
    const lab = ra.label.localeCompare(rb.label, "en", { sensitivity: "base" });
    if (lab !== 0) return lab;
    return ra.slug.localeCompare(rb.slug, "en", { sensitivity: "base" });
  });
}

/** Global coverage for a species from every `names.json` row that references the plant. */
export type PlantGlobalData = {
  /** Distinct ISO country codes (sorted A–Z for stable output). */
  countries: string[];
  /** All unique indexed common-name hubs for this plant (deduped by URL slug). */
  names: NameIndexLink[];
};

export type PlantGlobalDataOptions = {
  /** Canonical `/name/[slug]` segment for the active page (hyphenated). */
  pageNameSlug?: string;
  /** User-visible query / title spelling for “exact label” ordering. */
  queryDisplay?: string;
};

/**
 * Aggregate countries and common-name links for a plant across the full name index
 * (not limited to the current name hub row).
 */
export function getPlantGlobalData(
  plantId: string,
  options?: PlantGlobalDataOptions
): PlantGlobalData {
  const id = plantId.trim();
  if (!id) return { countries: [], names: [] };
  ensureIndexes();

  const countries = new Set<string>();
  for (const entry of namesList) {
    if (!entry.plant_ids.includes(id)) continue;
    for (const code of nameEntryCountries(entry)) {
      if (code) countries.add(code);
    }
  }

  const freq = nameSlugFrequencyForPlant(id);
  let names = getAlsoKnownAsLinks(id);
  names = dedupeNameIndexLinksByNormalizedLabel(names, freq);
  names = sortNameIndexLinksForPlantPage(names, id, options);

  return {
    countries: [...countries].sort((a, b) => a.localeCompare(b)),
    names,
  };
}

/**
 * Canonical `/name/[slug]` segment for a species (internal navigation only).
 * Uses the first indexed common-name slug when present, otherwise the scientific name.
 */
export function plantNameHubSlug(
  plantId: string,
  scientificName: string
): string {
  const id = plantId.trim();
  if (!id) {
    return urlSlugToCanonicalSlug(
      scientificName.replace(/\s+/g, "-").toLowerCase()
    );
  }
  const { names } = getPlantGlobalData(id);
  const first = names[0]?.slug;
  if (first) return urlSlugToCanonicalSlug(first);
  return urlSlugToCanonicalSlug(
    scientificName.replace(/\s+/g, "-").toLowerCase()
  );
}

/**
 * Indexed names that share any plant id with this hub’s species, excluding the
 * current name hub (by canonical slug). Data-driven internal linking.
 */
export function getRelatedHerbNameLinksForHub(
  plantIds: string[],
  excludeCanonicalSlug: string
): NameIndexLink[] {
  if (!plantIds.length) return [];
  ensureIndexes();
  const want = new Set(plantIds.map((id) => id.trim()).filter(Boolean));
  if (want.size === 0) return [];

  const excludeCanonical = urlSlugToCanonicalSlug(excludeCanonicalSlug);
  const bySlug = new Map<string, string>();

  for (const entry of namesList) {
    if (!entry.plant_ids.some((id) => want.has(id))) continue;
    const slug = getNameEntryUrlSlug(entry);
    if (!slug) continue;
    if (urlSlugToCanonicalSlug(slug) === excludeCanonical) continue;
    const label = entry.name.trim() || slug;
    if (!bySlug.has(slug)) bySlug.set(slug, label);
  }

  return Array.from(bySlug.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, "en", { sensitivity: "base" })
    );
}

/** Alternate indexed labels for the same plants as this hub, with countries (for SEO lists). */
export type AlternateNameCountryRow = {
  slug: string;
  label: string;
  countryCodes: string[];
};

export function getAlternateHerbNamesWithCountriesForHub(
  plantIds: string[],
  excludeCanonicalSlug: string,
  maxRows = 120
): AlternateNameCountryRow[] {
  if (!plantIds.length) return [];
  ensureIndexes();
  const want = new Set(plantIds.map((id) => id.trim()).filter(Boolean));
  if (want.size === 0) return [];

  const excludeCanonical = urlSlugToCanonicalSlug(excludeCanonicalSlug);
  const bySlug = new Map<string, { label: string; countries: Set<string> }>();

  for (const entry of namesList) {
    if (!entry.plant_ids.some((id) => want.has(id))) continue;
    const slug = getNameEntryUrlSlug(entry);
    if (!slug) continue;
    if (urlSlugToCanonicalSlug(slug) === excludeCanonical) continue;
    const codes = nameEntryCountries(entry);
    if (codes.length === 0) continue;
    const label = entry.name.trim() || slug;
    let row = bySlug.get(slug);
    if (!row) {
      row = { label, countries: new Set() };
      bySlug.set(slug, row);
    } else if (label.length > row.label.length) {
      row.label = label;
    }
    for (const code of codes) row.countries.add(code);
  }

  return Array.from(bySlug.entries())
    .map(([slug, { label, countries }]) => ({
      slug,
      label,
      countryCodes: [...countries].sort((a, b) => a.localeCompare(b)),
    }))
    .sort(
      (a, b) =>
        b.countryCodes.length - a.countryCodes.length ||
        a.label.localeCompare(b.label, "en", { sensitivity: "base" })
    )
    .slice(0, maxRows);
}

export type CountryNameGroup = {
  countryCode: string;
  entries: NameIndexLink[];
};

/**
 * For a plant id: every indexed (country, common-name) pair from `names.json`,
 * grouped by country for “what is it called here?” views.
 */
export function getNamesGroupedByCountryForPlant(
  plantId: string
): CountryNameGroup[] {
  if (!plantId) return [];
  ensureIndexes();
  const byCountry = new Map<string, Map<string, string>>();

  for (const entry of namesList) {
    if (!entry.plant_ids.includes(plantId)) continue;
    const slug = getNameEntryUrlSlug(entry);
    if (!slug) continue;
    const label = entry.name.trim() || slug;
    for (const code of nameEntryCountries(entry)) {
      if (!code) continue;
      let slugMap = byCountry.get(code);
      if (!slugMap) {
        slugMap = new Map();
        byCountry.set(code, slugMap);
      }
      if (!slugMap.has(slug)) slugMap.set(slug, label);
    }
  }

  return Array.from(byCountry.entries())
    .map(([countryCode, slugMap]) => ({
      countryCode,
      entries: Array.from(slugMap.entries())
        .map(([slug, label]) => ({ slug, label }))
        .sort((a, b) =>
          a.label.localeCompare(b.label, "en", { sensitivity: "base" })
        ),
    }))
    .sort((a, b) => a.countryCode.localeCompare(b.countryCode));
}

/** Country path segments (`/name/[slug]/[country]`) that exist for this canonical hub. */
export function getCountryUrlSlugsForNameHub(nameCanonicalSlug: string): Set<string> {
  const canon = urlSlugToCanonicalSlug(nameCanonicalSlug);
  const out = new Set<string>();
  for (const row of getNameCountryStaticParams()) {
    if (urlSlugToCanonicalSlug(row.slug) !== canon) continue;
    out.add(row.country);
  }
  return out;
}

/**
 * Other plants in the slim index that share at least one `primary_uses` slug with `plant`.
 */
export function getPlantsSharingPrimaryUses(plant: Plant, limit = 14): Plant[] {
  ensureIndexes();
  const uses = new Set(
    plant.primary_uses.map((u) => u.trim().toLowerCase()).filter(Boolean)
  );
  if (uses.size === 0) return [];

  const scored: { plant: Plant; n: number }[] = [];
  for (const p of plantsList) {
    if (p.id === plant.id) continue;
    const n = p.primary_uses.filter((u) =>
      uses.has(u.trim().toLowerCase())
    ).length;
    if (n === 0) continue;
    scored.push({ plant: p, n });
  }

  scored.sort(
    (a, b) =>
      b.n - a.n ||
      a.plant.scientific_name.localeCompare(b.plant.scientific_name, "en")
  );
  return scored.slice(0, limit).map((x) => x.plant);
}

/** ISO-style codes for region filter; merged with any countries present in names data. */
const DEFAULT_REGION_CODES = [
  "AR",
  "BO",
  "CL",
  "CO",
  "ES",
  "GB",
  "MX",
  "PE",
  "US",
  "UY",
] as const;

export function getCountryOptions(): string[] {
  ensureIndexes();
  const set = new Set<string>([...DEFAULT_REGION_CODES]);
  for (const n of namesList) {
    for (const c of nameEntryCountries(n)) {
      if (c) set.add(c);
    }
  }
  return Array.from(set).sort();
}

/** Static routes for `/name/[slug]/[country]` (canonical name slug + geo segment). */
export function getNameCountryStaticParams(): { slug: string; country: string }[] {
  ensureIndexes();
  const seen = new Set<string>();
  const out: { slug: string; country: string }[] = [];
  for (const entry of namesList) {
    const slug = getNameEntryUrlSlug(entry);
    if (!slug) continue;
    for (const code of nameEntryCountries(entry)) {
      if (!code) continue;
      const countrySeg = countryCodeToUrlSlug(code);
      const key = `${slug}::${countrySeg}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ slug, country: countrySeg });
    }
  }
  return out.sort(
    (a, b) => a.slug.localeCompare(b.slug) || a.country.localeCompare(b.country)
  );
}
