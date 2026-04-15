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
import {
  NameClusterRegional,
  NameClusterUses,
} from "@/components/NameClusterSections";
import { getPlantGlobalData, loadNames } from "@/lib/data";
import {
  aggregateCountryFrequencyForNameHub,
  getNameHubConfidenceTier,
  getNameHubCountryCodesSorted,
  getPlantCountryCodesSorted,
} from "@/lib/geo";
import { getCountryDisplayName, joinCountryNames } from "@/lib/countries";
import {
  countryCodeToFlagEmoji,
  MAX_VISIBLE_NAMES,
  partitionNameLinksByAscii,
} from "@/lib/nameHubDisplay";
import { NameHubCountryIndexSection } from "@/components/NameHubCountryIndexSection";
import { NameHubExploreSection } from "@/components/NameHubExploreSection";
import { NameHubPlantQuickLinks } from "@/components/NameHubPlantQuickLinks";
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

function PrimaryNameAnswerBox({
  lang,
  primary,
  queryLabel,
  ambiguity,
  normalizedCountry,
}: {
  lang: Locale;
  primary: PlantNameMatch;
  queryLabel: string;
  ambiguity: Ambiguity;
  normalizedCountry: string | null;
}) {
  const { plant, confidence } = primary;
  const names = loadNames();
  const countriesOrdered = getPlantCountryCodesSorted(plant.id, names, lang);
  const global = getPlantGlobalData(plant.id);
  const tier = getNameHubConfidenceTier(confidence);
  const plantHref = localePath(lang, `/plant/${plant.id}`);
  const visibleNames = global.names.slice(0, MAX_VISIBLE_NAMES);
  const hiddenNames = global.names.slice(MAX_VISIBLE_NAMES);
  const countryCount = countriesOrdered.length;
  const whyLine =
    countryCount > 0
      ? ti(lang, "name_primary_why_multi", { count: String(countryCount) })
      : t(lang, "name_primary_why_coverage");

  return (
    <section
      className="rounded-2xl border-2 border-stone-200 bg-white px-5 py-6 shadow-sm dark:border-stone-600 dark:bg-stone-900/50"
      aria-labelledby="name-page-h1"
    >
      <h1
        id="name-page-h1"
        className="font-serif text-2xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-3xl md:text-4xl dark:text-stone-100"
      >
        {ti(lang, "name_page_h1_what_is", { name: queryLabel })}
      </h1>
      {normalizedCountry ? (
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
          {lang === "es" ? "En" : "In"} {getCountryDisplayName(normalizedCountry, lang)}:
        </p>
      ) : null}
      <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
        {t(lang, "name_primary_refers_to")}
      </p>
      <h2 className="mt-2 font-serif text-xl font-semibold italic leading-snug tracking-tight text-stone-900 sm:text-2xl md:text-3xl dark:text-stone-100">
        <Link
          href={plantHref}
          className="text-stone-900 underline decoration-stone-300 underline-offset-[3px] hover:text-flora-forest hover:decoration-flora-forest dark:text-stone-100 dark:decoration-stone-600 dark:hover:text-emerald-300 dark:hover:decoration-emerald-400"
        >
          {plant.scientific_name}
        </Link>
      </h2>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <AmbiguityBadge lang={lang} level={ambiguity} />
        {tier === "most_likely" ? (
          <span className="inline-flex shrink-0 items-center rounded-md border border-emerald-600/35 bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-100">
            {t(lang, "name_confidence_most_likely")}
          </span>
        ) : null}
        {tier === "strong_regional" ? (
          <span className="inline-flex shrink-0 items-center rounded-md border border-amber-500/35 bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/50 dark:text-amber-100">
            {t(lang, "name_confidence_high_badge")}
          </span>
        ) : null}
        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
          {ti(lang, "name_confidence_percent", {
            percent: String(Math.round(confidence * 100)),
          })}
        </span>
      </div>

      <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">{whyLine}</p>

      {countriesOrdered.length > 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            {t(lang, "common_in")}{" "}
          </span>
          {joinCountryNames(countriesOrdered, lang)}
        </p>
      ) : null}

      {visibleNames.length > 0 ? (
        <div className="mt-4 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            {t(lang, "also_known_as")}:{" "}
          </span>
          <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
            {visibleNames.map(({ slug, label }, i) => (
              <span key={slug}>
                {i > 0 ? <span className="text-stone-400"> · </span> : null}
                <Link
                  href={localePath(lang, `/name/${slug}`)}
                  className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400"
                >
                  {label}
                </Link>
              </span>
            ))}
          </span>
          {hiddenNames.length > 0 ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-flora-forest hover:underline dark:text-emerald-300">
                {ti(lang, "name_also_known_show_all", {
                  n: String(hiddenNames.length),
                })}
              </summary>
              <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm">
                {hiddenNames.map(({ slug, label }) => (
                  <span key={slug}>
                    <Link
                      href={localePath(lang, `/name/${slug}`)}
                      className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-300"
                    >
                      {label}
                    </Link>
                  </span>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function NameGlobalNameNetworkSection({
  lang,
  plantContexts,
}: {
  lang: Locale;
  plantContexts: ResolvedPlantContext[];
}) {
  if (plantContexts.length === 0) return null;

  return (
    <section
      className="mt-14 border-t border-stone-200 pt-10 dark:border-stone-800"
      aria-labelledby="global-name-network-heading"
    >
      <h3
        id="global-name-network-heading"
        className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-xl"
      >
        {t(lang, "name_languages_heading")}
      </h3>
      <ul className="mt-6 space-y-8">
        {plantContexts.map(({ plant }) => {
          const { names } = getPlantGlobalData(plant.id);
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

          return (
            <li key={plant.id}>
              <p className="font-serif text-base font-semibold italic tracking-tight text-stone-900 dark:text-stone-100">
                <Link
                  href={localePath(lang, `/plant/${plant.id}`)}
                  className="text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
                >
                  {plant.scientific_name}
                </Link>
              </p>
              {names.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">—</p>
              ) : useGroups ? (
                <div className="mt-4 space-y-5 text-sm">
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
                <ul className="mt-3 flex flex-wrap gap-2">
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
  const normalizedCountry =
    selectedCountry && selectedCountry.trim()
      ? selectedCountry.trim().toUpperCase()
      : null;
  const siblingPlants = plantContexts.map((c) => c.plant);
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
    hasMatches && plantContexts.length === 2
      ? (() => {
          const ids = [
            plantContexts[0].plant.id,
            plantContexts[1].plant.id,
          ].sort();
          return `/compare/${ids[0]}-vs-${ids[1]}`;
        })()
      : null;

  const countryMatch =
    normalizedCountry && hasMatches
      ? matches.find(
          (m) => m.country.trim().toUpperCase() === normalizedCountry
        )
      : null;
  const primaryMatch =
    hasMatches && matches.length > 0 ? countryMatch ?? matches[0] : null;

  const quickCountryRows = regionalRowsDisplay.slice(0, 5);

  return (
    <div>
      {hasMatches && primaryMatch ? (
        <div className="space-y-5">
          <PrimaryNameAnswerBox
            lang={lang}
            primary={primaryMatch}
            queryLabel={titleName}
            ambiguity={ambiguity}
            normalizedCountry={normalizedCountry}
          />
        </div>
      ) : null}

      {hasMatches && quickCountryRows.length > 0 ? (
        <section
          className="quick-country-block mt-6 rounded-xl border border-stone-200/90 bg-stone-50/90 px-4 py-4 dark:border-stone-700 dark:bg-stone-900/50"
          aria-labelledby="quick-country-heading"
        >
          <h2 id="quick-country-heading" className="sr-only">
            {lang === "es" ? "Respuestas rápidas por país" : "Quick country answers"}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {lang === "es"
              ? "¿Buscas esta hierba en un país concreto?"
              : "Looking for this herb in a specific country?"}
          </p>
          <div className="mt-3 space-y-4 text-sm text-stone-800 dark:text-stone-200">
            {quickCountryRows.map((row) => {
              const flag = countryCodeToFlagEmoji(row.countryCode);
              const label = getCountryDisplayName(row.countryCode, lang);
              const hubCommon = titleName.trim();
              const microLine =
                hubCommon.length > 0 ? (
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    ({hubCommon})
                  </p>
                ) : null;

              if (row.plants.length === 0) return null;

              if (row.plants.length === 1) {
                const top = row.plants[0]!;
                return (
                  <div key={row.countryCode}>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      {flag ? (
                        <span className="shrink-0" aria-hidden="true">
                          {flag}
                        </span>
                      ) : null}
                      <span className="font-medium text-stone-900 dark:text-stone-100">
                        {label}
                      </span>
                      <span className="text-stone-400 dark:text-stone-500" aria-hidden="true">
                        →
                      </span>
                      <Link
                        href={localePath(lang, `/plant/${top.id}`)}
                        className="italic text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
                      >
                        {top.scientific_name}
                      </Link>
                    </div>
                    {microLine}
                  </div>
                );
              }

              return (
                <div key={row.countryCode}>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    {flag ? (
                      <span className="shrink-0" aria-hidden="true">
                        {flag}
                      </span>
                    ) : null}
                    <span className="font-medium text-stone-900 dark:text-stone-100">
                      {label}
                    </span>
                    <span className="text-stone-400 dark:text-stone-500" aria-hidden="true">
                      →
                    </span>
                  </div>
                  <ul className="mt-1.5 list-none space-y-1 pl-1 sm:pl-6">
                    {row.plants.map((p) => (
                      <li key={p.id} className="flex gap-2">
                        <span className="text-stone-400 dark:text-stone-500" aria-hidden="true">
                          •
                        </span>
                        <Link
                          href={localePath(lang, `/plant/${p.id}`)}
                          className="italic text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
                        >
                          {p.scientific_name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {microLine}
                </div>
              );
            })}
          </div>
          <p className="mt-3">
            <a
              href="#country-resolution"
              className="text-sm font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
            >
              {lang === "es"
                ? "Ver todos los países y variaciones →"
                : "See all countries and variations →"}
            </a>
          </p>
        </section>
      ) : null}

      {hasMatches ? (
        <div id="country-resolution" className="mt-8 scroll-mt-20 space-y-0">
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
      ) : null}

      {hasMatches ? (
        <div className="mt-6 border-b border-stone-200 pb-6 dark:border-stone-800">
          <CountryContextSelector
            lang={lang}
            slug={nameSlug}
            value={normalizedCountry ?? undefined}
            options={countryOptions}
          />
          {normalized && normalized !== queryLabel ? (
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
        </div>
      ) : (
        <header className="border-b border-stone-200 pb-8 dark:border-stone-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-xl font-semibold leading-snug tracking-tight text-stone-900 dark:text-stone-100 sm:text-2xl md:text-3xl">
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
        </header>
      )}

      {hasMatches && plantContexts.length > 1 ? (
        <section className="mt-8" aria-labelledby="name-alternatives-heading">
          <h2
            id="name-alternatives-heading"
            className="text-sm font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400"
          >
            {t(lang, "name_alternatives_h2")}
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {plantContexts.slice(1).map((ctx) => (
              <li key={ctx.plant.id}>
                <Link
                  href={localePath(lang, `/plant/${ctx.plant.id}`)}
                  className="italic text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
                >
                  {ctx.plant.scientific_name}
                </Link>
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

      {hasMatches ? (
        <section
          className="mt-12"
          aria-label={t(lang, "options_section_aria")}
        >
          <h2
            id="hub-species-heading"
            className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-2xl"
          >
            {ti(lang, "name_hub_matches_h2", { name: titleName })}
          </h2>
          <NameHubPlantQuickLinks lang={lang} plantContexts={plantContexts} />
          <p className="sr-only">
            {ti(lang, "options_heading", {
              count: String(plantContexts.length),
            })}
          </p>

          {plantContexts.length === 0 ? (
            <p className="mt-6 text-sm text-stone-600 dark:text-stone-400">
              {t(lang, "name_no_matches_title")}
            </p>
          ) : (
            <ul className="mt-8 flex flex-col gap-12">
              {plantContexts.map(({ plant, confidence }, index) => {
                const tier = getNameHubConfidenceTier(confidence);
                const cardShell =
                  tier === "most_likely"
                    ? "rounded-2xl border-2 border-emerald-500/45 bg-white px-6 py-6 shadow-md shadow-emerald-900/5 ring-2 ring-emerald-500/15 dark:border-emerald-500/40 dark:bg-stone-900/40 dark:shadow-black/25 dark:ring-emerald-500/20"
                    : tier === "strong_regional"
                      ? "rounded-2xl border border-amber-400/55 bg-amber-50/40 px-6 py-6 shadow-sm ring-1 ring-amber-500/15 dark:border-amber-600/40 dark:bg-amber-950/20 dark:ring-amber-500/10"
                      : "rounded-2xl border border-stone-200 bg-white px-6 py-6 shadow-sm dark:border-stone-600 dark:bg-stone-900/40 dark:shadow-black/20";
                const global = getPlantGlobalData(plant.id);
                const countriesForCard = getPlantCountryCodesSorted(
                  plant.id,
                  names,
                  lang
                );
                return (
                  <li key={plant.id} className="list-none">
                    <div className={cardShell}>
                      <PlantCard
                        lang={lang}
                        plant={plant}
                        headingLevel="h3"
                        frameless
                        commonCountries={countriesForCard}
                        userCountry={normalizedCountry ?? undefined}
                        alsoKnownAs={global.names}
                        deferImage
                        hideFamilyRow
                        suppressDecisionExplanations
                        hubStyleCard
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

      {hasMatches && plantContexts.length > 0 ? (
        <NameGlobalNameNetworkSection lang={lang} plantContexts={plantContexts} />
      ) : null}

      {hasMatches ? (
        <NameClusterUses
          lang={lang}
          displayName={titleName}
          useKeys={useKeys}
          listOnly
        />
      ) : null}

      {hasMatches ? (
        <div className="mt-10">
          <NameProgrammaticSeoBlocks
            lang={lang}
            displayName={titleName}
            hasMatches
            plantContexts={plantContexts}
            ambiguity={ambiguity}
          />
        </div>
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
        selectedCountry={normalizedCountry ?? undefined}
      />
    </div>
  );
}
