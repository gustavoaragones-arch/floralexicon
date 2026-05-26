/**
 * buildFromTier1.ts — FloraLexicon tier1-native dataset builder.
 *
 * Replaces the legacy mergeDataset.ts (which consumed data/raw/*.json in an old
 * ad-hoc schema). Reads ONLY:
 *   - data/tier1/*.json           (the validated v1.2 tier-1 plant files)
 *   - data/canonical/plants.json  (88-plant master: plant_id, scientific_name, family, kingdom, common_name_en, synonyms)
 *   - data/canonical/countries.json (76-country roster)
 *
 * Emits the exact files the app already reads (see lib/data.ts):
 *   - data/plants.json            (SLIM, root) — strict isPlantRecord shape, the iterated plant list
 *   - data/names.json             (root) — the name index (coalesceNameRecord contract)
 *   - data/processed/plants.json  (uses_structured + countries side-table, keyed by id)
 *   - data/processed/names.json   (duplicate of names.json; read by sitemapBuild + dataAudit)
 *
 * Run:  tsx scripts/buildFromTier1.ts
 * Then: python3 scripts/validate_tiers.py   (tier integrity)
 *       npm run canary                       (chamomile regression)
 *
 * Design notes:
 * - Primary selection per (plant, country): highest naming-authority, then confidence,
 *   then tier-file order. Authority rank: pharmacopoeia ~= regulatory > pharmacopoeia_traditional
 *   > traditional > commercial > linguistic > ethnobotany-as-traditional.
 * - normalizeString MUST match lib/data.ts exactly (validator warns otherwise).
 * - tier1 `source` (naming authority) is mapped to the app's CountryUsage.source
 *   (provenance enum) AND preserved verbatim in `authority_source` for future use.
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = process.cwd();
const TIER1_DIR = path.join(ROOT, "data", "tier1");
const CANONICAL_DIR = path.join(ROOT, "data", "canonical");
const PROCESSED_DIR = path.join(ROOT, "data", "processed");

const OUT_SLIM_PLANTS = path.join(ROOT, "data", "plants.json");
const OUT_NAMES = path.join(ROOT, "data", "names.json");
const OUT_PROCESSED_PLANTS = path.join(PROCESSED_DIR, "plants.json");
const OUT_PROCESSED_NAMES = path.join(PROCESSED_DIR, "names.json");

// ---------------------------------------------------------------------------
// Types (mirrors of the tier1 schema + app contract)
// ---------------------------------------------------------------------------
type Tier1Entry = {
  name: string;
  language: string;
  confidence: "high" | "medium" | "low";
  source:
    | "pharmacopoeia"
    | "pharmacopoeia_traditional"
    | "regulatory"
    | "ethnobotany"
    | "traditional"
    | "commercial"
    | "linguistic";
  citation?: string;
  transliteration?: string;
  transliteration_scheme?: string;
};
type Tier1File = {
  plant_id: string;
  tier: number;
  supported_countries: string[];
  names: Record<string, Tier1Entry[]>;
};
type CanonicalPlant = {
  plant_id: string;
  scientific_name: string;
  family: string;
  kingdom: string;
  common_name_en: string;
  synonyms: string[];
};

// App-facing CountryUsage source enum (provenance, NOT naming authority)
type AppCountryUsageSource =
  | "wikidata"
  | "paper"
  | "manual"
  | "global_fallback"
  | "global_reuse"
  | "local_ethnobotany";

// ---------------------------------------------------------------------------
// normalizeString — MUST match lib/data.ts byte-for-byte.
// ---------------------------------------------------------------------------
function normalizeString(input: string): string {
  if (input == null || typeof input !== "string") return "";
  const folded = input
    .trim()
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!folded) return "";
  return folded.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ---------------------------------------------------------------------------
// DISPLAY primary selection (which name is the headline for a country).
//
// Derived empirically from the Phase-1a chamomile canary, which requires the
// bare everyday name to win over qualified pharmacopoeial binomials:
//   AR/CL/PE -> Manzanilla (beats "Manzanilla común" / "Manzanilla alemana")
//   FR -> Camomille (beats "Camomille matricaire")
//   DE -> Kamille (beats "Kamillenblüten" / "Echte Kamille")
//   US -> Chamomile
// And cross-checked against tea (bare 茶/Tea/Чай must beat "Green tea"),
// ashwagandha (Ashwagandha/native script must beat "Indian ginseng" calque),
// sage, lavandin, rooibos, reishi.
//
// The unifying signal is BARENESS: the headline name is the shortest widely-
// used term. Qualified binomials, processing variants ("Green tea"), and
// calques ("Indian ginseng") all have MORE tokens than the bare headline.
// Ranking axes, in order of dominance:
//   1. bareness (fewer tokens = higher)   ×1000
//   2. display tier (vernacular > pharmacopoeia_traditional > pharma/regulatory) ×100
//   3. confidence                          ×10
// Note: pharmacopoeia/regulatory are authoritative for IDENTITY but are
// deprioritized for the DISPLAY headline — they tend to be formal binomials,
// not what people call the plant.
// ---------------------------------------------------------------------------
const DISPLAY_TIER: Record<Tier1Entry["source"], number> = {
  commercial: 3,
  traditional: 3,
  linguistic: 3,
  ethnobotany: 3,
  pharmacopoeia_traditional: 2,
  pharmacopoeia: 1,
  regulatory: 1,
};
const CONFIDENCE_RANK: Record<Tier1Entry["confidence"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/** Display-primary score for a tier1 entry within a single country. */
function primaryScore(e: Tier1Entry): number {
  const tokens = e.name.trim().split(/\s+/).length;
  const bareness = Math.max(0, 5 - tokens); // 1 token=4, 2=3, 3=2, 4=1, 5+=0
  return bareness * 1000 + DISPLAY_TIER[e.source] * 100 + CONFIDENCE_RANK[e.confidence] * 10;
}

