import { PlantPairCompare } from "@/components/PlantPairCompare";
import { getAllComparisonPairSlugs, parseComparisonPair } from "@/lib/comparisons";
import { getPlantById } from "@/lib/data";
import {
  alternateLanguageUrls,
  isLocale,
  locales,
  ti,
  type Locale,
} from "@/lib/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: { lang: string; pair: string } };

export async function generateStaticParams() {
  const pairs = getAllComparisonPairSlugs();
  return locales.flatMap((lang) => pairs.map((pair) => ({ lang, pair })));
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const parsed = parseComparisonPair(params.pair);
  const path = `/compare/${params.pair}`;
  const alt = alternateLanguageUrls(path);

  if (!parsed) {
    return {
      alternates: {
        canonical: lang === "es" ? alt.es : alt.en,
        languages: { en: alt.en, es: alt.es, "x-default": alt.xDefault },
      },
    };
  }

  const [idA, idB] = parsed;
  const a = getPlantById(idA);
  const b = getPlantById(idB);
  if (!a || !b) {
    return {
      alternates: {
        canonical: lang === "es" ? alt.es : alt.en,
        languages: { en: alt.en, es: alt.es, "x-default": alt.xDefault },
      },
    };
  }

  return {
    title: ti(lang, "compare_meta_title", {
      a: a.scientific_name,
      b: b.scientific_name,
    }),
    description: ti(lang, "compare_meta_desc", {
      a: a.scientific_name,
      b: b.scientific_name,
    }),
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

export default function ComparePage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const parsed = parseComparisonPair(params.pair);
  if (!parsed) notFound();
  const [idA, idB] = parsed;
  const plantA = getPlantById(idA);
  const plantB = getPlantById(idB);
  if (!plantA || !plantB) notFound();

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-3xl md:text-4xl">
        {ti(lang, "compare_h1", {
          a: plantA.scientific_name,
          b: plantB.scientific_name,
        })}
      </h1>
      <PlantPairCompare lang={lang} plantA={plantA} plantB={plantB} />
    </main>
  );
}
