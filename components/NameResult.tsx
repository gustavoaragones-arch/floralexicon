"use client";
import type {
  Ambiguity,
  PlantNameMatch,
  ResolvedPlantContext,
} from "@/lib/resolver";
import {
  buildRegionalPlantRows,
  isPlaceholderPlant,
  sortRegionalPlantRows,
} from "@/lib/resolver";
import { CountryContextSelector } from "@/components/CountryContextSelector";
import {
  dedupeNameIndexLinksByNormalizedLabel,
  getNameSlugRowCountForPlant,
  getPlantGlobalData,
  loadNames,
  plantNameHubSlug,
} from "@/lib/data";
import { aggregateCountryFrequencyForNameHub } from "@/lib/geo";
import { getCountryDisplayName } from "@/lib/countries";
import { pickCountryModeLocalNames } from "@/lib/nameHubCountryMode";
import {
  MAX_VISIBLE_NAMES,
  formatHumanUseKey,
  formatStructuredUseTagDisplay,
  isLatinScript,
  sortNameIndexLinksForScriptGroups,
  topStructuredUseTagsForPrimaryCard,
} from "@/lib/nameHubDisplay";
import { NameHubExploreSection } from "@/components/NameHubExploreSection";
import { NameProgrammaticSeoBlocks } from "@/components/NameProgrammaticSeoBlocks";
import {
  SamePlantNamesSection,
  type SamePlantCluster,
} from "@/components/SamePlantNamesSection";
import { NameSeoContent } from "@/components/NameSeoContent";
import { ConfidenceTooltipExplainer } from "@/components/ConfidenceTooltipExplainer";
import { localePath, ti, t, type Locale } from "@/lib/i18n";
import { getUsePath } from "@/lib/usePaths";
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
    if (!plant) continue;
    for (const u of plant.primary_uses) {
      const low = u.trim().toLowerCase();
      if (low) set.add(low);
    }
  }
  return Array.from(set).sort();
}

function primaryAuthorityHeadline(
  lang: Locale,
  countryIso: string | null,
  isStrongDominance: boolean
): string {
  if (isStrongDominance) {
    if (countryIso) {
      return ti(lang, "name_authority_common_in_country", {
        country: getCountryDisplayName(countryIso, lang),
      });
    }
    return t(lang, "name_authority_common_global");
  }
  if (countryIso) {
    return ti(lang, "name_authority_likely_in_country", {
      country: getCountryDisplayName(countryIso, lang),
    });
  }
  return t(lang, "name_authority_likely_match");
}

