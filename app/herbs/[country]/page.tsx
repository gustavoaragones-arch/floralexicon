import { getCountryDisplayName, joinCountryNames, urlSlugToCountryCode } from "@/lib/countries";
import { getAlsoKnownAsLinks, plantNameHubSlug } from "@/lib/data";
import { getMergedPlantRow } from "@/lib/plantDetailData";
import { getNameLinksForCountry, getPlantsForCountry } from "@/lib/herbLandings";
import { defaultLocale, localePath } from "@/lib/i18n";
import { herbHubStaticParams, isSeoHubCountrySlug, SEO_HUB_COUNTRY_SLUGS } from "@/lib/seoProgrammaticRoutes";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { country: string } };

const MAX_PLANTS = 100;
const MAX_NAMES = 40;

export function generateStaticParams() {
  return herbHubStaticParams();
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isSeoHubCountrySlug(params.country)) return {};
  const iso = urlSlugToCountryCode(params.country);
  if (!iso) return {};
  const countryLabel = getCountryDisplayName(iso, "en");
  return {
    title: `Medicinal herbs in ${countryLabel} | FloraLexicon`,
    description: `Discover traditional herbs used in ${countryLabel}. Find local names, compare across regions, and verify the correct plant.`,
  };
}

export default function CountryHerbsSeoPage({ params }: Props) {
  if (!isSeoHubCountrySlug(params.country)) notFound();
  const iso = urlSlugToCountryCode(params.country);
  if (!iso) notFound();

  const countryLabel = getCountryDisplayName(iso, "en");
  const plants = getPlantsForCountry(iso).slice(0, MAX_PLANTS);
  const names = getNameLinksForCountry(iso, MAX_NAMES);

  const otherHubSlugs = SEO_HUB_COUNTRY_SLUGS.filter((s) => s !== params.country.toLowerCase());

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
        Medicinal and traditional herbs in {countryLabel}
      </h1>
      <div className="mt-5 max-w-2xl space-y-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        <p>
          {countryLabel} has a strong tradition of herbal medicine and plant-based remedies. Many herbs are
          known by different local names across regions.
        </p>
        <p>
          Use this page to discover herbs commonly used in {countryLabel} and how they are known locally.
        </p>
      </div>

      <section className="mt-10" aria-labelledby="popular-names">
        <h2
          id="popular-names"
          className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          Popular herb names in {countryLabel}
        </h2>
        {names.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
            No indexed name records list this country yet; browse plants below or open another country hub.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {names.map(({ slug, label }) => (
              <li key={slug}>
                <Link
                  href={`${localePath(defaultLocale, `/name/${slug}`)}?country=${encodeURIComponent(iso)}`}
                  className="inline-block rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-sm font-medium text-flora-forest hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-900/60 dark:text-emerald-300"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="plants-country">
        <h2
          id="plants-country"
          className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          Herbs used in {countryLabel}
        </h2>
        {plants.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
            No slim-index plants are linked to this country in the merged dataset yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {plants.map((plant) => {
              const merged = getMergedPlantRow(plant.id);
              const commonIn = joinCountryNames(merged?.countries ?? [], "en");
              const also = getAlsoKnownAsLinks(plant.id).slice(0, 14);
              return (
                <li
                  key={plant.id}
                  className="rounded-2xl border border-stone-200 bg-white/60 px-4 py-4 dark:border-stone-700 dark:bg-stone-900/40"
                >
                  <p className="font-medium italic tracking-tight text-stone-900 dark:text-stone-100">
                    <Link
                      href={`${localePath(defaultLocale, `/name/${plantNameHubSlug(plant.id, plant.scientific_name)}`)}?country=${encodeURIComponent(iso)}`}
                      className="text-flora-forest hover:underline dark:text-emerald-300"
                    >
                      {plant.scientific_name}
                    </Link>
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    Also known as
                  </p>
                  {also.length === 0 ? (
                    <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">No additional indexed names.</p>
                  ) : (
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {also.map(({ slug, label }) => (
                        <li key={slug}>
                          <Link
                            href={`${localePath(defaultLocale, `/name/${slug}`)}?country=${encodeURIComponent(iso)}`}
                            className="text-sm font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-300"
                          >
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    Common in
                  </p>
                  <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">{commonIn || "—"}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="browse-use">
        <h2
          id="browse-use"
          className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          Browse by use
        </h2>
        <ul className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-8">
          <li>
            <Link
              href="/medicinal-herbs"
              className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-300"
            >
              Medicinal herbs
            </Link>
          </li>
          <li>
            <Link
              href="/culinary-medicinal-herbs"
              className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-300"
            >
              Culinary medicinal herbs
            </Link>
          </li>
          <li>
            <Link
              href="/ritual-herbs"
              className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 dark:text-emerald-300"
            >
              Ritual herbs
            </Link>
          </li>
        </ul>
      </section>

      <nav className="mt-12 border-t border-stone-200 pt-6 text-sm dark:border-stone-800">
        <p className="font-medium text-stone-800 dark:text-stone-200">More country hubs</p>
        <ul className="mt-3 flex flex-wrap gap-4">
          {otherHubSlugs.map((slug) => {
            const code = urlSlugToCountryCode(slug);
            if (!code) return null;
            return (
              <li key={slug}>
                <Link href={`/herbs/${slug}`} className="font-medium text-flora-forest underline dark:text-emerald-300">
                  {getCountryDisplayName(code, "en")}
                </Link>
              </li>
            );
          })}
          <li>
            <Link href="/herbs" className="font-medium text-flora-forest underline dark:text-emerald-300">
              All featured countries
            </Link>
          </li>
          <li>
            <Link href="/query" className="font-medium text-flora-forest underline dark:text-emerald-300">
              Name-in-country queries
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
