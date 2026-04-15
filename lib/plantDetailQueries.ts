import type { Plant } from "@/lib/data";
import {
  getNameEntryUrlSlug,
  loadNames,
  loadPlants,
  normalizeString,
  type NameEntry,
} from "@/lib/data";
import { getCountryDisplayName } from "@/lib/countries";
import type { PlantDetailModel } from "@/lib/plantDetailData";
import { getMergedPlantRow } from "@/lib/plantDetailData";
import { humanConditionLabel, humanUseLabel } from "@/lib/plantHumanLabels";
import type { Locale } from "@/lib/i18n";

function distinctDisplayNamesForPlant(plantId: string): string[] {
  const names = loadNames();
  const set = new Set<string>();
  for (const e of names) {
    if (!e.plant_ids.includes(plantId)) continue;
    const n = e.name.trim();
    if (n) set.add(n);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

export function buildPlantDetailModel(plant: Plant): PlantDetailModel {
  const merged = getMergedPlantRow(plant.id);
  const fromIndex = distinctDisplayNamesForPlant(plant.id);
  const fromMerged = (merged?.names ?? []).map((s) => s.trim()).filter(Boolean);
  const displayNames = [
    ...new Set([...fromMerged, ...fromIndex].filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  return { core: plant, merged, displayNames };
}

export function getNameEntriesForPlant(plantId: string): NameEntry[] {
  if (!plantId) return [];
  return loadNames().filter((e) => e.plant_ids.includes(plantId));
}

export type AmbiguityHub = {
  urlSlug: string;
  displayLabel: string;
  otherSpecies: { scientific: string; plantId: string }[];
};

/**
 * Name hubs where this plant appears alongside at least one other species
 * under the same normalized label.
 */
export function getAmbiguityHubsForPlant(plantId: string): AmbiguityHub[] {
  if (!plantId) return [];
  const names = loadNames();
  const plants = loadPlants();
  const plantById = new Map(plants.map((p) => [p.id, p]));

  const speciesByNorm = new Map<string, Set<string>>();
  for (const e of names) {
    const nk = normalizeString(e.normalized);
    if (!nk) continue;
    if (!speciesByNorm.has(nk)) speciesByNorm.set(nk, new Set());
    const set = speciesByNorm.get(nk)!;
    for (const pid of e.plant_ids) set.add(pid);
  }

  const seenNorm = new Set<string>();
  const hubs: AmbiguityHub[] = [];

  for (const e of names) {
    if (!e.plant_ids.includes(plantId)) continue;
    const nk = normalizeString(e.normalized);
    if (!nk) continue;
    const species = speciesByNorm.get(nk);
    if (!species || species.size < 2) continue;
    if (seenNorm.has(nk)) continue;
    seenNorm.add(nk);

    const urlSlug = getNameEntryUrlSlug(e);
    if (!urlSlug) continue;

    const displayLabel = e.name.trim() || nk;
    const otherSpecies = [...species]
      .filter((id) => id !== plantId)
      .map((id) => ({
        plantId: id,
        scientific: plantById.get(id)?.scientific_name ?? "",
      }))
      .filter((x) => x.scientific)
      .sort((a, b) => a.scientific.localeCompare(b.scientific));

    if (otherSpecies.length === 0) continue;
    hubs.push({ urlSlug, displayLabel, otherSpecies });
  }

  hubs.sort((a, b) => a.displayLabel.localeCompare(b.displayLabel, "en"));
  return hubs;
}

export function getRelatedPlants(plant: Plant, limit = 8): Plant[] {
  const g = plant.genus.trim();
  if (!g) return [];
  return loadPlants()
    .filter((p) => p.id !== plant.id && p.genus.trim() === g)
    .sort((a, b) => a.scientific_name.localeCompare(b.scientific_name))
    .slice(0, limit);
}

export type RelatedPlantItem = { plant: Plant; match: "genus" | "theme" };

/**
 * Same genus first, then plants sharing any of the first indexed conditions.
 * Caps at `limit` (default 6). Uses cached merged rows only—no extra I/O.
 */
export function getSmartRelatedPlants(
  plant: Plant,
  model: PlantDetailModel,
  limit = 6
): RelatedPlantItem[] {
  const topCond = (model.merged?.conditions ?? []).filter(Boolean).slice(0, 3);
  const plants = loadPlants();
  type Cand = { plant: Plant; score: number; match: RelatedPlantItem["match"] };
  const cands: Cand[] = [];

  const g0 = plant.genus.trim();
  for (const p of plants) {
    if (p.id === plant.id) continue;
    const sameGenus = Boolean(g0 && p.genus.trim() === g0);
    let themeHit = false;
    if (topCond.length) {
      const m = getMergedPlantRow(p.id);
      const pc = m?.conditions ?? [];
      themeHit = topCond.some((c) => pc.includes(c));
    }
    if (sameGenus) cands.push({ plant: p, score: 2, match: "genus" });
    else if (themeHit) cands.push({ plant: p, score: 1, match: "theme" });
  }

  cands.sort(
    (a, b) =>
      b.score - a.score ||
      a.plant.scientific_name.localeCompare(b.plant.scientific_name, "en")
  );

  const out: RelatedPlantItem[] = [];
  const seen = new Set<string>();
  for (const c of cands) {
    if (seen.has(c.plant.id)) continue;
    seen.add(c.plant.id);
    out.push({ plant: c.plant, match: c.match });
    if (out.length >= limit) break;
  }
  return out;
}

export type RegionalUseRow = {
  regionLabel: string;
  useFragment: string;
  nameHint: string | null;
};

export type RegionalUseBlock =
  | { kind: "uniform" }
  | { kind: "rows"; rows: RegionalUseRow[] };

/**
 * When local name signatures differ by country cluster, list region → uses.
 * Otherwise signals uniform traditional-use framing in the index.
 */
export function buildRegionalUseBlock(
  plantId: string,
  model: PlantDetailModel,
  lang: Locale
): RegionalUseBlock {
  const countryToNames = new Map<string, Set<string>>();
  for (const e of loadNames()) {
    if (!e.plant_ids.includes(plantId)) continue;
    const c = e.country.trim();
    if (!c) continue;
    if (!countryToNames.has(c)) countryToNames.set(c, new Set());
    countryToNames.get(c)!.add(e.name.trim());
  }
  for (const c of model.merged?.countries ?? []) {
    const cc = c.trim();
    if (!cc) continue;
    if (!countryToNames.has(cc)) countryToNames.set(cc, new Set());
  }

  if (countryToNames.size === 0) return { kind: "uniform" };

  const sigTo = new Map<
    string,
    { countries: string[]; hints: Set<string> }
  >();
  for (const [country, names] of countryToNames) {
    const sig =
      [...names].sort((a, b) => a.localeCompare(b, "en")).join("|||") || "__empty__";
    if (!sigTo.has(sig)) sigTo.set(sig, { countries: [], hints: new Set() });
    const row = sigTo.get(sig)!;
    row.countries.push(country);
    for (const n of names) row.hints.add(n);
  }

  if (sigTo.size <= 1) return { kind: "uniform" };

  const useParts: string[] = [];
  const uses = model.merged?.uses?.length
    ? model.merged.uses
    : model.core.primary_uses.map((u) => u.trim()).filter(Boolean);
  for (const u of uses.slice(0, 3)) useParts.push(humanUseLabel(u, lang));
  for (const c of (model.merged?.conditions ?? []).filter(Boolean).slice(0, 2)) {
    useParts.push(humanConditionLabel(c));
  }
  const useFragment = [...new Set(useParts)].slice(0, 4).join(", ");

  const rows: RegionalUseRow[] = [];
  for (const { countries, hints } of sigTo.values()) {
    countries.sort((a, b) =>
      getCountryDisplayName(a, lang).localeCompare(
        getCountryDisplayName(b, lang),
        lang === "es" ? "es" : "en"
      )
    );
    const regionLabel = countries
      .map((iso) => getCountryDisplayName(iso, lang))
      .join(" · ");
    const nameHint =
      [...hints].filter(Boolean).slice(0, 2).join(lang === "es" ? " · " : " · ") ||
      null;
    rows.push({
      regionLabel,
      useFragment: useFragment || humanUseLabel(uses[0] ?? "medicinal", lang),
      nameHint,
    });
  }
  rows.sort((a, b) => a.regionLabel.localeCompare(b.regionLabel, lang === "es" ? "es" : "en"));
  return { kind: "rows", rows };
}
