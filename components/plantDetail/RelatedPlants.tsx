import type { RelatedPlantItem } from "@/lib/plantDetailQueries";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

type Props = { lang: Locale; related: RelatedPlantItem[] };

export function RelatedPlants({ lang, related }: Props) {
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="plant-related-heading" className="mt-10">
      <h2
        id="plant-related-heading"
        className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
      >
        {t(lang, "plant_detail_related_heading")}
      </h2>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        {t(lang, "plant_detail_related_blurb")}
      </p>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        {related.map(({ plant, match }) => (
          <li key={plant.id} className="flex flex-wrap items-baseline gap-x-2">
            <Link href={localePath(lang, `/plant/${plant.id}`)} className={linkClass}>
              {plant.scientific_name}
            </Link>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {match === "genus"
                ? t(lang, "plant_detail_related_match_genus")
                : t(lang, "plant_detail_related_match_theme")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
