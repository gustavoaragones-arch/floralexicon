import { ConceptPage } from "@/components/concepts/ConceptPage";
import { getAllConcepts, getConceptBySlug, localizeConcept } from "@/lib/concepts";
import {
  alternateLanguageUrls,
  isLocale,
  locales,
  t,
  type Locale,
} from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: { lang: string; slug: string } };

export function generateStaticParams() {
  const slugs = getAllConcepts().map((c) => c.slug);
  return locales.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const source = getConceptBySlug(params.slug);
  if (!source) return {};
  const lang = params.lang as Locale;
  const { seo } = localizeConcept(source, lang);
  const path = `/concepts/${source.slug}`;
  const alt = alternateLanguageUrls(path);
  const canonical = (lang === "es" ? alt.es : alt.en) as string;
  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical,
      languages: {
        en: alt.en,
        es: alt.es,
        "x-default": alt.xDefault,
      },
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonical,
    },
  };
}

export default function ConceptDetailPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const source = getConceptBySlug(params.slug);
  if (!source) notFound();
  const concept = localizeConcept(source, lang);

  const path = `/concepts/${source.slug}`;
  const alt = alternateLanguageUrls(path);
  const canonicalUrl = (lang === "es" ? alt.es : alt.en) as string;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: concept.seo.title,
    description: concept.seo.description,
    about: { "@type": "Thing", name: t(lang, "concepts_jsonld_about") },
    inLanguage: lang,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "FloraLexicon",
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <ConceptPage lang={lang} concept={concept} />
    </>
  );
}
