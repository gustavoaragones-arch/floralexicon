/**
 * Search query parsing (intent keywords + name remainder).
 * Split from `lib/search.ts` so routing can depend on this without importing the full search module.
 */

export const ABORT_RE =
  /abortifacient|abortiva|abortivo|abortiv|aborto|emenagog|emmenagog|zoapatli|cihuapatli/i;

export const LETHAL_INTENT_RE =
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
