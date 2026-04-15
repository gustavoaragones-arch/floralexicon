import { TruncatedCountryList } from "@/components/TruncatedCountryList";
import type { AlternateNameCountryRow } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

type Props = {
  lang: Locale;
  rows: AlternateNameCountryRow[];
};

/** Alternate indexed labels for the same plants, with countries inline (SEO + clarity). */
export function NameRelatedHerbNamesSection({ lang, rows }: Props) {
  if (rows.length === 0) return null;

  return (
    <section
      className="mt-14 border-t border-stone-200 pt-10 dark:border-stone-800"
      aria-labelledby="name-also-called"
    >
      <h2
        id="name-also-called"
        className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
      >
        {t(lang, "name_also_called_h2")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {t(lang, "name_also_called_lead")}
      </p>
      <ul className="mt-5 list-none space-y-3 text-base leading-snug text-stone-800 dark:text-stone-200">
        {rows.map((row) => (
          <li key={row.slug} className="flex flex-wrap items-baseline gap-x-1">
            <span className="text-stone-500 dark:text-stone-400" aria-hidden>
              -{" "}
            </span>
            <Link href={localePath(lang, `/name/${row.slug}`)} className={linkClass}>
              {row.label}
            </Link>
            <span className="text-stone-600 dark:text-stone-300">
              {" "}
              (
              <TruncatedCountryList
                codes={row.countryCodes}
                lang={lang}
                maxVisible={6}
                className="inline"
              />
              )
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
