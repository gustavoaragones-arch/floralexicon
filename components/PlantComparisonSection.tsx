"use client";

import { plantNameHubSlug, type Plant } from "@/lib/data";
import { formatRegionList } from "@/lib/countries";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";
import { useId, useState } from "react";

type ComparisonRow = {
  plant: Plant;
  name: string;
  family: string;
  uses: string;
  regions: string;
};

function toRows(plants: Plant[]): ComparisonRow[] {
  return plants.map((plant) => ({
    plant,
    name: plant.scientific_name,
    family: plant.family,
    uses: [...plant.primary_uses].sort().join(", ") || "—",
    regions:
      plant.origin_regions.length > 0
        ? formatRegionList(plant.origin_regions)
        : "—",
  }));
}

/** True where the column is not uniform (bold differing cells). */
function highlightColumn(values: string[]): boolean[] {
  const heterogeneous = new Set(values).size > 1;
  if (!heterogeneous) return values.map(() => false);
  return values.map((v) => values.some((x) => x !== v));
}

type PlantComparisonSectionProps = {
  lang: Locale;
  plants: Plant[];
};

export function PlantComparisonSection({
  lang,
  plants,
}: PlantComparisonSectionProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rows = toRows(plants);

  if (plants.length < 2) return null;

  const names = rows.map((r) => r.name);
  const families = rows.map((r) => r.family);
  const uses = rows.map((r) => r.uses);
  const regions = rows.map((r) => r.regions);

  const boldName = highlightColumn(names);
  const boldFamily = highlightColumn(families);
  const boldUses = highlightColumn(uses);
  const boldRegions = highlightColumn(regions);

  return (
    <section className="mt-12 border-t border-stone-200 pt-10 dark:border-stone-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400">
          {t(lang, "comparison_title")}
        </h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full rounded-full border border-flora-forest bg-flora-forest px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:border-flora-forest-hover hover:bg-flora-forest-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-flora-forest/35 sm:w-auto dark:border-emerald-600 dark:bg-emerald-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-600"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t(lang, "comparison_hide") : t(lang, "comparison_show")}
        </button>
      </div>

      {open ? (
        <div
          id={panelId}
          className="mt-6 -mx-6 overflow-x-auto px-6 md:mx-0 md:px-0"
        >
          <div className="inline-block min-w-full rounded-2xl border border-stone-200 dark:border-stone-600">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-flora-sage/50 dark:border-stone-600 dark:bg-stone-900">
                <th scope="col" className="px-3 py-2.5 font-semibold text-stone-900 dark:text-stone-100">
                  {t(lang, "comparison_col_name")}
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold text-stone-900 dark:text-stone-100">
                  {t(lang, "comparison_col_family")}
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold text-stone-900 dark:text-stone-100">
                  {t(lang, "comparison_col_uses")}
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold text-stone-900 dark:text-stone-100">
                  {t(lang, "comparison_col_regions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.plant.id}
                  className="border-b border-stone-200 last:border-0 dark:border-stone-700"
                >
                  <td className="px-3 py-3 align-top text-stone-800 dark:text-stone-200">
                    <Link
                      href={localePath(
                        lang,
                        `/name/${plantNameHubSlug(row.plant.id, row.plant.scientific_name)}`
                      )}
                      className={
                        boldName[i]
                          ? "font-bold text-stone-950 underline decoration-stone-300 underline-offset-2 hover:text-flora-forest hover:decoration-flora-forest dark:text-stone-50 dark:hover:text-emerald-300 dark:hover:decoration-emerald-400"
                          : "underline decoration-stone-300 underline-offset-2 hover:text-flora-forest hover:decoration-flora-forest dark:hover:text-emerald-300 dark:hover:decoration-emerald-400"
                      }
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td
                    className={`px-3 py-3 align-top text-stone-700 dark:text-stone-300 ${boldFamily[i] ? "font-bold text-stone-950 dark:text-stone-50" : ""}`}
                  >
                    {row.family}
                  </td>
                  <td
                    className={`px-3 py-3 align-top capitalize text-stone-700 dark:text-stone-300 ${boldUses[i] ? "font-bold text-stone-950 dark:text-stone-50" : ""}`}
                  >
                    {row.uses}
                  </td>
                  <td
                    className={`px-3 py-3 align-top text-stone-700 dark:text-stone-300 ${boldRegions[i] ? "font-bold text-stone-950 dark:text-stone-50" : ""}`}
                  >
                    {row.regions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
