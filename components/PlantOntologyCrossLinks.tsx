import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

type Props = {
  lang: Locale;
  /** Distinct common-name index links for this species */
  alsoKnownAsCount: number;
  /** Country codes from name index + origin regions signal */
  multipleRegions: boolean;
};

/**
 * Conditional internal links into the concepts ontology from plant detail pages.
 */
export function PlantOntologyCrossLinks({
  lang,
  alsoKnownAsCount,
  multipleRegions,
}: Props) {
  if (alsoKnownAsCount <= 1 && !multipleRegions) return null;

  const linkClass =
    "font-medium text-flora-forest underline decoration-flora-forest/35 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:decoration-emerald-500/40 dark:hover:decoration-emerald-400";

  return (
    <aside
      className="mt-10 space-y-3 border-t border-stone-200 pt-8 text-sm text-stone-600 dark:border-stone-800 dark:text-stone-400"
      aria-label={t(lang, "plant_ontology_crosslinks_aria")}
    >
      {alsoKnownAsCount > 1 ? (
        <p>
          <Link href={localePath(lang, "/concepts/plant-synonyms")} className={linkClass}>
            {t(lang, "plant_ontology_synonyms_link")}
          </Link>
          <span className="text-stone-500 dark:text-stone-500">
            {" "}
            — {t(lang, "plant_ontology_synonyms_desc")}
          </span>
        </p>
      ) : null}
      {multipleRegions ? (
        <p>
          <Link
            href={localePath(lang, "/concepts/regional-plant-names")}
            className={linkClass}
          >
            {t(lang, "plant_ontology_regions_link")}
          </Link>
          <span className="text-stone-500 dark:text-stone-500">
            {" "}
            — {t(lang, "plant_ontology_regions_desc")}
          </span>
        </p>
      ) : null}
    </aside>
  );
}
