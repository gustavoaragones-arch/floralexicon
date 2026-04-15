import { PlantAmbiguity } from "@/components/plantDetail/PlantAmbiguity";
import { PlantCriticalSafetyBanner } from "@/components/plantDetail/PlantCriticalSafetyBanner";
import { PlantEvidence } from "@/components/plantDetail/PlantEvidence";
import { PlantFaq } from "@/components/plantDetail/PlantFaq";
import { PlantFactsGrid } from "@/components/plantDetail/PlantFactsGrid";
import { PlantHeader } from "@/components/plantDetail/PlantHeader";
import { PlantHerbNamesByCountrySection } from "@/components/plantDetail/PlantHerbNamesByCountrySection";
import { PlantPageScope } from "@/components/plantDetail/PlantPageScope";
import { PlantRegions } from "@/components/plantDetail/PlantRegions";
import { PlantSimilarUsesSection } from "@/components/plantDetail/PlantSimilarUsesSection";
import { PlantSafety } from "@/components/plantDetail/PlantSafety";
import { PlantSourcesFootnote } from "@/components/plantDetail/PlantSourcesFootnote";
import { PlantUses } from "@/components/plantDetail/PlantUses";
import { RelatedPlants } from "@/components/plantDetail/RelatedPlants";
import { PlantExploreSection } from "@/components/PlantExploreSection";
import {
  getAlsoKnownAsLinks,
  getNamesGroupedByCountryForPlant,
  getPlantsSharingPrimaryUses,
  loadPlants,
} from "@/lib/data";
import {
  buildPlantDetailModel,
  getAmbiguityHubsForPlant,
  getSmartRelatedPlants,
} from "@/lib/plantDetailQueries";
import {
  alternateLanguageUrls,
  isLocale,
  locales,
  ti,
  t,
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
    title: ti(lang, "plant_detail_meta_title_positioning", {
      name: plant.scientific_name,
    }),
    description: ti(lang, "plant_detail_meta_desc_positioning", {
      name: plant.scientific_name,
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

  const model = buildPlantDetailModel(plant);
  const ambiguityHubs = getAmbiguityHubsForPlant(plant.id);
  const related = getSmartRelatedPlants(plant, model, 6);
  const publicName = model.displayNames[0] ?? plant.scientific_name;
  const otherNameLinks = getAlsoKnownAsLinks(plant.id);
  const similarByUses = getPlantsSharingPrimaryUses(plant, 14);
  const namesByCountry = getNamesGroupedByCountryForPlant(plant.id);

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <PlantCriticalSafetyBanner lang={lang} model={model} />
      <PlantHeader lang={lang} model={model} alsoKnownLinks={otherNameLinks} />
      <PlantHerbNamesByCountrySection lang={lang} groups={namesByCountry} />
      <PlantPageScope lang={lang} />
      <PlantFactsGrid lang={lang} model={model} />
      <PlantUses lang={lang} model={model} />
      <PlantSimilarUsesSection lang={lang} plant={plant} similar={similarByUses} />
      <PlantSafety lang={lang} model={model} />
      <PlantEvidence lang={lang} model={model} />
      <PlantRegions lang={lang} model={model} />
      <PlantAmbiguity lang={lang} hubs={ambiguityHubs} />
      <RelatedPlants lang={lang} related={related} />
      <PlantFaq lang={lang} model={model} publicName={publicName} />
      <PlantSourcesFootnote lang={lang} />
      <PlantExploreSection lang={lang} plant={plant} />
    </main>
  );
}
