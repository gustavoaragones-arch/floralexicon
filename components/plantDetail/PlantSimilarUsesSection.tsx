import { plantNameHubSlug, type Plant } from "@/lib/data";
import { humanUseLabel } from "@/lib/plantHumanLabels";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

type Props = {
  lang: Locale;
  plant: Plant;
  similar: Plant[];
};

/** Other slim-index plants that share at least one `primary_uses` value. */
export function PlantSimilarUsesSection({ lang, plant, similar }: Props) {
  if (similar.length === 0) return null;

  const useSet = new Set(plant.primary_uses.map((u) => u.trim().toLowerCase()).filter(Boolean));
  const useLabels = plant.primary_uses
    .filter((u) => useSet.has(u.trim().toLowerCase()))
    .map((u) => humanUseLabel(u, lang))
    .join(" · ");

  return (
    <section
      aria-labelledby="plant-similar-uses-heading"
      className="mt-10 border-t border-stone-200 pt-10 dark:border-stone-800"
    >
      <h2
        id="plant-similar-uses-heading"
        className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
      >
        {t(lang, "plant_detail_similar_uses_h2")}
      </h2>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        {t(lang, "plant_detail_similar_uses_lead")}
        {useLabels ? (
          <>
            {" "}
            <span className="font-medium text-stone-800 dark:text-stone-200">{useLabels}</span>
          </>
        ) : null}
      </p>
      <ul className="mt-4 flex flex-col gap-2 text-sm">
        {similar.map((p) => (
          <li key={p.id}>
            <Link
              href={localePath(
                lang,
                `/name/${plantNameHubSlug(p.id, p.scientific_name)}`
              )}
              className={linkClass}
            >
              {p.scientific_name}
            </Link>
            <span className="ml-2 text-xs text-stone-500 dark:text-stone-400">
              {p.primary_uses.map((u) => humanUseLabel(u, lang)).join(" · ")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
