import {
  normalizeString,
  resolveCanonicalNameKey,
  loadNames,
  type Plant,
} from "@/lib/data";
import { getCountryDisplayName } from "@/lib/countries";
import { getPlantCountryCodesSorted } from "@/lib/geo";
import type { I18nKey, Locale } from "@/lib/i18n";
import type {
  PlantNameMatch,
  ResolvedPlantContext,
} from "@/lib/resolver";
import { resolvePlantName } from "@/lib/resolver";

/** Query normalization for search (accents, case, hyphens). */
export function normalizeQuery(input: string): string {
  return normalizeString(input);
}

export function getCanonicalHubKey(input: string): string {
  return resolveCanonicalNameKey(input);
}

const ABORT_RE =
  /abortifacient|abortiva|abortivo|abortiv|aborto|emenagog|emmenagog|zoapatli|cihuapatli/i;

const LETHAL_INTENT_RE =
  /\b(toxic|poison|toxico|tóxico|venen|veneno|lethal|let(a|)l|peligr|deadly)\b/i;

const ORAL_INTENT_RE =
  /\b(tea|infusion|infusión|infusions|brew|tisane|té)\b/i;

const MEDICINAL_INTENT_RE =
  /\b(medicinal|medicina|herbal|phyto|fito|herbolaria)\b/i;

const BENEFITS_INTENT_RE =
  /\b(benefits?|benefit|beneficio|beneficios|propiedades)\b/i;

const SAFETY_INTENT_RE =
  /\b(toxic|toxicity|toxicidad|poison|veneno|tóxico|peligr|unsafe|deadly|lethal)\b/i;

export type QueryIntent = {
  oral: boolean;
  medicinal: boolean;
  benefits: boolean;
  /** User is asking about danger / toxicity (affects ranking + “why” copy). */
  safety: boolean;
};

/**
 * Detect intent keywords, then strip them so the remainder resolves to a plant name
 * (e.g. "arnica tea" → name "arnica", oral intent).
 */
export function parseSearchQuery(raw: string): {
  nameForResolve: string;
  intent: QueryIntent;
} {
  const trimmed = raw.trim();
  const intent: QueryIntent = {
    oral: ORAL_INTENT_RE.test(trimmed),
    medicinal: MEDICINAL_INTENT_RE.test(trimmed),
    benefits: BENEFITS_INTENT_RE.test(trimmed),
    safety: SAFETY_INTENT_RE.test(trimmed),
  };

  let s = trimmed;
  const strip = (re: RegExp) => {
    s = s.replace(re, " ");
  };
  strip(/\b(tea|infusion|infusión|infusions|brew|tisane|té)\b/gi);
  strip(/\b(medicinal|medicina|herbal|phyto|fito|herbolaria)\b/gi);
  strip(/\b(benefits?|benefit|beneficio|beneficios|propiedades)\b/gi);
  strip(
    /\b(toxic|toxicity|toxicidad|poison|veneno|tóxico|peligr|unsafe|deadly|lethal)\b/gi
  );
  s = s.replace(/\s+/g, " ").trim();
  const nameForResolve = s.length >= 1 ? s : trimmed;
  return { nameForResolve, intent };
}

type ExtendedPlant = Plant & {
  toxicity?: { level?: string; type?: string[]; notes?: string | null };
  evidence?: { level?: string; source?: string; confidence?: number };
};

function readToxicityLevel(plant: Plant): string {
  const l = (plant as ExtendedPlant).toxicity?.level;
  return typeof l === "string" ? l.trim().toLowerCase() : "";
}

/** For UX hints (evidence concept) — strong indexed toxicity only. */
export function plantHasHighOrLethalToxicity(plant: Plant): boolean {
  const t = readToxicityLevel(plant);
  return t === "high" || t === "lethal";
}

/**
 * Non-linear bar width so rank tiers read visually (high conf fills track; lower = shorter).
 */
export function confidenceBarVisualPercent(confidence: number): number {
  const c = Math.min(1, Math.max(0, confidence));
  if (c >= 0.7) return 100;
  if (c >= 0.4) {
    return Math.round(50 + ((c - 0.4) / 0.3) * 38);
  }
  return Math.round(18 + (c / 0.4) * 27);
}

/** Subtle per-card label when indexed caution applies (lethal > high > moderate > other). */
export function cardSafetyMicroBadgeKey(plant: Plant): I18nKey | null {
  if (!plantNeedsToxicCaution(plant)) return null;
  const t = readToxicityLevel(plant);
  if (t === "lethal") return "search_card_badge_toxic";
  if (t === "high") return "search_card_badge_caution";
  if (t === "moderate" || t === "medium") {
    return "search_card_badge_precaution";
  }
  if (plantMayBeAbortifacient(plant)) return "search_card_badge_precaution";
  return "search_card_badge_precaution";
}

