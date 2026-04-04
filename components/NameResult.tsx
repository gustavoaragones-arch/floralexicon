import type {
  Ambiguity,
  PlantNameMatch,
  ResolvedPlantContext,
} from "@/lib/resolver";
import {
  buildRegionalPlantRows,
  sortRegionalPlantRows,
} from "@/lib/resolver";
import { CountryContextSelector } from "@/components/CountryContextSelector";
import { NameQuickAnswer } from "@/components/NameQuickAnswer";
import { NameClusterGlobalPresence } from "@/components/NameClusterGlobalPresence";
import {
  NameClusterOverview,
  NameClusterRegional,
  NameClusterUses,
} from "@/components/NameClusterSections";
import { loadNames } from "@/lib/data";
import {
  aggregateCountryFrequencyForNameHub,
  getNameHubConfidenceTier,
  getNameHubCountryCodesSorted,
} from "@/lib/geo";
import { NameHubExploreSection } from "@/components/NameHubExploreSection";
import { NameProgrammaticSeoBlocks } from "@/components/NameProgrammaticSeoBlocks";
import {
  SamePlantNamesSection,
  type SamePlantCluster,
} from "@/components/SamePlantNamesSection";
import { NameSeoContent } from "@/components/NameSeoContent";
import { PlantComparisonSection } from "@/components/PlantComparisonSection";
import { PlantCard } from "@/components/PlantCard";
import { localePath, ti, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

type NameResultProps = {
  lang: Locale;
  query: string;
  normalized: string;
  ambiguity: Ambiguity;
  plantContexts: ResolvedPlantContext[];
  matches: PlantNameMatch[];
  nameSlug: string;
  selectedCountry?: string;
  countryOptions: string[];
  hasMatches: boolean;
  samePlantClusters: SamePlantCluster[];
  variantNotice?: { variant: string; canonical: string };
};

function aggregateUseKeys(contexts: ResolvedPlantContext[]): string[] {
  const set = new Set<string>();
  for (const { plant } of contexts) {
    for (const u of plant.primary_uses) {
      const low = u.trim().toLowerCase();
      if (low) set.add(low);
    }
  }
  return Array.from(set).sort();
}

function AmbiguityBadge({ lang, level }: { lang: Locale; level: Ambiguity }) {
  const base =
    "inline-flex shrink-0 items-center rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wide";

  if (level === "low") {
    return (
      <span
        className={`${base} border border-green-600/30 bg-green-100 text-green-900 dark:border-green-500/40 dark:bg-green-950 dark:text-green-200`}
      >
        {t(lang, "ambiguity_low")}
      </span>
    );
  }
  if (level === "medium") {
    return (
      <span
        className={`${base} border border-amber-500/40 bg-amber-100 text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/80 dark:text-amber-100`}
      >
        {t(lang, "ambiguity_medium")}
      </span>
    );
  }
  return (
    <span
      className={`${base} border border-red-600/30 bg-red-100 text-red-950 dark:border-red-500/40 dark:bg-red-950 dark:text-red-100`}
    >
      {t(lang, "ambiguity_high")}
    </span>
  );
}

function AmbiguityBanner({ lang, level }: { lang: Locale; level: Ambiguity }) {
  if (level === "high") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-medium leading-relaxed text-red-950 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100"
      >
        {t(lang, "ambiguity_banner_high")}
      </div>
    );
  }
  if (level === "medium") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100"
      >
        {t(lang, "ambiguity_banner_medium")}
      </div>
    );
  }
  return null;
}

