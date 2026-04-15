import { countryCodeToUrlSlug, getCountryDisplayName } from "@/lib/countries";
import { countryCodeToFlagEmoji, formatHumanUseKey } from "@/lib/nameHubDisplay";
import { localePath, t, ti, type Locale } from "@/lib/i18n";
import type { RegionalPlantRow } from "@/lib/resolver";
import Link from "next/link";

const sectionProse =
  "text-sm leading-relaxed text-stone-600 dark:text-stone-400";
const h2Class =
  "font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100";

const linkClass =
  "text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

export function NameClusterRegional({
  lang,
  nameCanonicalSlug,
  regionalRows,
  heading,
  hideIntro = false,
}: {
  lang: Locale;
  nameCanonicalSlug: string;
  regionalRows: RegionalPlantRow[];
  /** Optional heading override (caller may pass pre-interpolated text). */
  heading?: string;
  hideIntro?: boolean;
}) {
  if (regionalRows.length === 0) return null;

  return (
    <section className="mt-6 sm:mt-8" aria-labelledby="hub-regional">
      <h2 id="hub-regional" className={h2Class}>
        {heading ?? t(lang, "name_country_mappings_h2")}
      </h2>
      {!hideIntro ? (
        <p className={`mt-3 ${sectionProse}`}>{t(lang, "name_country_mappings_intro")}</p>
      ) : null}
      <ul className="mt-6 space-y-6 border-t border-stone-200 pt-6 dark:border-stone-700">
        {regionalRows.map((row) => {
          const flag = countryCodeToFlagEmoji(row.countryCode);
          return (
            <li
              key={row.countryCode}
              className="country-block rounded-2xl border border-stone-200/90 bg-stone-50/80 px-4 py-4 dark:border-stone-700 dark:bg-stone-900/45"
            >
              <div className="country-name text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                <Link
                  href={localePath(
                    lang,
                    `/name/${nameCanonicalSlug}/${countryCodeToUrlSlug(row.countryCode)}`
                  )}
                  className={`${linkClass} inline-flex items-center gap-2 font-semibold`}
                  title={t(lang, "name_country_hub_link_title")}
                >
                  {flag ? <span aria-hidden="true">{flag}</span> : null}
                  <span>{getCountryDisplayName(row.countryCode, lang)}</span>
                </Link>
              </div>
              <div className="country-result mt-3 text-base font-medium leading-snug text-stone-900 dark:text-stone-100">
                {row.plants.map((plant, idx) => (
                  <span key={plant.id}>
                    {idx > 0 ? (
                      <span className="font-normal text-stone-400 dark:text-stone-500" aria-hidden>
                        ,{" "}
                      </span>
                    ) : null}
                    <Link
                      href={localePath(lang, `/plant/${plant.id}`)}
                      className={`${linkClass} italic tracking-tight`}
                    >
                      {plant.scientific_name}
                    </Link>
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatUseLabel(lang: Locale, key: string): string {
  const k = key.trim().toLowerCase();
  switch (k) {
    case "tea":
      return t(lang, "hub_use_tea");
    case "medicinal":
      return t(lang, "hub_use_medicinal");
    case "ritual":
      return t(lang, "hub_use_ritual");
    case "culinary":
      return t(lang, "hub_use_culinary");
    case "aromatic":
      return t(lang, "hub_use_aromatic");
    default:
      return k ? k.charAt(0).toUpperCase() + k.slice(1) : "";
  }
}

export function NameClusterUses({
  lang,
  displayName,
  useKeys,
  listOnly = false,
}: {
  lang: Locale;
  displayName: string;
  useKeys: string[];
  /** Name hub: short heading + bullet list only (no prose). */
  listOnly?: boolean;
}) {
  const name = displayName.trim();
  const useLabels = Array.from(new Set(useKeys))
    .sort()
    .map((k) => formatUseLabel(lang, k))
    .filter(Boolean);

  const humanUseLabels = Array.from(new Set(useKeys))
    .sort()
    .map((k) => formatHumanUseKey(lang, k))
    .filter(Boolean);

  if (listOnly) {
    return (
      <section className="mt-14" aria-labelledby="hub-uses">
        <h2 id="hub-uses" className={h2Class}>
          {t(lang, "name_hub_common_uses_h2")}
        </h2>
        {humanUseLabels.length === 0 ? (
          <p className={`mt-3 text-sm ${sectionProse}`}>{t(lang, "hub_uses_none")}</p>
        ) : (
          <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-stone-800 dark:text-stone-200">
            {humanUseLabels.map((label) => (
              <li key={label}>
                {label}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section className="mt-14" aria-labelledby="hub-uses">
      <h2 id="hub-uses" className={h2Class}>
        {ti(lang, "hub_uses_h2", { name })}
      </h2>
      <p className={`mt-3 ${sectionProse}`}>
        {useLabels.length > 0 ? (
          <>
            {t(lang, "hub_uses_intro")}{" "}
            <span className="font-medium text-stone-800 dark:text-stone-200">
              {useLabels.join(", ")}
            </span>
            . {t(lang, "hub_uses_suffix")}
          </>
        ) : (
          t(lang, "hub_uses_none")
        )}
      </p>
    </section>
  );
}