// tier1 naming-authority source → app provenance source.
function mapSource(src: Tier1Entry["source"], language: string): AppCountryUsageSource {
  switch (src) {
    case "pharmacopoeia":
    case "pharmacopoeia_traditional":
    case "regulatory":
      return "manual"; // codified / curated authority
    case "commercial":
      // English/global commercial labels reused widely → global_reuse; else local
      return language === "en" ? "global_reuse" : "local_ethnobotany";
    case "traditional":
    case "ethnobotany":
    case "linguistic":
    default:
      return "local_ethnobotany";
  }
}

// ---------------------------------------------------------------------------
// Load inputs
// ---------------------------------------------------------------------------
function loadCanonicalPlants(): Map<string, CanonicalPlant> {
  const p = path.join(CANONICAL_DIR, "plants.json");
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  const arr: CanonicalPlant[] = Array.isArray(data) ? data : data.plants;
  const m = new Map<string, CanonicalPlant>();
  for (const pl of arr) m.set(pl.plant_id, pl);
  return m;
}

function loadTier1Files(): Tier1File[] {
  if (!fs.existsSync(TIER1_DIR)) {
    throw new Error(`tier1 dir not found: ${TIER1_DIR}`);
  }
  const files = fs
    .readdirSync(TIER1_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("."));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(TIER1_DIR, f), "utf8")));
}

