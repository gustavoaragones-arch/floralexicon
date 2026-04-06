import type { Concept, ConceptSection, EvidenceSafetyBadge } from "@/lib/concepts";
import {
  getConceptContextLinks,
  getRelatedConcepts,
  localizeConcept,
} from "@/lib/concepts";
import { ConceptCard } from "@/components/concepts/ConceptCard";
import { localePath, t, type I18nKey, type Locale } from "@/lib/i18n";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  lang: Locale;
  concept: Concept;
};

const EVIDENCE_BADGE_LABEL: Record<EvidenceSafetyBadge, I18nKey> = {
  traditional: "concepts_evidence_badge_traditional",
  preliminary: "concepts_evidence_badge_preliminary",
  clinical: "concepts_evidence_badge_clinical",
  caution: "concepts_evidence_badge_caution",
};

function renderSection(lang: Locale, s: ConceptSection, i: number): ReactNode {
  if (s.type === "evidence_safety") {
    return (
      <div key={i} className="space-y-4">
        {s.tiers.map((tier, j) => (
          <div
            key={j}
            className="rounded-lg border border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-950/60"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-md border border-stone-300 bg-stone-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100">
                {t(lang, EVIDENCE_BADGE_LABEL[tier.badge])}
              </span>
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {tier.heading}
              </span>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-stone-700 dark:text-stone-300">
              {tier.body}
            </p>
          </div>
        ))}
      </div>
    );
  }
  if (s.type === "explanation") {
    return (
      <p
        key={i}
        className="text-[15px] leading-relaxed text-stone-700 dark:text-stone-300"
      >
        {s.content}
      </p>
    );
  }
  if (s.type === "example") {
    const href = localePath(lang, `/search?q=${encodeURIComponent(s.query)}`);
    return (
      <div
        key={i}
        className="rounded-lg border border-stone-200 bg-stone-50/80 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/50"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {t(lang, "concepts_example_label")}
        </p>
        <p className="mt-1 font-mono text-sm text-stone-800 dark:text-stone-200">{s.query}</p>
        <Link
          href={href}
          className="mt-2 inline-block text-sm font-medium text-flora-forest underline decoration-flora-forest/30 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:decoration-emerald-500/40 dark:hover:decoration-emerald-400"
        >
          {t(lang, "concepts_try_query")}
        </Link>
      </div>
    );
  }
  return (
    <div
      key={i}
      className="rounded-lg border-2 border-flora-forest/25 bg-flora-forest/[0.06] px-4 py-3 dark:border-emerald-600/35 dark:bg-emerald-950/40"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-flora-forest dark:text-emerald-400/90">
        {t(lang, "concepts_system_label")}
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-stone-800 dark:text-stone-200">
        {s.content}
      </p>
    </div>
  );
}

export function ConceptPage({ lang, concept }: Props) {
  const ctx = getConceptContextLinks(concept.slug, lang);
  const related = getRelatedConcepts(concept.slug).map((s) =>
    localizeConcept(s, lang)
  );

  return (
    <article className="mx-auto w-full max-w-[720px] px-6 py-14 sm:py-18">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-[2rem] sm:leading-tight">
        {concept.title}
      </h1>

      <p className="mt-6 border-l-4 border-flora-forest/50 pl-4 text-base leading-relaxed text-stone-800 dark:border-emerald-600/50 dark:text-stone-200">
        {concept.definition}
      </p>

      <div className="mt-10 space-y-6">
        {concept.sections.map((s, i) => renderSection(lang, s, i))}
      </div>

      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
            {t(lang, "concepts_related_heading")}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <ConceptCard
                key={r.slug}
                lang={lang}
                href={localePath(lang, `/concepts/${r.slug}`)}
                title={r.title}
                definition={r.definition}
                compact
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-14 border-t border-stone-200 pt-10 dark:border-stone-800">
        <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
          {t(lang, "concepts_appears_heading")}
        </h2>
        <div className="mt-5 space-y-8 text-sm">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t(lang, "concepts_name_queries_label")}
            </h3>
            {ctx.nameQueries.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {ctx.nameQueries.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-md border border-stone-200 bg-white px-2.5 py-1 font-mono text-stone-800 transition-colors hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-200 dark:hover:border-emerald-600/50"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-stone-600 dark:text-stone-400">
                {t(lang, "concepts_no_name_examples")}
              </p>
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t(lang, "concepts_plant_pages_label")}
            </h3>
            {ctx.plantPages.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {ctx.plantPages.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="font-medium text-flora-forest underline decoration-flora-forest/30 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-stone-600 dark:text-stone-400">
                {t(lang, "concepts_plant_pages_pending")}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="mt-12 rounded-xl border border-stone-200 bg-stone-50/60 px-5 py-5 dark:border-stone-700 dark:bg-stone-900/40">
        <p className="font-medium text-stone-900 dark:text-stone-100">
          {t(lang, "concepts_cta_title")}
        </p>
        <Link
          href={localePath(lang, "/names")}
          className="mt-2 inline-block text-sm font-semibold text-flora-forest underline decoration-flora-forest/30 underline-offset-2 dark:text-emerald-400"
        >
          {t(lang, "concepts_cta_link")}
        </Link>
      </div>
    </article>
  );
}
