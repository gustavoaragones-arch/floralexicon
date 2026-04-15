import { HerbCountryPageContent } from "@/components/HerbCountryPageContent";
import {
  alternateLanguageUrls,
  isLocale,
  ti,
  type Locale,
} from "@/lib/i18n";
import { generateHerbCountryStaticParams } from "@/lib/herbLandings";
import { getCountryDisplayName, urlSlugToCountryCode } from "@/lib/countries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: { lang: string; country: string } };

export function generateStaticParams() {
  return generateHerbCountryStaticParams();
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const iso = urlSlugToCountryCode(params.country);
  if (!iso) return {};
  const countryLabel = getCountryDisplayName(iso, lang);
  const path = `/herbs/${params.country}`;
  const alt = alternateLanguageUrls(path);

  return {
    title: ti(lang, "meta_herbs_country_title", { country: countryLabel }),
    description: ti(lang, "meta_herbs_country_desc", { country: countryLabel }),
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

export default function HerbCountryPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const iso = urlSlugToCountryCode(params.country);
  if (!iso) notFound();

  const countryLabel = getCountryDisplayName(iso, lang);

  return (
    <HerbCountryPageContent
      lang={lang}
      countryIso={iso}
      countryLabel={countryLabel}
    />
  );
}
