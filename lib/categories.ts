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
