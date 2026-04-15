import type { PlantDetailModel } from "@/lib/plantDetailData";
import { shouldShowHeaderStructuredSafety } from "@/lib/plantDetailData";
import {
  humanContraindication,
  humanToxicityBand,
  humanToxicityType,
} from "@/lib/plantHumanLabels";
import { t, type Locale } from "@/lib/i18n";

type Props = { lang: Locale; model: PlantDetailModel };

export function PlantStructuredSafety({ lang, model }: Props) {
  const merged = model.merged;
  if (!merged || !shouldShowHeaderStructuredSafety(merged)) return null;

  const tox = merged.toxicity ?? {
    level: "unknown",
    type: [] as string[],
    contraindications: [] as string[],
    notes: null as string | null,
  };

  const contras = (tox.contraindications ?? []).map((c) => c.trim().toLowerCase());
  const avoidParts: string[] = [];
  if (contras.includes("pregnancy")) {
    avoidParts.push(t(lang, "plant_detail_avoid_pregnant"));
  }
  const avoid = avoidParts.length ? avoidParts.join(", ") : t(lang, "plant_detail_avoid_none");

  const interactParts: string[] = [];
  for (const c of tox.contraindications ?? []) {
    const cl = c.trim().toLowerCase();
    if (cl === "pregnancy") continue;
    interactParts.push(humanContraindication(c, lang));
  }
  for (const ty of tox.type ?? []) {
    const lab = humanToxicityType(ty, lang);
    if (!interactParts.includes(lab)) interactParts.push(lab);
  }
  const notes = (tox.notes ?? "").toLowerCase();
  if (/sedativ|benzodiazep|sleep\s*med|blood\s*thinner|anticoagul|warfarin/i.test(notes)) {
    interactParts.push(t(lang, "plant_detail_interact_sedatives_bloodthinners"));
  }
  const interactions =
    interactParts.length > 0 ? interactParts.join(" · ") : t(lang, "plant_detail_interact_none");

  return (
    <aside
      className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30"
      aria-label={t(lang, "plant_detail_safety_block_title")}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-100">
        {t(lang, "plant_detail_safety_block_title")}
      </p>
      <dl className="mt-2 space-y-1.5 text-sm text-stone-800 dark:text-stone-200">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold text-stone-700 dark:text-stone-300">
            {t(lang, "plant_detail_safety_level")}:
          </dt>
          <dd>{humanToxicityBand(tox.level ?? "unknown", lang)}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold text-stone-700 dark:text-stone-300">
            {t(lang, "plant_detail_safety_avoid")}:
          </dt>
          <dd>{avoid}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold text-stone-700 dark:text-stone-300">
            {t(lang, "plant_detail_safety_interactions")}:
          </dt>
          <dd>{interactions}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-semibold text-stone-700 dark:text-stone-300">
            {t(lang, "plant_detail_safety_lookalike")}:
          </dt>
          <dd>
            {merged.lookalike_risk
              ? t(lang, "plant_detail_safety_lookalike_yes")
              : t(lang, "plant_detail_safety_lookalike_no")}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
