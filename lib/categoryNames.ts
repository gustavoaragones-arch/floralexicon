import { filterPlantsByCategory, type PlantCategory } from "@/lib/categories";
import {
  getNameEntryUrlSlug,
  loadNames,
  loadPlants,
  urlSlugToCanonicalSlug,
  type NameIndexLink,
} from "@/lib/data";

/**
 * Canonical name hubs for labels that appear on plants in this category (for internal linking).
 */
export function getTopNameLinksForCategory(
  category: PlantCategory,
  limit = 16
): NameIndexLink[] {
  const plants = filterPlantsByCategory(loadPlants(), category);
  const plantIds = new Set(plants.map((p) => p.id));
  const byCanonical = new Map<string, string>();

  for (const entry of loadNames()) {
    if (!entry.plant_ids.some((id) => plantIds.has(id))) continue;
    const slug = getNameEntryUrlSlug(entry);
    if (!slug) continue;
    const canon = urlSlugToCanonicalSlug(slug);
    const label = entry.name.trim() || slug;
    if (!byCanonical.has(canon)) byCanonical.set(canon, label);
  }

  return Array.from(byCanonical.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, "en", { sensitivity: "base" })
    )
    .slice(0, limit);
}
