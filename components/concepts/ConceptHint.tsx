import { getConceptBySlug } from "@/lib/concepts";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

type Props = {
  lang: Locale;
  /** Concept slug, e.g. `plant-name-ambiguity` */
  concept: string;
  className?: string;
};

/**
 * Inline CTA to a glossary concept (e.g. when the resolver returns multiple species).
 * Server-rendered; no client fetch.
 */
export function ConceptHint({ lang, concept, className = "" }: Props) {
  if (!getConceptBySlug(concept)) return null;
  const href = localePath(lang, `/concepts/${concept}`);
  return (
    <p
      className={`text-sm leading-relaxed text-stone-700 dark:text-stone-300 ${className}`.trim()}
    >
      <Link
        href={href}
        className="font-medium text-flora-forest underline decoration-flora-forest/35 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:decoration-emerald-500/40 dark:hover:decoration-emerald-400"
      >
        {t(lang, "concept_hint_multiple_plants")}
      </Link>
    </p>
  );
}
