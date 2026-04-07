import { t, type Locale } from "@/lib/i18n";

export function AmbiguityNotice({ lang }: { lang: Locale }) {
  return (
    <div
      className="rounded-xl border border-stone-200 bg-stone-50/90 px-4 py-3 text-sm leading-relaxed text-stone-700 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-300"
      role="note"
    >
      {t(lang, "search_ambiguity_notice")}
    </div>
  );
}