export function NameResult({
  lang,
  query,
  normalized,
  ambiguity,
  plantContexts,
  matches,
  nameSlug,
  selectedCountry,
  countryOptions,
  hasMatches,
  samePlantClusters,
  variantNotice,
}: NameResultProps) {
  const queryLabel = query.trim() || normalized;
  const titleName = queryLabel;
  const siblingPlants = plantContexts.map((c) => c.plant);
  const names = loadNames();
  const hubFreq =
    hasMatches && normalized
      ? aggregateCountryFrequencyForNameHub(normalized, names)
      : new Map<string, number>();
  const regionalRows = hasMatches
    ? sortRegionalPlantRows(buildRegionalPlantRows(matches), hubFreq, lang)
    : [];
  const globalHubCodes =
    hasMatches && normalized
      ? getNameHubCountryCodesSorted(normalized, names, lang)
      : [];
  const useKeys = hasMatches ? aggregateUseKeys(plantContexts) : [];
  const comparePairPath =
    hasMatches && plantContexts.length === 2
      ? (() => {
          const ids = [
            plantContexts[0].plant.id,
            plantContexts[1].plant.id,
          ].sort();
          return `/compare/${ids[0]}-vs-${ids[1]}`;
        })()
      : null;

  return (
    <div>
      <header className="border-b border-stone-200 pb-8 dark:border-stone-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-500">
              {t(lang, "name_label_plant_name")}
            </p>
            <h1 className="mt-2 font-serif text-xl font-semibold leading-snug tracking-tight text-stone-900 dark:text-stone-100 sm:text-2xl md:text-3xl">
              {ti(lang, "name_h1", { name: titleName })}
            </h1>
            {normalized && normalized !== queryLabel ? (
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                {t(lang, "name_spelling_match")} {normalized}
              </p>
            ) : null}
            {variantNotice ? (
              <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
                {ti(lang, "name_variant_notice", {
                  variant: variantNotice.variant,
                  canonical: variantNotice.canonical,
                })}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-500">
              {t(lang, "name_ambiguity_label")}
            </span>
            <AmbiguityBadge lang={lang} level={ambiguity} />
          </div>
        </div>

        {hasMatches && plantContexts.length > 0 ? (
          <NameQuickAnswer
            lang={lang}
            displayName={titleName}
            contexts={plantContexts.slice(0, 2)}
          />
        ) : null}

        {hasMatches ? (
          <CountryContextSelector
            lang={lang}
            slug={nameSlug}
            value={selectedCountry}
            options={countryOptions}
          />
        ) : null}
      </header>

      {hasMatches ? (
        <div className="mt-10 space-y-0">
          <NameClusterGlobalPresence
            lang={lang}
            displayName={titleName}
            countryCodesSorted={globalHubCodes}
          />
          <div className="mt-10">
            <NameClusterOverview lang={lang} displayName={titleName} />
          </div>
          <NameClusterUses
            lang={lang}
            displayName={titleName}
            useKeys={useKeys}
          />
          <NameClusterRegional
            lang={lang}
            displayName={titleName}
            nameCanonicalSlug={nameSlug}
            regionalRows={regionalRows}
            names={names}
          />
          <div className="mt-10">
            <NameProgrammaticSeoBlocks
              lang={lang}
              displayName={titleName}
              hasMatches
              plantContexts={plantContexts}
              ambiguity={ambiguity}
            />
          </div>
        </div>
      ) : null}

      {!hasMatches ? (
        <div
          className="mt-10 rounded-2xl border border-stone-300 bg-flora-sage/50 px-4 py-6 text-center dark:border-stone-600 dark:bg-stone-900/50"
          role="status"
        >
          <p className="text-base font-medium text-stone-800 dark:text-stone-200">
            {t(lang, "name_no_matches_title")}
          </p>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {t(lang, "name_no_matches_body")}
          </p>
        </div>
      ) : null}

      {!hasMatches ? (
        <NameProgrammaticSeoBlocks
          lang={lang}
          displayName={titleName}
          hasMatches={false}
        />
      ) : null}

      {hasMatches ? (
        <section
          className="mt-14"
          aria-label={t(lang, "options_section_aria")}
        >
          <h2
            id="hub-species-heading"
            className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-2xl"
          >
            {ti(lang, "name_hub_species_h2", { name: titleName })}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {ti(lang, "name_hub_species_lead", {
              count: String(plantContexts.length),
            })}
          </p>
          <p className="sr-only">
            {ti(lang, "options_heading", {
              count: String(plantContexts.length),
            })}
          </p>

          {(ambiguity === "high" || ambiguity === "medium") && plantContexts.length >= 1 ? (
            <div className="mt-6">
              <AmbiguityBanner lang={lang} level={ambiguity} />
            </div>
          ) : null}

          {plantContexts.length === 0 ? (
            <p className="mt-6 text-sm text-stone-600 dark:text-stone-400">
              {t(lang, "name_no_matches_title")}
            </p>
          ) : (
            <ul className="mt-8 flex flex-col gap-12">
              {plantContexts.map(({ plant, countries, confidence }, index) => {
                const tier = getNameHubConfidenceTier(confidence);
                const cardShell =
                  tier === "most_likely"
                    ? "rounded-2xl border-2 border-emerald-500/45 bg-white px-6 py-6 shadow-md shadow-emerald-900/5 ring-2 ring-emerald-500/15 dark:border-emerald-500/40 dark:bg-stone-900/40 dark:shadow-black/25 dark:ring-emerald-500/20"
                    : tier === "strong_regional"
                      ? "rounded-2xl border border-amber-400/55 bg-amber-50/40 px-6 py-6 shadow-sm ring-1 ring-amber-500/15 dark:border-amber-600/40 dark:bg-amber-950/20 dark:ring-amber-500/10"
                      : "rounded-2xl border border-stone-200 bg-white px-6 py-6 shadow-sm dark:border-stone-600 dark:bg-stone-900/40 dark:shadow-black/20";
                return (
                  <li key={plant.id} className="list-none">
                    <div className={cardShell}>
                      <PlantCard
                        lang={lang}
                        plant={plant}
                        headingLevel="h3"
                        frameless
                        commonCountries={countries}
                        userCountry={selectedCountry}
                        decisionAssist={{
                          matchNumber: index + 1,
                          queryLabel: titleName,
                          siblingPlants,
                        }}
                        nameHubConfidence={{
                          rankIndex: index,
                          totalMatches: plantContexts.length,
                          confidence,
                          showPercent: true,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {hasMatches && ambiguity === "high" && plantContexts.length >= 2 ? (
        <PlantComparisonSection
          lang={lang}
          plants={plantContexts.map((ctx) => ctx.plant)}
        />
      ) : null}

      {comparePairPath ? (
        <p className="mt-8 text-sm">
          <Link
            href={localePath(lang, comparePairPath)}
            className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-400"
          >
            {t(lang, "name_hub_compare_cta")}
          </Link>
        </p>
      ) : null}

      {hasMatches ? (
        <SamePlantNamesSection
          lang={lang}
          id="same-plant-names-heading"
          clusters={samePlantClusters}
        />
      ) : null}

      {hasMatches ? (
        <NameHubExploreSection
          lang={lang}
          nameSlug={nameSlug}
          plants={siblingPlants}
          samePlantClusters={samePlantClusters}
        />
      ) : null}

      <NameSeoContent
        lang={lang}
        displayName={titleName}
        ambiguity={ambiguity}
        selectedCountry={selectedCountry}
      />
    </div>
  );
}
