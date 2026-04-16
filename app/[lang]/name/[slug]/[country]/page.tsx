import { urlSlugToCountryCode } from "@/lib/countries";
import { urlSlugToCanonicalSlug } from "@/lib/data";
import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { notFound, permanentRedirect } from "next/navigation";

type Props = { params: { lang: string; slug: string; country: string } };

/**
 * Legacy `/name/[slug]/[country]` URLs redirect to the canonical name hub with `?country=`.
 */
export default function NameCountryLegacyRedirect({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const countryCode = urlSlugToCountryCode(params.country);
  if (!countryCode) notFound();

  const canonicalSlug = urlSlugToCanonicalSlug(params.slug);
  const target =
    localePath(lang, `/name/${canonicalSlug}`) +
    `?country=${encodeURIComponent(countryCode)}`;
  permanentRedirect(target);
}
