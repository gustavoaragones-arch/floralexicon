import { TruncatedCountryList } from "@/components/TruncatedCountryList";
import type { AlternateNameCountryRow } from "@/lib/data";
import { localePath, ti, t, type Locale } from "@/lib/i18n";
import type { ResolvedPlantContext } from "@/lib/resolver";
import Link from "next/link";

const linkClass =
  "font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

type Props = {
  lang: Locale;
  displayName: string;
  alternateRows: AlternateNameCountryRow[];
  countryCodesWhereNameAppears: string[];
  plantContexts: ResolvedPlantContext[];
};

export function NameInstantAnswer({
  lang,
  displayName,
  alternateRows,
  countryCodesWhereNameAppears,
  plantContexts,
}: Props) {
  const name = displayName.trim();
  const genera = new Set(
    plantContexts.map(({ plant }) => plant.genus.trim()).filter(Boolean)
  );
  const closing =
    genera.size === 1
      ? ti(lang, "name_instant_answer_closing_single", {
          genus: [...genera][0]!,
        })
      : t(lang, "name_instant_answer_closing_multi");

  const bullets = alternateRows.slice(0, 6);

  return (
    <section
      className="mb-8 rounded-2xl border border-stone-200/90 bg-flora-sage/35 px-5 py-5 dark:border-stone-700 dark:bg-stone-900/50"
      aria-labelledby="name-instant-answer-heading"
    >
      <h2
        id="name-instant-answer-heading"
        className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
      >
        {ti(lang, "name_instant_answer_lead", { name })}
      </h2>

      {bullets.length > 0 ? (
        <ul className="mt-4 list-none space-y-2.5 text-base leading-snug text-stone-800 dark:text-stone-200">
          {bullets.map((row) => (
            <li key={row.slug} className="flex flex-wrap items-baseline gap-x-1">
              <span className="text-stone-500 dark:text-stone-400" aria-hidden>
                •{" "}
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
                  maxVisible={5}
                  className="inline"
                />
                )
              </span>
            </li>
          ))}
        </ul>
      ) : countryCodesWhereNameAppears.length > 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <span className="font-medium text-stone-800 dark:text-stone-200">
            {t(lang, "name_instant_answer_where_recorded")}
          </span>{" "}
          <TruncatedCountryList
            codes={countryCodesWhereNameAppears}
            lang={lang}
            maxVisible={8}
            className="font-medium text-stone-900 dark:text-stone-100"
          />
        </p>
      ) : null}

      {plantContexts.length > 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {closing}
        </p>
      ) : null}
    </section>
  );
}
