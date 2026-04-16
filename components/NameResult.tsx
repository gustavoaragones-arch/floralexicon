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
import { NameClusterRegional } from "@/components/NameClusterSections";
import { getPlantGlobalData, loadNames, plantNameHubSlug } from "@/lib/data";
import {
  aggregateCountryFrequencyForNameHub,
  getNameHubCountryCodesSorted,
  getPlantCountryCodesSorted,
} from "@/lib/geo";
import { getCountryDisplayName, joinCountryNames } from "@/lib/countries";
import {
  MAX_VISIBLE_NAMES,
  formatHumanUseKey,
  partitionNameLinksByAscii,
} from "@/lib/nameHubDisplay";
import { NameHubCountryIndexSection } from "@/components/NameHubCountryIndexSection";
import { NameHubExploreSection } from "@/components/NameHubExploreSection";
import { NameProgrammaticSeoBlocks } from "@/components/NameProgrammaticSeoBlocks";
import {
  SamePlantNamesSection,
  type SamePlantCluster,
} from "@/components/SamePlantNamesSection";
import { NameSeoContent } from "@/components/NameSeoContent";
import { PlantComparisonSection } from "@/components/PlantComparisonSection";
import { ConfidenceTooltipExplainer } from "@/components/ConfidenceTooltipExplainer";
import { nameHubMatchWhyLine } from "@/lib/nameHubMatchWhyLine";
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

function prioritizeRegionalRows<T extends { countryCode: string }>(
  rows: T[],
  selectedIso?: string
): T[] {
  const want = selectedIso?.trim().toUpperCase();
  if (!want || rows.length < 2) return rows;
  const idx = rows.findIndex((r) => r.countryCode.trim().toUpperCase() === want);
  if (idx <= 0) return rows;
  const next = [...rows];
  const [hit] = next.splice(idx, 1);
  next.unshift(hit);
  return next;
}

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

