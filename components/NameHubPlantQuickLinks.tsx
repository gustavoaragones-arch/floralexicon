import type { ResolvedPlantContext } from "@/lib/resolver";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "inline-flex items-center rounded-lg border border-stone-200 bg-stone-50/90 px-3 py-1.5 text-sm font-medium text-flora-forest hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-900/50 dark:text-emerald-300 dark:hover:border-emerald-500/40";

type Props = {
  lang: Locale;
  plantContexts: ResolvedPlantContext[];
};

/** Quick crawlable links to each species card in this name hub. */
export function NameHubPlantQuickLinks({ lang, plantContexts }: Props) {
  if (plantContexts.length === 0) return null;

  return (
    <nav
      className="mt-6 rounded-xl border border-stone-200/80 bg-stone-50/50 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/35"
      aria-label={t(lang, "name_hub_plant_quick_nav_aria")}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {t(lang, "name_hub_plant_quick_nav_label")}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {plantContexts.map(({ plant }) => (
          <li key={plant.id}>
            <Link href={localePath(lang, `/plant/${plant.id}`)} className={linkClass}>
              {plant.scientific_name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
