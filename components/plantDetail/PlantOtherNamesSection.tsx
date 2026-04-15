import type { NameIndexLink } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "inline-block rounded-full border border-stone-200 bg-white/90 px-3 py-1.5 text-sm font-medium text-flora-forest transition-colors hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-900/60 dark:text-emerald-300 dark:hover:border-emerald-600/50";

type Props = {
  lang: Locale;
  links: NameIndexLink[];
};

/** Indexed common-name hubs that reference this plant (`names` × `plant_ids`). */
export function PlantOtherNamesSection({ lang, links }: Props) {
  if (links.length === 0) return null;

  return (
    <section
      aria-labelledby="plant-other-names-heading"
      className="mt-10 border-t border-stone-200 pt-10 dark:border-stone-800"
    >
      <h2
        id="plant-other-names-heading"
        className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
      >
        {t(lang, "plant_detail_other_names_h2")}
      </h2>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        {t(lang, "plant_detail_other_names_lead")}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {links.map(({ slug, label }) => (
          <li key={slug}>
            <Link href={localePath(lang, `/name/${slug}`)} className={linkClass}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