// ---------------------------------------------------------------------------
// Genus / family inference for the slim plants.json (strict isPlantRecord).
// ---------------------------------------------------------------------------
function inferGenus(scientificName: string): string {
  // first token, strip the × hybrid marker
  const first = scientificName.trim().split(/\s+/)[0] ?? "";
  return first === "×" ? scientificName.trim().split(/\s+/)[1] ?? "" : first;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
type NameRow = {
  name: string;
  normalized: string;
  language: string;
  plant_ids: string[];
  countries: string[];
  country_usage: Array<{
    country: string;
    is_primary: boolean;
    confidence: "high" | "medium" | "low";
    source: AppCountryUsageSource;
    authority_source: Tier1Entry["source"]; // preserved tier1 source
  }>;
  ambiguity_level: string;
  name_country_count: number;
  dominant_in_countries: string[];
};

type SlimPlant = {
  id: string;
  scientific_name: string;
  family: string;
  genus: string;
  rank: string;
  origin_regions: string[];
  plant_type: string;
  primary_uses: string[];
  common_name_en?: string;
  kingdom?: string;
};

type ProcessedPlant = {
  id: string;
  scientific_name: string;
  family: string;
  names: string[];
  countries: string[];
  uses: string[];
  uses_structured: { medicinal: string[]; culinary: string[]; topical: string[]; other: string[] };
};

function main() {
  const canonical = loadCanonicalPlants();
  const tier1Files = loadTier1Files();

  // name-key → aggregated row. Key by (normalized, language, plant_id) so the
  // same string in different languages / for different plants stays distinct.
  const nameRows = new Map<string, NameRow>();
  const slimPlants: SlimPlant[] = [];
  const processedPlants: ProcessedPlant[] = [];

  for (const tf of tier1Files) {
    const canon = canonical.get(tf.plant_id);
    if (!canon) {
      console.warn(`[buildFromTier1] tier1 plant_id "${tf.plant_id}" not in canonical — skipping`);
      continue;
    }

    // --- slim plant row (strict isPlantRecord) ---
    slimPlants.push({
      id: tf.plant_id,
      scientific_name: canon.scientific_name,
      family: canon.family,
      genus: inferGenus(canon.scientific_name),
      rank: "species",
      origin_regions: [],
      plant_type: canon.kingdom === "plant" ? "herb" : canon.kingdom,
      primary_uses: [],
      common_name_en: canon.common_name_en,
      kingdom: canon.kingdom,
    });

    // --- collect names + per-plant country set ---
    const plantCountries = new Set<string>(tf.supported_countries);
    const plantNamesSet = new Set<string>();

    for (const [cc, entries] of Object.entries(tf.names)) {
      // primary selection for THIS country: bareness > display tier > confidence.
      let bestIdx = -1;
      let bestScore = -1;
      entries.forEach((e, i) => {
        const score = primaryScore(e);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      });

      entries.forEach((e, i) => {
        plantNamesSet.add(e.name);
        const normalized = normalizeString(e.name);
        if (!normalized) return;
        const key = `${normalized}\u0000${e.language}\u0000${tf.plant_id}`;
        const isPrimary = i === bestIdx;
        const appSource = mapSource(e.source, e.language);

        let row = nameRows.get(key);
        if (!row) {
          row = {
            name: e.name,
            normalized,
            language: e.language,
            plant_ids: [tf.plant_id],
            countries: [],
            country_usage: [],
            ambiguity_level: "low",
            name_country_count: 0,
            dominant_in_countries: [],
          };
          nameRows.set(key, row);
        }
        if (!row.countries.includes(cc)) row.countries.push(cc);
        row.country_usage.push({
          country: cc,
          is_primary: isPrimary,
          confidence: e.confidence,
          source: appSource,
          authority_source: e.source,
        });
        if (isPrimary && !row.dominant_in_countries.includes(cc)) {
          row.dominant_in_countries.push(cc);
        }
      });
    }

    // --- processed plant row (uses side-table; uses empty for now) ---
    processedPlants.push({
      id: tf.plant_id,
      scientific_name: canon.scientific_name,
      family: canon.family,
      names: [...plantNamesSet].sort((a, b) => a.localeCompare(b)),
      countries: [...plantCountries].sort((a, b) => a.localeCompare(b)),
      uses: [],
      uses_structured: { medicinal: [], culinary: [], topical: [], other: [] },
    });
  }

  // finalize name rows
  const namesOut = [...nameRows.values()].map((r) => {
    r.countries.sort((a, b) => a.localeCompare(b));
    r.dominant_in_countries.sort((a, b) => a.localeCompare(b));
    r.country_usage.sort((a, b) => a.country.localeCompare(b.country));
    r.name_country_count = r.countries.length;
    return r;
  });
  namesOut.sort((a, b) => a.name.localeCompare(b.name) || a.language.localeCompare(b.language));

  slimPlants.sort((a, b) => a.id.localeCompare(b.id));
  processedPlants.sort((a, b) => a.id.localeCompare(b.id));

  // write
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  fs.writeFileSync(OUT_SLIM_PLANTS, JSON.stringify(slimPlants, null, 2));
  fs.writeFileSync(OUT_NAMES, JSON.stringify(namesOut, null, 2));
  fs.writeFileSync(OUT_PROCESSED_PLANTS, JSON.stringify(processedPlants, null, 2));
  fs.writeFileSync(OUT_PROCESSED_NAMES, JSON.stringify(namesOut, null, 2));

  console.log(`✓ buildFromTier1 complete`);
  console.log(`  tier1 files read:     ${tier1Files.length}`);
  console.log(`  slim plants written:  ${slimPlants.length}  -> data/plants.json`);
  console.log(`  name rows written:    ${namesOut.length}  -> data/names.json (+ processed/names.json)`);
  console.log(`  processed plants:     ${processedPlants.length}  -> data/processed/plants.json`);
}

main();
