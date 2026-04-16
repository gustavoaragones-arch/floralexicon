import { categoryListingPath } from "@/lib/categories";
import { plantNameHubSlug } from "@/lib/data";
import {
  getNameLinksForCountry,
  getPlantsForCountry,
} from "@/lib/herbLandings";
import { localePath, ti, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const cardClass =
  "group block rounded-2xl border border-stone-200 bg-white/60 px-4 py-3 shadow-sm transition-colors hover:border-flora-forest/35 hover:bg-white dark:border-stone-700 dark:bg-stone-900/40 dark:hover:border-emerald-700/50 dark:hover:bg-stone-900/70";

const chipClass =
  "inline-block rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-sm font-medium text-flora-forest transition-colors hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-900/60 dark:text-emerald-300 dark:hover:border-emerald-600/50";

const MAX_PLANTS = 100;

type Props = {
  lang: Locale;
  countryIso: string;
  countryLabel: string;
};

export function HerbCountryPageContent({
  lang,
  countryIso,
  countryLabel,
}: Props) {
  const plants = getPlantsForCountry(countryIso);
  const listed = plants.slice(0, MAX_PLANTS);
  const nameLinks = getNameLinksForCountry(countryIso, 48);

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
        {ti(lang, "herbs_country_h1", { country: countryLabel })}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-600 dark:text-stone-400">
        {ti(lang, "herbs_country_intro", { country: countryLabel })}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {ti(lang, "herbs_country_intro_seo", { country: countryLabel })}
      </p>

      <nav
        className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-stone-200 pt-6 text-sm dark:border-stone-800"
        aria-label={t(lang, "herbs_country_nav_aria")}
      >
        <Link
          href={localePath(lang, categoryListingPath.medicinal)}
          className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-400"
        >
          {t(lang, "herbs_country_nav_medicinal")}
        </Link>
        <Link
          href={localePath(lang, "/plants")}
          className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-400"
        >
          {t(lang, "herbs_country_nav_plants")}
        </Link>
        <Link
          href={localePath(lang, "/names")}
          className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-400"
        >
          {t(lang, "herbs_country_nav_names")}
        </Link>
      </nav>

      {nameLinks.length > 0 ? (
        <section
          className="mt-10 rounded-2xl border border-stone-200 bg-flora-sage/25 px-5 py-5 dark:border-stone-700 dark:bg-stone-900/40"
          aria-labelledby="herbs-country-names"
        >
          <h2
            id="herbs-country-names"
            className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
          >
            {ti(lang, "herbs_country_names_h2", { country: countryLabel })}
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {t(lang, "herbs_country_names_lead")}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {nameLinks.map(({ slug, label }) => (
              <li key={slug}>
                <Link href={localePath(lang, `/name/${slug}`)} className={chipClass}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12" aria-labelledby="herbs-country-plants">
        <h2
          id="herbs-country-plants"
          className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          {ti(lang, "herbs_country_plants_h2", { country: countryLabel })}
        </h2>
        {plants.length > listed.length ? (
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {ti(lang, "herbs_country_plants_cap", {
              shown: String(listed.length),
              total: String(plants.length),
            })}
          </p>
        ) : null}
        <ul className="mt-6 space-y-3">
          {listed.map((plant) => (
            <li key={plant.id}>
              <Link
                href={`${localePath(lang, `/name/${plantNameHubSlug(plant.id, plant.scientific_name)}`)}?country=${encodeURIComponent(countryIso)}`}
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
          <p className="mt-6 text-sm text-stone-600 dark:text-stone-400">
            {t(lang, "herbs_country_empty")}
          </p>
        ) : null}
      </section>
    </main>
  );
}
