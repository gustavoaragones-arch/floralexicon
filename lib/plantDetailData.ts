import type { Plant } from "@/lib/data";
import mergedPlants from "@/data/merged/plants.json";

export type MergedPlantRow = {
  plant_id: string;
  scientific_name: string;
  family: string;
  names: string[];
  countries: string[];
  regions: string[];
  uses: string[];
  conditions: string[];
  toxicity: {
    level: string;
    type?: string[];
    notes?: string | null;
    contraindications?: string[];
  };
  evidence: {
    level: string;
    source?: string;
    confidence?: number;
  };
  sustainability?: { status: string; notes?: string | null };
  lookalike_risk?: boolean;
  geo_precision?: string;
};

function isMergedRow(x: unknown): x is MergedPlantRow {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.plant_id === "string";
}

let mergedById: Map<string, MergedPlantRow> | null = null;

export function getMergedPlantRow(plantId: string): MergedPlantRow | undefined {
  if (!plantId) return undefined;
  if (!mergedById) {
    mergedById = new Map();
    for (const row of mergedPlants as unknown[]) {
      if (!isMergedRow(row)) continue;
      mergedById.set(row.plant_id, row);
    }
  }
  return mergedById.get(plantId);
}

export type PlantDetailModel = {
  core: Plant;
  merged: MergedPlantRow | undefined;
  /** Display-only common names (no internal ids). */
  displayNames: string[];
};

/** Numeric ordering for merged toxicity bands (higher = more concern). */
export function toxicityLevelRank(level: string | undefined): number {
  const l = (level ?? "").toLowerCase().trim();
  if (l === "lethal") return 4;
  if (l === "high") return 3;
  if (l === "moderate") return 2;
  if (l === "low") return 1;
  return 0;
}

/**
 * Compact structured safety in the page header: moderate+ toxicity, look‑alike
 * risk, or any indexed precautions / toxicity types.
 */
export function shouldShowHeaderStructuredSafety(merged: MergedPlantRow | undefined): boolean {
  if (!merged) return false;
  if (toxicityLevelRank(merged.toxicity?.level) >= 2) return true;
  if (merged.lookalike_risk) return true;
  const tox = merged.toxicity;
  const extras =
    (tox?.contraindications?.filter(Boolean).length ?? 0) > 0 ||
    (tox?.type?.filter(Boolean).length ?? 0) > 0;
  return extras;
}
