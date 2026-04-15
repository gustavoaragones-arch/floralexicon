import {
  countryCodeToUrlSlug,
  getCountryDisplayName,
  urlSlugToCountryCode,
} from "@/lib/countries";
import {
  getAlternateHerbNamesWithCountriesForHub,
  getNamesByNormalized,
  getPlantById,
  resolveCanonicalNameKey,
} from "@/lib/data";
import {
  isSeoHubCountrySlug,
  isSeoNameCountryQuery,
  seoNameCountryQueryPath,
  seoNameCountryQueryStaticParams,
} from "@/lib/seoProgrammaticRoutes";
import { resolvePlantName } from "@/lib/resolver";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { name: string; country: string } };

const MAX_ANSWER_PLANTS = 8;
const MAX_ALSO_CALLED = 36;
const MAX_RELATED_QUERIES = 12;

function humanNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function generateStaticParams() {
  return seoNameCountryQueryStaticParams();
}

export function generateMetadata({ params }: Props): Metadata {
  if (!isSeoNameCountryQuery(params.name, params.country)) return {};
  const iso = urlSlugToCountryCode(params.country);
  if (!iso) return {};
  const countryLabel = getCountryDisplayName(iso, "en");
  const nameLabel = humanNameFromSlug(params.name);
  return {
    title: `What is "${nameLabel}" called in ${countryLabel}?`,
    description: `Find what "${nameLabel}" is called in ${countryLabel}. Compare local herb names and verify the correct plant.`,
  };
}

