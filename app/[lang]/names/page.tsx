import { AlphabetJumpNav } from "@/components/AlphabetJumpNav";
import { BackToTopButton } from "@/components/BackToTopButton";
import { buildLetterGroups, sortedGroupKeys } from "@/lib/alphabetIndex";
import { getAllNameUrlSlugsIncludingVariants } from "@/lib/data";
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
  const alt = alternateLanguageUrls("/names");
  return {
    title: t(lang, "meta_names_title"),
    description: t(lang, "meta_names_desc"),
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

function slugToLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const linkClass =
  "text-stone-800 underline decoration-stone-300 underline-offset-2 hover:text-flora-forest hover:decoration-flora-forest dark:text-stone-200 dark:hover:text-emerald-300 dark:hover:decoration-emerald-400";

export default function NamesIndexPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const slugs = [...getAllNameUrlSlugsIncludingVariants()].sort((a, b) =>
    slugToLabel(a).localeCompare(slugToLabel(b), "en", { sensitivity: "base" })
  );
  const groups = buildLetterGroups(slugs, slugToLabel);
  const letters = sortedGroupKeys(groups);

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
        {t(lang, "names_index_h1")}
      </h1>
      <p className="mt-3 max-w-2xl text-stone-600 dark:text-stone-400">
        {t(lang, "names_index_lead")}
      </p>

      <AlphabetJumpNav
        letters={letters}
        otherLabel={t(lang, "names_index_other")}
        idPrefix="names-letter"
      />

      <div className="mt-12 space-y-10">
        {letters.map((letter) => (
          <section
            key={letter}
            aria-labelledby={`names-letter-${letter === "#" ? "other" : letter}`}
          >
            <h2
              id={`names-letter-${letter === "#" ? "other" : letter}`}
              className="scroll-mt-28 font-serif text-2xl font-semibold tracking-tight text-flora-forest dark:text-emerald-300"
            >
              {letter === "#" ? t(lang, "names_index_other") : letter}
            </h2>
            <ul className="mt-4 list-disc space-y-1.5 pl-6 text-stone-700 dark:text-stone-300">
              {(groups.get(letter) ?? []).map((slug) => (
                <li key={slug}>
                  <Link
                    href={localePath(lang, `/name/${encodeURIComponent(slug)}`)}
                    className={linkClass}
                  >
                    {slugToLabel(slug).toLowerCase()}
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
