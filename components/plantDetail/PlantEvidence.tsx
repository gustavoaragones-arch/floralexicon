import type { PlantDetailModel } from "@/lib/plantDetailData";
import { humanEvidenceLevel } from "@/lib/plantHumanLabels";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

type Props = { lang: Locale; model: PlantDetailModel };

export function PlantEvidence({ lang, model }: Props) {
  const ev = model.merged?.evidence;
  if (!ev?.level) return null;

  return (
    <section aria-labelledby="plant-evidence-heading" className="mt-10">
      <h2
        id="plant-evidence-heading"
        className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
      >
        {t(lang, "plant_detail_evidence_heading")}
      </h2>
      <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">
        {humanEvidenceLevel(ev.level, lang)}
      </p>
      <p className="mt-3 text-xs text-stone-600 dark:text-stone-400">
        <Link
          href={localePath(lang, "/concepts/scientific-evidence-levels")}
          className={linkClass}
        >
          {t(lang, "plant_detail_evidence_read_concept")}
        </Link>
      </p>
    </section>
  );
}
