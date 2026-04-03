import { NameLinkListSection } from "@/components/NameLinkListSection";
import { PlantExploreSection } from "@/components/PlantExploreSection";
import { PlantCard } from "@/components/PlantCard";
import { PlantCategoriesBlock } from "@/components/PlantCategoriesBlock";
import { PlantProgrammaticSeoBlocks } from "@/components/PlantProgrammaticSeoBlocks";
import { getAlsoKnownAsLinks, loadNames, loadPlants } from "@/lib/data";
import { getPlantCountryCodesSorted } from "@/lib/geo";
import {
  alternateLanguageUrls,
  isLocale,
  locales,
  t,
  ti,
  type Locale,
} from "@/lib/i18n";
import { getPlantByRouteId } from "@/lib/resolver";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: { lang: string; slug: string } };

export async function generateStaticParams() {
  const plants = loadPlants();
  return locales.flatMap((lang) =>
    plants.map((p) => ({ lang, slug: p.id }))
  );
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const plant = getPlantByRouteId(params.slug);
  const path = `/plant/${params.slug}`;
  const alt = alternateLanguageUrls(path);

  if (!plant) {
    return {
      title: t(lang, "meta_plant_not_found_title"),
      alternates: {
        canonical: lang === "es" ? alt.es : alt.en,
        languages: { en: alt.en, es: alt.es, "x-default": alt.xDefault },
      },
    };
  }

  return {
    title: plant.scientific_name,
    description: ti(lang, "meta_plant_desc", {
      name: plant.scientific_name,
      family: plant.family,
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

export default function PlantPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const { slug } = params;
  const plant = getPlantByRouteId(slug);
  if (!plant) notFound();

  const alsoKnownAs = getAlsoKnownAsLinks(plant.id);
  const commonCountries = getPlantCountryCodesSorted(
    plant.id,
    loadNames(),
    lang
  );

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <PlantCard
        lang={lang}
        plant={plant}
        variant="full"
        headingLevel="h1"
        showLink={false}
        commonCountries={commonCountries}
      />
      <PlantCategoriesBlock lang={lang} plant={plant} />
      <PlantProgrammaticSeoBlocks lang={lang} plant={plant} />
      <NameLinkListSection
        lang={lang}
        id="also-known-as-heading"
        title={t(lang, "also_known_as")}
        links={alsoKnownAs}
      />
      <PlantExploreSection lang={lang} plant={plant} />
    </main>
  );
}
