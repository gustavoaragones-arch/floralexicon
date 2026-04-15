import type { PlantDetailModel } from "@/lib/plantDetailData";
import {
  formatRegionsForLocale,
  humanEvidenceLevel,
  humanSustainabilityStatus,
  humanToxicityBand,
} from "@/lib/plantHumanLabels";
import { t, type Locale } from "@/lib/i18n";

type Props = { lang: Locale; model: PlantDetailModel };

export function PlantFactsGrid({ lang, model }: Props) {
  const { core, merged } = model;

  const regionsLabel = merged?.regions?.length
    ? formatRegionsForLocale(merged.regions, lang)
    : null;
  const countriesLabel = merged?.countries?.length
    ? formatRegionsForLocale(merged.countries, lang)
    : null;
  const regionsCombined =
    [countriesLabel, regionsLabel].filter(Boolean).join(" · ") || null;

  const cells: { label: string; value: string }[] = [
    { label: t(lang, "plant_detail_fact_family"), value: core.family },
    {
      label: t(lang, "plant_detail_fact_regions"),
      value: regionsCombined ?? t(lang, "plant_detail_value_not_listed"),
    },
    {
      label: t(lang, "plant_detail_fact_evidence"),
      value: merged?.evidence?.level
        ? humanEvidenceLevel(merged.evidence.level, lang)
        : t(lang, "plant_detail_value_not_listed"),
    },
    {
      label: t(lang, "plant_detail_fact_toxicity"),
      value: merged?.toxicity?.level
        ? humanToxicityBand(merged.toxicity.level, lang)
        : t(lang, "plant_detail_value_not_listed"),
    },
    {
      label: t(lang, "plant_detail_fact_sustainability"),
      value: merged?.sustainability?.status
        ? humanSustainabilityStatus(merged.sustainability.status, lang)
        : t(lang, "plant_detail_value_not_listed"),
    },
  ];

  return (
    <section aria-labelledby="plant-facts-heading" className="mt-10">
      <h2
        id="plant-facts-heading"
        className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
      >
        {t(lang, "plant_detail_facts")}
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {cells.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-stone-200 bg-white/60 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/40"
          >
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {c.label}
            </dt>
            <dd className="mt-1 text-sm text-stone-800 dark:text-stone-200">{c.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
