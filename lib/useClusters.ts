import { getNameEntryUrlSlug, loadNames, loadPlants, type NameIndexLink, type Plant } from "@/lib/data";

export type UseClusterSlug =
  | "medicinal-herbs"
  | "herbal-teas"
  | "culinary-medicinal-herbs"
  | "ritual-herbs";

type UseClusterConfig = {
  slug: UseClusterSlug;
  title: string;
  description: string;
  matches: (plant: Plant) => boolean;
};

const CLUSTERS: UseClusterConfig[] = [
  {
    slug: "medicinal-herbs",
    title: "Medicinal herbs",
    description:
      "Dataset-driven listing of plants tagged for medicinal use, with internal links to herb names and country pages.",
    matches: (plant) =>
      plant.primary_uses.some((u) => u.trim().toLowerCase() === "medicinal"),
  },
  {
    slug: "herbal-teas",
    title: "Herbal teas",
    description:
      "Programmatic cluster of plants associated with tea use, linking herb names, plant pages, and country hubs.",
    matches: (plant) =>
      plant.primary_uses.some((u) => u.trim().toLowerCase() === "tea"),
  },
  {
    slug: "culinary-medicinal-herbs",
    title: "Culinary medicinal herbs",
    description:
      "Plants tagged for culinary use alongside medicinal traditions, with links to name hubs, species pages, and country herb listings.",
    matches: (plant) =>
      plant.primary_uses.some((u) => u.trim().toLowerCase() === "culinary"),
  },
  {
    slug: "ritual-herbs",
    title: "Ritual herbs",
    description:
      "Plants associated with ritual use in the dataset, cross-linked to local names, scientific pages, and regional herb hubs.",
    matches: (plant) =>
      plant.primary_uses.some((u) => u.trim().toLowerCase() === "ritual"),
  },
];

export function getUseClusterSlugs(): UseClusterSlug[] {
  return CLUSTERS.map((c) => c.slug);
}

export function getUseClusterConfig(slug: string): UseClusterConfig | undefined {
  return CLUSTERS.find((c) => c.slug === slug);
}

export function getPlantsForUseCluster(slug: string): Plant[] {
  const cfg = getUseClusterConfig(slug);
  if (!cfg) return [];
  return loadPlants()
    .filter(cfg.matches)
    .sort((a, b) => a.scientific_name.localeCompare(b.scientific_name, "en"));
}

export function getTopNameLinksForUseCluster(slug: string, limit = 60): NameIndexLink[] {
  const plants = getPlantsForUseCluster(slug);
  if (plants.length === 0) return [];
  const allowed = new Set(plants.map((p) => p.id));
  const counts = new Map<string, { label: string; count: number }>();
  for (const row of loadNames()) {
    if (!row.plant_ids.some((id) => allowed.has(id))) continue;
    const key = getNameEntryUrlSlug(row);
    if (!key) continue;
    const label = row.name.trim() || key;
    const hit = counts.get(key);
    if (hit) {
      hit.count += 1;
    } else {
      counts.set(key, { label, count: 1 });
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[1].label.localeCompare(b[1].label, "en"))
    .slice(0, limit)
    .map(([slugName, row]) => ({ slug: slugName, label: row.label }));
}
