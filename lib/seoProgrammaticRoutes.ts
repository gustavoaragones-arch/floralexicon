/**
 * Locale-agnostic programmatic SEO routes (country hubs + query batch).
 * Kept in one module so `generateStaticParams`, pages, and sitemap stay aligned.
 */

export const SEO_HUB_COUNTRY_SLUGS = [
  "peru",
  "mexico",
  "colombia",
  "spain",
  "argentina",
] as const;

export type SeoHubCountrySlug = (typeof SEO_HUB_COUNTRY_SLUGS)[number];

export function isSeoHubCountrySlug(slug: string): slug is SeoHubCountrySlug {
  return (SEO_HUB_COUNTRY_SLUGS as readonly string[]).includes(slug.toLowerCase());
}

export function herbHubStaticParams(): { country: string }[] {
  return SEO_HUB_COUNTRY_SLUGS.map((country) => ({ country }));
}

/** Top name URL segments × top country URL segments (20 × 10 = 200). */
export const SEO_QUERY_NAME_SLUGS = [
  "ruda",
  "matico",
  "manzanilla",
  "cedron",
  "yerba-buena",
  "boldo",
  "epazote",
  "muna",
  "guayusa",
  "salvia",
  "romero",
  "tomillo",
  "albahaca",
  "hierbabuena",
  "tila",
  "valeriana",
  "diente-de-leon",
  "ortiga",
  "eucalipto",
  "anis",
] as const;

export const SEO_QUERY_COUNTRY_SLUGS = [
  "mexico",
  "peru",
  "colombia",
  "chile",
  "argentina",
  "spain",
  "ecuador",
  "bolivia",
  "venezuela",
  "guatemala",
] as const;

export function seoNameCountryQueryStaticParams(): { name: string; country: string }[] {
  const out: { name: string; country: string }[] = [];
  for (const name of SEO_QUERY_NAME_SLUGS) {
    for (const country of SEO_QUERY_COUNTRY_SLUGS) {
      out.push({ name, country });
    }
  }
  return out;
}

export function seoNameCountryQueryPath(name: string, country: string): string {
  return `/query/${name}-in-${country}`;
}

const SEO_QUERY_KEYS = new Set(
  SEO_QUERY_NAME_SLUGS.flatMap((name) =>
    SEO_QUERY_COUNTRY_SLUGS.map((country) => `${name}\0${country}`)
  )
);

export function isSeoNameCountryQuery(name: string, country: string): boolean {
  return SEO_QUERY_KEYS.has(`${name}\0${country}`);
}
