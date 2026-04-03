import { NameResult } from "@/components/NameResult";
import {
  getAllNameUrlSlugsIncludingVariants,
  getCountryOptions,
  getOtherNamesForSamePlant,
  urlSlugToCanonicalSlug,
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
import { countryCodeToUrlSlug, resolveCountryFromQueryParam } from "@/lib/countries";
import { resolvePlantName } from "@/lib/resolver";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

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

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const canonicalSlug = urlSlugToCanonicalSlug(params.slug);
  const path = `/name/${canonicalSlug}`;
  const alt = alternateLanguageUrls(path);

  const result = resolvePlantName(params.slug, undefined, lang);

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
    };
  }

  const nameForMeta =
    result.matches[0]?.name_entry.name ?? slugToDisplayLabel(params.slug);

  return {
    title: ti(lang, "meta_name_match_title", { name: nameForMeta }),
    description: ti(lang, "meta_name_match_desc", { name: nameForMeta }),
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

export default function NamePage({ params, searchParams }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const canonicalSlug = urlSlugToCanonicalSlug(params.slug);
  const countryRaw = searchParams?.country;
  if (typeof countryRaw === "string" && countryRaw.trim()) {
    const code = resolveCountryFromQueryParam(countryRaw);
    if (code) {
      permanentRedirect(
        localePath(
          lang,
          `/name/${canonicalSlug}/${countryCodeToUrlSlug(code)}`
        )
      );
    }
  }

  const result = resolvePlantName(params.slug, undefined, lang);
  const hasMatches = result.matches.length > 0;

  const ambiguity = result.ambiguity;
  const queryLabel =
    result.query.trim() || slugToDisplayLabel(params.slug);
  const countryOptions = getCountryOptions();

  const samePlantClusters = result.plantContexts.map(({ plant }) => ({
    plant: {
      id: plant.id,
      scientific_name: plant.scientific_name,
    },
    links: getOtherNamesForSamePlant(plant.id, canonicalSlug),
  }));

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
