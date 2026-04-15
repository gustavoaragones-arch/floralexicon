import { getCountryDisplayName, urlSlugToCountryCode } from "@/lib/countries";
import { seoNameCountryQueryPath, seoNameCountryQueryStaticParams } from "@/lib/seoProgrammaticRoutes";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Herb query pages by name and country | FloraLexicon",
  description:
    "Long-tail query pages for common herb names in specific countries: local context, linked plants, and cross-links to FloraLexicon name hubs.",
};

function humanNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function QueryIndexPage() {
  const combos = seoNameCountryQueryStaticParams();
  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
        Herb query combinations
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        Programmatic long-tail pages in the format{" "}
        <code className="rounded bg-stone-100 px-1 py-0.5 dark:bg-stone-800">
          /query/[name]-in-[country]
        </code>
        . Each page answers what a common name tends to mean in one country, with links to species and related
        labels.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {combos.map((row) => {
          const iso = urlSlugToCountryCode(row.country);
          const countryLabel = iso ? getCountryDisplayName(iso, "en") : row.country;
          return (
            <li key={`${row.name}-${row.country}`}>
              <Link
                href={seoNameCountryQueryPath(row.name, row.country)}
                className="block rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-stone-800 hover:border-flora-forest/35 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-100"
              >
                {humanNameFromSlug(row.name)} in {countryLabel}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-8 text-xs text-stone-500 dark:text-stone-400">
        Showing {combos.length} prebuilt combinations (curated name list × priority countries).
      </p>
    </main>
  );
}
