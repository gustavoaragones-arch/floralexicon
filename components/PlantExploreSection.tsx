import { getPlantCategories, categoryListingPath } from "@/lib/categories";
import type { Plant } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

type PlantExploreSectionProps = {
  lang: Locale;
  plant: Plant;
};

export function PlantExploreSection({ lang, plant }: PlantExploreSectionProps) {
  const categories = getPlantCategories(plant);

  return (
    <section
      className="mt-12 border-t border-stone-200 pt-10 dark:border-stone-800"
      aria-labelledby="plant-explore-heading"
    >
      <h2
        id="plant-explore-heading"
        className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
      >
        {t(lang, "plant_explore_heading")}
      </h2>
      <ul className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6">
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
        {categories.includes("medicinal") ? (
          <li>
            <Link
              href={localePath(lang, categoryListingPath.medicinal)}
              className={linkClass}
            >
              {t(lang, "home_link_medicinal_herbs")}
            </Link>
          </li>
        ) : null}
        {categories.includes("culinary-medicinal") ? (
          <li>
            <Link
              href={localePath(lang, categoryListingPath["culinary-medicinal"])}
              className={linkClass}
            >
              {t(lang, "home_link_culinary_herbs")}
            </Link>
          </li>
        ) : null}
        {categories.includes("ritual") ? (
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
