import { CountryContextSelector } from "@/components/CountryContextSelector";
import { PlantCard } from "@/components/PlantCard";
import { formatRegionList } from "@/lib/countries";
import { getPlantGlobalData, plantNameHubSlug } from "@/lib/data";
import { localePath, t, ti, type Locale } from "@/lib/i18n";
import type { PlantNameMatch, ResolvedPlantContext } from "@/lib/resolver";
import Link from "next/link";

const prose =
  "text-sm leading-relaxed text-stone-600 dark:text-stone-400";

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

function formatUsesLine(lang: Locale, keys: string[]): string {
  if (keys.length === 0) return t(lang, "hub_uses_none");
  const labels = keys.map((k) => {
    switch (k) {
      case "tea":
        return t(lang, "hub_use_tea");
      case "medicinal":
        return t(lang, "hub_use_medicinal");
      case "ritual":
        return t(lang, "hub_use_ritual");
      case "culinary":
        return t(lang, "hub_use_culinary");
      case "aromatic":
        return t(lang, "hub_use_aromatic");
      default:
        return k.charAt(0).toUpperCase() + k.slice(1);
    }
  });
  return labels.join(", ");
}

type NameCountryHubProps = {
  lang: Locale;
  displayName: string;
  countryLabel: string;
  countryCode: string;
  nameCanonicalSlug: string;
  countryOptions: string[];
  plantContexts: ResolvedPlantContext[];
  matches: PlantNameMatch[];
};

export function NameCountryHub({
  lang,
  displayName,
  countryLabel,
  countryCode,
  nameCanonicalSlug,
  countryOptions,
  plantContexts,
  matches,
}: NameCountryHubProps) {
  const titleName = displayName.trim();
  const useKeys = aggregateUseKeys(plantContexts);
  const siblingPlants = plantContexts
    .map((c) => c.plant)
    .filter((p): p is NonNullable<typeof p> => p != null);
  const primary = plantContexts[0];
  const entryName =
    matches[0]?.name_entry.name.trim() || titleName;
  const primaryGlobalNames = primary
    ? getPlantGlobalData(primary.plant_id, {
        pageNameSlug: nameCanonicalSlug,
        queryDisplay: titleName,
      }).names
    : [];

  return (
    <div>
      <nav className="text-xs text-stone-500 dark:text-stone-500">
        <Link
          href={localePath(lang, `/name/${nameCanonicalSlug}`)}
          className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400"
        >
          {t(lang, "name_country_breadcrumb_hub")}
        </Link>
        <span className="mx-1.5">/</span>
        <span>{countryLabel}</span>
      </nav>

      <header className="mt-6 border-b border-stone-200 pb-8 dark:border-stone-800">
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-500">
          {t(lang, "name_country_kicker")}
        </p>
        <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-3xl md:text-4xl">
          {ti(lang, "name_country_h1", {
            name: titleName,
            country: countryLabel,
          })}
        </h1>
        <p className={`mt-4 max-w-2xl ${prose}`}>
          {ti(lang, "name_country_intro", {
            name: titleName,
            country: countryLabel,
          })}
        </p>
      </header>

      <CountryContextSelector
        lang={lang}
        slug={nameCanonicalSlug}
        value={countryCode}
        options={countryOptions}
      />

      {primary ? (
        <section className="mt-10" aria-labelledby="country-primary-heading">
          <h2
            id="country-primary-heading"
            className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
          >
            {t(lang, "name_country_primary_heading")}
          </h2>
          <p className={`mt-2 ${prose}`}>
            {ti(lang, "name_country_primary_lead", {
              scientific:
                primary.plant?.scientific_name ??
                t(lang, "plant_placeholder_title"),
              name: entryName,
              country: countryLabel,
            })}
          </p>
          <div className="mt-6 rounded-2xl border border-stone-200 bg-white px-6 py-6 shadow-sm dark:border-stone-600 dark:bg-stone-900/40">
            <PlantCard
              lang={lang}
              plant={primary.plant}
              indexingPlaceholder={Boolean(primary.isPlaceholder)}
              headingLevel="h3"
              frameless
              deferImage
              commonCountries={primary.countries}
              userCountry={countryCode}
              nameHubSlug={nameCanonicalSlug}
              hubStyleCard
              suppressDecisionExplanations
              alsoKnownAs={primaryGlobalNames}
              decisionAssist={{
                matchNumber: 1,
                queryLabel: titleName,
                siblingPlants,
              }}
              nameHubConfidence={{
                rankIndex: 0,
                totalMatches: plantContexts.length,
                confidence: primary.confidence,
                showPercent: true,
                global_agreement: primary.global_agreement,
                regional_strength: primary.regional_strength,
                selectedCountryIso: countryCode,
              }}
            />
          </div>
        </section>
      ) : null}

      {plantContexts.length > 1 ? (
        <section className="mt-12" aria-labelledby="country-alt-heading">
          <h2
            id="country-alt-heading"
            className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
          >
            {t(lang, "name_country_other_species_heading")}
          </h2>
          <ul className="mt-4 space-y-3">
            {plantContexts.slice(1).map((ctx) => (
              <li key={ctx.plant_id}>
                {ctx.plant && !ctx.isPlaceholder ? (
                  <>
                    <Link
                      href={`${localePath(
                        lang,
                        `/name/${plantNameHubSlug(ctx.plant.id, ctx.plant.scientific_name)}`
                      )}?country=${encodeURIComponent(countryCode)}`}
                      className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-400"
                    >
                      {ctx.plant.scientific_name}
                    </Link>
                    <span className="text-stone-500 dark:text-stone-500">
                      {" "}
                      · {ctx.plant.family}
                    </span>
                  </>
                ) : (
                  <span className="text-stone-800 dark:text-stone-200">
                    {t(lang, "plant_placeholder_title")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12 border-t border-stone-200 pt-10 dark:border-stone-800">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          {t(lang, "name_country_uses_heading")}
        </h2>
        <p className={`mt-3 capitalize ${prose}`}>
          {formatUsesLine(lang, useKeys)}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          {t(lang, "name_country_native_range_heading")}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-stone-700 dark:text-stone-300">
          {plantContexts.map((ctx) => (
            <li key={ctx.plant_id}>
              {ctx.plant && !ctx.isPlaceholder ? (
                <>
                  <span className="font-medium">{ctx.plant.scientific_name}:</span>{" "}
                  {formatRegionList(ctx.plant.origin_regions)}
                </>
              ) : (
                <span className="text-stone-700 dark:text-stone-300">
                  <span className="font-medium">
                    {t(lang, "plant_placeholder_title")}
                  </span>
                  <span className="text-stone-500"> — </span>
                  {t(lang, "plant_placeholder_subtitle")}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-12 text-sm">
        <Link
          href={localePath(lang, `/name/${nameCanonicalSlug}`)}
          className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-400"
        >
          {ti(lang, "name_country_hub_cta", { name: titleName })}
        </Link>
      </p>
    </div>
  );
}
