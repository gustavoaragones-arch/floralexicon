import type { Plant } from "@/lib/data";

export type PlantCategory = "medicinal" | "culinary-medicinal" | "ritual";

const CATEGORY_ORDER: PlantCategory[] = [
  "medicinal",
  "culinary-medicinal",
  "ritual",
];

/** URL path segment under `[lang]` for each category index. */
export const categoryListingPath: Record<PlantCategory, string> = {
  medicinal: "/medicinal-herbs",
  "culinary-medicinal": "/culinary-herbs",
  ritual: "/ritual-herbs",
};

export function getPlantCategories(plant: Plant): PlantCategory[] {
  const uses = (plant.primary_uses || []).map((u) => u.trim().toLowerCase());
  const categories = new Set<PlantCategory>();

  if (uses.includes("medicinal") || uses.includes("tea")) {
    categories.add("medicinal");
  }

  if (uses.includes("culinary")) {
    categories.add("culinary-medicinal");
  }

  if (uses.includes("ritual")) {
    categories.add("ritual");
  }

  return CATEGORY_ORDER.filter((c) => categories.has(c));
}

export function filterPlantsByCategory(
  plants: readonly Plant[],
  category: PlantCategory
): Plant[] {
  return plants.filter((p) => getPlantCategories(p).includes(category));
}

/** Hub path under `[lang]` for a primary-use slug, when we surface browse-by-use links. */
export function browsePathForPrimaryUseSlug(use: string): string | null {
  const u = use.trim().toLowerCase();
  if (u === "medicinal" || u === "tea") return categoryListingPath.medicinal;
  if (u === "culinary") return categoryListingPath["culinary-medicinal"];
  if (u === "ritual") return categoryListingPath.ritual;
  return null;
}
