import { ConceptHint } from "@/components/concepts/ConceptHint";
import { AmbiguityNotice } from "@/components/search/AmbiguityNotice";
import { DisambiguationResultsClient } from "@/components/search/DisambiguationResultsClient";
import { SearchBar } from "@/components/search/SearchBar";
import {
  alternateLanguageUrls,
  isLocale,
  localePath,
  t,
  ti,
  type Locale,
} from "@/lib/i18n";
import { urlSlugToCanonicalSlug } from "@/lib/data";
import { resolveCountryFromQueryParam } from "@/lib/countries";
import { normalizeHubKey } from "@/lib/hubKey";
import { runDisambiguationSearch } from "@/lib/search";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: { lang: string };
  searchParams: Record<string, string | string[] | undefined>;
};

function pickParam(
  v: string | string[] | undefined
): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return undefined;
}

export function generateMetadata({ params, searchParams }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const q = pickParam(searchParams.q)?.trim() ?? "";
  const alt = alternateLanguageUrls("/search");
  const title = q
    ? `${q} — ${t(lang, "search_meta_title")}`
    : t(lang, "search_meta_title");
  return {
    title,
    description: t(lang, "search_meta_desc"),
    alternates: {
      canonical: lang === "es" ? alt.es : alt.en,
      languages: {
        en: alt.en,
        es: alt.es,
        "x-default": alt.xDefault,
      },
    },
  };
}

export default function DisambiguationSearchPage({ params, searchParams }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const qRaw = pickParam(searchParams.q) ?? "";
  const userCountry = pickParam(searchParams.country)?.toUpperCase();

  const result = runDisambiguationSearch(qRaw, lang, userCountry);

  if (
    result.hadQuery &&
    !result.noHubMatch &&
    result.rows.length === 1
  ) {
    const nameSlug = urlSlugToCanonicalSlug(
      result.normalizedHub.replace(/\s+/g, "-")
    );
    const base = localePath(lang, `/name/${nameSlug}`);
    const cc = userCountry
      ? resolveCountryFromQueryParam(userCountry)
      : undefined;
    const qs = cc ? `?country=${encodeURIComponent(cc)}` : "";
    redirect(`${base}${qs}`);
  }

  const heading =
    result.displayQuery || t(lang, "search_prompt_title");

  const hubKeyForClicks = normalizeHubKey(result.normalizedHub);
  const nameSlugForResults = urlSlugToCanonicalSlug(
    result.normalizedHub.replace(/\s+/g, "-")
  );

  return (
    <main className="mx-auto w-full max-w-[720px] px-6 py-14 sm:py-18">
      <header className="border-b border-stone-200 pb-10 dark:border-stone-800">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-[2rem] sm:leading-tight">
          {heading}
        </h1>
        {result.hadQuery && result.rows.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-base font-medium text-stone-700 dark:text-stone-300">
              {result.hasMultiplePlants
                ? t(lang, "search_subtitle_multi")
                : t(lang, "search_subtitle_single")}
            </p>
            {result.hasMultiplePlants ? (
              <p className="text-sm text-stone-600 dark:text-stone-400">
                <span>{t(lang, "search_inline_why_lead")} </span>
                <Link
                  href={localePath(lang, "/concepts/plant-name-ambiguity")}
                  className="font-semibold text-flora-forest underline decoration-flora-forest/35 underline-offset-2 dark:text-emerald-400"
                >
                  {t(lang, "search_inline_why_cta")}
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8">
          <SearchBar lang={lang} initialQ={result.displayQuery} />
        </div>
      </header>

      {!result.hadQuery ? (
        <p className="mt-10 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {t(lang, "search_prompt_body")}
        </p>
      ) : null}

      {result.hadQuery && result.noHubMatch ? (
        <div
          className="mt-10 rounded-2xl border border-stone-200 bg-stone-50/80 px-5 py-6 dark:border-stone-700 dark:bg-stone-900/40"
          role="status"
        >
          <p className="text-base font-semibold text-stone-900 dark:text-stone-100">
            {t(lang, "search_empty_no_hub_title")}
          </p>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            {t(lang, "search_empty_no_hub_body")}
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium">
            <Link
              href={localePath(lang, "/plants")}
              className="text-flora-forest underline decoration-flora-forest/35 underline-offset-2 dark:text-emerald-400"
            >
              {t(lang, "search_empty_browse_plants")}
            </Link>
            <Link
              href={localePath(lang, "/names")}
              className="text-flora-forest underline decoration-flora-forest/35 underline-offset-2 dark:text-emerald-400"
            >
              {t(lang, "search_empty_browse_names")}
            </Link>
          </div>
        </div>
      ) : null}

      {result.hadQuery && result.rows.length > 0 ? (
        <>
          {result.hasMultiplePlants ? (
            <div className="mt-8 space-y-3">
              <ConceptHint lang={lang} concept="plant-name-ambiguity" />
              {result.suggestEvidenceConceptHint ? (
                <ConceptHint
                  lang={lang}
                  concept="scientific-evidence-levels"
                  messageKey="concept_hint_evidence_levels"
                />
              ) : null}
              <AmbiguityNotice lang={lang} />
            </div>
          ) : null}

          {result.globalSafetyMode !== "none" ? (
            <div
              className="mt-8 rounded-xl border-2 border-amber-500/80 bg-amber-50 px-4 py-3 text-sm font-semibold leading-relaxed text-amber-950 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100"
              role="alert"
            >
              <span className="mr-2" aria-hidden>
                ⚠️
              </span>
              {result.globalSafetyMode === "multi_toxic"
                ? t(lang, "search_global_safety_combined")
                : result.globalSafetyMode === "toxic"
                  ? t(lang, "search_global_safety_toxic_only")
                  : t(lang, "search_global_safety_multi")}
            </div>
          ) : null}

          {result.showGlobalLookalikeSoft ? (
            <div
              className="mt-4 rounded-xl border border-violet-400/70 bg-violet-50 px-4 py-3 text-sm font-medium leading-relaxed text-violet-950 dark:border-violet-700/50 dark:bg-violet-950/40 dark:text-violet-100"
              role="status"
            >
              <span className="mr-2" aria-hidden>
                ⚠️
              </span>
              {t(lang, "search_global_lookalike_soft")}
            </div>
          ) : null}

          {result.hasMultiplePlants ? (
            <p className="mt-8 font-medium text-stone-800 dark:text-stone-200">
              {ti(lang, "search_rank_intro", { name: result.displayQuery })}
            </p>
          ) : null}

          <DisambiguationResultsClient
            lang={lang}
            hubKey={hubKeyForClicks}
            nameSlug={nameSlugForResults}
            initialRows={result.rows}
            hasMultiplePlants={result.hasMultiplePlants}
            searchQuery={result.displayQuery}
            searchCountryParam={userCountry}
          />
        </>
      ) : null}
    </main>
  );
}
