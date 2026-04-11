import {
  normalizeString,
  resolveCanonicalNameKey,
  loadNames,
  type Plant,
} from "@/lib/data";
import { getCountryDisplayName } from "@/lib/countries";
import { getPlantCountryCodesSorted } from "@/lib/geo";
import { i18nHasKey, t, type I18nKey, type Locale } from "@/lib/i18n";
import type {
  PlantNameMatch,
  ResolvedPlantContext,
} from "@/lib/resolver";
import { resolvePlantName } from "@/lib/resolver";
import { normalizeHubKey } from "@/lib/hubKey";

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
  sustainability?: { status?: string; notes?: string | null };
  lookalike_risk?: boolean;
  geo_precision?: string;
  /** Merged dataset: ISO countries + regional tokens (e.g. US_NE). */
  countries?: string[];
  regions?: string[];
  metadata?: { na_source?: string; mx_source?: string };
};

type EvidenceLevelKey = "traditional" | "empirical" | "tramil" | "clinical";

const EVIDENCE_SCORE_MULT: Record<EvidenceLevelKey, number> = {
  traditional: 1.0,
  empirical: 1.03,
  tramil: 1.06,
  clinical: 1.1,
};

function readEvidenceLevelKey(plant: Plant): EvidenceLevelKey {
  const r = evidenceRank(plant);
  if (r >= 4) return "clinical";
  if (r >= 3) return "tramil";
  if (r >= 2) return "empirical";
  return "traditional";
}

function readMergedRegions(plant: Plant): string[] {
  const r = (plant as ExtendedPlant).regions;
  if (!Array.isArray(r)) return [];
  return r.map((x) => String(x).trim().toUpperCase()).filter(Boolean);
}

function readMergedCountries(plant: Plant): string[] {
  const c = (plant as ExtendedPlant).countries;
  if (!Array.isArray(c)) return [];
  return c.map((x) => String(x).trim().toUpperCase()).filter(Boolean);
}

/** Subnational token like US_NE — used for geo-precision inline copy. */
function pickSubnationalRegionToken(
  regs: string[],
  uc: string
): string | null {
  const u = uc.trim().toUpperCase();
  if (!u || regs.length === 0) return null;
  const hits = regs.filter(
    (r) => r.startsWith(`${u}_`) || (r.length > u.length && r[u.length] === "_")
  );
  if (hits.length === 0) return null;
  hits.sort((a, b) => b.length - a.length);
  return hits[0] ?? null;
}

/** Readable fallback when no localized region string exists (e.g. MX_BAJA → "MX BAJA"). */
function humanizeRegionToken(token: string): string {
  const k = token.trim().toUpperCase();
  if (/^[A-Z]{2}_[A-Z0-9]+/.test(k)) {
    const cc = k.slice(0, 2);
    const rest = k.slice(3).replace(/_/g, " ");
    return `${cc} ${rest}`.trim();
  }
  return k.replace(/_/g, " ");
}

const REGION_CACHE_MAX = 200;
const regionLabelCache = new Map<string, string>();

function regionLabelCacheKey(lang: Locale, tokenUpper: string): string {
  return `${lang}\t${tokenUpper}`;
}

/** LRU touch: move entry to most-recent end (Map insertion order). */
function getRegionLabelCache(key: string): string | undefined {
  const val = regionLabelCache.get(key);
  if (val !== undefined) {
    regionLabelCache.delete(key);
    regionLabelCache.set(key, val);
  }
  return val;
}

function setRegionLabelCache(key: string, value: string): void {
  if (regionLabelCache.size >= REGION_CACHE_MAX && !regionLabelCache.has(key)) {
    const firstKey = regionLabelCache.keys().next().value;
    if (firstKey !== undefined) regionLabelCache.delete(firstKey);
  }
  regionLabelCache.delete(key);
  regionLabelCache.set(key, value);
}

function mergedRegionLabelForDisplay(token: string, lang: Locale): string {
  const k = token.trim().toUpperCase();
  const ck = regionLabelCacheKey(lang, k);
  const cached = getRegionLabelCache(ck);
  if (cached !== undefined) return cached;
  const dynKey = `search_geo_label_${k.toLowerCase()}`;
  const label = i18nHasKey(dynKey) ? t(lang, dynKey) : humanizeRegionToken(k);
  setRegionLabelCache(ck, label);
  return label;
}

function readLookalikeRisk(plant: Plant): boolean {
  return (plant as ExtendedPlant).lookalike_risk === true;
}

