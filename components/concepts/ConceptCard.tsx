import { t, type Locale } from "@/lib/i18n";
import Link from "next/link";

type Props = {
  lang: Locale;
  href: string;
  title: string;
  definition: string;
  core?: boolean;
  /** Slightly tighter padding for dense lists */
  compact?: boolean;
};

export function ConceptCard({ lang, href, title, definition, core, compact }: Props) {
  const pad = compact ? "p-4" : "p-5";
  return (
    <Link
      href={href}
      className={`group block rounded-xl border border-stone-200 bg-white ${pad} shadow-sm transition-colors hover:border-flora-forest/35 dark:border-stone-700 dark:bg-stone-950 dark:hover:border-emerald-600/45`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold tracking-tight text-stone-900 group-hover:text-flora-forest dark:text-stone-100 dark:group-hover:text-emerald-300">
          {title}
        </h2>
        {core ? (
          <span className="shrink-0 rounded-md border border-stone-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:border-stone-600 dark:text-stone-400">
            {t(lang, "concepts_core_badge")}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-snug text-stone-600 dark:text-stone-400">{definition}</p>
    </Link>
  );
}