/** Muted one-liner under badge for strongest toxicity only. */
export function cardSafetySupportLineKey(plant: Plant): I18nKey | null {
  const lv = readToxicityLevel(plant);
  if (lv === "lethal") return "search_card_sub_toxic";
  if (lv === "high") return "search_card_sub_caution";
  return null;
}

function evidenceRank(plant: Plant): number {
  const raw = (plant as ExtendedPlant).evidence?.level;
  const l = typeof raw === "string" ? raw.toLowerCase() : "";
  if (l === "clinical" || l === "experimental") return 3;
  if (l === "tramil") return 2;
  return 1;
}

function safetyPenalty(plant: Plant): number {
  const t = readToxicityLevel(plant);
  if (t === "lethal") return 5;
  if (t === "high") return 3;
  if (t === "moderate" || t === "medium") return 2;
  if (t === "low") return 0;
  return 0;
}

export function plantMayBeAbortifacient(plant: Plant): boolean {
  const blob = `${plant.scientific_name} ${plant.primary_uses.join(" ")}`;
  return ABORT_RE.test(blob);
}

export function plantNeedsToxicCaution(plant: Plant): boolean {
  const t = readToxicityLevel(plant);
  if (t === "lethal" || t === "high" || t === "moderate" || t === "medium") {
    return true;
  }
  return plantMayBeAbortifacient(plant);
}

function plantOralFit(plant: Plant): { fit: boolean; ritualHeavy: boolean } {
  const uses = plant.primary_uses.map((u) => u.toLowerCase());
  const fit = uses.some(
    (u) =>
      u.includes("tea") ||
      u.includes("culinary") ||
      u.includes("beverage") ||
      u.includes("infusion")
  );
  const ritualHeavy =
    uses.length > 0 && uses.every((u) => u.includes("ritual"));
  return { fit, ritualHeavy };
}

export type ConfidenceBarLevel = "high" | "medium" | "low";

export type DisambiguationTier = "most_likely" | "possible" | "less_common";

export type WhyBullet = { i18nKey: I18nKey; vars?: Record<string, string> };

/** One visible line under the confidence bar (region boost → usage → top country). */
export type InlineConfidenceLine =
  | { i18nKey: "search_inline_reason_region"; vars: { country: string } }
  | { i18nKey: "search_inline_reason_usage" }
  | { i18nKey: "search_disamb_common_in"; vars: { country: string } };

export type DisambiguationRow = {
  plant: Plant;
  confidence: number;
  confidencePercent: number;
  displayName: string;
  countries: string[];
  tier: DisambiguationTier;
  barLevel: ConfidenceBarLevel;
  evidenceKey: "clinical" | "tramil" | "traditional";
  showSafetyRow: boolean;
  isAbortifacient: boolean;
  whyBullets: WhyBullet[];
  inlineConfidenceLine: InlineConfidenceLine | null;
  /** Short safety pill when this row contributes to caution (which one is risky). */
  safetyMicroBadgeKey: I18nKey | null;
  /** Muted line under badge for lethal / high only. */
  safetySupportLineKey: I18nKey | null;
};

function confidenceTier(conf: number): DisambiguationTier {
  if (conf > 0.7) return "most_likely";
  if (conf >= 0.4) return "possible";
  return "less_common";
}

function barLevel(conf: number): ConfidenceBarLevel {
  if (conf >= 0.7) return "high";
  if (conf >= 0.4) return "medium";
  return "low";
}

function bestDisplayName(
  plantId: string,
  matches: PlantNameMatch[],
  hubKey: string
): string {
  const forPlant = matches.filter((m) => m.plant.id === plantId);
  if (forPlant.length === 0) return "";
  const hub = hubKey.trim().toLowerCase();
  const exact = forPlant.find(
    (m) => normalizeString(m.name_entry.normalized) === hub
  );
  return (exact ?? forPlant[0]).name_entry.name;
}

function sortScore(
  ctx: ResolvedPlantContext,
  plant: Plant,
  userCountry: string | undefined,
  lethalIntent: boolean,
  intent: QueryIntent
): number {
  let s = ctx.confidence * 100;
  if (ctx.countries.some((c) => c === "MX")) s += 2;
  const uc = userCountry?.trim().toUpperCase();
  if (uc && ctx.countries.includes(uc)) s += 3;
  s += evidenceRank(plant) * 0.15;
  if (!lethalIntent) s -= safetyPenalty(plant) * 8;

  if (intent.oral) {
    const { fit, ritualHeavy } = plantOralFit(plant);
    if (fit) s += 5;
    if (ritualHeavy && !fit) s -= 4;
  }

  if (intent.medicinal || intent.benefits) {
    if (
      plant.primary_uses.some((u) => u.toLowerCase().includes("medicinal"))
    ) {
      s += 2;
    }
  }

  if (intent.safety) {
    const t = readToxicityLevel(plant);
    if (t === "high" || t === "lethal" || t === "moderate" || t === "medium") {
      s += 3;
    } else if (plantNeedsToxicCaution(plant)) {
      s += 1;
    }
  }

  return s;
}

