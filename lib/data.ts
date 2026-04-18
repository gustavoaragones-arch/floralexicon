import { countryCodeToUrlSlug } from "@/lib/countries";
import { toUrlSlug } from "@/lib/toUrlSlug";
import { canonicalTagFromUseSlug, slugifyUseTag } from "@/lib/usePaths";
import nameVariantsJson from "@/data/nameVariants.json";
import plantsJson from "@/data/plants.json";
import namesJson from "@/data/names.json";
import processedPlantsJson from "@/data/processed/plants.json";
import plantsEnrichedJson from "@/data/enriched/plants.enriched.json";

export type UsesStructured = {
  medicinal: string[];
  culinary: string[];
  topical: string[];
  other: string[];
};

export type Plant = {
  id: string;
  scientific_name: string;
  family: string;
  genus: string;
  rank: string;
  origin_regions: string[];
  plant_type: string;
  primary_uses: string[];
  /** Derived from `data/processed/plants.json` keyword taxonomy (not merged into slim JSON). */
  uses_structured: UsesStructured;
  /**
   * Synthetic plant built from `names.json` when this `id` is referenced but missing from `plants.json`.
   * Prefer {@link getPlantById} which returns ghosts automatically when name rows exist.
   */
  isGhost?: boolean;
  /** Curator layer from `data/enriched/plants.enriched.json` (uses / meta / family). */
  meta?: Record<string, unknown>;
  /** True when a row exists in the enrichment file for this plant `id` (or slug from `scientific_name`). */
  is_enriched?: boolean;
};

export type PlantAuthorityTier = "standard" | "cross_regional" | "cosmopolitan";

/** @deprecated Use {@link PlantAuthorityTier} */
export type LexiconAuthorityTier = PlantAuthorityTier;

export type CountryUsageConfidence = "high" | "medium" | "low";

export type CountryUsageSource =
  | "wikidata"
  | "paper"
  | "manual"
  | "global_fallback"
  /** English (or global) label reused for a country outside primary Anglophone regions. */
  | "global_reuse"
  /** Regional / vernacular or non-English-primary name usage (default for migrated rows). */
  | "local_ethnobotany";

/** Per-country attachment for a name row; preferred over flat `countries`. */
export type CountryUsage = {
  country: string;
  is_primary?: boolean;
  confidence?: CountryUsageConfidence;
  source?: CountryUsageSource;
};

export type NameEntrySource = "wikidata" | "paper" | "manual";
export type NameEvidenceLevel = "high" | "medium" | "low";

export type NameEntry = {
  name: string;
  normalized: string;
  language: string;
  /**
   * Geographic usage (preferred). When present, drives {@link nameEntryCountries}.
   * Legacy rows may only have `countries` until migration.
   */
  country_usage?: CountryUsage[];
  /**
   * Legacy single-country field; kept populated (first sorted ISO code) for older call sites.
   * Prefer {@link nameEntryCountries}.
   */
  country: string;
  /** Distinct ISO codes where this name–plant row appears across merged sources (uppercase, sorted). */
  countries: string[];
  plant_ids: string[];
  ambiguity_level: string;
  /** Optional provenance for the whole name row (not per-country). */
  source?: NameEntrySource;
  evidence_level?: NameEvidenceLevel;
  is_transliterated?: boolean;
  /** True when this label is treated as globally scoped in the index. */
  global?: boolean;
  /** Hub width for this name row (same as `countries.length`; explicit for authority layer). */
  name_country_count?: number;
  /**
   * Distinct countries for this species across the merged corpus (union of this plant’s
   * regional rows and `plants.json` regions). Set by `applyCrossCountryNameAuthority.ts`.
   */
  plant_country_span?: number;
  /** Plant-level geographic breadth tier (optional). */
  plant_authority_tier?: PlantAuthorityTier;
  /** @deprecated Renamed to {@link NameEntry.plant_authority_tier} */
  lexicon_authority_tier?: PlantAuthorityTier;
  /** True when this row is the global primary indexed label for the plant (widest hub). */
  is_global_dominant_name?: boolean;
  /** @deprecated Renamed to {@link NameEntry.is_global_dominant_name} */
  dominant_common_name_for_plant?: boolean;
  /** ISO codes where this row wins the per-plant, per-country dominant label rule. */
  dominant_in_countries?: string[];
  /** Other common-name labels indexed for the same plant (cross-country variants). */
  plant_name_variants?: string[];
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

export function emptyUsesStructured(): UsesStructured {
  return { medicinal: [], culinary: [], topical: [], other: [] };
}

type ProcessedPlantRow = {
  id?: string;
  uses_structured?: Record<string, unknown>;
};

function coerceUsesStringArray(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  const out = x
    .map((v) => String(v).trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(out)].sort((a, b) => a.localeCompare(b));
}

function coerceUsesStructured(raw: unknown): UsesStructured {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return emptyUsesStructured();
  }
  const o = raw as Record<string, unknown>;
  return {
    medicinal: coerceUsesStringArray(o.medicinal),
    culinary: coerceUsesStringArray(o.culinary),
    topical: coerceUsesStringArray(o.topical),
    other: coerceUsesStringArray(o.other),
  };
}

