import { AlphabetJumpNav } from "@/components/AlphabetJumpNav";
import { BackToTopButton } from "@/components/BackToTopButton";
import { buildLetterGroups, sortedGroupKeys } from "@/lib/alphabetIndex";
import { loadPlants, plantNameHubSlug } from "@/lib/data";
import {
  alternateLanguageUrls,
  isLocale,
  localePath,
  t,
  type Locale,
} from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const alt = alternateLanguageUrls("/plants");
  return {
    title: t(lang, "meta_plants_title"),
    description: t(lang, "meta_plants_desc"),
    alternates: {
      canonical: lang === "es" ? alt.es : alt.en,
      languages: {
        en: alt.en,
        es: alt.es,
        "x-default": alt.xDefault,
      },
    },
  };
}

export default function PlantsIndexPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const plants = [...loadPlants()].sort((a, b) =>
    a.scientific_name.localeCompare(b.scientific_name)
  );
  const groups = buildLetterGroups(plants, (plant) => plant.scientific_name);
  const letters = sortedGroupKeys(groups);

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
        {t(lang, "plants_index_h1")}
      </h1>
      <p className="mt-3 max-w-2xl text-stone-600 dark:text-stone-400">
        {t(lang, "plants_index_lead")}
      </p>

      <AlphabetJumpNav
        letters={letters}
        otherLabel={t(lang, "plants_index_other")}
        idPrefix="plants-letter"
      />

      <div className="mt-12 space-y-10">
        {letters.map((letter) => (
          <section
            key={letter}
            aria-labelledby={`plants-letter-${letter === "#" ? "other" : letter}`}
          >
            <h2
              id={`plants-letter-${letter === "#" ? "other" : letter}`}
              className="scroll-mt-28 font-serif text-2xl font-semibold tracking-tight text-flora-forest dark:text-emerald-300"
            >
              {letter === "#" ? t(lang, "plants_index_other") : letter}
            </h2>
            <ul className="mt-4 space-y-3">
              {(groups.get(letter) ?? []).map((plant) => (
                <li key={plant.id}>
                  <Link
                    href={localePath(
                      lang,
                      `/name/${plantNameHubSlug(plant.id, plant.scientific_name)}`
                    )}
                    className="group block rounded-2xl border border-stone-200 bg-white/60 px-4 py-3 shadow-sm transition-colors hover:border-flora-forest/35 hover:bg-white dark:border-stone-700 dark:bg-stone-900/40 dark:hover:border-emerald-700/50 dark:hover:bg-stone-900/70"
                  >
                    <span className="font-medium text-stone-900 group-hover:underline dark:text-stone-100">
                      {plant.scientific_name}
                    </span>
                    <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">
                      {plant.family} · {plant.plant_type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <BackToTopButton label={t(lang, "back_to_top")} />
    </main>
  );
}
