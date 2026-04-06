import { ConceptCard } from "@/components/concepts/ConceptCard";
import {
  getAllConcepts,
  getCoreConcepts,
  localizeConcept,
} from "@/lib/concepts";
import {
  alternateLanguageUrls,
  isLocale,
  localePath,
  locales,
  t,
  type Locale,
} from "@/lib/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: { lang: string } };

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const alt = alternateLanguageUrls("/concepts");
  return {
    title: t(lang, "concepts_meta_index_title"),
    description: t(lang, "concepts_meta_index_desc"),
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

export default function ConceptsIndexPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const core = getCoreConcepts().map((s) => localizeConcept(s, lang));
  const nonCore = getAllConcepts()
    .filter((c) => !c.core)
    .map((s) => localizeConcept(s, lang))
    .sort((a, b) =>
      a.title.localeCompare(b.title, lang === "es" ? "es" : "en", {
        sensitivity: "base",
      })
    );

  const leadClass = "mt-4 max-w-2xl text-stone-600 dark:text-stone-400";
  const h2Class =
    "font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100";

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14 sm:py-18">
      <header className="border-b border-stone-200 pb-12 dark:border-stone-800">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
          {t(lang, "concepts_hero_h1")}
        </h1>
        <p className={leadClass}>{t(lang, "concepts_hero_lead")}</p>
      </header>

      <section className="mt-12">
        <h2 className={h2Class}>{t(lang, "concepts_core_heading")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {core.map((c) => (
            <ConceptCard
              key={c.slug}
              lang={lang}
              href={localePath(lang, `/concepts/${c.slug}`)}
              title={c.title}
              definition={c.definition}
              core
            />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className={h2Class}>{t(lang, "concepts_all_heading")}</h2>
        <ul className="mt-6 space-y-3">
          {nonCore.map((c) => (
            <li key={c.slug}>
              <ConceptCard
                lang={lang}
                href={localePath(lang, `/concepts/${c.slug}`)}
                title={c.title}
                definition={c.definition}
                compact
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
