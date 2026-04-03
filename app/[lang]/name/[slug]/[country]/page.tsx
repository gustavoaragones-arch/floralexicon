import { NameCountryHub } from "@/components/NameCountryHub";
import { getCountryDisplayName, urlSlugToCountryCode } from "@/lib/countries";
import {
  getCountryOptions,
  getNameCountryStaticParams,
  urlSlugToCanonicalSlug,
} from "@/lib/data";
import {
  alternateLanguageUrls,
  isLocale,
  locales,
  ti,
  t,
  type Locale,
} from "@/lib/i18n";
import { resolvePlantNameForCountryRoute } from "@/lib/resolver";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: { lang: string; slug: string; country: string };
};

function slugToDisplayLabel(slug: string): string {
  if (!slug) return "";
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .trim() || slug;
}

export async function generateStaticParams() {
  const pairs = getNameCountryStaticParams();
  return locales.flatMap((lang) =>
    pairs.map(({ slug, country }) => ({ lang, slug, country }))
  );
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const countryCode = urlSlugToCountryCode(params.country);
  if (!countryCode) return {};

  const canonicalSlug = urlSlugToCanonicalSlug(params.slug);
  const path = `/name/${canonicalSlug}/${params.country}`;
  const alt = alternateLanguageUrls(path);

  const result = resolvePlantNameForCountryRoute(
    params.slug,
    countryCode,
    lang
  );
  if (!result) {
    return {
      title: t(lang, "meta_name_missing_title"),
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

  const nameForMeta =
    result.matches[0]?.name_entry.name ?? slugToDisplayLabel(params.slug);
  const countryLabel = getCountryDisplayName(countryCode, lang);

  return {
    title: ti(lang, "meta_name_country_title", {
      name: nameForMeta,
      country: countryLabel,
    }),
    description: ti(lang, "meta_name_country_desc", {
      name: nameForMeta,
      country: countryLabel,
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

export default function NameCountryPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const countryCode = urlSlugToCountryCode(params.country);
  if (!countryCode) notFound();

  const canonicalSlug = urlSlugToCanonicalSlug(params.slug);
  const result = resolvePlantNameForCountryRoute(
    params.slug,
    countryCode,
    lang
  );
  if (!result) notFound();

  const countryLabel = getCountryDisplayName(countryCode, lang);
  const queryLabel =
    result.query.trim() || slugToDisplayLabel(params.slug);
  const countryOptions = (() => {
    const base = getCountryOptions();
    if (!base.includes(countryCode)) {
      return [...base, countryCode].sort();
    }
    return base;
  })();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: ti(lang, "meta_name_country_title", {
      name: queryLabel,
      country: countryLabel,
    }),
    url: `${SITE_URL}/${lang}/name/${canonicalSlug}/${params.country}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
        <NameCountryHub
          lang={lang}
          displayName={queryLabel}
          countryLabel={countryLabel}
          countryCode={countryCode}
          nameCanonicalSlug={canonicalSlug}
          countryOptions={countryOptions}
          plantContexts={result.plantContexts}
          matches={result.matches}
        />
      </main>
    </>
  );
}