function readSustainabilityStatus(plant: Plant): string {
  const s = (plant as ExtendedPlant).sustainability?.status;
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}

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
  if (l === "clinical" || l === "experimental") return 4;
  if (l === "tramil") return 3;
  if (l === "empirical") return 2;
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
  | {
      i18nKey: "search_inline_reason_region_specific";
      vars: { regionLabel: string };
    }
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
  evidenceKey: "clinical" | "tramil" | "empirical" | "traditional";
  showSafetyRow: boolean;
  isAbortifacient: boolean;
  /** Indexed confusable-species risk (separate from toxicity row). */
  hasLookalikeWarning: boolean;
  whyBullets: WhyBullet[];
  inlineConfidenceLine: InlineConfidenceLine | null;
  /** Short safety pill when this row contributes to caution (which one is risky). */
  safetyMicroBadgeKey: I18nKey | null;
  /** Muted line under badge for lethal / high only. */
  safetySupportLineKey: I18nKey | null;
  /** Sorted source labels for “Sources: …” (client may truncate + expand). */
  sourceProvenanceItems: string[] | null;
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
  const hub = normalizeHubKey(hubKey);
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

  const evKey = readEvidenceLevelKey(plant);
  s *= EVIDENCE_SCORE_MULT[evKey] ?? 1;

  if (uc) {
    const regs = readMergedRegions(plant);
    const mct = readMergedCountries(plant);
    if (regs.length > 0 && regs.some((r) => r.startsWith(uc))) {
      s *= 1.12;
    } else if (mct.length > 0 && mct.includes(uc)) {
      s *= 1.06;
    }
  }

  if (readSustainabilityStatus(plant) === "at-risk") {
    s *= 0.9;
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
  } else if (p.evidenceKey === "empirical") {
    out.push({ i18nKey: "search_why_evidence_empirical" });
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

/** Normalize hub confidences so distinct plants’ shares sum to 1.0 (float fix on first row). */
export function normalizePlantContextConfidences(
  contexts: ResolvedPlantContext[]
): ResolvedPlantContext[] {
  if (contexts.length <= 1) return contexts;
  const sum = contexts.reduce((a, c) => a + c.confidence, 0);
  if (sum <= 0 || Math.abs(sum - 1) < 1e-9) return contexts;
  const scaled = contexts.map((c) => ({
    ...c,
    confidence: Math.round((c.confidence / sum) * 1000) / 1000,
  }));
  const sum2 = scaled.reduce((a, c) => a + c.confidence, 0);
  const delta = Math.round((1 - sum2) * 1000) / 1000;
  if (delta !== 0 && scaled[0]) {
    scaled[0] = {
      ...scaled[0],
      confidence: +(scaled[0].confidence + delta).toFixed(3),
    };
  }
  return scaled;
}

const SOURCE_LINE_MAX = 96;

/** Max provenance items shown before “(+N more)” expand in the disambiguation card. */
export const SOURCE_PROVENANCE_VISIBLE_CAP = 3;

type ProvenanceBucket = "catalog" | "mexico" | "north_america" | "other";

const PROVENANCE_BUCKET_ORDER: Record<ProvenanceBucket, number> = {
  catalog: 0,
  mexico: 1,
  north_america: 2,
  other: 3,
};

type ProvenanceEntry = {
  display: string;
  bucket: ProvenanceBucket;
  /** Normalized raw fragment for deterministic tie-break (fixed `en` collation). */
  rawNorm: string;
};

function mergeProvenanceEntry(prev: ProvenanceEntry, next: ProvenanceEntry): ProvenanceEntry {
  const bo =
    PROVENANCE_BUCKET_ORDER[next.bucket] - PROVENANCE_BUCKET_ORDER[prev.bucket];
  if (bo < 0) return next;
  if (bo > 0) return prev;
  const rawNorm =
    prev.rawNorm.localeCompare(next.rawNorm, "en") <= 0
      ? prev.rawNorm
      : next.rawNorm;
  return { display: prev.display, bucket: prev.bucket, rawNorm };
}

/** Map a source fragment to display text + stable sort bucket (locale-safe ordering). */
function sourceSegmentToProvenanceEntry(
  lang: Locale,
  segment: string
): ProvenanceEntry | null {
  const w = segment.trim();
  if (!w) return null;
  const rawNorm = w.toLowerCase();
  const low = rawNorm;
  if (low.includes("master") || low.includes("layered merge")) {
    return {
      display: t(lang, "search_source_label_catalog"),
      bucket: "catalog",
      rawNorm,
    };
  }
  if (low.includes("mexico") || low.includes("mexican") || low.includes("tramil")) {
    return {
      display: t(lang, "search_source_label_mexico"),
      bucket: "mexico",
      rawNorm,
    };
  }
  if (low.includes("na_ethnobotany") || low.includes("north america")) {
    return {
      display: t(lang, "search_source_label_north_america"),
      bucket: "north_america",
      rawNorm,
    };
  }
  const clipped =
    w.length > SOURCE_LINE_MAX ? `${w.slice(0, SOURCE_LINE_MAX - 1)}…` : w;
  return { display: clipped, bucket: "other", rawNorm };
}

function sortProvenanceEntries(entries: ProvenanceEntry[]): ProvenanceEntry[] {
  return [...entries].sort((a, b) => {
    const o =
      PROVENANCE_BUCKET_ORDER[a.bucket] - PROVENANCE_BUCKET_ORDER[b.bucket];
    if (o !== 0) return o;
    const d = a.display.localeCompare(b.display, "en", { sensitivity: "base" });
    if (d !== 0) return d;
    return a.rawNorm.localeCompare(b.rawNorm, "en");
  });
}

function buildSourceProvenanceItems(lang: Locale, plant: Plant): string[] | null {
  const ep = plant as ExtendedPlant;
  const byKey = new Map<string, ProvenanceEntry>();

  const addFromText = (s: string | undefined, split: boolean) => {
    if (typeof s !== "string" || !s.trim()) return;
    const pieces = split ? s.split(/[;,]/) : [s];
    for (const piece of pieces) {
      const entry = sourceSegmentToProvenanceEntry(lang, piece);
      if (!entry) continue;
      const key = entry.display.toLowerCase();
      const prev = byKey.get(key);
      if (!prev) byKey.set(key, entry);
      else byKey.set(key, mergeProvenanceEntry(prev, entry));
    }
  };

  addFromText(ep.evidence?.source, true);
  addFromText(ep.metadata?.na_source, false);
  addFromText(ep.metadata?.mx_source, false);

  if (byKey.size === 0) return null;
  const sorted = sortProvenanceEntries([...byKey.values()]);
  return sorted.map((e) => e.display);
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
  /**
   * Softer copy when some results are look-alike flagged but no toxicity/abort row
   * (avoids stacking with the main amber banner when combined risk already shown).
   */
  showGlobalLookalikeSoft: boolean;
  hadQuery: boolean;
  noHubMatch: boolean;
};

function globalSafetyModeFor(
  hasMultiplePlants: boolean,
  anyToxicOrAbortifacient: boolean,
  anyLookalike: boolean
): SearchGlobalSafetyMode {
  if (hasMultiplePlants && (anyToxicOrAbortifacient || anyLookalike)) {
    return "multi_toxic";
  }
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
      showGlobalLookalikeSoft: false,
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
      showGlobalLookalikeSoft: false,
      hadQuery: true,
      noHubMatch: true,
    };
  }

  const resolved = resolvePlantName(nameForResolve, userCountry, lang);
  const names = loadNames();
  const normalizedContexts = normalizePlantContextConfidences(
    resolved.plantContexts
  );

  if (process.env.NODE_ENV !== "production" && normalizedContexts.length > 1) {
    const sum = normalizedContexts.reduce((s, c) => s + c.confidence, 0);
    if (Math.abs(sum - 1) > 0.001) {
      console.warn("[FloraLexicon] Confidence sum != 1:", displayQuery, sum);
    }
  }

  const rankedCtx = rankPlantContextsForSearch(
    normalizedContexts,
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
      er >= 4 ? "clinical" : er >= 3 ? "tramil" : er >= 2 ? "empirical" : "traditional";
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
    const mergedRegs = readMergedRegions(ctx.plant);
    const mergedCts = readMergedCountries(ctx.plant);
    const subToken = uc ? pickSubnationalRegionToken(mergedRegs, uc) : null;
    const isRegionalMatch = Boolean(subToken);
    const countryGeoMatch = Boolean(
      uc &&
        (ctx.countries.includes(uc) ||
          (mergedCts.length > 0 && mergedCts.includes(uc)))
    );
    let inlineConfidenceLine: InlineConfidenceLine | null = null;
    if (uc && isRegionalMatch && subToken) {
      inlineConfidenceLine = {
        i18nKey: "search_inline_reason_region_specific",
        vars: { regionLabel: mergedRegionLabelForDisplay(subToken, lang) },
      };
    } else if (uc && countryGeoMatch) {
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
      hasLookalikeWarning: readLookalikeRisk(ctx.plant),
      sourceProvenanceItems: buildSourceProvenanceItems(lang, ctx.plant),
    };
  });

  const hasMultiplePlants = rows.length > 1;
  const anyToxicOrAbortifacient = rows.some(
    (r) => r.showSafetyRow || r.isAbortifacient
  );
  const anyLookalike = rows.some((r) => r.hasLookalikeWarning);
  const suggestEvidenceConceptHint =
    hasMultiplePlants &&
    rows.some((r) => plantHasHighOrLethalToxicity(r.plant));
  const showGlobalLookalikeSoft =
    anyLookalike && !anyToxicOrAbortifacient && !hasMultiplePlants;

  return {
    displayQuery,
    normalizedHub,
    intent,
    rows,
    hasMultiplePlants,
    globalSafetyMode: globalSafetyModeFor(
      hasMultiplePlants,
      anyToxicOrAbortifacient,
      anyLookalike
    ),
    suggestEvidenceConceptHint,
    showGlobalLookalikeSoft,
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
