/**
 * Map indexed condition ids to glossary concept slugs (only existing concepts).
 * Falls back to null when no good match — UI shows plain text without a link.
 */
const CONDITION_TO_CONCEPT: Record<string, string> = {
  digestive_complaints: "herbal-medicine-traditional-use",
  digestive_issues: "herbal-medicine-traditional-use",
  respiratory_support: "ethnobotany",
  inflammation: "herbal-medicine-traditional-use",
  womens_health: "herbal-medicine-traditional-use",
  dermatologic_infection: "herbal-medicine-traditional-use",
  musculoskeletal_pain: "herbal-medicine-traditional-use",
  anxiety_support: "scientific-evidence-levels",
  stress_support: "scientific-evidence-levels",
  sleep_support: "scientific-evidence-levels",
  circulation_support: "ethnobotany",
  wound_healing: "herbal-medicine-traditional-use",
};

export function conceptSlugForCondition(conditionId: string): string | null {
  const id = conditionId.trim().toLowerCase();
  if (CONDITION_TO_CONCEPT[id]) return CONDITION_TO_CONCEPT[id];
  if (/digest/.test(id)) return "herbal-medicine-traditional-use";
  if (/respir|cold|cough/.test(id)) return "ethnobotany";
  if (/women|menstru|uter|pregnan/.test(id)) return "herbal-medicine-traditional-use";
  if (/derma|skin|wound|infect/.test(id)) return "herbal-medicine-traditional-use";
  if (/pain|musculo|arthr|rheum/.test(id)) return "herbal-medicine-traditional-use";
  if (/anxiety|stress|sleep|calm/.test(id)) return "scientific-evidence-levels";
  if (/inflam/.test(id)) return "herbal-medicine-traditional-use";
  return null;
}
