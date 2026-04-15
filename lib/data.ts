import { countryCodeToUrlSlug } from "@/lib/countries";
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
};

export type NameEntry = {
  name: string;
  normalized: string;
  language: string;
  country: string;
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

function isNameRecord(x: unknown): x is NameEntry {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    typeof o.normalized === "string" &&
    typeof o.language === "string" &&
    typeof o.country === "string" &&
    Array.isArray(o.plant_ids) &&
    o.plant_ids.every((id) => typeof id === "string") &&
    typeof o.ambiguity_level === "string"
  );
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
  return key.replace(/\s+/g, "-");
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
          `[FloraLexicon] Missing plant_id "${pid}" referenced by "${entry.name}" (${entry.country})`
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

  validateDataset(plants, names);
  buildNameMap(names);
}

function ensureIndexes(): void {
  if (indexesBuilt) return;

  const rawPlants = Array.isArray(plantsJson) ? plantsJson : [];
  const rawNames = Array.isArray(namesJson) ? namesJson : [];

  plantsList = rawPlants.filter(isPlantRecord);
  namesList = rawNames.filter(isNameRecord);

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

/** O(1) by plant id. Returns undefined if missing or unknown id. */
export function getPlantById(id: string): Plant | undefined {
  if (!id || typeof id !== "string") return undefined;
  ensureIndexes();
  return plantMap.get(id);
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
  return Array.from(nameMap.keys(), (k) => k.replace(/\s+/g, "-"));
}

/** Canonical name slugs plus variant spellings/plurals for static generation. */
export function getAllNameUrlSlugsIncludingVariants(): string[] {
  ensureIndexes();
  const set = new Set(getAllNameUrlSlugs());
  Array.from(nameAliasToCanonical.keys()).forEach((variantKey) => {
    set.add(variantKey.replace(/\s+/g, "-"));
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "en"));
}

/** Canonical `nameMap` key → path segment for `/name/[slug]`. */
export function normalizedKeyToUrlSlug(normalizedKey: string): string {
  return normalizedKey.replace(/\s+/g, "-");
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
    const code = entry.country?.trim().toUpperCase();
    if (!code) continue;
    const label = entry.name.trim() || slug;
    let row = bySlug.get(slug);
    if (!row) {
      row = { label, countries: new Set() };
      bySlug.set(slug, row);
    } else if (label.length > row.label.length) {
      row.label = label;
    }
    row.countries.add(code);
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
    const code = entry.country?.trim().toUpperCase();
    if (!code) continue;
    const slug = getNameEntryUrlSlug(entry);
    if (!slug) continue;
    const label = entry.name.trim() || slug;
    let slugMap = byCountry.get(code);
    if (!slugMap) {
      slugMap = new Map();
      byCountry.set(code, slugMap);
    }
    if (!slugMap.has(slug)) slugMap.set(slug, label);
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
    const c = n.country?.trim().toUpperCase();
    if (c) set.add(c);
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
    const code = entry.country?.trim().toUpperCase();
    if (!code) continue;
    const countrySeg = countryCodeToUrlSlug(code);
    const key = `${slug}::${countrySeg}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ slug, country: countrySeg });
  }
  return out.sort(
    (a, b) => a.slug.localeCompare(b.slug) || a.country.localeCompare(b.country)
  );
}
