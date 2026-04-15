import type { NameIndexLink } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const chipClass =
  "inline-block rounded-full border border-stone-200 bg-white/90 px-3 py-1.5 text-sm font-medium text-flora-forest transition-colors hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-900/60 dark:text-emerald-300 dark:hover:border-emerald-600/50";

type Props = {
  lang: Locale;
  links: NameIndexLink[];
};

/** Other indexed herb names that share species with this name hub (dataset `plant_ids`). */
export function NameRelatedHerbNamesSection({ lang, links }: Props) {
  if (links.length === 0) return null;

  return (
    <section
      className="mt-14 border-t border-stone-200 pt-10 dark:border-stone-800"
      aria-labelledby="name-related-herb-names"
    >
      <h2
        id="name-related-herb-names"
        className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
      >
        {t(lang, "name_related_herb_names_h2")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {t(lang, "name_related_herb_names_lead")}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {links.map(({ slug, label }) => (
          <li key={slug}>
            <Link href={localePath(lang, `/name/${slug}`)} className={chipClass}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
