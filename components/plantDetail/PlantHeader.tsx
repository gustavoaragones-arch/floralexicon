import { PlantStructuredSafety } from "@/components/plantDetail/PlantStructuredSafety";
import type { NameIndexLink } from "@/lib/data";
import type { PlantDetailModel } from "@/lib/plantDetailData";
import { topTwoThemesForHeader } from "@/lib/plantIntroCopy";
import { joinCountryNames } from "@/lib/geo";
import { humanToxicityBand } from "@/lib/plantHumanLabels";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const nameLinkClass =
  "font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

type Props = {
  lang: Locale;
  model: PlantDetailModel;
  /** Indexed common-name hubs → `/name/[slug]` (full list for header). */
  alsoKnownLinks: NameIndexLink[];
};

export function PlantHeader({ lang, model, alsoKnownLinks }: Props) {
  const { core, merged, displayNames } = model;

  const topTwo = topTwoThemesForHeader(model, lang);
  const usedFor =
    topTwo.length > 0
      ? `${t(lang, "plant_detail_used_for")}: ${topTwo.join(" · ")}`
      : null;

  const countryCodes = merged?.countries?.length
    ? merged.countries
    : [];
  const commonInLine =
    countryCodes.length > 0
      ? `${t(lang, "plant_detail_common_in_label")} ${joinCountryNames(countryCodes, lang)}`
      : null;

  const toxLevel = merged?.toxicity?.level;
  const showToxicBadge = Boolean(toxLevel && toxLevel.toLowerCase() !== "unknown");
  const showLookalikeBadge = merged?.lookalike_risk === true;

  const fallbackNames =
    alsoKnownLinks.length === 0 && displayNames.length > 0
      ? displayNames.filter(
          (n) => n.trim().toLowerCase() !== core.scientific_name.trim().toLowerCase()
        )
      : [];

  return (
    <header className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
          {core.scientific_name}
        </h1>

        {alsoKnownLinks.length > 0 ? (
          <p className="mt-4 text-base leading-relaxed text-stone-800 dark:text-stone-200">
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              {t(lang, "plant_detail_also_known")}:{" "}
            </span>
            <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
              {alsoKnownLinks.map(({ slug, label }, i) => (
                <span key={slug}>
                  {i > 0 ? <span className="text-stone-400"> · </span> : null}
                  <Link href={localePath(lang, `/name/${slug}`)} className={nameLinkClass}>
                    {label}
                  </Link>
                </span>
              ))}
            </span>
          </p>
        ) : fallbackNames.length > 0 ? (
          <p className="mt-4 text-base text-stone-800 dark:text-stone-200">
            <span className="font-semibold text-stone-900 dark:text-stone-100">
              {t(lang, "plant_detail_also_known")}:{" "}
            </span>
            {fallbackNames.join(", ")}
          </p>
        ) : null}

        {commonInLine ? (
          <p className="mt-3 text-base text-stone-700 dark:text-stone-300">{commonInLine}</p>
        ) : null}

        {usedFor ? (
          <p className="mt-3 text-sm font-medium text-stone-900 dark:text-stone-100">{usedFor}</p>
        ) : null}

        <p className="mt-2 text-xs text-stone-500 dark:text-stone-500">
          {core.rank} · {t(lang, "type")}: {core.plant_type}
        </p>

        {showToxicBadge || showLookalikeBadge ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {showToxicBadge ? (
              <span className="inline-flex items-center rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100">
                {t(lang, "plant_detail_safety_badge_toxic")}:{" "}
                {humanToxicityBand(toxLevel, lang)}
              </span>
            ) : null}
            {showLookalikeBadge ? (
              <span className="inline-flex items-center rounded-full border border-amber-600/60 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-100">
                {t(lang, "plant_detail_safety_badge_lookalike")}
              </span>
            ) : null}
          </div>
        ) : null}

        <PlantStructuredSafety lang={lang} model={model} />
      </div>
    </header>
  );
}
