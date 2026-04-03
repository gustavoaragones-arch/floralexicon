import { filterPlantsByCategory, type PlantCategory } from "@/lib/categories";
import { getTopNameLinksForCategory } from "@/lib/categoryNames";
import { loadPlants } from "@/lib/data";
import { localePath, t, type I18nKey, type Locale } from "@/lib/i18n";
import Link from "next/link";

const cardClass =
  "group block rounded-2xl border border-stone-200 bg-white/60 px-4 py-3 shadow-sm transition-colors hover:border-flora-forest/35 hover:bg-white dark:border-stone-700 dark:bg-stone-900/40 dark:hover:border-emerald-700/50 dark:hover:bg-stone-900/70";

type CategoryHerbsPageContentProps = {
  lang: Locale;
  category: PlantCategory;
  h1Key: I18nKey;
  introKey: I18nKey;
};

export function CategoryHerbsPageContent({
  lang,
  category,
  h1Key,
  introKey,
}: CategoryHerbsPageContentProps) {
  const plants = filterPlantsByCategory(loadPlants(), category).sort((a, b) =>
    a.scientific_name.localeCompare(b.scientific_name)
  );
  const topNames = getTopNameLinksForCategory(category);

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
        {t(lang, h1Key)}
      </h1>
      <p className="mt-4 max-w-2xl text-stone-600 dark:text-stone-400 leading-relaxed">
        {t(lang, introKey)}
      </p>

      {topNames.length > 0 ? (
        <section
          className="mt-10 rounded-2xl border border-stone-200 bg-flora-sage/25 px-5 py-5 dark:border-stone-700 dark:bg-stone-900/40"
          aria-labelledby="category-top-names"
        >
          <h2
            id="category-top-names"
            className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
          >
            {t(lang, "category_top_names_heading")}
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {t(lang, "category_top_names_lead")}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {topNames.map(({ slug, label }) => (
              <li key={slug}>
                <Link
                  href={localePath(lang, `/name/${slug}`)}
                  className="inline-block rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-sm font-medium text-flora-forest transition-colors hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-900/60 dark:text-emerald-300 dark:hover:border-emerald-600/50"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ul className="mt-12 space-y-3">
        {plants.map((plant) => (
          <li key={plant.id}>
            <Link
              href={localePath(lang, `/plant/${plant.id}`)}
              className={cardClass}
            >
              <span className="font-medium text-stone-900 group-hover:underline dark:text-stone-100">
                {plant.scientific_name}
              </span>
              <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">
                {t(lang, "family")} {plant.family}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {plants.length === 0 ? (
        <p className="mt-10 text-sm text-stone-600 dark:text-stone-400">
          {t(lang, "category_empty_list")}
        </p>
      ) : null}
    </main>
  );
}