function ambiguityNote(lang: Locale, level: Ambiguity): string {
  if (level === "high") return t(lang, "ambiguity_note_high");
  if (level === "medium") return t(lang, "ambiguity_note_medium");
  return t(lang, "ambiguity_note_low");
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
      <h3
        id="global-name-network-heading"
        className="font-serif text-base font-semibold tracking-tight text-stone-900 dark:text-stone-100"
      >
        {t(lang, "name_languages_heading")}
      </h3>
      <ul className="mt-4 space-y-6">
        {plantContexts.map((ctx) => {
          const { plant, plant_id: plantId, isPlaceholder } = ctx;
          const { names } = getPlantGlobalData(plantId, {
            pageNameSlug,
            queryDisplay,
          });
          const { ascii, nonAscii } = partitionNameLinksByAscii(names);
          const useGroups = ascii.length > 0 && nonAscii.length > 0;

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
              {names.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">—</p>
              ) : useGroups ? (
                <div className="mt-3 space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                      {t(lang, "name_group_ascii_names")}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {ascii.map(({ slug, label }) => chip(slug, label))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                      {t(lang, "name_group_nonascii_names")}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {nonAscii.map(({ slug, label }) => chip(slug, label))}
                    </ul>
                  </div>
                </div>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {names.map(({ slug, label }) => chip(slug, label))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SimplifiedMatchCard({
  lang,
  ctx,
  pageNameSlug,
  queryDisplay,
  selectedCountryIso,
}: {
  lang: Locale;
  ctx: ResolvedPlantContext;
  pageNameSlug: string;
  queryDisplay: string;
  selectedCountryIso?: string | null;
}) {
  const {
    plant,
    plant_id: plantId,
    confidence,
    isPlaceholder,
    global_agreement: globalAgreement,
    regional_strength: regionalStrength,
  } = ctx;
  const names = loadNames();
  const countriesForCard = getPlantCountryCodesSorted(plantId, names, lang);
  const global = getPlantGlobalData(plantId, {
    pageNameSlug,
    queryDisplay,
  });
  const whyLine = nameHubMatchWhyLine(
    lang,
    regionalStrength,
    globalAgreement,
    selectedCountryIso
  );
  const useLabels = plant
    ? Array.from(
        new Set(plant.primary_uses.map((u) => formatHumanUseKey(lang, u)).filter(Boolean))
      )
    : [];

  if (plant?.isGhost) {
    const limitedBadge =
      "inline-flex shrink-0 items-center rounded-md border border-violet-400/40 bg-violet-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-950 dark:border-violet-500/35 dark:bg-violet-950/40 dark:text-violet-100";
    return (
      <article className="rounded-2xl border border-stone-200 bg-white px-5 py-5 dark:border-stone-700 dark:bg-stone-900/40">
        <div className="flex flex-wrap items-start gap-2">
          <h3 className="min-w-0 flex-1 font-serif text-lg font-semibold italic tracking-tight text-stone-900 dark:text-stone-100">
            <Link
              href={localePath(
                lang,
                `/name/${plantNameHubSlug(plant.id, plant.scientific_name)}`
              )}
              className="text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
            >
              {plant.scientific_name}
            </Link>
          </h3>
          <span className={limitedBadge}>{t(lang, "plant_limited_data_badge")}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          {t(lang, "plant_ghost_mapping_note")}
        </p>
        {countriesForCard.length > 0 ? (
          <p className="mt-3 text-sm text-stone-700 dark:text-stone-300">
            <strong>{t(lang, "plantcard_most_common_in")}</strong>{" "}
            {joinCountryNames(countriesForCard, lang)}
          </p>
        ) : null}
        {global.names.length > 0 ? (
          <div className="mt-3 text-sm text-stone-700 dark:text-stone-300">
            <p>
              <strong>{t(lang, "common_names_label")}</strong>{" "}
              <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
                {global.names.slice(0, MAX_VISIBLE_NAMES).map(({ slug, label }, i) => (
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
            {global.names.length > MAX_VISIBLE_NAMES ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-flora-forest hover:underline dark:text-emerald-300">
                  {ti(lang, "name_also_known_show_all", {
                    n: String(global.names.length - MAX_VISIBLE_NAMES),
                  })}
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {global.names.slice(MAX_VISIBLE_NAMES).map(({ slug, label }) => (
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
      </article>
    );
  }

  if (isPlaceholder || !plant) {
    return (
      <article className="rounded-2xl border border-stone-200 bg-white px-5 py-5 dark:border-stone-700 dark:bg-stone-900/40">
        <h3 className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          {t(lang, "plant_placeholder_title")}
        </h3>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {t(lang, "plant_placeholder_subtitle")}
        </p>
        {countriesForCard.length > 0 ? (
          <p className="mt-3 text-sm text-stone-700 dark:text-stone-300">
            <strong>{t(lang, "plantcard_most_common_in")}</strong>{" "}
            {joinCountryNames(countriesForCard, lang)}
          </p>
        ) : null}
        {global.names.length > 0 ? (
          <div className="mt-3 text-sm text-stone-700 dark:text-stone-300">
            <p>
              <strong>{t(lang, "common_names_label")}</strong>{" "}
              <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
                {global.names.slice(0, MAX_VISIBLE_NAMES).map(({ slug, label }, i) => (
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
            {global.names.length > MAX_VISIBLE_NAMES ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-flora-forest hover:underline dark:text-emerald-300">
                  {ti(lang, "name_also_known_show_all", {
                    n: String(global.names.length - MAX_VISIBLE_NAMES),
                  })}
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {global.names.slice(MAX_VISIBLE_NAMES).map(({ slug, label }) => (
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
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
          <span>
            {ti(lang, "name_confidence_percent", {
              percent: String(Math.round(confidence * 100)),
            })}{" "}
            {t(lang, "name_hub_score_suffix")}
          </span>
          <ConfidenceTooltipExplainer lang={lang} />
        </div>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{whyLine}</p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-stone-200 bg-white px-5 py-5 dark:border-stone-700 dark:bg-stone-900/40">
      <h3 className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
        <Link
          href={localePath(lang, `/name/${plantNameHubSlug(plant.id, plant.scientific_name)}`)}
          className="text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
        >
          {plant.scientific_name}
        </Link>
      </h3>
      {countriesForCard.length > 0 ? (
        <p className="mt-3 text-sm text-stone-700 dark:text-stone-300">
          <strong>{t(lang, "plantcard_most_common_in")}</strong>{" "}
          {joinCountryNames(countriesForCard, lang)}
        </p>
      ) : null}
      {global.names.length > 0 ? (
        <div className="mt-3 text-sm text-stone-700 dark:text-stone-300">
          <p>
            <strong>{t(lang, "common_names_label")}</strong>{" "}
            <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
              {global.names.slice(0, MAX_VISIBLE_NAMES).map(({ slug, label }, i) => (
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
          {global.names.length > MAX_VISIBLE_NAMES ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-flora-forest hover:underline dark:text-emerald-300">
                {ti(lang, "name_also_known_show_all", {
                  n: String(global.names.length - MAX_VISIBLE_NAMES),
                })}
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {global.names.slice(MAX_VISIBLE_NAMES).map(({ slug, label }) => (
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
      {useLabels.length > 0 ? (
        <div className="mt-3 text-sm text-stone-700 dark:text-stone-300">
          <p>
            <strong>{lang === "es" ? "Usos habituales:" : "Used for:"}</strong>
          </p>
          <ul className="mt-1 list-disc pl-5">
            {useLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
        <span>
          {ti(lang, "name_confidence_percent", {
            percent: String(Math.round(confidence * 100)),
          })}{" "}
          {t(lang, "name_hub_score_suffix")}
        </span>
        <ConfidenceTooltipExplainer lang={lang} />
      </div>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{whyLine}</p>
    </article>
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
  const siblingPlants = plantContexts
    .map((c) => c.plant)
    .filter((p): p is NonNullable<typeof p> => p != null);
  const names = loadNames();
  const hubFreq =
    hasMatches && normalized
      ? aggregateCountryFrequencyForNameHub(normalized, names)
      : new Map<string, number>();
  const regionalRows = hasMatches
    ? sortRegionalPlantRows(buildRegionalPlantRows(matches), hubFreq, lang)
    : [];
  const regionalRowsDisplay = prioritizeRegionalRows(
    regionalRows,
    normalizedCountry ?? undefined
  );
  const globalHubCodes =
    hasMatches && normalized
      ? getNameHubCountryCodesSorted(normalized, names, lang)
      : [];
  const useKeys = hasMatches ? aggregateUseKeys(plantContexts) : [];
  const comparePairPath =
    hasMatches &&
    plantContexts.length === 2 &&
    plantContexts[0]?.plant &&
    plantContexts[1]?.plant
      ? (() => {
          const ids = [
            plantContexts[0].plant!.id,
            plantContexts[1].plant!.id,
          ].sort();
          return `/compare/${ids[0]}-vs-${ids[1]}`;
        })()
      : null;

  const plantGlobalOpts =
    hasMatches && nameSlug.trim()
      ? { pageNameSlug: nameSlug.trim(), queryDisplay: inputName }
      : undefined;

  const countryMatch =
    normalizedCountry && hasMatches
      ? matches.find(
          (m) => m.country.trim().toUpperCase() === normalizedCountry
        )
      : null;
  const primaryMatch =
    hasMatches && matches.length > 0 ? countryMatch ?? matches[0] : null;

  const plantData = primaryMatch
    ? getPlantGlobalData(primaryMatch.plant_id, plantGlobalOpts)
    : { countries: [] as string[], names: [] };
  const plantCountries = plantData.countries;
  const quickCountryRows = plantCountries.slice(0, 5);

  const comparisonContexts =
    plantContexts.length > 1 ? plantContexts.slice(1) : [];

  const humanUseLabels = Array.from(
    new Set(useKeys.map((k) => formatHumanUseKey(lang, k)).filter(Boolean))
  );

  return (
    <div>
      {hasMatches && primaryMatch ? (
        <>
          <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-3xl md:text-4xl dark:text-stone-100">
            {lang === "es" ? (
              <>
                ¿Cómo se llama «{inputName}» en diferentes países?
              </>
            ) : (
              <>
                How is &quot;{inputName}&quot; called in different countries?
              </>
            )}
          </h1>

          {(() => {
            const {
              plant,
              confidence,
              plant_id: primaryPid,
              isPlaceholder,
              global_agreement: primaryGlobalAgreement,
              regional_strength: primaryRegionalStrength,
            } = primaryMatch;
            const isGhost = Boolean(plant?.isGhost);
            const countriesOrdered = getPlantCountryCodesSorted(primaryPid, names, lang);
            const globalNames = plantData.names;
            const visibleNames = globalNames.slice(0, MAX_VISIBLE_NAMES);
            const hiddenNames = globalNames.slice(MAX_VISIBLE_NAMES);
            const whyLine = nameHubMatchWhyLine(
              lang,
              primaryRegionalStrength,
              primaryGlobalAgreement,
              normalizedCountry
            );
            const remainingCount = hiddenNames.length;

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

                {isGhost ? (
                  <div className="mt-3 space-y-2">
                    <span className="inline-flex shrink-0 items-center rounded-md border border-violet-400/40 bg-violet-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-950 dark:border-violet-500/35 dark:bg-violet-950/40 dark:text-violet-100">
                      {t(lang, "plant_limited_data_badge")}
                    </span>
                    <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                      {t(lang, "plant_ghost_mapping_note")}
                    </p>
                  </div>
                ) : (
                  <div className="confidence-row mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                    <span>
                      {ti(lang, "name_confidence_percent", {
                        percent: String(Math.round(confidence * 100)),
                      })}{" "}
                      {t(lang, "name_hub_score_suffix")}
                    </span>
                    <ConfidenceTooltipExplainer lang={lang} />
                  </div>
                )}

                <p className="why-line mt-3 text-sm text-stone-600 dark:text-stone-400">
                  {whyLine}
                </p>

                {countriesOrdered.length > 0 ? (
                  <p className="mt-4 text-sm text-stone-700 dark:text-stone-300">
                    <strong>{t(lang, "common_in")}</strong>{" "}
                    {joinCountryNames(countriesOrdered, lang)}
                  </p>
                ) : null}

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
              </div>
            );
          })()}
        </>
      ) : null}

      {hasMatches && plantContexts.length > 1 ? (
        <section
          className="name-alternatives mt-8 border-t border-stone-200 pt-8 dark:border-stone-800"
          aria-labelledby="name-alternatives-heading"
        >
          <h2
            id="name-alternatives-heading"
            className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
          >
            {t(lang, "name_alternatives_h2")}
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-700 dark:text-stone-300">
            {plantContexts.slice(1).map((ctx) => {
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
                    className="text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400"
                  >
                    <span className="italic">{sci}</span>
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
            {lang === "es" ? (
              <>¿Cómo se llama «{inputName}» en diferentes países?</>
            ) : (
              <>
                How is &quot;{inputName}&quot; called in different countries?
              </>
            )}
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
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <span className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-500">
                {t(lang, "name_ambiguity_label")}
              </span>
              <AmbiguityBadge lang={lang} level={ambiguity} />
            </div>
          </div>
        </header>
      ) : null}

      {hasMatches && primaryMatch && quickCountryRows.length > 0 ? (
        <section
          className="quick-country-block mt-8 rounded-xl border border-stone-200/90 bg-stone-50/90 px-4 py-4 dark:border-stone-700 dark:bg-stone-900/50"
          aria-labelledby="quick-country-heading"
        >
          <h2 id="quick-country-heading" className="sr-only">
            {lang === "es" ? "Respuestas por país" : "Quick country answers"}
          </h2>
          <div className="space-y-2 text-sm text-stone-800 dark:text-stone-200">
            {quickCountryRows.map((countryCode) => {
              const label = getCountryDisplayName(countryCode, lang);
              return (
                <p key={countryCode}>
                  <span className="font-medium">{label}</span>
                  <span className="text-stone-400 dark:text-stone-500"> → </span>
                  <Link
                    href={`${localePath(lang, `/name/${nameSlug}`)}?country=${encodeURIComponent(countryCode)}`}
                    className="text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
                  >
                    {primaryMatch.plant?.scientific_name ??
                      t(lang, "plant_placeholder_title")}
                  </Link>
                </p>
              );
            })}
          </div>
          <p className="mt-3">
            <a
              href="#country-resolution"
              className="text-sm font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
            >
              {lang === "es"
                ? "Ver desglose completo por país"
                : "View full country breakdown"}
            </a>
          </p>
        </section>
      ) : null}

      {hasMatches ? (
        <div id="country-resolution" className="mt-8 scroll-mt-20 space-y-4">
          <CountryContextSelector
            lang={lang}
            slug={nameSlug}
            value={normalizedCountry ?? undefined}
            options={countryOptions}
          />
          {normalized && normalized !== inputName ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t(lang, "name_spelling_match")} {normalized}
            </p>
          ) : null}
          {variantNotice ? (
            <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100">
              {ti(lang, "name_variant_notice", {
                variant: variantNotice.variant,
                canonical: variantNotice.canonical,
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      {hasMatches && comparisonContexts.length > 0 ? (
        <section className="mt-10" aria-labelledby="hub-species-heading">
          <h2 id="hub-species-heading" className="sr-only">
            {ti(lang, "name_hub_matches_h2", { name: titleName })}
          </h2>
          <ul className="flex flex-col gap-6">
            {comparisonContexts.map((ctx) => (
              <li key={ctx.plant_id} className="list-none">
                <SimplifiedMatchCard
                  lang={lang}
                  ctx={ctx}
                  pageNameSlug={nameSlug}
                  queryDisplay={inputName}
                  selectedCountryIso={normalizedCountry}
                />
              </li>
            ))}
          </ul>
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
            {(ambiguity === "medium" || ambiguity === "high") && (
              <p>{ambiguityNote(lang, ambiguity)}</p>
            )}
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
            {lang === "es" ? "Geografía" : "Geography"}
          </summary>
          <div className="mt-4">
            <NameClusterRegional
              lang={lang}
              nameCanonicalSlug={nameSlug}
              regionalRows={regionalRowsDisplay}
              heading={ti(lang, "name_country_resolution_h2", { name: titleName })}
              hideIntro
            />
            <NameHubCountryIndexSection
              lang={lang}
              nameCanonicalSlug={nameSlug}
              countryCodesSorted={globalHubCodes}
            />
          </div>
        </details>
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
              ambiguity={ambiguity}
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
            {plantContexts.length > 0 ? (
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
            {ambiguity === "high" && plantContexts.length >= 2 ? (
              <PlantComparisonSection
                lang={lang}
                plants={plantContexts
                  .map((ctx) => ctx.plant)
                  .filter((p): p is NonNullable<typeof p> => p != null)}
              />
            ) : null}
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
