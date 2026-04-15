import { countryCodeToUrlSlug, getCountryDisplayName } from "@/lib/countries";
import { getCountryUrlSlugsForNameHub } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const chipClass =
  "inline-block rounded-full border border-stone-200 bg-white/90 px-3 py-1.5 text-sm font-medium text-flora-forest transition-colors hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-900/60 dark:text-emerald-300 dark:hover:border-emerald-600/50";

type Props = {
  lang: Locale;
  nameCanonicalSlug: string;
  /** ISO country codes where this name hub appears (e.g. from index aggregation). */
  countryCodesSorted: string[];
};

/**
 * Flat index of country-filtered name hub pages — only links that exist in
 * `getNameCountryStaticParams` for this hub.
 */
export function NameHubCountryIndexSection({
  lang,
  nameCanonicalSlug,
  countryCodesSorted,
}: Props) {
  const validSegs = getCountryUrlSlugsForNameHub(nameCanonicalSlug);
  const rows = countryCodesSorted
    .map((code) => {
      const seg = countryCodeToUrlSlug(code);
      if (!validSegs.has(seg)) return null;
      return { code, seg, label: getCountryDisplayName(code, lang) };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  if (rows.length === 0) return null;

  return (
    <section
      className="mt-6 rounded-2xl border border-stone-200 bg-white/60 px-5 py-5 dark:border-stone-700 dark:bg-stone-900/40"
      aria-labelledby="name-hub-countries-index"
    >
      <h2
        id="name-hub-countries-index"
        className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
      >
        {t(lang, "name_hub_countries_index_h2")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {t(lang, "name_hub_countries_index_lead")}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {rows.map(({ code, seg, label }) => (
          <li key={code}>
            <Link
              href={localePath(lang, `/name/${nameCanonicalSlug}/${seg}`)}
              className={chipClass}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
