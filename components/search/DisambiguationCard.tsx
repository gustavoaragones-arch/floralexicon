"use client";

import dynamic from "next/dynamic";
import {
  confidenceBarVisualPercent,
  type DisambiguationRow,
} from "@/lib/search";
import { ViewPlantLink } from "@/components/search/ViewPlantLink";
import { localePath, t, ti, type I18nKey, type Locale } from "@/lib/i18n";
import Link from "next/link";

const WhyDetailsLazy = dynamic(() => import("./WhyDetails"), {
  ssr: false,
  loading: () => null,
});

const barBg: Record<DisambiguationRow["barLevel"], string> = {
  high: "bg-emerald-500 dark:bg-emerald-600",
  medium: "bg-amber-500 dark:bg-amber-500",
  low: "bg-stone-400 dark:bg-stone-500",
};

const tierI18n: Record<DisambiguationRow["tier"], I18nKey> = {
  most_likely: "search_tier_most_likely",
  possible: "search_tier_possible",
  less_common: "search_tier_less_common",
};

const barLabelI18n: Record<DisambiguationRow["barLevel"], I18nKey> = {
  high: "search_conf_bar_high",
  medium: "search_conf_bar_medium",
  low: "search_conf_bar_low",
};

const evidenceI18n: Record<DisambiguationRow["evidenceKey"], I18nKey> = {
  clinical: "search_evidence_clinical",
  tramil: "search_evidence_tramil",
  traditional: "search_evidence_traditional",
};

function inlineConfidenceLineText(
  lang: Locale,
  line: NonNullable<DisambiguationRow["inlineConfidenceLine"]>
): string {
  return line.i18nKey === "search_inline_reason_usage"
    ? t(lang, line.i18nKey)
    : ti(lang, line.i18nKey, line.vars);
}

/** Max two visible tokens: region/usage + evidence, or tier + evidence. */
function inlineWhySummaryText(lang: Locale, row: DisambiguationRow): string {
  const ev = t(lang, evidenceI18n[row.evidenceKey]);
  if (row.inlineConfidenceLine) {
    return `${inlineConfidenceLineText(lang, row.inlineConfidenceLine)} · ${ev}`;
  }
  return `${t(lang, tierI18n[row.tier])} · ${ev}`;
}

type Props = {
  lang: Locale;
  row: DisambiguationRow;
  index: number;
  showIndex?: boolean;
  /** Canonical hub key for click tracking (space-normalized). */
  hubKey?: string;
  isWhyOpen: boolean;
  onWhyOpenChange: (open: boolean) => void;
};

export function DisambiguationCard({
  lang,
  row,
  index,
  showIndex,
  hubKey = "",
  isWhyOpen,
  onWhyOpenChange,
}: Props) {
  const { plant, displayName, confidence, confidencePercent, tier, barLevel } =
    row;
  const barVisualPct = confidenceBarVisualPercent(confidence);

  const plantHref = localePath(lang, `/plant/${plant.id}`);
  const linkClass =
    "inline-flex min-h-11 items-center justify-center rounded-full border border-flora-forest bg-flora-forest px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:border-flora-forest-hover hover:bg-flora-forest-hover dark:border-emerald-600 dark:bg-emerald-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-600";

  return (
    <article className="rounded-2xl border border-stone-200 bg-white px-5 py-5 shadow-sm dark:border-stone-700 dark:bg-stone-950/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {showIndex ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {index + 1}.
            </p>
          ) : null}
          <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {plant.scientific_name}
          </h2>
          {displayName &&
          displayName.trim().toLowerCase() !==
            plant.scientific_name.trim().toLowerCase() ? (
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              ({displayName})
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {row.safetyMicroBadgeKey ? (
            <div className="flex flex-col items-end gap-0.5 text-right">
              <span className="rounded-md border border-amber-200/90 bg-amber-50/90 px-2 py-0.5 text-[11px] font-medium leading-tight text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/35 dark:text-amber-100">
                {t(lang, row.safetyMicroBadgeKey)}
              </span>
              {row.safetySupportLineKey ? (
                <p className="max-w-[14rem] text-[10px] font-medium leading-snug text-amber-900/75 dark:text-amber-100/65">
                  {t(lang, row.safetySupportLineKey)}
                </p>
              ) : null}
            </div>
          ) : null}
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              tier === "most_likely"
                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                : tier === "possible"
                  ? "bg-amber-100 text-amber-950 dark:bg-amber-950/80 dark:text-amber-100"
                  : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200"
            }`}
          >
            {t(lang, tierI18n[tier])}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
          <span>{t(lang, "search_confidence_visual")}</span>
          <span>
            {t(lang, barLabelI18n[barLevel])} · {confidencePercent}%
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div
            className={`h-full min-w-[4px] rounded-full transition-[width] ${barBg[barLevel]}`}
            style={{ width: `${barVisualPct}%` }}
            title={`${confidencePercent}%`}
          />
        </div>
        {row.inlineConfidenceLine ? (
          <p className="mt-2 text-xs font-medium text-stone-600 dark:text-stone-400">
            {row.inlineConfidenceLine.i18nKey === "search_inline_reason_usage"
              ? t(lang, row.inlineConfidenceLine.i18nKey)
              : ti(
                  lang,
                  row.inlineConfidenceLine.i18nKey,
                  row.inlineConfidenceLine.vars
                )}
          </p>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
        {inlineWhySummaryText(lang, row)}
      </p>

      {row.showSafetyRow || row.isAbortifacient ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100">
          <span aria-hidden>⚠️</span>
          <span>
            {row.isAbortifacient
              ? t(lang, "search_safety_abort")
              : t(lang, "search_safety_toxic")}
          </span>
        </p>
      ) : null}

      <details
        className="mt-4 rounded-lg border border-stone-200 bg-stone-50/80 dark:border-stone-700 dark:bg-stone-900/40"
        open={isWhyOpen}
        onToggle={(e) => onWhyOpenChange(e.currentTarget.open)}
      >
        <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-semibold text-stone-800 dark:text-stone-200">
          {t(lang, "search_why_heading")}
        </summary>
        {isWhyOpen ? (
          <WhyDetailsLazy lang={lang} bullets={row.whyBullets} />
        ) : null}
      </details>

      <dl className="mt-4 grid gap-2 text-sm text-stone-600 dark:text-stone-400">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-stone-800 dark:text-stone-200">
            {t(lang, "search_facts_family")}
          </dt>
          <dd>{plant.family}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-stone-800 dark:text-stone-200">
            {t(lang, "search_facts_region")}
          </dt>
          <dd>
            {plant.origin_regions.length
              ? plant.origin_regions.join(", ")
              : "—"}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-stone-800 dark:text-stone-200">
            {t(lang, "search_facts_evidence")}
          </dt>
          <dd>{t(lang, evidenceI18n[row.evidenceKey])}</dd>
        </div>
      </dl>

      <div className="mt-5">
        {hubKey.trim() ? (
          <ViewPlantLink
            href={plantHref}
            hubKey={hubKey}
            plantId={plant.id}
            className={linkClass}
          >
            {t(lang, "search_view_plant")}
          </ViewPlantLink>
        ) : (
          <Link href={plantHref} className={linkClass}>
            {t(lang, "search_view_plant")}
          </Link>
        )}
      </div>
    </article>
  );
}
