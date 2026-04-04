import { joinCountryNames } from "@/lib/countries";
import { localePath, ti, t, type Locale } from "@/lib/i18n";
import type { ResolvedPlantContext } from "@/lib/resolver";
import Link from "next/link";

const MAX_REGIONS = 6;

type NameQuickAnswerProps = {
  lang: Locale;
  /** Display name for the searched label (e.g. common name). */
  displayName: string;
  /** Top 1–2 plants by confidence (caller slices). */
  contexts: ResolvedPlantContext[];
};

/**
 * Short semantic summary at the top of name hub pages for users and search snippets.
 */
export function NameQuickAnswer({
  lang,
  displayName,
  contexts,
}: NameQuickAnswerProps) {
  if (contexts.length === 0) return null;

  return (
    <section
      className="mt-6 rounded-2xl border border-stone-200/90 bg-stone-50/95 px-5 py-5 text-base leading-relaxed shadow-sm dark:border-stone-600 dark:bg-stone-900/50"
      aria-labelledby="name-quick-answer-heading"
    >
      <h2
        id="name-quick-answer-heading"
        className="sr-only"
      >
        {t(lang, "name_quick_answer_sr")}
      </h2>
      <p className="text-lg font-medium leading-snug text-stone-900 dark:text-stone-100">
        <strong>{ti(lang, "name_quick_answer_lead", { name: displayName })}</strong>
      </p>
      <ul className="mt-3 list-none space-y-2.5 pl-0">
        {contexts.map((ctx) => {
          const codes = ctx.countries.slice(0, MAX_REGIONS);
          const regions = codes.length > 0 ? joinCountryNames(codes, lang) : "";
          return (
            <li key={ctx.plant.id} className="text-[1.05rem] leading-snug">
              <strong>
                <Link
                  href={localePath(lang, `/plant/${ctx.plant.id}`)}
                  className="text-flora-forest underline decoration-stone-300 underline-offset-[3px] hover:decoration-flora-forest dark:text-emerald-400 dark:decoration-stone-600 dark:hover:decoration-emerald-300"
                >
                  {ctx.plant.scientific_name}
                </Link>
              </strong>
              {regions ? (
                <>
                  {" "}
                  <span className="font-normal text-stone-600 dark:text-stone-400">
                    <strong className="font-semibold text-stone-700 dark:text-stone-300">
                      {t(lang, "name_quick_answer_common_in")}
                    </strong>{" "}
                    {regions}.
                  </span>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
