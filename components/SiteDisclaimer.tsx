import { t, type Locale } from "@/lib/i18n";

export function SiteDisclaimer({ lang }: { lang: Locale }) {
  return (
    <div
      className="border-t border-stone-200 bg-flora-sage/40 px-6 py-3 text-center text-xs text-stone-600 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-400"
      role="note"
    >
      {t(lang, "site_disclaimer_strip")}
    </div>
  );
}