function NameGlobalNameNetworkSection({
  lang,
  plantContexts,
  pageNameSlug,
  queryDisplay,
}: {
  lang: Locale;
  plantContexts: ResolvedPlantContext[];
  pageNameSlug: string;
  queryDisplay: string;
}) {
  if (plantContexts.length === 0) return null;

  return (
    <section
      className="mt-6"
      aria-labelledby="global-name-network-heading"
    >
      <h2
        id="global-name-network-heading"
        className="font-serif text-base font-semibold tracking-tight text-stone-900 dark:text-stone-100"
      >
        {t(lang, "name_languages_heading")}
      </h2>
      <ul className="mt-4 space-y-6">
        {plantContexts.map((ctx) => {
          const { plant, plant_id: plantId, isPlaceholder } = ctx;
          const { names } = getPlantGlobalData(plantId, {
            pageNameSlug,
            queryDisplay,
          });
          const freq = getNameSlugRowCountForPlant(plantId);
          const uniqueNames = dedupeNameIndexLinksByNormalizedLabel(names, freq);
          const latinNames = sortNameIndexLinksForScriptGroups(
            uniqueNames.filter((n) => isLatinScript(n.label)),
            queryDisplay,
            freq
          );
          const otherScriptNames = sortNameIndexLinksForScriptGroups(
            uniqueNames.filter((n) => !isLatinScript(n.label)),
            queryDisplay,
            freq
          );

          const chip = (slug: string, label: string) => (
            <li key={slug}>
              <Link
                href={localePath(lang, `/name/${slug}`)}
                className="inline-block rounded-full border border-stone-200 bg-white/90 px-3 py-1 text-sm font-medium text-flora-forest hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-900/60 dark:text-emerald-300"
              >
                {label}
              </Link>
            </li>
          );

          const speciesLabel =
            plant?.scientific_name ?? t(lang, "plant_placeholder_title");
          const ghostLinkClass =
            "text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300";

          return (
            <li key={plantId} className="list-none">
              <p className="font-serif text-sm font-semibold italic text-stone-900 dark:text-stone-100">
                {isPlaceholder || !plant ? (
                  <span className="text-stone-800 dark:text-stone-200">
                    {speciesLabel}
                  </span>
                ) : plant.isGhost ? (
                  <Link
                    href={localePath(
                      lang,
                      `/name/${plantNameHubSlug(plant.id, plant.scientific_name)}`
                    )}
                    className={`italic ${ghostLinkClass}`}
                  >
                    {plant.scientific_name}
                  </Link>
                ) : (
                  <Link
                    href={localePath(
                      lang,
                      `/name/${plantNameHubSlug(plant.id, plant.scientific_name)}`
                    )}
                    className={ghostLinkClass}
                  >
                    {plant.scientific_name}
                  </Link>
                )}
              </p>
              {uniqueNames.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">—</p>
              ) : (
                <div className="mt-3 space-y-4 text-sm">
                  {latinNames.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-stone-800 dark:text-stone-200">
                        {t(lang, "name_group_common_names")}
                      </h3>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {latinNames.map(({ slug, label }) => chip(slug, label))}
                      </ul>
                    </div>
                  )}
                  {otherScriptNames.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-stone-800 dark:text-stone-200">
                        {t(lang, "name_group_other_scripts")}
                      </h3>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {otherScriptNames.map(({ slug, label }) =>
                          chip(slug, label)
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
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
  const inputName = query.trim() || normalized.trim();
  const titleName = inputName;
  const normalizedCountry =
    selectedCountry && selectedCountry.trim()
      ? selectedCountry.trim().toUpperCase()
      : null;
  const isCountryMode = Boolean(normalizedCountry);

  const primaryContext =
    plantContexts.find((p) => p.is_primary_authority) ?? plantContexts[0];

  const siblingPlants = plantContexts
    .map((c) => c.plant)
    .filter((p): p is NonNullable<typeof p> => p != null);
  const names = loadNames();
  /** Country selector: plant regional inventory (`processed` merge), not name-hub footprint. */
  const plantSelectorCountries =
    hasMatches &&
    primaryContext?.plant &&
    !primaryContext.isPlaceholder &&
    Array.isArray(primaryContext.plant.countries) &&
    primaryContext.plant.countries.length > 0
      ? [...primaryContext.plant.countries].sort((a, b) => a.localeCompare(b))
      : [];
  const globalHubCodes = plantSelectorCountries;
  /** Single source for country preview and selector options (plant distribution only). */
  const countryMatches = globalHubCodes;
  const countrySelectorOptions =
    plantSelectorCountries.length > 0
      ? plantSelectorCountries
      : primaryContext?.isPlaceholder
        ? countryOptions
        : [];
  const filteredCountryMatches = normalizedCountry
    ? countryMatches.filter((c) => c === normalizedCountry)
    : countryMatches;

  const hubFreq =
    hasMatches && normalized
      ? aggregateCountryFrequencyForNameHub(normalized, names)
      : new Map<string, number>();
  const regionalRowsSorted = hasMatches
    ? sortRegionalPlantRows(buildRegionalPlantRows(matches), hubFreq, lang)
    : [];
  const plantsByCountry = new Map(
    regionalRowsSorted.map((r) => [r.countryCode, r.plants])
  );
  /** Hub country order × plants tied to this name in that country (from matches; preserves ambiguity). */
  const filteredCountryRows = filteredCountryMatches.map((countryCode) => ({
    countryCode,
    plants: plantsByCountry.get(countryCode) ?? [],
  }));

  const useKeys = hasMatches ? aggregateUseKeys(plantContexts) : [];

  const secondaryContexts = plantContexts.filter((p) => !p.is_primary_authority);

  const comparePairPath =
    hasMatches &&
    primaryContext?.plant &&
    secondaryContexts[0]?.plant &&
    secondaryContexts.length === 1
      ? (() => {
          const ids = [
            primaryContext.plant!.id,
            secondaryContexts[0]!.plant!.id,
          ].sort();
          return `/compare/${ids[0]}-vs-${ids[1]}`;
        })()
      : null;

  const plantGlobalOpts =
    hasMatches && nameSlug.trim()
      ? { pageNameSlug: nameSlug.trim(), queryDisplay: inputName }
      : undefined;

  const primaryMatch =
    hasMatches && primaryContext
      ? (normalizedCountry
          ? matches.find(
              (m) =>
                m.plant_id === primaryContext.plant_id &&
                m.country.trim().toUpperCase() === normalizedCountry
            )
          : undefined) ??
        matches.find(
          (m) =>
            m.plant_id === primaryContext.plant_id &&
            m.is_primary_authority === true
        ) ??
        matches.find((m) => m.plant_id === primaryContext.plant_id) ??
        matches[0] ??
        null
      : null;

  const countryLocalPick =
    isCountryMode && normalizedCountry && primaryContext
      ? pickCountryModeLocalNames(primaryContext.plant_id, normalizedCountry)
      : null;
  const countryPrimaryHeadline = isCountryMode
    ? countryLocalPick?.primaryLocalName.trim() || inputName
    : "";

  const plantData = primaryMatch
    ? getPlantGlobalData(primaryMatch.plant_id, plantGlobalOpts)
    : { countries: [] as string[], names: [] };
  const humanUseLabels = Array.from(
    new Set(useKeys.map((k) => formatHumanUseKey(lang, k)).filter(Boolean))
  );

  return (
    <div>
      {hasMatches && primaryMatch ? (
        <>
          <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-3xl md:text-4xl dark:text-stone-100">
            {isCountryMode && normalizedCountry ? (
              <>
                {ti(lang, "name_hub_h1_country_mode", {
                  name: inputName,
                  country: getCountryDisplayName(normalizedCountry, lang),
                })}
              </>
            ) : (
              <>{ti(lang, "name_hub_h1_default", { name: inputName })}</>
            )}
          </h1>

          {(() => {
            const { plant, isPlaceholder } = primaryMatch;
            const isGhost = Boolean(plant?.isGhost);
            const globalNames = plantData.names;
            const visibleNames = globalNames.slice(0, MAX_VISIBLE_NAMES);
            const hiddenNames = globalNames.slice(MAX_VISIBLE_NAMES);
            const remainingCount = hiddenNames.length;
            const authorityHeadline = primaryAuthorityHeadline(
              lang,
              normalizedCountry,
              primaryContext.is_strong_dominance
            );

            if (isCountryMode && normalizedCountry) {
              const countryLabel = getCountryDisplayName(
                normalizedCountry,
                lang
              );
              const plantHref =
                plant && !isPlaceholder
                  ? localePath(
                      lang,
                      `/plant/${plantNameHubSlug(plant.id, plant.scientific_name)}`
                    )
                  : null;

              const pickMode = countryLocalPick?.mode;

              return (
                <div className="primary-card mt-6 rounded-2xl border-2 border-stone-200 bg-white px-5 py-6 shadow-sm dark:border-stone-600 dark:bg-stone-900/50">
                  {pickMode === "native" ? (
                    <p className="label text-sm font-medium text-stone-600 dark:text-stone-400">
                      {ti(lang, "name_country_mode_called_in", {
                        country: countryLabel,
                      })}
                    </p>
                  ) : pickMode === "language_fallback" ? (
                    <p className="label text-sm font-medium text-stone-600 dark:text-stone-400">
                      {t(lang, "name_country_mode_language_intro")}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="label text-sm font-medium text-stone-600 dark:text-stone-400">
                        {ti(lang, "name_country_mode_no_country_for_country", {
                          country: countryLabel,
                        })}
                      </p>
                      <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                        {t(lang, "name_country_mode_common_name_used")}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                      <p className="local-primary-name font-serif text-2xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-3xl md:text-4xl dark:text-stone-100">
                        {countryPrimaryHeadline}
                      </p>
                      {countryLocalPick ? (
                        <span
                          className={
                            pickMode === "native"
                              ? "badge badge--green shrink-0 inline-block rounded-md border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-100"
                              : pickMode === "language_fallback"
                                ? "badge shrink-0 inline-block rounded-md border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100"
                                : "badge badge--muted shrink-0 inline-block rounded-md border border-stone-200 bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
                          }
                        >
                          {pickMode === "native"
                            ? t(lang, "name_country_mode_badge_local")
                            : pickMode === "language_fallback"
                              ? t(lang, "name_country_mode_badge_regional")
                              : t(lang, "name_country_mode_badge_global")}
                        </span>
                      ) : null}
                    </div>
                    {countryLocalPick &&
                    (pickMode === "language_fallback" ||
                      pickMode === "global") ? (
                      <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                        {pickMode === "language_fallback"
                          ? t(lang, "name_country_mode_regional_hint")
                          : t(lang, "name_country_mode_fallback_hint")}
                      </p>
                    ) : null}
                  </div>

                  {isPlaceholder || !plant ? (
                    <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
                      {t(lang, "plant_placeholder_subtitle")}
                    </p>
                  ) : (
                    <div className="mt-5 border-t border-stone-200 pt-4 dark:border-stone-700">
                      <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                        {t(lang, "name_country_mode_scientific_verification")}
                      </p>
                      <p className="scientific-name mt-1 font-serif text-lg font-semibold italic tracking-tight text-stone-900 sm:text-xl md:text-2xl dark:text-stone-100">
                        {plantHref ? (
                          <Link
                            href={plantHref}
                            className="text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
                          >
                            {plant.scientific_name}
                          </Link>
                        ) : (
                          plant.scientific_name
                        )}
                      </p>
                    </div>
                  )}

                  {isGhost && !plant?.is_enriched ? (
                    <div className="mt-3 space-y-2">
                      <span className="inline-flex shrink-0 items-center rounded-md border border-violet-400/40 bg-violet-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-950 dark:border-violet-500/35 dark:bg-violet-950/40 dark:text-violet-100">
                        {t(lang, "plant_limited_data_badge")}
                      </span>
                      <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                        {t(lang, "plant_ghost_mapping_note")}
                      </p>
                    </div>
                  ) : null}

                  {countryLocalPick &&
                  countryLocalPick.alternativeLabels.length > 0 ? (
                    <div className="mt-5 text-sm text-stone-800 dark:text-stone-200">
                      <p className="font-semibold text-stone-900 dark:text-stone-100">
                        {countryLocalPick.mode === "native"
                          ? ti(lang, "name_country_mode_also_used_in", {
                              country: countryLabel,
                            })
                          : t(lang, "name_country_mode_other_names")}
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {countryLocalPick.alternativeLabels.map((label) => (
                          <li key={label}>{label}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {plant && !isPlaceholder ? (
                    (() => {
                      const tags = topStructuredUseTagsForPrimaryCard(plant, 2);
                      if (tags.length === 0) return null;
                      return (
                        <div className="mt-4 text-sm text-stone-700 dark:text-stone-300">
                          <p className="font-semibold text-stone-800 dark:text-stone-200">
                            {t(lang, "name_primary_top_uses")}
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            {tags.map((tag) => (
                              <li key={tag}>
                                <Link
                                  href={localePath(lang, getUsePath(tag))}
                                  className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400"
                                >
                                  {formatStructuredUseTagDisplay(lang, tag)}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()
                  ) : null}
                </div>
              );
            }

            return (
              <div className="primary-card mt-6 rounded-2xl border-2 border-stone-200 bg-white px-5 py-6 shadow-sm dark:border-stone-600 dark:bg-stone-900/50">
                <p className="label text-sm font-medium text-stone-600 dark:text-stone-400">
                  {t(lang, "name_primary_refers_to")}
                </p>
                <h2 className="scientific-name mt-2 font-serif text-xl font-semibold italic tracking-tight text-stone-900 sm:text-2xl md:text-3xl dark:text-stone-100">
                  {isPlaceholder || !plant
                    ? t(lang, "plant_placeholder_title")
                    : plant.scientific_name}
                </h2>
                {isPlaceholder || !plant ? (
                  <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
                    {t(lang, "plant_placeholder_subtitle")}
                  </p>
                ) : null}

                {!isPlaceholder && plant && primaryContext.authority_level === "dominant" ? (
                  <span className="badge badge--green mt-2 inline-block rounded-md border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-100">
                    {t(lang, "name_authority_most_common_badge")}
                  </span>
                ) : null}

                {isGhost && !plant?.is_enriched ? (
                  <div className="mt-3 space-y-2">
                    <span className="inline-flex shrink-0 items-center rounded-md border border-violet-400/40 bg-violet-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-950 dark:border-violet-500/35 dark:bg-violet-950/40 dark:text-violet-100">
                      {t(lang, "plant_limited_data_badge")}
                    </span>
                    <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                      {t(lang, "plant_ghost_mapping_note")}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                      <span>{authorityHeadline}</span>
                      <ConfidenceTooltipExplainer lang={lang} />
                    </div>
                  </div>
                ) : (
                  <div className="confidence-row mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                    <span>{authorityHeadline}</span>
                    <ConfidenceTooltipExplainer lang={lang} />
                  </div>
                )}

                {visibleNames.length > 0 ? (
                  <div className="mt-4 text-sm text-stone-700 dark:text-stone-300">
                    <p>
                      <strong>{t(lang, "common_names_label")}</strong>{" "}
                      <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
                        {visibleNames.map(({ slug, label }, i) => (
                          <span key={slug}>
                            {i > 0 ? <span className="text-stone-400"> · </span> : null}
                            <Link
                              href={localePath(lang, `/name/${slug}`)}
                              className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400"
                            >
                              {label}
                            </Link>
                          </span>
                        ))}
                      </span>
                    </p>
                    {remainingCount > 0 ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium text-flora-forest hover:underline dark:text-emerald-300">
                          {ti(lang, "name_also_known_show_all", {
                            n: String(remainingCount),
                          })}
                        </summary>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                          {hiddenNames.map(({ slug, label }) => (
                            <li key={slug}>
                              <Link
                                href={localePath(lang, `/name/${slug}`)}
                                className="font-medium text-flora-forest underline dark:text-emerald-300"
                              >
                                {label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                ) : null}

                {plant && !isPlaceholder ? (
                  (() => {
                    const tags = topStructuredUseTagsForPrimaryCard(plant, 2);
                    if (tags.length === 0) return null;
                    return (
                      <div className="mt-4 text-sm text-stone-700 dark:text-stone-300">
                        <p className="font-semibold text-stone-800 dark:text-stone-200">
                          {t(lang, "name_primary_top_uses")}
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          {tags.map((tag) => (
                            <li key={tag}>
                              <Link
                                href={localePath(lang, getUsePath(tag))}
                                className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400"
                              >
                                {formatStructuredUseTagDisplay(lang, tag)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()
                ) : null}
              </div>
            );
          })()}
        </>
      ) : null}

      {hasMatches &&
      secondaryContexts.length > 0 &&
      !primaryContext.is_strong_dominance ? (
        <section
          className="name-secondary-plants mt-8 border-t border-stone-200 pt-6 dark:border-stone-800"
          aria-labelledby="name-secondary-plants-heading"
        >
          <h2
            id="name-secondary-plants-heading"
            className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400"
          >
            {t(lang, "name_secondary_plants_h2")}
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-stone-500 dark:text-stone-400">
            {secondaryContexts.slice(0, 3).map((ctx) => {
              const sci =
                ctx.plant?.scientific_name ??
                ctx.scientific_name ??
                t(lang, "plant_placeholder_title");
              const href =
                ctx.plant && !ctx.isPlaceholder
                  ? localePath(
                      lang,
                      `/plant/${plantNameHubSlug(ctx.plant.id, ctx.plant.scientific_name)}`
                    )
                  : localePath(lang, `/plant/${ctx.plant_id}`);
              return (
                <li key={ctx.plant_id}>
                  <Link
                    href={href}
                    className="text-flora-forest/80 underline decoration-stone-300/80 underline-offset-2 hover:text-flora-forest dark:text-emerald-400/90"
                  >
                    <em>{sci}</em>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {!hasMatches ? (
        <header className="border-b border-stone-200 pb-8 dark:border-stone-800">
          <h1 className="font-serif text-xl font-semibold leading-snug tracking-tight text-stone-900 dark:text-stone-100 sm:text-2xl md:text-3xl">
            {ti(lang, "name_hub_h1_default", { name: inputName })}
          </h1>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              {normalized && normalized !== inputName ? (
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
          </div>
        </header>
      ) : null}

      {hasMatches && primaryMatch ? (
        <section
          className="country-breakdown mt-8 rounded-xl border border-stone-200/90 bg-stone-50/90 px-4 py-5 dark:border-stone-700 dark:bg-stone-900/50"
          aria-labelledby="country-breakdown-heading"
        >
          <h2
            id="country-breakdown-heading"
            className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
          >
            {t(lang, "name_country_breakdown_h2")}
          </h2>
          <CountryContextSelector
            lang={lang}
            slug={nameSlug}
            value={normalizedCountry ?? undefined}
            options={countrySelectorOptions}
            wrapperClassName="mt-4 rounded-2xl border border-stone-200 bg-flora-sage/35 px-4 py-4 dark:border-stone-700 dark:bg-stone-900/50"
          />
          {normalized && normalized !== inputName ? (
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
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
          {filteredCountryRows.length > 0 ? (
            <div className="mt-4 text-sm text-stone-800 dark:text-stone-200">
              {filteredCountryRows.map(({ countryCode, plants }) => (
                <div key={countryCode} className="country-row mb-3 last:mb-0">
                  <div className="country-name font-semibold text-stone-900 dark:text-stone-100">
                    <Link
                      href={`${localePath(lang, `/name/${nameSlug}`)}?country=${encodeURIComponent(countryCode)}`}
                      className="text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
                    >
                      {getCountryDisplayName(countryCode, lang)}
                    </Link>
                  </div>
                  <div className="country-plants ml-3 mt-1 flex flex-wrap gap-2">
                    {plants.length === 0 ? (
                      <span className="text-stone-500 dark:text-stone-400">—</span>
                    ) : (
                      plants.map((plant) =>
                        isPlaceholderPlant(plant) ? (
                          <span
                            key={plant.id}
                            className="italic text-stone-600 dark:text-stone-400"
                          >
                            {t(lang, "plant_placeholder_title")}
                          </span>
                        ) : (
                          <Link
                            key={plant.id}
                            href={localePath(lang, `/plant/${plant.id}`)}
                            className="italic text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
                          >
                            {plant.scientific_name}
                          </Link>
                        )
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
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

      {hasMatches && humanUseLabels.length > 0 ? (
        <section className="mt-10" aria-labelledby="common-uses-heading">
          <h2
            id="common-uses-heading"
            className="text-base font-semibold text-stone-900 dark:text-stone-100"
          >
            {lang === "es" ? "Usos habituales:" : "Common uses:"}
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-800 dark:text-stone-200">
            {humanUseLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasMatches ? (
        <details className="mt-10 border-t border-stone-200 pt-8 dark:border-stone-800">
          <summary className="cursor-pointer font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {lang === "es" ? "Información de seguridad" : "Safety information"}
          </summary>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            <p>{t(lang, "faq_a_safe")}</p>
          </div>
        </details>
      ) : null}

      {hasMatches ? (
        <NameSeoContent
          lang={lang}
          displayName={titleName}
          ambiguity={ambiguity}
          selectedCountry={normalizedCountry ?? undefined}
        />
      ) : null}

      {hasMatches ? (
        <details className="mt-10 border-t border-stone-200 pt-8 dark:border-stone-800">
          <summary className="cursor-pointer font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {lang === "es" ? "Evidencia y contexto" : "Evidence"}
          </summary>
          <div className="mt-4">
            <NameProgrammaticSeoBlocks
              lang={lang}
              displayName={titleName}
              hasMatches
              plantContexts={plantContexts}
              suppressCountryRollup
            />
          </div>
        </details>
      ) : null}

      {hasMatches ? (
        <details className="mt-10 border-t border-stone-200 pt-8 dark:border-stone-800">
          <summary className="cursor-pointer font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {lang === "es" ? "Hierbas similares y enlaces" : "Similar herbs"}
          </summary>
          <div className="mt-4 space-y-8">
            {plantContexts.length > 0 && !isCountryMode ? (
              <NameGlobalNameNetworkSection
                lang={lang}
                plantContexts={plantContexts}
                pageNameSlug={nameSlug}
                queryDisplay={inputName}
              />
            ) : null}
            <SamePlantNamesSection
              lang={lang}
              id="same-plant-names-heading"
              clusters={samePlantClusters}
            />
            <NameHubExploreSection
              lang={lang}
              nameSlug={nameSlug}
              plants={siblingPlants}
              samePlantClusters={samePlantClusters}
            />
            {comparePairPath ? (
              <p className="text-sm">
                <Link
                  href={localePath(lang, comparePairPath)}
                  className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-400"
                >
                  {t(lang, "name_hub_compare_cta")}
                </Link>
              </p>
            ) : null}
          </div>
        </details>
      ) : null}
    </div>
  );
}
