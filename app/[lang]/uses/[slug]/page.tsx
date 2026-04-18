import {
  getPlantsWithStructuredUseSlug,
  plantNameHubSlug,
} from "@/lib/data";
import {
  alternateLanguageUrls,
  isLocale,
  localePath,
  locales,
  ti,
  t,
  type Locale,
} from "@/lib/i18n";
import { formatStructuredUseTagDisplay } from "@/lib/nameHubDisplay";
import {
  canonicalTagFromUseSlug,
  getAllUseTaxonomySlugs,
} from "@/lib/usePaths";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { lang: string; slug: string } };

export function generateStaticParams() {
  const slugs = getAllUseTaxonomySlugs();
  return locales.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const tag = canonicalTagFromUseSlug(params.slug);
  const path = `/uses/${params.slug}`;
  const alt = alternateLanguageUrls(path);
  if (!tag) {
    return {
      title: t(lang, "meta_plant_not_found_title"),
      alternates: {
        canonical: lang === "es" ? alt.es : alt.en,
        languages: { en: alt.en, es: alt.es, "x-default": alt.xDefault },
      },
    };
  }
  const label = formatStructuredUseTagDisplay(lang, tag);
  return {
    title: ti(lang, "uses_page_meta_title", { tag: label }),
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

export default function UseTaxonomyPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const tag = canonicalTagFromUseSlug(params.slug);
  if (!tag) notFound();

  const plants = getPlantsWithStructuredUseSlug(params.slug);
  const label = formatStructuredUseTagDisplay(lang, tag);

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <h1 className="font-serif text-2xl font-semibold text-stone-900 dark:text-stone-100 sm:text-3xl">
        {ti(lang, "uses_page_h1", { tag: label })}
      </h1>
      <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
        {t(lang, "uses_page_intro")}
      </p>
      {plants.length === 0 ? (
        <p className="mt-8 text-sm text-stone-600 dark:text-stone-400">
          {t(lang, "uses_page_none")}
        </p>
      ) : (
        <ul className="mt-8 list-disc space-y-2 pl-6 text-stone-800 dark:text-stone-200">
          {plants.map((p) => (
            <li key={p.id}>
              <Link
                href={localePath(
                  lang,
                  `/plant/${plantNameHubSlug(p.id, p.scientific_name)}`
                )}
                className="text-flora-forest underline dark:text-emerald-300"
              >
                {p.scientific_name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
