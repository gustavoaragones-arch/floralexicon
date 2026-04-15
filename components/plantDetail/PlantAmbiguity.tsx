import type { AmbiguityHub } from "@/lib/plantDetailQueries";
import { localePath, ti, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

type Props = { lang: Locale; hubs: AmbiguityHub[] };

export function PlantAmbiguity({ lang, hubs }: Props) {
  if (hubs.length === 0) return null;

  return (
    <section aria-labelledby="plant-amb-heading" className="mt-10">
      <h2
        id="plant-amb-heading"
        className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
      >
        {t(lang, "plant_detail_amb_heading")}
      </h2>
      <p className="mt-2 text-sm font-semibold text-amber-950 dark:text-amber-100">
        {t(lang, "plant_detail_amb_headline")}
      </p>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        {t(lang, "plant_detail_amb_intro")}
      </p>

      <ul className="mt-4 space-y-4">
        {hubs.map((hub) => (
          <li
            key={hub.urlSlug}
            className="rounded-xl border-l-4 border-amber-600 bg-amber-50/70 px-4 py-4 shadow-sm dark:border-amber-500 dark:bg-amber-950/40"
          >
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {ti(lang, "plant_detail_amb_confused_line", { common: hub.displayLabel })}
            </p>
            <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
              {t(lang, "plant_detail_amb_species_line")}
            </p>
            <p className="mt-1 text-sm text-stone-800 dark:text-stone-200">
              {hub.otherSpecies.map((o) => o.scientific).join(" · ")}
            </p>
            <p className="mt-4">
              <Link
                href={localePath(lang, `/name/${hub.urlSlug}`)}
                className={linkClass}
              >
                {ti(lang, "plant_detail_amb_compare_cta", { common: hub.displayLabel })}
              </Link>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
