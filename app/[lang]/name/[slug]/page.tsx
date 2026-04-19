import { NameResult } from "@/components/NameResult";
import {
  getAllNameUrlSlugsIncludingVariants,
  getCountryOptions,
  getPlantGlobalData,
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
import {
  getCountryDisplayName,
  resolveCountryFromQueryParam,
} from "@/lib/countries";
import { resolvePlantName } from "@/lib/resolver";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: { lang: string; slug: string };
  searchParams?: { country?: string };
};

function slugToDisplayLabel(slug: string): string {
  if (!slug) return "";
  const label = slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .trim();
  return label || slug;
}

export async function generateStaticParams() {
  const slugs = getAllNameUrlSlugsIncludingVariants();
  return locales.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export function generateMetadata({ params, searchParams }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const canonicalSlug = urlSlugToCanonicalSlug(params.slug);
  const path = `/name/${canonicalSlug}`;
  const alt = alternateLanguageUrls(path);

  const countryRaw = searchParams?.country;
  const countryFromQuery =
    typeof countryRaw === "string" && countryRaw.trim()
      ? resolveCountryFromQueryParam(countryRaw.trim()) ?? null
      : null;

  const result = resolvePlantName(
    params.slug,
    countryFromQuery ?? undefined,
    lang
  );

  if (!result.matches.length) {
    return {
      title: t(lang, "meta_name_missing_title"),
      description: t(lang, "meta_name_missing_desc"),
      alternates: {
        canonical: lang === "es" ? alt.es : alt.en,
        languages: {
          en: alt.en,
          es: alt.es,
          "x-default": alt.xDefault,
        },
      },
      openGraph: {
        url: `${SITE_URL}/${lang}/name/${canonicalSlug}`,
        siteName: "FloraLexicon",
      },
    };
  }

  const nameForMeta =
    result.matches[0]?.name_entry.name ?? slugToDisplayLabel(params.slug);

  const countryLabel =
    countryFromQuery != null
      ? getCountryDisplayName(countryFromQuery, lang)
      : null;

  const title =
    countryLabel != null
      ? ti(lang, "meta_name_country_title", {
          name: nameForMeta,
          country: countryLabel,
        })
      : ti(lang, "meta_name_match_title", { name: nameForMeta });

  const description =
    countryLabel != null
      ? ti(lang, "meta_name_country_desc", {
          name: nameForMeta,
          country: countryLabel,
        })
      : ti(lang, "meta_name_match_desc", { name: nameForMeta });

  return {
    title,
    description,
    alternates: {
      canonical: lang === "es" ? alt.es : alt.en,
      languages: {
        en: alt.en,
        es: alt.es,
        "x-default": alt.xDefault,
      },
    },
    openGraph: {
      url: `${SITE_URL}/${lang}/name/${canonicalSlug}`,
      siteName: "FloraLexicon",
    },
  };
}

export default function NamePage({ params, searchParams }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const canonicalSlug = urlSlugToCanonicalSlug(params.slug);
  const countryRaw = searchParams?.country;
  const countryFromQuery =
    typeof countryRaw === "string" && countryRaw.trim()
      ? resolveCountryFromQueryParam(countryRaw.trim()) ?? null
      : null;

  const result = resolvePlantName(
    params.slug,
    countryFromQuery ?? undefined,
    lang
  );
  const hasMatches = result.matches.length > 0;

  const ambiguity = result.ambiguity;
  const queryLabel =
    result.query.trim() || slugToDisplayLabel(params.slug);
  const countryOptions = getCountryOptions();

  const samePlantClusters = result.plantContexts.map(
    ({ plant, plant_id: plantId }) => {
      const { names: globalForPlant } = getPlantGlobalData(plantId, {
        pageNameSlug: canonicalSlug,
        queryDisplay: queryLabel,
      });
      const pageCanon = urlSlugToCanonicalSlug(canonicalSlug);
      const links = globalForPlant.filter(
        (l) => urlSlugToCanonicalSlug(l.slug) !== pageCanon
      );
      return {
        plant: {
          id: plantId,
          scientific_name:
            plant?.scientific_name?.trim() ||
            t(lang, "plant_placeholder_title"),
        },
        links,
      };
    }
  );

  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: queryLabel,
    description: t(lang, "defined_term_desc"),
    url: `${SITE_URL}/${lang}/name/${canonicalSlug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermJsonLd) }}
      />
      <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
        <NameResult
          lang={lang}
          query={queryLabel}
          normalized={result.normalized}
          ambiguity={ambiguity}
          plantContexts={result.plantContexts}
          matches={result.matches}
          nameSlug={canonicalSlug}
          selectedCountry={countryFromQuery ?? undefined}
          countryOptions={countryOptions}
          hasMatches={hasMatches}
          samePlantClusters={samePlantClusters}
          variantNotice={
            params.slug !== canonicalSlug
              ? {
                  variant: slugToDisplayLabel(params.slug),
                  canonical: slugToDisplayLabel(canonicalSlug),
                }
              : undefined
          }
        />
      </main>
    </>
  );
}
