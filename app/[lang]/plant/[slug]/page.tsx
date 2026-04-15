import { PlantAmbiguity } from "@/components/plantDetail/PlantAmbiguity";
import { PlantCriticalSafetyBanner } from "@/components/plantDetail/PlantCriticalSafetyBanner";
import { PlantEvidence } from "@/components/plantDetail/PlantEvidence";
import { PlantFaq } from "@/components/plantDetail/PlantFaq";
import { PlantFactsGrid } from "@/components/plantDetail/PlantFactsGrid";
import { PlantHeader } from "@/components/plantDetail/PlantHeader";
import { PlantPageScope } from "@/components/plantDetail/PlantPageScope";
import { PlantRegions } from "@/components/plantDetail/PlantRegions";
import { PlantSafety } from "@/components/plantDetail/PlantSafety";
import { PlantSourcesFootnote } from "@/components/plantDetail/PlantSourcesFootnote";
import { PlantUses } from "@/components/plantDetail/PlantUses";
import { RelatedPlants } from "@/components/plantDetail/RelatedPlants";
import { PlantExploreSection } from "@/components/PlantExploreSection";
import { loadPlants } from "@/lib/data";
import { clipForMetaDescription, humanToxicityBand, humanUseLabel } from "@/lib/plantHumanLabels";
import { topTwoThemesForHeader } from "@/lib/plantIntroCopy";
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

  const model = buildPlantDetailModel(plant);
  const topTwo = topTwoThemesForHeader(model, lang);
  const usesShort =
    topTwo.join(" · ") ||
    plant.primary_uses
      .slice(0, 2)
      .map((u) => humanUseLabel(u.trim(), lang))
      .filter(Boolean)
      .join(" · ") ||
    t(lang, "plant_detail_value_not_listed");
  const safety = model.merged?.toxicity?.level
    ? humanToxicityBand(model.merged.toxicity.level, lang)
    : t(lang, "plant_detail_tox_unknown");

  const description = clipForMetaDescription(
    ti(lang, "plant_detail_meta_desc_v2", { uses: usesShort, safety }),
    155
  );

  return {
    title: ti(lang, "plant_detail_meta_title_v2", { name: plant.scientific_name }),
    description,
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

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <PlantCriticalSafetyBanner lang={lang} model={model} />
      <PlantHeader lang={lang} model={model} />
      <PlantPageScope lang={lang} />
      <PlantFactsGrid lang={lang} model={model} />
      <PlantUses lang={lang} model={model} />
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
