import { t, type Locale } from "@/lib/i18n";

export function ConfidenceTooltipExplainer({ lang }: { lang: Locale }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        className="tooltip-trigger inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-300 text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
        aria-label={lang === "es" ? "Información sobre la confianza" : "About confidence"}
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 w-72 max-w-[85vw] -translate-x-1/2 rounded-lg border border-stone-200 bg-white p-3 text-left text-xs leading-snug text-stone-700 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200"
      >
        <p>{t(lang, "name_confidence_tooltip_main")}</p>
      </span>
    </span>
  );
}
