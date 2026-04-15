import { filterPlantsByCategory, type PlantCategory } from "@/lib/categories";
import { getTopNameLinksForCategory } from "@/lib/categoryNames";
import { countryCodeToUrlSlug, getCountryDisplayName } from "@/lib/countries";
import { getCountryCodesWithIndexedPlants } from "@/lib/herbLandings";
import { loadPlants } from "@/lib/data";
import { localePath, t, ti, type I18nKey, type Locale } from "@/lib/i18n";
import Link from "next/link";

const cardClass =
  "group block rounded-2xl border border-stone-200 bg-white/60 px-4 py-3 shadow-sm transition-colors hover:border-flora-forest/35 hover:bg-white dark:border-stone-700 dark:bg-stone-900/40 dark:hover:border-emerald-700/50 dark:hover:bg-stone-900/70";

const chipClass =
  "inline-block rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-sm font-medium text-flora-forest transition-colors hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-900/60 dark:text-emerald-300 dark:hover:border-emerald-600/50";

type CategoryHerbsPageContentProps = {
  lang: Locale;
  category: PlantCategory;
  h1Key: I18nKey;
  introKey: I18nKey;
  /** Optional second SEO paragraph (e.g. medicinal hub). */
  introSecondaryKey?: I18nKey;
  /** Cap plant cards (default: no cap). */
  maxPlants?: number;
  /** Cap name hub chips from category filter. */
  nameLinkLimit?: number;
  /** Show links to `/herbs/[country]` for indexed geos (medicinal hub). */
  showCountryHubLinks?: boolean;
};

export function CategoryHerbsPageContent({
  lang,
  category,
  h1Key,
  introKey,
  introSecondaryKey,
  maxPlants = 100,
  nameLinkLimit = 36,
  showCountryHubLinks = false,
}: CategoryHerbsPageContentProps) {
  const plants = filterPlantsByCategory(loadPlants(), category).sort((a, b) =>
    a.scientific_name.localeCompare(b.scientific_name, "en")
  );
  const listed = plants.slice(0, maxPlants);
  const topNames = getTopNameLinksForCategory(category, nameLinkLimit);

  const countryLinks = showCountryHubLinks
    ? [...getCountryCodesWithIndexedPlants()].sort((a, b) =>
        getCountryDisplayName(a, lang).localeCompare(
          getCountryDisplayName(b, lang),
          lang === "es" ? "es" : "en"
        )
      )
    : [];

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
        {t(lang, h1Key)}
      </h1>
      <p className="mt-4 max-w-2xl text-stone-600 dark:text-stone-400 leading-relaxed">
        {t(lang, introKey)}
      </p>
      {introSecondaryKey ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {t(lang, introSecondaryKey)}
        </p>
      ) : null}

      {showCountryHubLinks && countryLinks.length > 0 ? (
        <section
          className="mt-10 rounded-2xl border border-stone-200 bg-stone-50/70 px-5 py-5 dark:border-stone-700 dark:bg-stone-900/45"
          aria-labelledby="category-country-hubs"
        >
          <h2
            id="category-country-hubs"
            className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
          >
            {t(lang, "category_medicinal_country_heading")}
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {t(lang, "category_medicinal_country_lead")}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {countryLinks.map((iso) => (
              <li key={iso}>
                <Link
                  href={localePath(lang, `/herbs/${countryCodeToUrlSlug(iso)}`)}
                  className={chipClass}
                >
                  {getCountryDisplayName(iso, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
                  className={chipClass}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12" aria-labelledby="category-plant-list">
        <h2
          id="category-plant-list"
          className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          {t(lang, "category_plant_list_h2")}
        </h2>
        {plants.length > listed.length ? (
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {ti(lang, "category_plant_list_truncated", {
              shown: String(listed.length),
              total: String(plants.length),
            })}
          </p>
        ) : null}
        <ul className="mt-6 space-y-3">
          {listed.map((plant) => (
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
      </section>

      {plants.length === 0 ? (
        <p className="mt-10 text-sm text-stone-600 dark:text-stone-400">
          {t(lang, "category_empty_list")}
        </p>
      ) : null}

      <nav
        className="mt-12 border-t border-stone-200 pt-8 text-sm dark:border-stone-800"
        aria-label={t(lang, "category_footer_nav_aria")}
      >
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <Link
              href={localePath(lang, "/plants")}
              className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-400"
            >
              {t(lang, "herbs_country_nav_plants")}
            </Link>
          </li>
          <li>
            <Link
              href={localePath(lang, "/names")}
              className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-400"
            >
              {t(lang, "herbs_country_nav_names")}
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
