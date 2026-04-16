import { plantNameHubSlug, type NameIndexLink, type Plant } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "text-stone-800 underline decoration-stone-300 underline-offset-2 hover:text-flora-forest hover:decoration-flora-forest dark:text-stone-200 dark:hover:text-emerald-300 dark:hover:decoration-emerald-400";

export type SamePlantCluster = {
  plant: Pick<Plant, "id" | "scientific_name">;
  links: NameIndexLink[];
};

type SamePlantNamesSectionProps = {
  lang: Locale;
  id: string;
  clusters: SamePlantCluster[];
};

/**
 * Names that share at least one resolved species with this page — per-plant silos when
 * multiple species match.
 */
export function SamePlantNamesSection({
  lang,
  id,
  clusters,
}: SamePlantNamesSectionProps) {
  const nonEmpty = clusters.filter((c) => c.links.length > 0);
  if (nonEmpty.length === 0) return null;

  return (
    <section
      className="mt-12 border-t border-stone-200 pt-10 dark:border-stone-800"
      aria-labelledby={id}
    >
      <h2
        id={id}
        className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
      >
        {t(lang, "same_plant_heading")}
      </h2>

      {nonEmpty.length === 1 ? (
        <ul className="mt-4 list-disc space-y-1.5 pl-6 text-stone-700 dark:text-stone-300">
          {nonEmpty[0].links.map(({ slug, label }) => (
            <li key={slug}>
              <Link
                href={localePath(lang, `/name/${slug}`)}
                className={linkClass}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 space-y-8">
          {nonEmpty.map(({ plant, links }) => (
            <div key={plant.id}>
              <h3 className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                <Link
                  href={localePath(
                    lang,
                    `/name/${plantNameHubSlug(plant.id, plant.scientific_name)}`
                  )}
                  className="text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400"
                >
                  {plant.scientific_name}
                </Link>
              </h3>
              <ul className="mt-3 list-disc space-y-1.5 pl-6 text-stone-700 dark:text-stone-300">
                {links.map(({ slug, label }) => (
                  <li key={slug}>
                    <Link
                      href={localePath(lang, `/name/${slug}`)}
                      className={linkClass}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
