/**
 * Maps free-text `uses` on processed plants to `uses_structured` using keyword rules.
 * Does not modify `uses`, raw data, or infer tags outside data/taxonomy/uses.json.
 * Idempotent: re-run overwrites `uses_structured` from current `uses` only.
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TAXONOMY_PATH = path.join(ROOT, "data", "taxonomy", "uses.json");
const PLANTS_PATH = path.join(ROOT, "data", "processed", "plants.json");

type Taxonomy = {
  medicinal: string[];
  culinary: string[];
  topical: string[];
  other: string[];
};

type UsesStructured = {
  medicinal: string[];
  culinary: string[];
  topical: string[];
  other: string[];
};

type PlantRow = Record<string, unknown> & {
  id?: string;
  uses?: unknown;
  uses_structured?: UsesStructured;
};

const BUCKETS = ["medicinal", "culinary", "topical", "other"] as const;
type Bucket = (typeof BUCKETS)[number];

function loadTaxonomy(): { taxonomy: Taxonomy; allowed: Map<Bucket, Set<string>> } {
  const raw = JSON.parse(fs.readFileSync(TAXONOMY_PATH, "utf8")) as Taxonomy;
  const allowed = new Map<Bucket, Set<string>>();
  for (const b of BUCKETS) {
    const arr = raw[b];
    if (!Array.isArray(arr)) throw new Error(`taxonomy.${b} must be an array`);
    allowed.set(b, new Set(arr.map((x) => String(x).trim()).filter(Boolean)));
  }
  return { taxonomy: raw, allowed };
}

/** Substring match on lowercased use text; tag must exist in taxonomy bucket. */
type Rule = { bucket: Bucket; tag: string; needles: string[] };

/**
 * Keyword → taxonomy leaf only. Order: longer / more specific needles first where relevant.
 */
const RULES: Rule[] = [
  // medicinal — anti-inflammatory (before generic "inflamm" if needed)
  {
    bucket: "medicinal",
    tag: "anti-inflammatory",
    needles: [
      "anti-inflammatory",
      "anti inflammatory",
      "antiinflammatory",
      "oral cavity anti-inflammatory",
    ],
  },
  // medicinal — respiratory
  {
    bucket: "medicinal",
    tag: "respiratory",
    needles: [
      "respiratory",
      "bronch",
      "expectorant",
      "antitussive",
      "wet cough",
      "sore throat",
      "throat irritation",
      "bronchial irritation",
      "bronchitis",
      "asthma",
      "antiasthmatic",
      "pharyn",
      "colds",
    ],
  },
  // medicinal — digestive
  {
    bucket: "medicinal",
    tag: "digestive",
    needles: [
      "stomach pain",
      "stomach ache",
      "stomach cramps",
      "digestive",
      "digestion",
      "gastrointestinal",
      "gastrointestinal issues",
      "intestinal",
      "liver and bile",
      "liver disease",
      "liver diseases",
      "liver support",
      "liver protection",
      "hepatoprotective",
      "gallbladder",
      "biliary",
      "bile",
      "carminative",
      "colic",
      "nausea",
      "bloating",
      "diarrhea",
      "laxative",
      "appetite stimulant",
      "digestive diseases",
      "digestive support",
      "digestive aid",
      "digestive bitters",
      "digestive soothing",
      "digestive upset",
      "fats digestion",
      "gynecological conditions",
    ],
  },
  // medicinal — sedative
  {
    bucket: "medicinal",
    tag: "sedative",
    needles: [
      "sedative",
      "mild sedative",
      "hypnotic",
      "calming",
      "relaxation",
      "stress reduction",
      "nervous tension",
      "sleep",
      "hysteria",
    ],
  },
  // culinary — tea
  {
    bucket: "culinary",
    tag: "tea",
    needles: ["herbal tea", "tea", "infusion", "tisane"],
  },
  // culinary — spice
  {
    bucket: "culinary",
    tag: "spice",
    needles: ["spice", "seasoning", "preservatives for meat", "condiment"],
  },
  // culinary — flavoring
  {
    bucket: "culinary",
    tag: "flavoring",
    needles: [
      "flavoring",
      "flavouring",
      "culinary use",
      "culinary",
      "bitter tonic",
      "bitters",
      "syrups",
      "spirits",
      "beverages",
      "vinegar",
    ],
  },
  // topical — skin
  {
    bucket: "topical",
    tag: "skin",
    needles: [
      "skin",
      "dermatologic",
      "skin conditions",
      "skin disorders",
      "skin irritation",
      "skin soothing",
      "emollient",
      "cosmetic",
      "eczema",
      "rashes",
      "scalp health",
      "depigmentation",
      "topical only",
      "topical pain",
    ],
  },
  // topical — wounds (incl. healing / cicatrizing)
  {
    bucket: "topical",
    tag: "wounds",
    needles: [
      "wound healing",
      "wounds",
      "cicatrizing",
      "burns",
      "bruises",
      "anal fissures",
      "hemorrhoids",
      "bleeding control",
      "bleeding",
    ],
  },
  // other
  { bucket: "other", tag: "aromatic", needles: ["aromatic", "aromatherapy"] },
  { bucket: "other", tag: "ritual", needles: ["ritual"] },
];

function normalizeUse(u: unknown): string {
  return String(u ?? "")
    .trim()
    .toLowerCase();
}

function coerceUses(plant: PlantRow): string[] {
  const u = plant.uses;
  if (!Array.isArray(u)) return [];
  return u.map((x) => String(x).trim()).filter(Boolean);
}

function mapUsesToStructured(
  uses: string[],
  allowed: Map<Bucket, Set<string>>
): UsesStructured {
  const out: UsesStructured = {
    medicinal: [],
    culinary: [],
    topical: [],
    other: [],
  };
  const sets: Record<Bucket, Set<string>> = {
    medicinal: new Set(),
    culinary: new Set(),
    topical: new Set(),
    other: new Set(),
  };

  for (const raw of uses) {
    const hay = normalizeUse(raw);
    if (!hay) continue;
    for (const rule of RULES) {
      if (!allowed.get(rule.bucket)?.has(rule.tag)) continue;
      for (const needle of rule.needles) {
        if (hay.includes(needle.toLowerCase())) {
          sets[rule.bucket].add(rule.tag);
          break;
        }
      }
    }
  }

  for (const b of BUCKETS) {
    out[b] = [...sets[b]].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  }
  return out;
}

function assertUsesPreserved(before: string[][], after: PlantRow[]): void {
  if (before.length !== after.length) {
    throw new Error(`Plant count changed: ${before.length} → ${after.length}`);
  }
  for (let i = 0; i < before.length; i++) {
    const got = coerceUses(after[i]!);
    if (JSON.stringify(got) !== JSON.stringify(before[i])) {
      const id = String(after[i]?.id ?? i);
      throw new Error(`uses array mutated for plant index ${i} id=${id}`);
    }
  }
}

function main() {
  const { allowed } = loadTaxonomy();
  const plants = JSON.parse(fs.readFileSync(PLANTS_PATH, "utf8")) as PlantRow[];
  const snapshot = plants.map((p) => coerceUses(p));

  for (const plant of plants) {
    const uses = coerceUses(plant);
    plant.uses_structured = mapUsesToStructured(uses, allowed);
  }

  assertUsesPreserved(snapshot, plants);

  fs.writeFileSync(PLANTS_PATH, JSON.stringify(plants, null, 2) + "\n", "utf8");
  console.log(`Wrote ${PLANTS_PATH} (${plants.length} plants, uses_structured added/updated)`);
}

main();
