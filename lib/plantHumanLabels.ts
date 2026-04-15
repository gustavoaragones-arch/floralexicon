import type { Locale } from "@/lib/i18n";
import { ti, t, type I18nKey } from "@/lib/i18n";
import { formatRegionList } from "@/lib/countries";
import { getCountryDisplayName } from "@/lib/countries";

function titleCaseWords(slug: string): string {
  return slug
    .split(/_+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function humanConditionLabel(id: string): string {
  const t = id.trim();
  if (!t) return "";
  if (/^[a-z0-9_]+$/i.test(t)) return titleCaseWords(t);
  return t;
}

function mapUseSlugToI18nKey(use: string): I18nKey | null {
  const u = use.trim().toLowerCase();
  if (u === "medicinal") return "hub_use_medicinal";
  if (u === "tea") return "hub_use_tea";
  if (u === "ritual") return "hub_use_ritual";
  if (u === "culinary") return "hub_use_culinary";
  if (u === "aromatic") return "hub_use_aromatic";
  if (u === "topical") return "plant_detail_use_topical";
  return null;
}

export function humanUseLabel(use: string, lang: Locale): string {
  const key = mapUseSlugToI18nKey(use);
  if (key) return t(lang, key);
  return titleCaseWords(use.replace(/-/g, "_"));
}

/** Localized toxicity band for UI (no raw slugs). */
export function humanToxicityBand(level: string | undefined, lang: Locale): string {
  const l = (level ?? "").toLowerCase().trim();
  if (l === "lethal") return t(lang, "plant_detail_tox_lethal");
  if (l === "high") return t(lang, "plant_detail_tox_high");
  if (l === "moderate") return t(lang, "plant_detail_tox_moderate");
  if (l === "low") return t(lang, "plant_detail_tox_low");
  if (l === "unknown" || !l) return t(lang, "plant_detail_tox_unknown");
  return titleCaseWords(l);
}

export function humanEvidenceLevel(level: string | undefined, lang: Locale): string {
  const l = (level ?? "").toLowerCase().trim();
  if (l === "clinical") return t(lang, "plant_detail_evid_clinical");
  if (l === "tramil") return t(lang, "plant_detail_evid_tramil");
  if (l === "empirical") return t(lang, "plant_detail_evid_empirical");
  if (l === "traditional") return t(lang, "plant_detail_evid_traditional");
  return titleCaseWords(l || "traditional");
}

export function humanSustainabilityStatus(
  status: string | undefined,
  lang: Locale
): string {
  const s = (status ?? "").toLowerCase().trim();
  if (s === "at-risk") return t(lang, "plant_detail_sus_at_risk");
  if (s === "caution") return t(lang, "plant_detail_sus_caution");
  if (s === "safe") return t(lang, "plant_detail_sus_safe");
  return titleCaseWords(s || "unknown");
}

export function humanContraindication(
  raw: string,
  lang: Locale
): string {
  const r = raw.trim().toLowerCase();
  if (r === "pregnancy") return t(lang, "plant_detail_contra_pregnancy");
  if (r === "anticoagulant_interaction")
    return t(lang, "plant_detail_contra_anticoagulant");
  if (r === "liver_caution") return t(lang, "plant_detail_contra_liver");
  return titleCaseWords(raw.replace(/_/g, " "));
}

export function humanToxicityType(raw: string, lang: Locale): string {
  const r = raw.trim().toLowerCase();
  if (r === "abortifacient" || r.includes("abort"))
    return t(lang, "plant_detail_flag_abortifacient");
  return titleCaseWords(raw.replace(/_/g, " "));
}

/** Regions / codes: ISO → localized country; other tokens → readable title. */
export function formatRegionsForLocale(codes: string[], lang: Locale): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const raw of codes) {
    const c = raw.trim();
    if (!c || seen.has(c)) continue;
    seen.add(c);
    if (/^[A-Z]{2}$/.test(c)) {
      parts.push(getCountryDisplayName(c, lang));
    } else if (/^[A-Z0-9_]+$/.test(c)) {
      parts.push(
        c
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (x) => x.toUpperCase())
      );
    } else {
      parts.push(c);
    }
  }
  parts.sort((a, b) => a.localeCompare(b, lang === "es" ? "es" : "en"));
  return parts.join(", ");
}

export function formatOriginRegions(regions: string[]): string {
  return formatRegionList(regions);
}

/** One scannable sentence for plant detail “uses” cards (no raw condition ids). */
export function conditionThemeOneLiner(conditionId: string, lang: Locale): string {
  const k = conditionId.trim().toLowerCase();
  if (k.includes("digest")) return t(lang, "plant_detail_cond_one_digest");
  if (k.includes("inflam")) return t(lang, "plant_detail_cond_one_inflam");
  if (k.includes("respir") || k.includes("cough"))
    return t(lang, "plant_detail_cond_one_respiratory");
  if (k.includes("women") || k.includes("menstru") || k.includes("uter"))
    return t(lang, "plant_detail_cond_one_womens");
  if (k.includes("anxiety") || k.includes("stress") || k.includes("sleep"))
    return t(lang, "plant_detail_cond_one_relax");
  if (k.includes("derma") || k.includes("skin") || k.includes("wound"))
    return t(lang, "plant_detail_cond_one_skin");
  if (k.includes("pain") || k.includes("musculo") || k.includes("arthr"))
    return t(lang, "plant_detail_cond_one_pain");
  if (k.includes("circulat")) return t(lang, "plant_detail_cond_one_circulation");
  return ti(lang, "plant_detail_cond_one_fallback", {
    label: humanConditionLabel(conditionId),
  });
}

/** Truncate meta description for SERP limits (default 155). */
export function clipForMetaDescription(text: string, max = 155): string {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const last = cut.lastIndexOf(" ");
  const base = last > Math.min(48, Math.floor(max * 0.45)) ? cut.slice(0, last) : cut;
  return `${base.trimEnd()}…`;
}