export default function QueryLandingPage({ params }: Props) {
  if (!isSeoNameCountryQuery(params.name, params.country)) notFound();

  const iso = urlSlugToCountryCode(params.country);
  if (!iso) notFound();

  const countryLabel = getCountryDisplayName(iso, "en");
  const countrySlug = countryCodeToUrlSlug(iso);
  const herbsCountryHref = isSeoHubCountrySlug(countrySlug)
    ? `/herbs/${countrySlug}`
    : "/herbs";
  const nameLabel = humanNameFromSlug(params.name);
  const queryText = params.name.replace(/-/g, " ").trim();
  const result = resolvePlantName(queryText, iso, "en");
  const matches = result.plantContexts.slice(0, MAX_ANSWER_PLANTS);

  const canonicalKey = resolveCanonicalNameKey(queryText);
  const localRows = getNamesByNormalized(canonicalKey).filter(
    (e) => e.country.trim().toUpperCase() === iso
  );

  const plantIds = matches.map((m) => m.plant.id);
  const alsoCalled = getAlternateHerbNamesWithCountriesForHub(
    plantIds,
    params.name,
    MAX_ALSO_CALLED
  );

  const relatedQueries = seoNameCountryQueryStaticParams()
    .filter((row) => row.country === params.country && row.name !== params.name)
    .slice(0, MAX_RELATED_QUERIES);

  return (
    <main className="mx-auto w-full max-w-[1000px] px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
        What is &quot;{nameLabel}&quot; called in {countryLabel}?
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        FloraLexicon maps everyday herb names to species using country context. Start with how people say it
        locally, then confirm the scientific name when you need certainty.
      </p>

      <section
        className="mt-8 rounded-2xl border border-stone-200 bg-stone-50/80 px-5 py-5 dark:border-stone-700 dark:bg-stone-900/45"
        aria-labelledby="query-answer"
      >
        <h2 id="query-answer" className="text-sm font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300">
          In {countryLabel}, &quot;{nameLabel}&quot; commonly refers to
        </h2>
        {matches.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            We do not yet have indexed plant links for this exact spelling in {countryLabel}. Open the{" "}
            <Link href={`/name/${params.name}`} className="font-medium text-flora-forest underline dark:text-emerald-300">
              name hub
            </Link>{" "}
            or the{" "}
            <Link href={herbsCountryHref} className="font-medium text-flora-forest underline dark:text-emerald-300">
              {isSeoHubCountrySlug(countrySlug) ? `${countryLabel} herb listing` : "Featured country herb pages"}
            </Link>{" "}
            to explore nearby records.
          </p>
        ) : (
          <>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-stone-800 dark:text-stone-200">
              {matches.map((ctx) => (
                <li key={ctx.plant.id}>
                  <Link href={`/plant/${ctx.plant.id}`} className="font-medium italic text-flora-forest hover:underline dark:text-emerald-300">
                    {ctx.plant.scientific_name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              These herbs appear in traditional remedies and everyday plant knowledge; the right species can
              still vary by region, dialect, and local markets.
            </p>
          </>
        )}
      </section>

      <section className="mt-10" aria-labelledby="local-context">
        <h2
          id="local-context"
          className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          Local context
        </h2>
        {localRows.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
            No name rows in the index list this label specifically for {countryLabel} yet. Dataset coverage
            grows over time; the name hub still aggregates related entries when available.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {localRows.map((row, idx) => (
              <li
                key={`${row.name}-${row.language}-${idx}`}
                className="rounded-2xl border border-stone-200 bg-white/60 px-4 py-3 text-sm dark:border-stone-700 dark:bg-stone-900/40"
              >
                <p className="font-medium text-stone-900 dark:text-stone-100">{row.name}</p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  Language: {row.language} · Linked plants:
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {row.plant_ids.map((pid) => {
                    const p = getPlantById(pid);
                    const label = p?.scientific_name ?? pid;
                    return (
                      <li key={pid}>
                        <Link
                          href={`/plant/${pid}`}
                          className="text-sm font-medium text-flora-forest underline dark:text-emerald-300"
                        >
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="also-called">
        <h2
          id="also-called"
          className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          Also called
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
          The same underlying plants are often labeled differently in neighboring countries or languages.
        </p>
        {alsoCalled.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
            No cross-country alias rows are indexed for these matches yet.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {alsoCalled.map((row) => (
              <li key={row.slug}>
                <Link
                  href={`/name/${row.slug}`}
                  className="inline-block rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-sm font-medium text-flora-forest hover:border-flora-forest/40 dark:border-stone-600 dark:bg-stone-900/60 dark:text-emerald-300"
                >
                  {row.label}
                  <span className="ml-1 text-xs font-normal text-stone-500 dark:text-stone-400">
                    ({row.countryCodes.map((c) => getCountryDisplayName(c, "en")).join(", ")})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="scientific">
        <h2
          id="scientific"
          className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          Scientific confirmation
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          When safety, cultivation, or regulations matter, the everyday name alone is not enough. Use the
          scientific name as the stable key for the organism you mean.
        </p>
        {matches.length === 0 ? null : (
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {matches.slice(0, 4).map((ctx) => (
              <li key={ctx.plant.id}>
                In FloraLexicon, &quot;{nameLabel}&quot; in {countryLabel} can point to the species{" "}
                <Link href={`/plant/${ctx.plant.id}`} className="font-medium italic text-flora-forest underline dark:text-emerald-300">
                  {ctx.plant.scientific_name}
                </Link>
                .
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="related-queries">
        <h2
          id="related-queries"
          className="font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          More in {countryLabel}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {relatedQueries.map((row) => (
            <li key={`${row.name}-${row.country}`}>
              <Link
                href={seoNameCountryQueryPath(row.name, row.country)}
                className="inline-block rounded-full border border-stone-200 bg-white/70 px-3 py-1 text-sm text-flora-forest hover:border-flora-forest/40 dark:border-stone-700 dark:bg-stone-900/50 dark:text-emerald-300"
              >
                {humanNameFromSlug(row.name)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <nav className="mt-12 border-t border-stone-200 pt-6 text-sm dark:border-stone-800">
        <p className="font-medium text-stone-800 dark:text-stone-200">Explore further</p>
        <ul className="mt-3 flex flex-wrap gap-4">
          <li>
            <Link href={`/name/${params.name}`} className="font-medium text-flora-forest underline dark:text-emerald-300">
              Name hub: {nameLabel}
            </Link>
          </li>
          <li>
            <Link href={herbsCountryHref} className="font-medium text-flora-forest underline dark:text-emerald-300">
              {isSeoHubCountrySlug(countrySlug) ? `Herbs in ${countryLabel}` : "Browse herb pages by country"}
            </Link>
          </li>
          <li>
            <Link href="/medicinal-herbs" className="font-medium text-flora-forest underline dark:text-emerald-300">
              Medicinal herbs
            </Link>
          </li>
          <li>
            <Link href="/culinary-medicinal-herbs" className="font-medium text-flora-forest underline dark:text-emerald-300">
              Culinary medicinal herbs
            </Link>
          </li>
          <li>
            <Link href="/ritual-herbs" className="font-medium text-flora-forest underline dark:text-emerald-300">
              Ritual herbs
            </Link>
          </li>
          <li>
            <Link href="/query" className="font-medium text-flora-forest underline dark:text-emerald-300">
              All query pages
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
