import { TruncatedCountryList } from "@/components/TruncatedCountryList";
import { ti, type Locale } from "@/lib/i18n";

const h2Class =
  "font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100";
const sectionProse =
  "text-sm leading-relaxed text-stone-600 dark:text-stone-400";

type NameClusterGlobalPresenceProps = {
  lang: Locale;
  displayName: string;
  countryCodesSorted: string[];
};

export function NameClusterGlobalPresence({
  lang,
  displayName,
  countryCodesSorted,
}: NameClusterGlobalPresenceProps) {
  const name = displayName.trim();
  if (countryCodesSorted.length === 0) return null;

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-flora-sage/30 px-5 py-5 dark:border-stone-700 dark:bg-stone-900/45"
      aria-labelledby="hub-global-presence"
    >
      <h2 id="hub-global-presence" className={h2Class}>
        {ti(lang, "name_hub_global_h2", { name })}
      </h2>
      <p className={`mt-3 ${sectionProse}`}>
        <span>{ti(lang, "name_hub_global_intro", { name })}</span>{" "}
        <TruncatedCountryList
          codes={countryCodesSorted}
          lang={lang}
          maxVisible={5}
          className="font-medium text-stone-800 dark:text-stone-200"
        />
      </p>
    </section>
  );
}
