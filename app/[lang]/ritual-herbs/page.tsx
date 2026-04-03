import { CategoryHerbsPageContent } from "@/components/CategoryHerbsPageContent";
import {
  alternateLanguageUrls,
  isLocale,
  t,
  type Locale,
} from "@/lib/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: { lang: string } };

const PATH = "/ritual-herbs";

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const alt = alternateLanguageUrls(PATH);
  return {
    title: t(lang, "meta_category_ritual_title"),
    description: t(lang, "meta_category_ritual_desc"),
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

export default function RitualHerbsPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  return (
    <CategoryHerbsPageContent
      lang={lang}
      category="ritual"
      h1Key="category_ritual_h1"
      introKey="category_ritual_intro"
    />
  );
}