function mergeUsesStructuredUnion(a: UsesStructured, b: UsesStructured): UsesStructured {
  const u = (x: string[], y: string[]) =>
    [...new Set([...x, ...y])].sort((p, q) => p.localeCompare(q));
  return {
    medicinal: u(a.medicinal, b.medicinal),
    culinary: u(a.culinary, b.culinary),
    topical: u(a.topical, b.topical),
    other: u(a.other, b.other),
  };
}

/**
 * `data/processed/plants.json` may contain duplicate `id` rows; union tags so a later
 * sparse row does not wipe `uses_structured` from an earlier row.
 */
function buildProcessedUsesStructuredById(): Map<string, UsesStructured> {
  const m = new Map<string, UsesStructured>();
  const rows = Array.isArray(processedPlantsJson) ? processedPlantsJson : [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const id =
      typeof (row as ProcessedPlantRow).id === "string"
        ? (row as ProcessedPlantRow).id!.trim()
        : "";
    if (!id) continue;
    const next = coerceUsesStructured((row as ProcessedPlantRow).uses_structured);
    const prev = m.get(id);
    m.set(id, prev ? mergeUsesStructuredUnion(prev, next) : next);
  }
  return m;
}

let processedUsesById = new Map<string, UsesStructured>();

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
  if (Array.isArray(entry.country_usage) && entry.country_usage.length > 0) {
    const s = new Set<string>();
    for (const u of entry.country_usage) {
      const cc =
        typeof u.country === "string" ? u.country.trim().toUpperCase() : "";
      if (cc) s.add(cc);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }
  if (Array.isArray(entry.countries) && entry.countries.length > 0) {
    return [...entry.countries];
  }
  const c = entry.country?.trim().toUpperCase();
  return c ? [c] : [];
}

/**
 * True when `countryIso` is tied to this row from real regional data, not a
 * synthetic `global_fallback` {@link CountryUsage} entry.
 * {@link CountryUsageSource} values `global_reuse` and `local_ethnobotany` count as explicit.
 */
export function nameEntryHasExplicitCountryCoverage(
  entry: NameEntry,
  countryIso: string
): boolean {
  const C = countryIso.trim().toUpperCase();
  if (!C) return false;
  if (Array.isArray(entry.country_usage) && entry.country_usage.length > 0) {
    return entry.country_usage.some((u) => {
      const cc =
        typeof u.country === "string" ? u.country.trim().toUpperCase() : "";
      return cc === C && u.source !== "global_fallback";
    });
  }
  return nameEntryCountries(entry).includes(C);
}

function parseCountryUsageConfidence(
  v: unknown
): CountryUsageConfidence | undefined {
  if (v === "high" || v === "medium" || v === "low") return v;
  return undefined;
}

function parseCountryUsageSource(v: unknown): CountryUsageSource | undefined {
  if (
    v === "wikidata" ||
    v === "paper" ||
    v === "manual" ||
    v === "global_fallback" ||
    v === "global_reuse" ||
    v === "local_ethnobotany"
  ) {
    return v;
  }
  return undefined;
}

