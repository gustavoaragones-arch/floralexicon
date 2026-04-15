import type { PlantDetailModel } from "@/lib/plantDetailData";
import { buildRegionalUseBlock } from "@/lib/plantDetailQueries";
import { formatOriginRegions, formatRegionsForLocale } from "@/lib/plantHumanLabels";
import { t, type Locale } from "@/lib/i18n";

type Props = { lang: Locale; model: PlantDetailModel };

export function PlantRegions({ lang, model }: Props) {
  const { core, merged } = model;
  const origin = formatOriginRegions(core.origin_regions);
  const indexGeo = merged?.regions?.length
    ? formatRegionsForLocale(merged.regions, lang)
    : null;
  const indexCountries = merged?.countries?.length
    ? formatRegionsForLocale(merged.countries, lang)
    : null;
  const indexCombined = [indexCountries, indexGeo].filter(Boolean).join(" · ") || null;

  const regional = buildRegionalUseBlock(core.id, model, lang);

  return (
    <section aria-labelledby="plant-regions-heading" className="mt-10">
      <h2
        id="plant-regions-heading"
        className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
      >
        {t(lang, "plant_detail_regions_heading")}
      </h2>
      <div className="mt-4 space-y-4 text-sm text-stone-700 dark:text-stone-300">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {t(lang, "plant_detail_regions_origin")}
          </h3>
          <p className="mt-1">{origin || t(lang, "plant_detail_value_not_listed")}</p>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {t(lang, "plant_detail_regions_index")}
          </h3>
          <p className="mt-1">
            {indexCombined ?? t(lang, "plant_detail_value_not_listed")}
          </p>
        </div>
        {origin && indexCombined ? (
          <p className="text-xs text-stone-600 dark:text-stone-400">
            {t(lang, "plant_detail_regions_diff")}
          </p>
        ) : null}

        <div className="rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/40">
          <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {t(lang, "plant_detail_regions_use_heading")}
          </h3>
          {regional.kind === "uniform" ? (
            <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
              {t(lang, "plant_detail_regions_uniform")}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {regional.rows.map((row, i) => (
                <li key={`${row.regionLabel}-${i}`} className="text-sm">
                  <span className="font-medium text-stone-900 dark:text-stone-100">
                    {row.regionLabel}
                  </span>
                  <span className="text-stone-500 dark:text-stone-500">
                    {" "}
                    {t(lang, "plant_detail_regions_arrow")}{" "}
                  </span>
                  <span>{row.useFragment}</span>
                  {row.nameHint ? (
                    <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
                      {row.nameHint}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
