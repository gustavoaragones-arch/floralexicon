import { SearchBar } from "@/components/search/SearchBar";
import {
  alternateLanguageUrls,
  isLocale,
  localePath,
  t,
  type Locale,
} from "@/lib/i18n";
import { resolveCountryFromQueryParam } from "@/lib/countries";
import { runDisambiguationSearch } from "@/lib/search";
import { resolveSearchNavigation } from "@/lib/resolver";
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

  const nav = qRaw.trim() ? resolveSearchNavigation(qRaw) : { type: "search" as const };
  if (nav.type === "name") {
    const base = localePath(lang, `/name/${nav.slug}`);
    const cc = userCountry
      ? resolveCountryFromQueryParam(userCountry)
      : undefined;
    const qs = cc ? `?country=${encodeURIComponent(cc)}` : "";
    redirect(`${base}${qs}`);
  }

  const result = runDisambiguationSearch(qRaw, lang, userCountry);

  const heading =
    result.displayQuery || t(lang, "search_prompt_title");

  return (
    <main className="mx-auto w-full max-w-[720px] px-6 py-14 sm:py-18">
      <header className="border-b border-stone-200 pb-10 dark:border-stone-800">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-[2rem] sm:leading-tight">
          {heading}
        </h1>

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
    </main>
  );
}