function buildWhyBullets(p: {
  tier: DisambiguationTier;
  evidenceKey: DisambiguationRow["evidenceKey"];
  countries: string[];
  plant: Plant;
  intent: QueryIntent;
  userCountry: string | undefined;
  lang: Locale;
}): WhyBullet[] {
  const out: WhyBullet[] = [];
  const top = p.countries[0];
  if (top) {
    out.push({
      i18nKey: "search_why_top_country",
      vars: { country: getCountryDisplayName(top, p.lang) },
    });
  }
  const uc = p.userCountry?.trim().toUpperCase();
  if (uc && p.countries.includes(uc)) {
    out.push({
      i18nKey: "search_why_user_country",
      vars: { country: getCountryDisplayName(uc, p.lang) },
    });
  }

  if (p.tier === "most_likely") {
    out.push({ i18nKey: "search_why_freq_high" });
  } else if (p.tier === "possible") {
    out.push({ i18nKey: "search_why_freq_mid" });
  } else {
    out.push({ i18nKey: "search_why_freq_low" });
  }

  if (p.evidenceKey === "traditional") {
    out.push({ i18nKey: "search_why_evidence_traditional" });
  } else if (p.evidenceKey === "tramil") {
    out.push({ i18nKey: "search_why_evidence_tramil" });
  } else {
    out.push({ i18nKey: "search_why_evidence_clinical" });
  }

  if (p.intent.oral) {
    const { fit } = plantOralFit(p.plant);
    out.push({
      i18nKey: fit ? "search_why_tea_fit" : "search_why_tea_uncertain",
    });
  }
  if (p.intent.medicinal || p.intent.benefits) {
    if (
      p.plant.primary_uses.some((u) => u.toLowerCase().includes("medicinal"))
    ) {
      out.push({ i18nKey: "search_why_medicinal_fit" });
    }
  }
  if (p.intent.safety) {
    out.push({ i18nKey: "search_why_safety_focus" });
  }

  return out.slice(0, 7);
}

export function groupMatchesByPlantId(matches: PlantNameMatch[]): string[] {
  const order: string[] = [];
  const seen = new Set<string>();
  for (const m of matches) {
    if (seen.has(m.plant.id)) continue;
    seen.add(m.plant.id);
    order.push(m.plant.id);
  }
  return order;
}

/**
 * Re-rank plant contexts (confidence, region, evidence, safety, query intent).
 */
export function rankPlantContextsForSearch(
  contexts: ResolvedPlantContext[],
  matches: PlantNameMatch[],
  rawQuery: string,
  userCountry: string | undefined,
  intent: QueryIntent
): ResolvedPlantContext[] {
  const lethalIntent =
    intent.safety || LETHAL_INTENT_RE.test(rawQuery);
  return [...contexts].sort((a, b) => {
    const sa = sortScore(a, a.plant, userCountry, lethalIntent, intent);
    const sb = sortScore(b, b.plant, userCountry, lethalIntent, intent);
    if (sb !== sa) return sb - sa;
    return a.plant.scientific_name.localeCompare(b.plant.scientific_name);
  });
}

export type SearchGlobalSafetyMode = "none" | "multi" | "toxic" | "multi_toxic";

export type DisambiguationSearchResult = {
  displayQuery: string;
  normalizedHub: string;
  intent: QueryIntent;
  rows: DisambiguationRow[];
  hasMultiplePlants: boolean;
  /** Which global safety banner to show (single message; combined when multi + toxic). */
  globalSafetyMode: SearchGlobalSafetyMode;
  /** High/lethal toxicity in results → suggest evidence-levels concept (safety ↔ evidence). */
  suggestEvidenceConceptHint: boolean;
  hadQuery: boolean;
  noHubMatch: boolean;
};

function globalSafetyModeFor(
  hasMultiplePlants: boolean,
  anyToxicOrAbortifacient: boolean
): SearchGlobalSafetyMode {
  if (hasMultiplePlants && anyToxicOrAbortifacient) return "multi_toxic";
  if (anyToxicOrAbortifacient) return "toxic";
  if (hasMultiplePlants) return "multi";
  return "none";
}