function parseCountryUsageArray(raw: unknown): CountryUsage[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: CountryUsage[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      out.push({
        country: item.trim().toUpperCase(),
        is_primary: true,
        confidence: "medium",
      });
      continue;
    }
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const o = item as Record<string, unknown>;
      const country =
        typeof o.country === "string" ? o.country.trim().toUpperCase() : "";
      if (!country) continue;
      const usage: CountryUsage = { country };
      if (o.is_primary === true) usage.is_primary = true;
      const conf = parseCountryUsageConfidence(o.confidence);
      if (conf) usage.confidence = conf;
      const src = parseCountryUsageSource(o.source);
      if (src) usage.source = src;
      out.push(usage);
    }
  }
  return out.length ? out : undefined;
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

  let country_usage = parseCountryUsageArray(raw.country_usage);
  const cset = new Set<string>();
  if (country_usage && country_usage.length > 0) {
    for (const u of country_usage) {
      if (u.country) cset.add(u.country);
    }
  } else {
    country_usage = undefined;
    if (Array.isArray(raw.countries)) {
      for (const c of raw.countries) {
        if (typeof c === "string" && c.trim()) cset.add(c.trim().toUpperCase());
      }
    }
    if (typeof raw.country === "string" && raw.country.trim()) {
      cset.add(raw.country.trim().toUpperCase());
    }
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

  const plant_country_span =
    typeof raw.plant_country_span === "number" && Number.isFinite(raw.plant_country_span)
      ? Math.max(0, Math.floor(raw.plant_country_span))
      : undefined;

  const name_country_count =
    typeof raw.name_country_count === "number" && Number.isFinite(raw.name_country_count)
      ? Math.max(0, Math.floor(raw.name_country_count))
      : countries.length;

  let plant_authority_tier: PlantAuthorityTier | undefined;
  const tierNew = raw.plant_authority_tier;
  const tierOld = raw.lexicon_authority_tier;
  const tierRaw = tierNew ?? tierOld;
  if (tierRaw === "standard" || tierRaw === "cross_regional" || tierRaw === "cosmopolitan") {
    plant_authority_tier = tierRaw;
  }

  const is_global_dominant_name =
    raw.is_global_dominant_name === true || raw.dominant_common_name_for_plant === true
      ? true
      : undefined;

  let dominant_in_countries: string[] | undefined;
  if (Array.isArray(raw.dominant_in_countries)) {
    const ds = raw.dominant_in_countries
      .map((x) => (typeof x === "string" ? x.trim().toUpperCase() : ""))
      .filter(Boolean);
    dominant_in_countries = [...new Set(ds)].sort((a, b) => a.localeCompare(b));
    if (dominant_in_countries.length === 0) dominant_in_countries = undefined;
  }

  let plant_name_variants: string[] | undefined;
  if (Array.isArray(raw.plant_name_variants)) {
    const vs = raw.plant_name_variants
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
    if (vs.length > 0) plant_name_variants = [...new Set(vs)];
  }

  let source: NameEntrySource | undefined;
  if (raw.source === "wikidata" || raw.source === "paper" || raw.source === "manual") {
    source = raw.source;
  }
  let evidence_level: NameEvidenceLevel | undefined;
  if (
    raw.evidence_level === "high" ||
    raw.evidence_level === "medium" ||
    raw.evidence_level === "low"
  ) {
    evidence_level = raw.evidence_level;
  }
  const is_transliterated =
    raw.is_transliterated === true ? true : undefined;
  const global = raw.global === true ? true : undefined;

  return {
    name: raw.name,
    normalized: raw.normalized,
    language,
    country: countries[0] ?? "",
    countries,
    ...(country_usage ? { country_usage } : {}),
    plant_ids,
    ambiguity_level,
    name_country_count,
    ...(plant_country_span !== undefined ? { plant_country_span } : {}),
    ...(plant_authority_tier ? { plant_authority_tier } : {}),
    ...(is_global_dominant_name ? { is_global_dominant_name } : {}),
    ...(dominant_in_countries ? { dominant_in_countries } : {}),
    ...(plant_name_variants ? { plant_name_variants } : {}),
    ...(source ? { source } : {}),
    ...(evidence_level ? { evidence_level } : {}),
    ...(is_transliterated !== undefined ? { is_transliterated } : {}),
    ...(global !== undefined ? { global } : {}),
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

/** Same binomial → id rule as merge pipeline (`slugifyScientific`), for enrichment keys. */
function slugifyScientific(scientific: string): string {
  const n = scientific
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const parts = n.split(/\s+/).filter(Boolean);
  const base =
    parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0] ?? n;
  return base.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

type EnrichedPlantRow = Record<string, unknown>;

/**
 * Curated plant patches (bundled JSON). Keeps merge/raw untouched; safe for client + server.
 * Shape: `[{ "id"?: "…", "scientific_name"?: "…", "uses"?: string[], "family"?: string, "meta"?: object }]`.
 */
export function loadEnrichedPlants(): unknown[] {
  try {
    if (!Array.isArray(plantsEnrichedJson)) return [];
    return plantsEnrichedJson;
  } catch {
    return [];
  }
}

let enrichedByPlantId = new Map<string, EnrichedPlantRow>();

function buildEnrichedPlantById(rows: unknown[]): Map<string, EnrichedPlantRow> {
  const m = new Map<string, EnrichedPlantRow>();
  for (const r of rows) {
    if (!r || typeof r !== "object" || Array.isArray(r)) continue;
    const o = r as EnrichedPlantRow;
    const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
    const sci =
      typeof o.scientific_name === "string" && o.scientific_name.trim()
        ? o.scientific_name.trim()
        : "";
    const slug = sci ? slugifyScientific(sci) : "";
    if (id) m.set(id, o);
    if (slug && slug !== id) m.set(slug, o);
  }
  return m;
}

function coerceLowerUses(u: unknown): string[] {
  if (!Array.isArray(u)) return [];
  return u.map((x) => String(x).trim().toLowerCase()).filter(Boolean);
}

function mergeEnrichedLayer(plant: Plant): Plant {
  const row = enrichedByPlantId.get(plant.id);
  if (!row) return plant;

  const usesArr = coerceLowerUses(row.uses ?? row.primary_uses);
  const hasUses = usesArr.length > 0;
  const famRaw = row.family;
  const familyStr =
    typeof famRaw === "string" && famRaw.trim() ? famRaw.trim() : null;
  const metaRaw = row.meta;
  const metaOk =
    metaRaw != null &&
    typeof metaRaw === "object" &&
    !Array.isArray(metaRaw);

  const next: Plant = {
    ...plant,
    primary_uses: hasUses ? usesArr : plant.primary_uses,
    family: familyStr ?? plant.family,
    ...(metaOk
      ? { meta: metaRaw as Record<string, unknown> }
      : plant.meta
        ? { meta: plant.meta }
        : {}),
    is_enriched: true,
  };
  return next;
}

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

  enrichedByPlantId = buildEnrichedPlantById(loadEnrichedPlants());
  processedUsesById = buildProcessedUsesStructuredById();
  plantsList = rawPlants
    .filter(isPlantRecord)
    .map((p) => {
      const base = p as unknown as Plant;
      const withStructured: Plant = {
        ...base,
        uses_structured: processedUsesById.get(base.id) ?? emptyUsesStructured(),
      };
      return mergeEnrichedLayer(withStructured);
    });
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

/**
 * Synthetic `Plant` for ids present in `names.json` but not yet in `plants.json`.
 * Built from the canonical `plant_id` slug (no name-row payload required).
 */
export function buildGhostPlant(plant_id: string): Plant {
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
    uses_structured: processedUsesById.get(id) ?? emptyUsesStructured(),
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
  const ghost = mergeEnrichedLayer(buildGhostPlant(id));
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
export function getNameSlugRowCountForPlant(plantId: string): Map<string, number> {
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
export function dedupeNameIndexLinksByNormalizedLabel(
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
  const freq = getNameSlugRowCountForPlant(plantId);
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

  const freq = getNameSlugRowCountForPlant(id);
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

/** Lightweight row for `/uses/[slug]` lists (full processed corpus, not slim runtime). */
export type ProcessedPlantUseListRow = {
  id: string;
  scientific_name: string;
};

function processedBucketHasTag(bucket: unknown, tagNorm: string): boolean {
  if (!Array.isArray(bucket)) return false;
  return bucket.some((x) => String(x).trim().toLowerCase() === tagNorm);
}

/**
 * Plants from bundled `data/processed/plants.json` whose `uses_structured` includes the
 * taxonomy leaf for this URL slug. Dedupes duplicate `id` rows (longest `scientific_name` wins).
 * Server-safe; does not depend on {@link ensureIndexes}.
 */
export function getProcessedPlantsWithUseSlug(
  slug: string
): ProcessedPlantUseListRow[] {
  const tag = canonicalTagFromUseSlug(slug.trim());
  if (!tag) return [];
  const tagNorm = tag.toLowerCase();
  const processed = Array.isArray(processedPlantsJson) ? processedPlantsJson : [];
  const byId = new Map<string, ProcessedPlantUseListRow>();

  for (const raw of processed) {
    if (!raw || typeof raw !== "object") continue;
    const p = raw as Record<string, unknown>;
    const id = typeof p.id === "string" ? p.id.trim() : "";
    if (!id) continue;
    const u = (p.uses_structured ?? {}) as Record<string, unknown>;
    const has =
      processedBucketHasTag(u.medicinal, tagNorm) ||
      processedBucketHasTag(u.culinary, tagNorm) ||
      processedBucketHasTag(u.topical, tagNorm) ||
      processedBucketHasTag(u.other, tagNorm);
    if (!has) continue;

    const sci =
      typeof p.scientific_name === "string" ? p.scientific_name.trim() : "";
    const displaySci = sci || id.replace(/_/g, " ");
    const prev = byId.get(id);
    if (!prev || displaySci.length > prev.scientific_name.length) {
      byId.set(id, { id, scientific_name: displaySci });
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.scientific_name.localeCompare(b.scientific_name, "en", {
      sensitivity: "base",
    })
  );
}

/**
 * Plants whose `uses_structured` lists include a leaf matching this URL slug
 * (slim runtime index only; see {@link getProcessedPlantsWithUseSlug} for full processed).
 */
export function getPlantsWithStructuredUseSlug(slug: string): Plant[] {
  ensureIndexes();
  const want = slug.trim().toLowerCase();
  if (!want) return [];
  return plantsList.filter((p) => {
    const u = p.uses_structured;
    const all = [...u.medicinal, ...u.culinary, ...u.topical, ...u.other];
    return all.some((t) => slugifyUseTag(t) === want);
  });
}

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
