import { plantNameHubSlug, type NameIndexLink, type Plant } from "@/lib/data";
import { formatRegionList, joinCountryNames } from "@/lib/countries";
import { formatHumanUseKey, MAX_VISIBLE_NAMES } from "@/lib/nameHubDisplay";
import { PlantReferenceImage } from "@/components/PlantReferenceImage";
import {
  buildHowItDiffers,
  buildWhenToChooseText,
} from "@/components/plantDecisionCopy";
import { ConfidenceTooltipExplainer } from "@/components/ConfidenceTooltipExplainer";
import { nameHubMatchWhyLine } from "@/lib/nameHubMatchWhyLine";
import { localePath, ti, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

type PlantCardProps = {
  lang: Locale;
  /** Null when the name index lists a plant id not yet present in `plants.json`. */
  plant: Plant | null;
  /** When true with `plant === null`, show “not fully indexed” copy instead of species details. */
  indexingPlaceholder?: boolean;
  variant?: "compact" | "full";
  headingLevel?: "h1" | "h2" | "h3";
  showLink?: boolean;
  frameless?: boolean;
  commonCountries?: string[];
  userCountry?: string;
  /** Name-resolution UI: numbered option + decision copy (omit on plant detail page). */
  decisionAssist?: {
    matchNumber: number;
    queryLabel: string;
    siblingPlants: Plant[];
  };
  /** Name hub: confidence ranking + optional coverage percent. */
  nameHubConfidence?: {
    rankIndex: number;
    totalMatches: number;
    confidence: number;
    showPercent?: boolean;
    global_agreement?: number;
    regional_strength?: number;
    /** ISO for regional “dominant” branch; falls back to `userCountry`. */
    selectedCountryIso?: string | null;
  };
  /** Other indexed common names for this species (name hub cards). */
  alsoKnownAs?: NameIndexLink[];
  /** Put illustration after text so the common name / region story leads. */
  deferImage?: boolean;
  /** Omit family line on name-hub match cards (keep focus on verification fields). */
  hideFamilyRow?: boolean;
  /** Name hub: hide “when to choose / how it differs” copy for a scannable decision layout. */
  suppressDecisionExplanations?: boolean;
  /** Name hub match cards: evidence-first layout (countries → aliases → uses → confidence → image). */
  hubStyleCard?: boolean;
  /** When set, the species title links to this name hub (same hub for all match cards). */
  nameHubSlug?: string;
};

export function PlantCard({
  lang,
  plant,
  indexingPlaceholder = false,
  variant = "compact",
  headingLevel = "h2",
  showLink = true,
  frameless = false,
  commonCountries,
  userCountry,
  decisionAssist,
  nameHubConfidence,
  alsoKnownAs,
  deferImage = false,
  hideFamilyRow = false,
  suppressDecisionExplanations = false,
  hubStyleCard = false,
  nameHubSlug,
}: PlantCardProps) {
  const TitleTag = headingLevel;

  if (indexingPlaceholder && !plant) {
    const shell = frameless
      ? "px-0 py-0"
      : "rounded-2xl border border-stone-200 bg-white/70 px-5 py-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/40";
    const topCountryCodes = (commonCountries ?? []).slice(0, 4);
    return (
      <article className={shell}>
        <TitleTag className="font-serif text-xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-2xl dark:text-stone-100">
          {t(lang, "plant_placeholder_title")}
        </TitleTag>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {t(lang, "plant_placeholder_subtitle")}
        </p>
        {topCountryCodes.length > 0 ? (
          <p className="mt-4 text-sm text-stone-700 dark:text-stone-300">
            <span aria-hidden="true" className="mr-1">
              ✅
            </span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {t(lang, "plantcard_most_common_in")}{" "}
            </span>
            {joinCountryNames(topCountryCodes, lang)}
          </p>
        ) : null}
      </article>
    );
  }

  if (!plant) {
    return null;
  }

  if (plant.isGhost) {
    const shell = [
      frameless
        ? "px-0 py-0"
        : "rounded-2xl border border-stone-200 bg-white/70 px-5 py-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/40",
      deferImage ? "flex flex-col" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const topCountryCodes = (commonCountries ?? []).slice(0, 12);
    const nameSlugResolved =
      nameHubSlug ?? plantNameHubSlug(plant.id, plant.scientific_name);
    const plantHref = localePath(lang, `/name/${nameSlugResolved}`);
    const ghostTitle = showLink ? (
      <Link
        href={plantHref}
        className="font-serif text-xl font-semibold italic leading-tight tracking-tight text-stone-900 underline decoration-stone-300 underline-offset-[3px] hover:text-flora-forest hover:decoration-flora-forest dark:text-stone-100 dark:decoration-stone-600 dark:hover:text-emerald-300 sm:text-2xl"
      >
        {plant.scientific_name}
      </Link>
    ) : (
      <span className="font-serif text-xl font-semibold italic leading-tight tracking-tight text-stone-900 sm:text-2xl dark:text-stone-100">
        {plant.scientific_name}
      </span>
    );

    const commonNamesBlock =
      alsoKnownAs && alsoKnownAs.length > 0 ? (
        <div className="mt-4 text-sm text-stone-700 dark:text-stone-300">
          <p className="font-semibold text-stone-800 dark:text-stone-200">
            {t(lang, "common_names_label")}
          </p>
          <p className="mt-2 inline-flex flex-wrap gap-x-2 gap-y-1">
            {alsoKnownAs.slice(0, MAX_VISIBLE_NAMES).map(({ slug, label }, i) => (
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
          </p>
          {alsoKnownAs.length > MAX_VISIBLE_NAMES ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-flora-forest hover:underline dark:text-emerald-300">
                {ti(lang, "name_also_known_show_all", {
                  n: String(alsoKnownAs.length - MAX_VISIBLE_NAMES),
                })}
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {alsoKnownAs.slice(MAX_VISIBLE_NAMES).map(({ slug, label }) => (
                  <li key={slug}>
                    <Link
                      href={localePath(lang, `/name/${slug}`)}
                      className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null;

    return (
      <article className={shell}>
        <div className="flex flex-wrap items-start gap-2">
          <TitleTag className="min-w-0 flex-1">{ghostTitle}</TitleTag>
          <span className="inline-flex shrink-0 items-center rounded-md border border-violet-400/40 bg-violet-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-950 dark:border-violet-500/35 dark:bg-violet-950/40 dark:text-violet-100">
            {t(lang, "plant_limited_data_badge")}
          </span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          {t(lang, "plant_ghost_mapping_note")}
        </p>
        {topCountryCodes.length > 0 ? (
          <p className="mt-4 text-sm text-stone-700 dark:text-stone-300">
            <span aria-hidden="true" className="mr-1">
              ✅
            </span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {t(lang, "plantcard_most_common_in")}{" "}
            </span>
            {joinCountryNames(topCountryCodes, lang)}
          </p>
        ) : null}
        {commonNamesBlock}
      </article>
    );
  }

  const uses = plant.primary_uses.join(", ");

  const region = userCountry?.trim().toUpperCase();
  const matchesUserRegion =
    region &&
    commonCountries?.some((c) => c.toUpperCase() === region) === true;

  const whenText =
    !suppressDecisionExplanations &&
    decisionAssist &&
    buildWhenToChooseText({
      lang,
      queryLabel: decisionAssist.queryLabel,
      plant,
      commonCountries,
      userCountry,
    });

  const differsText =
    !suppressDecisionExplanations &&
    decisionAssist &&
    buildHowItDiffers({
      lang,
      plant,
      siblingPlants: decisionAssist.siblingPlants,
      queryLabel: decisionAssist.queryLabel,
    });

  const nameSlugResolved =
    nameHubSlug ?? plantNameHubSlug(plant.id, plant.scientific_name);
  const plantHref = localePath(lang, `/name/${nameSlugResolved}`);

  const title = showLink ? (
    <Link
      href={plantHref}
      className="text-stone-900 underline decoration-stone-300 underline-offset-[3px] hover:text-flora-forest hover:decoration-flora-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-flora-forest/30 dark:text-stone-100 dark:decoration-stone-600 dark:hover:text-emerald-300 dark:hover:decoration-emerald-400"
    >
      {plant.scientific_name}
    </Link>
  ) : (
    <span className="text-stone-900 dark:text-stone-100">
      {plant.scientific_name}
    </span>
  );

  const shell = [
    frameless
      ? "px-0 py-0"
      : "rounded-2xl border border-stone-200 bg-white/70 px-5 py-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/40",
    deferImage ? "flex flex-col" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const hubEvidence = hubStyleCard && suppressDecisionExplanations;
  const topCountryCodes = (commonCountries ?? []).slice(0, 4);
  const humanUses = Array.from(
    new Set(plant.primary_uses.map((u) => u.trim().toLowerCase()).filter(Boolean))
  )
    .sort()
    .map((k) => formatHumanUseKey(lang, k))
    .filter(Boolean);

  const imageBlock = (
    <div
      className={
        deferImage
          ? `${decisionAssist && !suppressDecisionExplanations ? "mb-6" : frameless ? "mb-5" : "mb-4"} mt-6`
          : `${decisionAssist && !suppressDecisionExplanations ? "mb-6" : frameless ? "mb-5" : "mb-4"}`
      }
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-500">
        {t(lang, "visual_reference")}
      </p>
      <PlantReferenceImage
        plantId={plant.id}
        scientificName={plant.scientific_name}
        queryLabel={decisionAssist?.queryLabel}
        primaryUses={plant.primary_uses}
        plantType={plant.plant_type}
      />
    </div>
  );

  const confidenceBlock = nameHubConfidence ? (
    <div className="mt-4">
      {nameHubConfidence.showPercent ? (
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
          <span>
            {ti(lang, "name_confidence_percent", {
              percent: String(Math.round(nameHubConfidence.confidence * 100)),
            })}{" "}
            {t(lang, "name_hub_score_suffix")}
          </span>
          <ConfidenceTooltipExplainer lang={lang} />
        </div>
      ) : null}
      <p
        className={
          nameHubConfidence.showPercent
            ? "mt-2 text-sm text-stone-600 dark:text-stone-400"
            : "text-sm text-stone-600 dark:text-stone-400"
        }
      >
        {nameHubMatchWhyLine(
          lang,
          nameHubConfidence.regional_strength ?? 0,
          nameHubConfidence.global_agreement ?? 0,
          nameHubConfidence.selectedCountryIso ?? userCountry ?? null
        )}
      </p>
    </div>
  ) : null;

  if (hubEvidence) {
    return (
      <article className={shell}>
        <div className="flex flex-wrap items-start gap-2">
          <TitleTag className="font-serif text-xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-2xl dark:text-stone-100">
            {title}
          </TitleTag>
          {matchesUserRegion ? (
            <span className="inline-flex shrink-0 items-center rounded border border-green-600/40 bg-green-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-green-900 dark:border-green-500/50 dark:bg-green-950 dark:text-green-200">
              {t(lang, "region_badge")}
            </span>
          ) : null}
        </div>

        {topCountryCodes.length > 0 ? (
          <p className="mt-4 text-sm text-stone-700 dark:text-stone-300">
            <span aria-hidden="true" className="mr-1">
              ✅
            </span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {t(lang, "plantcard_most_common_in")}{" "}
            </span>
            {joinCountryNames(topCountryCodes, lang)}
          </p>
        ) : null}

        {alsoKnownAs && alsoKnownAs.length > 0 ? (
          <div className="mt-4 text-sm text-stone-700 dark:text-stone-300">
            <p className="font-semibold text-stone-800 dark:text-stone-200">
              {t(lang, "common_names_label")}
            </p>
            <p className="mt-2 inline-flex flex-wrap gap-x-2 gap-y-1">
              {alsoKnownAs.slice(0, MAX_VISIBLE_NAMES).map(({ slug, label }, i) => (
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
            </p>
            {alsoKnownAs.length > MAX_VISIBLE_NAMES ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-flora-forest hover:underline dark:text-emerald-300">
                  {ti(lang, "name_also_known_show_all", {
                    n: String(alsoKnownAs.length - MAX_VISIBLE_NAMES),
                  })}
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {alsoKnownAs.slice(MAX_VISIBLE_NAMES).map(({ slug, label }) => (
                    <li key={slug}>
                      <Link
                        href={localePath(lang, `/name/${slug}`)}
                        className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400"
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

        {humanUses.length > 0 ? (
          <div className="mt-4 text-sm text-stone-700 dark:text-stone-300">
            <p className="font-semibold text-stone-800 dark:text-stone-200">
              {t(lang, "plantcard_used_for")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {humanUses.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {confidenceBlock}

        {deferImage ? imageBlock : null}
        {!hideFamilyRow ? (
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
            <span className="text-stone-500 dark:text-stone-500">
              {t(lang, "family")}{" "}
            </span>
            {plant.family}
          </p>
        ) : null}
        {variant === "full" ? (
          <dl className="mt-4 space-y-1 border-t border-stone-200 pt-4 text-sm text-stone-600 dark:border-stone-800 dark:text-stone-400">
            <div>
              <dt className="inline text-stone-500 dark:text-stone-500">
                {t(lang, "genus")}{" "}
              </dt>
              <dd className="inline">{plant.genus}</dd>
            </div>
            <div>
              <dt className="inline text-stone-500 dark:text-stone-500">
                {t(lang, "rank")}{" "}
              </dt>
              <dd className="inline capitalize">{plant.rank}</dd>
            </div>
            <div>
              <dt className="inline text-stone-500 dark:text-stone-500">
                {t(lang, "type")}{" "}
              </dt>
              <dd className="inline capitalize">{plant.plant_type}</dd>
            </div>
            <div>
              <dt className="text-stone-500 dark:text-stone-500">
                {t(lang, "origin")}
              </dt>
              <dd className="mt-0.5">{formatRegionList(plant.origin_regions)}</dd>
            </div>
          </dl>
        ) : null}
      </article>
    );
  }

  return (
    <article className={shell}>
      {decisionAssist && !suppressDecisionExplanations ? (
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
          {ti(lang, "possible_match", { n: String(decisionAssist.matchNumber) })}
        </p>
      ) : null}

      {!deferImage ? imageBlock : null}

      <div className="flex flex-wrap items-start gap-2">
        <TitleTag
          className={
            decisionAssist
              ? "font-serif text-xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-2xl dark:text-stone-100"
              : headingLevel === "h1"
                ? "font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-100"
                : "text-base font-semibold tracking-tight text-stone-900 dark:text-stone-100"
          }
        >
          {title}
        </TitleTag>
        {matchesUserRegion ? (
          <span className="inline-flex shrink-0 items-center rounded border border-green-600/40 bg-green-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-green-900 dark:border-green-500/50 dark:bg-green-950 dark:text-green-200">
            {t(lang, "region_badge")}
          </span>
        ) : null}
      </div>

      {whenText ? (
        <section className="mt-6 rounded-xl border border-stone-200 bg-white/90 px-4 py-3 dark:border-stone-700 dark:bg-stone-950/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            {t(lang, "when_correct_title")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {whenText}
          </p>
        </section>
      ) : null}

      {differsText ? (
        <section className="mt-4 rounded-xl border border-stone-200 bg-flora-sage/40 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/50">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            {t(lang, "how_differs_title")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {differsText}
          </p>
        </section>
      ) : null}

      {alsoKnownAs && alsoKnownAs.length > 0 ? (
        <div className="mt-4 text-sm text-stone-600 dark:text-stone-400">
          <p>
            <span className="font-medium text-stone-700 dark:text-stone-300">
              {t(lang, "common_names_label")}{" "}
            </span>
            <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
              {alsoKnownAs.slice(0, MAX_VISIBLE_NAMES).map(({ slug, label }, i) => (
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
          </p>
          {alsoKnownAs.length > MAX_VISIBLE_NAMES ? (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-flora-forest hover:underline dark:text-emerald-300">
                {ti(lang, "name_also_known_show_all", {
                  n: String(alsoKnownAs.length - MAX_VISIBLE_NAMES),
                })}
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-700 dark:text-stone-300">
                {alsoKnownAs.slice(MAX_VISIBLE_NAMES).map(({ slug, label }) => (
                  <li key={slug}>
                    <Link
                      href={localePath(lang, `/name/${slug}`)}
                      className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400"
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

      {commonCountries && commonCountries.length > 0 ? (
        <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
          <span className="text-stone-500 dark:text-stone-500">
            {t(lang, "common_in")}{" "}
          </span>
          {joinCountryNames(commonCountries, lang)}
        </p>
      ) : null}

      <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
        <span className="text-stone-500 dark:text-stone-500">
          {t(lang, "uses")}{" "}
        </span>
        <span className="capitalize">{uses}</span>
      </p>

      {confidenceBlock}

      {deferImage ? imageBlock : null}
      {!hideFamilyRow ? (
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          <span className="text-stone-500 dark:text-stone-500">
            {t(lang, "family")}{" "}
          </span>
          {plant.family}
        </p>
      ) : null}
      {variant === "full" ? (
        <dl className="mt-4 space-y-1 border-t border-stone-200 pt-4 text-sm text-stone-600 dark:border-stone-800 dark:text-stone-400">
          <div>
            <dt className="inline text-stone-500 dark:text-stone-500">
              {t(lang, "genus")}{" "}
            </dt>
            <dd className="inline">{plant.genus}</dd>
          </div>
          <div>
            <dt className="inline text-stone-500 dark:text-stone-500">
              {t(lang, "rank")}{" "}
            </dt>
            <dd className="inline capitalize">{plant.rank}</dd>
          </div>
          <div>
            <dt className="inline text-stone-500 dark:text-stone-500">
              {t(lang, "type")}{" "}
            </dt>
            <dd className="inline capitalize">{plant.plant_type}</dd>
          </div>
          <div>
            <dt className="text-stone-500 dark:text-stone-500">
              {t(lang, "origin")}
            </dt>
            <dd className="mt-0.5">{formatRegionList(plant.origin_regions)}</dd>
          </div>
        </dl>
      ) : null}
    </article>
  );
}
