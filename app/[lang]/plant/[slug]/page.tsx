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
  loadNames,
  loadPlants,
  plantNameHubSlug,
} from "@/lib/data";
import { getPlantCountryCodesSorted } from "@/lib/geo";
import { joinCountryNames } from "@/lib/countries";
import {
  buildPlantDetailModel,
  getAmbiguityHubsForPlant,
  getSmartRelatedPlants,
} from "@/lib/plantDetailQueries";
import {
  alternateLanguageUrls,
  isLocale,
  localePath,
  locales,
  ti,
  t,
  type Locale,
} from "@/lib/i18n";
import { getPlantByRouteId } from "@/lib/resolver";
import type { Metadata } from "next";
import Link from "next/link";
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

  if (plant.isGhost) {
    const names = loadNames();
    const countriesOrdered = getPlantCountryCodesSorted(plant.id, names, lang);
    const otherNameLinks = getAlsoKnownAsLinks(plant.id);
    const nameHubHref = localePath(
      lang,
      `/name/${plantNameHubSlug(plant.id, plant.scientific_name)}`
    );

    return (
      <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
        <p className="mb-6 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          {t(lang, "plant_ghost_mapping_note")}
        </p>
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="font-serif text-3xl font-semibold italic tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
            {plant.scientific_name}
          </h1>
          <span className="inline-flex shrink-0 items-center rounded-md border border-violet-400/40 bg-violet-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-950 dark:border-violet-500/35 dark:bg-violet-950/40 dark:text-violet-100">
            {t(lang, "plant_limited_data_badge")}
          </span>
        </div>
        {countriesOrdered.length > 0 ? (
          <p className="mt-6 text-sm text-stone-700 dark:text-stone-300">
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {t(lang, "plant_detail_common_in_label")}{" "}
            </span>
            {joinCountryNames(countriesOrdered, lang)}
          </p>
        ) : null}
        {otherNameLinks.length > 0 ? (
          <div className="mt-6 text-sm text-stone-700 dark:text-stone-300">
            <p className="font-semibold text-stone-800 dark:text-stone-200">
              {t(lang, "plant_detail_also_known")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {otherNameLinks.map(({ slug, label }) => (
                <li key={slug}>
                  <Link
                    href={localePath(lang, `/name/${slug}`)}
                    className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="mt-10 text-sm text-stone-600 dark:text-stone-400">
          <Link
            href={nameHubHref}
            className="font-semibold text-flora-forest underline decoration-flora-forest/35 underline-offset-2 dark:text-emerald-400"
          >
            {lang === "es"
              ? "Ver este nombre en el índice regional →"
              : "View this name in the regional index →"}
          </Link>
        </p>
      </main>
    );
  }

  const model = buildPlantDetailModel(plant);
  const ambiguityHubs = getAmbiguityHubsForPlant(plant.id);
  const related = getSmartRelatedPlants(plant, model, 6);
  const publicName = model.displayNames[0] ?? plant.scientific_name;
  const primaryNameSlug = plantNameHubSlug(plant.id, plant.scientific_name);
  const otherNameLinks = getAlsoKnownAsLinks(plant.id);
  const similarByUses = getPlantsSharingPrimaryUses(plant, 14);
  const namesByCountry = getNamesGroupedByCountryForPlant(plant.id);

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <p className="mb-8 rounded-xl border border-stone-200 bg-stone-50/90 px-4 py-3 text-sm leading-relaxed text-stone-700 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-300">
        {lang === "es"
          ? "Esta página es una referencia botánica detallada. Para traducciones del nombre entre países, consulta"
          : "This page is a detailed botanical reference. For name translations across countries, see:"}{" "}
        <Link
          href={localePath(lang, `/name/${primaryNameSlug}`)}
          className="font-semibold text-flora-forest underline decoration-flora-forest/35 underline-offset-2 dark:text-emerald-400"
        >
          {publicName}
        </Link>
        .
      </p>
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
