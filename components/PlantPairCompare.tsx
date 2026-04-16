import { formatRegionList } from "@/lib/countries";
import { plantNameHubSlug, type Plant } from "@/lib/data";
import { localePath, t, ti, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

type PlantPairCompareProps = {
  lang: Locale;
  plantA: Plant;
  plantB: Plant;
};

export function PlantPairCompare({ lang, plantA, plantB }: PlantPairCompareProps) {
  const usesA = [...plantA.primary_uses].sort().join(", ") || "—";
  const usesB = [...plantB.primary_uses].sort().join(", ") || "—";
  const regionsA = formatRegionList(plantA.origin_regions) || "—";
  const regionsB = formatRegionList(plantB.origin_regions) || "—";

  return (
    <div className="space-y-12">
      <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {t(lang, "compare_intro")}
      </p>

      <section aria-labelledby="compare-diff">
        <h2
          id="compare-diff"
          className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          {t(lang, "compare_diff_heading")}
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-stone-700 dark:text-stone-300">
          {plantA.family !== plantB.family ? (
            <li>
              {ti(lang, "compare_diff_families", {
                a: plantA.family,
                b: plantB.family,
              })}
            </li>
          ) : (
            <li>
              {ti(lang, "compare_same_family", { family: plantA.family })}
            </li>
          )}
          <li>
            {ti(lang, "compare_diff_genera", {
              ga: plantA.genus,
              gb: plantB.genus,
            })}
          </li>
        </ul>
      </section>

      <div className="-mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
        <table className="w-full min-w-[20rem] border-collapse border border-stone-200 text-left text-sm dark:border-stone-600">
          <thead>
            <tr className="border-b border-stone-200 bg-flora-sage/50 dark:border-stone-600 dark:bg-stone-900">
              <th className="px-3 py-2.5 font-semibold text-stone-900 dark:text-stone-100">
                {t(lang, "comparison_col_name")}
              </th>
              <th className="px-3 py-2.5 font-semibold text-stone-900 dark:text-stone-100">
                {plantA.scientific_name}
              </th>
              <th className="px-3 py-2.5 font-semibold text-stone-900 dark:text-stone-100">
                {plantB.scientific_name}
              </th>
            </tr>
          </thead>
          <tbody className="text-stone-700 dark:text-stone-300">
            <tr className="border-b border-stone-200 dark:border-stone-700">
              <th scope="row" className="px-3 py-3 font-medium text-stone-800 dark:text-stone-200">
                {t(lang, "comparison_col_family")}
              </th>
              <td className="px-3 py-3">{plantA.family}</td>
              <td className="px-3 py-3">{plantB.family}</td>
            </tr>
            <tr className="border-b border-stone-200 dark:border-stone-700">
              <th scope="row" className="px-3 py-3 font-medium text-stone-800 dark:text-stone-200">
                {t(lang, "compare_table_uses")}
              </th>
              <td className="px-3 py-3 capitalize">{usesA}</td>
              <td className="px-3 py-3 capitalize">{usesB}</td>
            </tr>
            <tr>
              <th scope="row" className="px-3 py-3 font-medium text-stone-800 dark:text-stone-200">
                {t(lang, "compare_table_regions")}
              </th>
              <td className="px-3 py-3">{regionsA}</td>
              <td className="px-3 py-3">{regionsB}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-sm text-stone-600 dark:text-stone-400">
        <Link
          href={localePath(
            lang,
            `/name/${plantNameHubSlug(plantA.id, plantA.scientific_name)}`
          )}
          className={linkClass}
        >
          {plantA.scientific_name}
        </Link>
        {" · "}
        <Link
          href={localePath(
            lang,
            `/name/${plantNameHubSlug(plantB.id, plantB.scientific_name)}`
          )}
          className={linkClass}
        >
          {plantB.scientific_name}
        </Link>
      </p>

      <nav className="flex flex-wrap gap-4 border-t border-stone-200 pt-8 text-sm font-medium dark:border-stone-800">
        <Link href={localePath(lang, "/names")} className={linkClass}>
          {t(lang, "internal_link_browse_names")}
        </Link>
        <Link href={localePath(lang, "/medicinal-herbs")} className={linkClass}>
          {t(lang, "home_link_medicinal_herbs")}
        </Link>
      </nav>
    </div>
  );
}
