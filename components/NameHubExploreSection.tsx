import type { SamePlantCluster } from "@/components/SamePlantNamesSection";
import { categoryListingPath, getPlantCategories, type PlantCategory } from "@/lib/categories";
import { urlSlugToCanonicalSlug, type Plant } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

const chipClass =
  "inline-block rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-sm font-medium text-flora-forest transition-colors hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-900/60 dark:text-emerald-300 dark:hover:border-emerald-600/50";

function categoriesForPlants(plants: Plant[]): Set<PlantCategory> {
  const s = new Set<PlantCategory>();
  for (const p of plants) {
    for (const c of getPlantCategories(p)) s.add(c);
  }
  return s;
}

type NameHubExploreSectionProps = {
  lang: Locale;
  nameSlug: string;
  plants: Plant[];
  samePlantClusters: SamePlantCluster[];
};

export function NameHubExploreSection({
  lang,
  nameSlug,
  plants,
  samePlantClusters,
}: NameHubExploreSectionProps) {
  const similar = new Map<string, string>();
  for (const cluster of samePlantClusters) {
    for (const { slug, label } of cluster.links) {
      if (urlSlugToCanonicalSlug(slug) === nameSlug) continue;
      if (!similar.has(slug)) similar.set(slug, label);
    }
  }
  const similarList = Array.from(similar.entries()).sort((a, b) =>
    a[1].localeCompare(b[1], "en", { sensitivity: "base" })
  );

  const cats = categoriesForPlants(plants);

  return (
    <section
      className="mt-12 border-t border-stone-200 pt-10 dark:border-stone-800"
      aria-labelledby="name-hub-explore-heading"
    >
      <h2
        id="name-hub-explore-heading"
        className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
      >
        {t(lang, "name_hub_explore_h2")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {t(lang, "name_hub_explore_lead")}
      </p>

      {similarList.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
            {t(lang, "name_hub_explore_similar_heading")}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {similarList.map(([slug, label]) => (
              <li key={slug}>
                <Link
                  href={localePath(lang, `/name/${slug}`)}
                  className={chipClass}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="mt-8 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6">
        <li>
          <Link href={localePath(lang, "/names")} className={linkClass}>
            {t(lang, "internal_link_browse_names")}
          </Link>
        </li>
        <li>
          <Link href={localePath(lang, "/plants")} className={linkClass}>
            {t(lang, "internal_link_all_plants")}
          </Link>
        </li>
        {cats.has("medicinal") ? (
          <li>
            <Link
              href={localePath(lang, categoryListingPath.medicinal)}
              className={linkClass}
            >
              {t(lang, "home_link_medicinal_herbs")}
            </Link>
          </li>
        ) : null}
        {cats.has("culinary-medicinal") ? (
          <li>
            <Link
              href={localePath(lang, categoryListingPath["culinary-medicinal"])}
              className={linkClass}
            >
              {t(lang, "home_link_culinary_herbs")}
            </Link>
          </li>
        ) : null}
        {cats.has("ritual") ? (
          <li>
            <Link
              href={localePath(lang, categoryListingPath.ritual)}
              className={linkClass}
            >
              {t(lang, "home_link_ritual_herbs")}
            </Link>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
