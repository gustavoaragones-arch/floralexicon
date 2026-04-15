import type { CountryNameGroup } from "@/lib/data";
import { getCountryDisplayName } from "@/lib/geo";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

type Props = {
  lang: Locale;
  groups: CountryNameGroup[];
};

export function PlantHerbNamesByCountrySection({ lang, groups }: Props) {
  if (groups.length === 0) return null;

  const sorted = [...groups].sort((a, b) =>
    getCountryDisplayName(a.countryCode, lang).localeCompare(
      getCountryDisplayName(b.countryCode, lang),
      lang === "es" ? "es" : "en",
      { sensitivity: "base" }
    )
  );

  return (
    <section
      className="mt-10 border-t border-stone-200 pt-10 dark:border-stone-800"
      aria-labelledby="plant-names-by-country-heading"
    >
      <h2
        id="plant-names-by-country-heading"
        className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
      >
        {t(lang, "plant_detail_called_in_countries_h2")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {t(lang, "plant_detail_called_in_countries_lead")}
      </p>
      <ul className="mt-6 space-y-5">
        {sorted.map((row) => (
          <li
            key={row.countryCode}
            className="rounded-xl border border-stone-200 bg-white/60 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/40"
          >
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {getCountryDisplayName(row.countryCode, lang)}
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm">
              {row.entries.map(({ slug, label }) => (
                <li key={`${row.countryCode}-${slug}`}>
                  <Link href={localePath(lang, `/name/${slug}`)} className={linkClass}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
