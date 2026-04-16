import { getCountryDisplayName } from "@/lib/countries";
import { ti, t, type Locale } from "@/lib/i18n";

/** Data-driven one-line explanation for name-hub match ranking (V2 signals). */
export function nameHubMatchWhyLine(
  lang: Locale,
  regionalStrength: number,
  globalAgreement: number,
  selectedIso: string | null | undefined
): string {
  const iso = selectedIso?.trim().toUpperCase();
  if (regionalStrength > 0.75 && iso) {
    return ti(lang, "name_primary_why_dominant_country", {
      country: getCountryDisplayName(iso, lang),
    });
  }
  if (globalAgreement > 0.7) {
    return t(lang, "name_primary_why_common_global");
  }
  return t(lang, "name_primary_why_frequent_match");
}