export function runDisambiguationSearch(
  rawQuery: string,
  lang: Locale,
  userCountry?: string
): DisambiguationSearchResult {
  const displayQuery = rawQuery.trim();
  const hadQuery = displayQuery.length > 0;
  const { nameForResolve, intent } = parseSearchQuery(displayQuery);
  const normalizedHub = resolveCanonicalNameKey(nameForResolve);

  if (!hadQuery) {
    return {
      displayQuery,
      normalizedHub: "",
      intent,
      rows: [],
      hasMultiplePlants: false,
      globalSafetyMode: "none",
      suggestEvidenceConceptHint: false,
      hadQuery: false,
      noHubMatch: false,
    };
  }

  if (!normalizedHub) {
    return {
      displayQuery,
      normalizedHub: "",
      intent,
      rows: [],
      hasMultiplePlants: false,
      globalSafetyMode: "none",
      suggestEvidenceConceptHint: false,
      hadQuery: true,
      noHubMatch: true,
    };
  }

  const resolved = resolvePlantName(nameForResolve, userCountry, lang);
  const names = loadNames();
  const rankedCtx = rankPlantContextsForSearch(
    resolved.plantContexts,
    resolved.matches,
    displayQuery,
    userCountry,
    intent
  );

  const rows: DisambiguationRow[] = rankedCtx.map((ctx) => {
    const conf = ctx.confidence;
    const displayName =
      bestDisplayName(ctx.plant.id, resolved.matches, normalizedHub) ||
      ctx.plant.scientific_name;
    const countries = getPlantCountryCodesSorted(ctx.plant.id, names, lang);
    const er = evidenceRank(ctx.plant);
    const evidenceKey: DisambiguationRow["evidenceKey"] =
      er >= 3 ? "clinical" : er >= 2 ? "tramil" : "traditional";
    const tier = confidenceTier(conf);
    const bar = barLevel(conf);

    const whyBullets = buildWhyBullets({
      tier,
      evidenceKey,
      countries,
      plant: ctx.plant,
      intent,
      userCountry,
      lang,
    });

    const uc = userCountry?.trim().toUpperCase();
    const regionBoosted = Boolean(uc && ctx.countries.includes(uc));
    let inlineConfidenceLine: InlineConfidenceLine | null = null;
    if (regionBoosted && uc) {
      inlineConfidenceLine = {
        i18nKey: "search_inline_reason_region",
        vars: { country: getCountryDisplayName(uc, lang) },
      };
    } else if (conf > 0.7) {
      inlineConfidenceLine = { i18nKey: "search_inline_reason_usage" };
    } else if (countries[0]) {
      inlineConfidenceLine = {
        i18nKey: "search_disamb_common_in",
        vars: { country: getCountryDisplayName(countries[0], lang) },
      };
    }

    return {
      plant: ctx.plant,
      confidence: conf,
      confidencePercent: Math.round(Math.min(1, Math.max(0, conf)) * 100),
      displayName,
      countries,
      tier,
      barLevel: bar,
      evidenceKey,
      showSafetyRow: plantNeedsToxicCaution(ctx.plant),
      isAbortifacient: plantMayBeAbortifacient(ctx.plant),
      whyBullets,
      inlineConfidenceLine,
      safetyMicroBadgeKey: cardSafetyMicroBadgeKey(ctx.plant),
      safetySupportLineKey: cardSafetySupportLineKey(ctx.plant),
    };
  });

  const hasMultiplePlants = rows.length > 1;
  const anyToxicOrAbortifacient = rows.some(
    (r) => r.showSafetyRow || r.isAbortifacient
  );
  const suggestEvidenceConceptHint =
    hasMultiplePlants &&
    rows.some((r) => plantHasHighOrLethalToxicity(r.plant));

  return {
    displayQuery,
    normalizedHub,
    intent,
    rows,
    hasMultiplePlants,
    globalSafetyMode: globalSafetyModeFor(
      hasMultiplePlants,
      anyToxicOrAbortifacient
    ),
    suggestEvidenceConceptHint,
    hadQuery: true,
    noHubMatch: rows.length === 0,
  };
}

export function getMatches(
  query: string,
  lang: Locale,
  userCountry?: string
): DisambiguationRow[] {
  return runDisambiguationSearch(query, lang, userCountry).rows;
}

export { groupMatchesByPlantId as groupByPlant };

export function rankMatches(
  contexts: ResolvedPlantContext[],
  matches: PlantNameMatch[],
  query: string,
  userCountry?: string
): ResolvedPlantContext[] {
  const intent = parseSearchQuery(query).intent;
  return rankPlantContextsForSearch(
    contexts,
    matches,
    query,
    userCountry,
    intent
  );
}
