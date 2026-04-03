import type { Plant } from "@/lib/data";
import { getCountryDisplayName, joinCountryNames } from "@/lib/countries";
import { t, ti, type Locale } from "@/lib/i18n";

export function buildWhenToChooseText(params: {
  lang: Locale;
  queryLabel: string;
  plant: Plant;
  commonCountries?: string[];
  userCountry?: string;
}): string {
  const { lang, queryLabel, plant, commonCountries, userCountry } = params;
  const uses =
    plant.primary_uses.length > 0
      ? plant.primary_uses.join(", ")
      : t(lang, "decision_uses_fallback");
  const q = queryLabel.trim() || "this name";
  const region = userCountry?.trim().toUpperCase();

  if (region && commonCountries?.some((c) => c.toUpperCase() === region)) {
    const nm = getCountryDisplayName(region, lang);
    return ti(lang, "decision_when_region", { q, country: nm, uses });
  }

  if (commonCountries?.length === 1) {
    const nm = getCountryDisplayName(commonCountries[0], lang);
    return ti(lang, "decision_when_single", { q, country: nm, uses });
  }

  if (commonCountries && commonCountries.length > 1) {
    const places = joinCountryNames(commonCountries, lang);
    return ti(lang, "decision_when_multi", { q, places, uses });
  }

  return ti(lang, "decision_when_fallback", { q, uses });
}

export function buildHowItDiffers(params: {
  lang: Locale;
  plant: Plant;
  siblingPlants: Plant[];
  queryLabel: string;
}): string | null {
  const { lang, plant, siblingPlants, queryLabel } = params;
  const others = siblingPlants.filter((p) => p.id !== plant.id);
  if (others.length === 0) return null;

  const q = queryLabel.trim() || "this name";
  const otherFamilies = Array.from(new Set(others.map((p) => p.family)));

  if (otherFamilies.length === 1 && otherFamilies[0] === plant.family) {
    const otherGenera = Array.from(new Set(others.map((p) => p.genus))).filter(
      (g) => g !== plant.genus
    );
    if (otherGenera.length > 0) {
      return ti(lang, "decision_diff_genus", {
        q,
        genus: plant.genus,
        family: plant.family,
        genera: otherGenera.join(lang === "es" ? " y " : " and "),
      });
    }
    return ti(lang, "decision_diff_same_family", {
      q,
      scientific: plant.scientific_name,
      family: plant.family,
    });
  }

  const familyList = otherFamilies.join(lang === "es" ? " y " : " and ");
  return ti(lang, "decision_diff_families", {
    q,
    family: plant.family,
    families: familyList,
  });
}
