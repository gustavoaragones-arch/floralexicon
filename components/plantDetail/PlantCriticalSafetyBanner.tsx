import type { PlantDetailModel } from "@/lib/plantDetailData";
import { toxicityLevelRank } from "@/lib/plantDetailData";
import { t, type Locale } from "@/lib/i18n";

type Props = { lang: Locale; model: PlantDetailModel };

/** High / lethal toxicity: render at top of page above all sections. */
export function PlantCriticalSafetyBanner({ lang, model }: Props) {
  const level = model.merged?.toxicity?.level;
  const rank = toxicityLevelRank(level);
  if (rank < 3) return null;

  const tox = (level ?? "").toLowerCase().trim();
  const lethal = tox === "lethal";

  return (
    <div
      className={`mb-8 rounded-xl border px-4 py-3 text-sm font-medium ${
        lethal
          ? "border-red-800 bg-red-950/90 text-red-50 dark:border-red-700 dark:bg-red-950/80"
          : "border-amber-700 bg-amber-50 text-amber-950 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-50"
      }`}
      role="alert"
    >
      {lethal ? t(lang, "plant_detail_safety_lethal") : t(lang, "plant_detail_safety_critical")}
      <span className="mt-1 block font-normal opacity-90">
        {t(lang, "plant_detail_safety_intro")}
      </span>
    </div>
  );
}
