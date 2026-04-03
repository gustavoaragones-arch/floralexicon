import type { Plant } from "@/lib/data";
import { formatRegionList, joinCountryNames } from "@/lib/countries";
import { PlantReferenceImage } from "@/components/PlantReferenceImage";
import {
  buildHowItDiffers,
  buildWhenToChooseText,
} from "@/components/plantDecisionCopy";
import { localePath, ti, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

type PlantCardProps = {
  lang: Locale;
  plant: Plant;
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
};

export function PlantCard({
  lang,
  plant,
  variant = "compact",
  headingLevel = "h2",
  showLink = true,
  frameless = false,
  commonCountries,
  userCountry,
  decisionAssist,
}: PlantCardProps) {
  const TitleTag = headingLevel;
  const uses = plant.primary_uses.join(", ");

  const region = userCountry?.trim().toUpperCase();
  const matchesUserRegion =
    region &&
    commonCountries?.some((c) => c.toUpperCase() === region) === true;

  const whenText =
    decisionAssist &&
    buildWhenToChooseText({
      lang,
      queryLabel: decisionAssist.queryLabel,
      plant,
      commonCountries,
      userCountry,
    });

  const differsText =
    decisionAssist &&
    buildHowItDiffers({
      lang,
      plant,
      siblingPlants: decisionAssist.siblingPlants,
      queryLabel: decisionAssist.queryLabel,
    });

  const plantHref = localePath(lang, `/plant/${plant.id}`);

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

  const shell = frameless
    ? "px-0 py-0"
    : "rounded-2xl border border-stone-200 bg-white/70 px-5 py-4 shadow-sm dark:border-stone-700 dark:bg-stone-900/40";

  return (
    <article className={shell}>
      {decisionAssist ? (
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
          {ti(lang, "possible_match", { n: String(decisionAssist.matchNumber) })}
        </p>
      ) : null}

      <div className={decisionAssist ? "mb-6" : frameless ? "mb-5" : "mb-4"}>
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

      {commonCountries && commonCountries.length > 0 ? (
        <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
          <span className="text-stone-500 dark:text-stone-500">
            {t(lang, "common_in")}{" "}
          </span>
          {joinCountryNames(commonCountries, lang)}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        <span className="text-stone-500 dark:text-stone-500">
          {t(lang, "family")}{" "}
        </span>
        {plant.family}
      </p>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        <span className="text-stone-500 dark:text-stone-500">
          {t(lang, "uses")}{" "}
        </span>
        <span className="capitalize">{uses}</span>
      </p>
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
