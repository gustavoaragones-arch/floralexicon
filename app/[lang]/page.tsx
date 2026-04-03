import { searchName } from "@/app/actions";
import {
  alternateLanguageUrls,
  isLocale,
  localePath,
  t,
  type Locale,
} from "@/lib/i18n";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const alt = alternateLanguageUrls("/");
  return {
    title: t(lang, "meta_home_title"),
    description: t(lang, "meta_home_desc"),
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

export default function HomePage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const sectionClass = "space-y-6";
  const h2Class =
    "font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-2xl";
  const bodyClass = "text-stone-600 dark:text-stone-400 leading-relaxed";

  const popular = [
    { slug: "manzanilla", label: "manzanilla" },
    { slug: "ruda", label: "ruda" },
    { slug: "matico", label: "matico" },
    { slug: "cedron", label: "cedrón (cedron)" },
  ];

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-16 sm:py-20">
      <section className="border-b border-stone-200 pb-16 dark:border-stone-800">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl sm:leading-tight md:text-[2.5rem]">
          {t(lang, "hero_title")}
        </h1>
        <p className={`mt-5 max-w-2xl text-lg ${bodyClass}`}>
          {t(lang, "hero_lead")}
        </p>

        <form
          action={searchName}
          className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-stretch"
        >
          <input type="hidden" name="lang" value={lang} />
          <label htmlFor="q" className="sr-only">
            {t(lang, "search_label_sr")}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            autoComplete="off"
            placeholder={t(lang, "search_placeholder")}
            className="min-h-12 flex-1 rounded-2xl border border-stone-300 bg-white px-5 py-2 text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-flora-forest focus:outline-none focus:ring-2 focus:ring-flora-forest/25 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30"
          />
          <button
            type="submit"
            className="min-h-12 rounded-full border border-flora-forest bg-flora-forest px-10 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:border-flora-forest-hover hover:bg-flora-forest-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-flora-forest/40 dark:border-emerald-600 dark:bg-emerald-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-600"
          >
            {t(lang, "search_button")}
          </button>
        </form>

        <p className="mt-4 max-w-2xl text-sm font-medium text-stone-700 dark:text-stone-300">
          {t(lang, "hero_search_context")}
        </p>

        <p className="mt-6 text-sm text-stone-500 dark:text-stone-500">
          {t(lang, "examples_label")}{" "}
          {popular.map((item, i) => (
            <span key={item.slug}>
              {i > 0 ? " · " : null}
              <Link
                href={localePath(lang, `/name/${item.slug}`)}
                className="font-medium text-stone-700 underline decoration-stone-300 underline-offset-2 hover:text-flora-forest hover:decoration-flora-forest dark:text-stone-300 dark:hover:text-emerald-300 dark:hover:decoration-emerald-400"
              >
                {item.label}
              </Link>
            </span>
          ))}
        </p>
      </section>

      <div className="mt-20 space-y-20">
        <section className={sectionClass} aria-labelledby="how-heading">
          <h2 id="how-heading" className={h2Class}>
            {t(lang, "home_how_title")}
          </h2>
          <ol className="mt-2 list-decimal space-y-4 pl-5 text-stone-700 dark:text-stone-300">
            <li className="pl-1">
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {t(lang, "home_how_1_title")}
              </span>{" "}
              {t(lang, "home_how_1_body")}
            </li>
            <li className="pl-1">
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {t(lang, "home_how_2_title")}
              </span>{" "}
              {t(lang, "home_how_2_body")}
            </li>
            <li className="pl-1">
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {t(lang, "home_how_3_title")}
              </span>{" "}
              {t(lang, "home_how_3_body")}
            </li>
          </ol>
        </section>

        <section
          className={`rounded-3xl border border-stone-200/80 bg-flora-sage/40 px-6 py-8 dark:border-stone-700 dark:bg-stone-900/40 sm:px-8 ${sectionClass}`}
          aria-labelledby="why-heading"
        >
          <h2 id="why-heading" className={h2Class}>
            {t(lang, "home_why_title")}
          </h2>
          <div className={`space-y-4 ${bodyClass}`}>
            <p>
              {t(lang, "home_why_p1a")}{" "}
              <strong className="font-medium text-stone-800 dark:text-stone-200">
                {t(lang, "home_why_p1b")}
              </strong>{" "}
              {t(lang, "home_why_p1c")}{" "}
              <strong className="font-medium text-stone-800 dark:text-stone-200">
                {t(lang, "home_why_p1d")}
              </strong>
              {t(lang, "home_why_p1e")}
            </p>
            <p>
              {t(lang, "home_why_p2a")}{" "}
              <strong className="font-medium text-stone-800 dark:text-stone-200">
                {t(lang, "home_why_p2b")}
              </strong>{" "}
              {t(lang, "home_why_p2c")}{" "}
              <strong className="font-medium text-stone-800 dark:text-stone-200">
                {t(lang, "home_why_p2d")}
              </strong>
              {t(lang, "home_why_p2e")}{" "}
              <strong className="font-medium text-stone-800 dark:text-stone-200">
                {t(lang, "home_why_p2f")}
              </strong>{" "}
              {t(lang, "home_why_p2g")}
            </p>
            <p>{t(lang, "home_why_p3")}</p>
          </div>
        </section>

        <section className={sectionClass} aria-labelledby="medicinal-heading">
          <h2 id="medicinal-heading" className={h2Class}>
            {t(lang, "home_medicinal_title")}
          </h2>
          <p className={bodyClass}>{t(lang, "home_medicinal_body")}</p>
        </section>

        <section className={sectionClass} aria-labelledby="popular-heading">
          <h2 id="popular-heading" className={h2Class}>
            {t(lang, "home_popular_title")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {popular.map((item) => (
              <li key={item.slug}>
                <Link
                  href={localePath(lang, `/name/${item.slug}`)}
                  className="block rounded-2xl border border-stone-200 bg-white/60 px-4 py-3 text-stone-800 shadow-sm transition-colors hover:border-flora-forest/40 hover:bg-white dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-200 dark:hover:border-emerald-700/50 dark:hover:bg-stone-900/70"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-500">
                    {t(lang, "home_popular_cta")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={sectionClass} aria-labelledby="browse-by-use-heading">
          <h2 id="browse-by-use-heading" className={h2Class}>
            {t(lang, "home_browse_by_use_title")}
          </h2>
          <ul className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
            <li>
              <Link
                href={localePath(lang, "/medicinal-herbs")}
                className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400"
              >
                {t(lang, "home_link_medicinal_herbs")}
              </Link>
            </li>
            <li>
              <Link
                href={localePath(lang, "/culinary-herbs")}
                className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400"
              >
                {t(lang, "home_link_culinary_herbs")}
              </Link>
            </li>
            <li>
              <Link
                href={localePath(lang, "/ritual-herbs")}
                className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400"
              >
                {t(lang, "home_link_ritual_herbs")}
              </Link>
            </li>
          </ul>
        </section>

        <section className={sectionClass} aria-labelledby="browse-heading">
          <h2 id="browse-heading" className={h2Class}>
            {t(lang, "home_browse_title")}
          </h2>
          <p className={bodyClass}>{t(lang, "home_browse_lead")}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href={localePath(lang, "/plants")}
              className="inline-flex items-center rounded-full border-2 border-flora-forest bg-flora-forest px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:border-flora-forest-hover hover:bg-flora-forest-hover dark:border-emerald-600 dark:bg-emerald-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-600"
            >
              {t(lang, "home_all_plants")}
            </Link>
            <Link
              href={localePath(lang, "/names")}
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-8 py-3 text-sm font-semibold text-stone-800 shadow-sm transition-colors hover:border-flora-forest/50 hover:bg-flora-sage/50 dark:border-stone-600 dark:bg-stone-900/50 dark:text-stone-200 dark:hover:border-emerald-700/60 dark:hover:bg-stone-800/50"
            >
              {t(lang, "home_all_names")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
