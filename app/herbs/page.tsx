import { getCountryDisplayName, urlSlugToCountryCode } from "@/lib/countries";
import { SEO_HUB_COUNTRY_SLUGS } from "@/lib/seoProgrammaticRoutes";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Herb names by country | FloraLexicon",
  description:
    "Browse country-level herb name pages. Compare local names, plant matches, and traditional use clusters.",
};

export default function HerbsCountryIndexPage() {
  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
        Herb names by country
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        Programmatic country pages built from FloraLexicon records. Open a country to see local herb names,
        associated plants, and links to use-based browse pages.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {SEO_HUB_COUNTRY_SLUGS.map((slug) => {
          const iso = urlSlugToCountryCode(slug);
          if (!iso) return null;
          return (
            <li key={slug}>
              <Link
                href={`/herbs/${slug}`}
                className="block rounded-2xl border border-stone-200 bg-white/70 px-4 py-3 text-stone-900 hover:border-flora-forest/35 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-100"
              >
                {getCountryDisplayName(iso, "en")}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
