import { PlantStructuredSafety } from "@/components/plantDetail/PlantStructuredSafety";
import type { PlantDetailModel } from "@/lib/plantDetailData";
import { buildDefinitionalLines, topTwoThemesForHeader } from "@/lib/plantIntroCopy";
import { humanToxicityBand } from "@/lib/plantHumanLabels";
import { t, type Locale } from "@/lib/i18n";

type Props = {
  lang: Locale;
  model: PlantDetailModel;
};

export function PlantHeader({ lang, model }: Props) {
  const { core, merged, displayNames } = model;

  const topTwo = topTwoThemesForHeader(model, lang);
  const usedFor =
    topTwo.length > 0
      ? `${t(lang, "plant_detail_used_for")}: ${topTwo.join(" · ")}`
      : null;

  const { line1, line2 } = buildDefinitionalLines(model, lang);

  const synonymPool = displayNames.filter(
    (n) => n.trim().toLowerCase() !== core.scientific_name.trim().toLowerCase()
  );
  const alsoKnown = synonymPool.slice(0, 3);
  const alsoKnownLine =
    alsoKnown.length > 0
      ? `${t(lang, "plant_detail_also_known")}: ${alsoKnown.join(", ")}`
      : null;

  const toxLevel = merged?.toxicity?.level;
  const showToxicBadge = Boolean(toxLevel && toxLevel.toLowerCase() !== "unknown");
  const showLookalikeBadge = merged?.lookalike_risk === true;

  return (
    <header className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
          {core.scientific_name}
        </h1>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
          {core.rank} · {t(lang, "type")}
        </p>

        {displayNames.length > 0 ? (
          <p className="mt-3 line-clamp-2 text-base text-stone-700 dark:text-stone-300">
            <span className="font-medium text-stone-900 dark:text-stone-200">
              {t(lang, "plant_detail_common_names")}:{" "}
            </span>
            {displayNames.join(", ")}
          </p>
        ) : null}

        <div className="mt-4 max-w-3xl space-y-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <p>{line1}</p>
          {line2 ? <p>{line2}</p> : null}
        </div>

        {usedFor ? (
          <p className="mt-4 text-sm font-medium text-stone-900 dark:text-stone-100">{usedFor}</p>
        ) : null}

        {alsoKnownLine ? (
          <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">{alsoKnownLine}</p>
        ) : null}

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
