import { getCoreConcepts } from "@/lib/concepts";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * Hint browsers to prefetch core concept URLs for the active locale (SSG pages, no runtime fetch).
 */
export function CoreConceptPrefetch({ lang }: { lang: Locale }) {
  const hrefs = getCoreConcepts().map((c) => localePath(lang, `/concepts/${c.slug}`));
  return (
    <>
      {hrefs.map((href) => (
        <link key={href} rel="prefetch" href={href} />
      ))}
    </>
  );
}
