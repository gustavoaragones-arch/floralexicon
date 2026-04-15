import type { PlantDetailModel } from "@/lib/plantDetailData";
import {
  humanContraindication,
  humanToxicityBand,
  humanToxicityType,
} from "@/lib/plantHumanLabels";
import { t, type Locale } from "@/lib/i18n";

type Props = { lang: Locale; model: PlantDetailModel };

export function PlantSafety({ lang, model }: Props) {
  const merged = model.merged;
  if (!merged) return null;
  if (!merged.toxicity && merged.lookalike_risk !== true) return null;

  const tox = (merged.toxicity ?? {
    level: "unknown",
    type: [] as string[],
    contraindications: [] as string[],
    notes: null as string | null,
  }) as {
    level: string;
    type?: string[];
    contraindications?: string[];
    notes?: string | null;
  };

  const types = (tox.type ?? []).filter(Boolean);
  const contras = (tox.contraindications ?? []).filter(Boolean);
  const notes = tox.notes?.trim();

  const contrasLower = contras.map((c) => c.trim().toLowerCase());
  const avoidParts: string[] = [];
  if (contrasLower.includes("pregnancy")) {
    avoidParts.push(t(lang, "plant_detail_avoid_pregnant"));
  }
  const avoid =
    avoidParts.length > 0 ? avoidParts.join(", ") : t(lang, "plant_detail_avoid_none");

  const interactParts: string[] = [];
  for (const c of contras) {
    if (c.trim().toLowerCase() === "pregnancy") continue;
    interactParts.push(humanContraindication(c, lang));
  }
  for (const ty of types) {
    const lab = humanToxicityType(ty, lang);
    if (!interactParts.includes(lab)) interactParts.push(lab);
  }
  const notesLower = (notes ?? "").toLowerCase();
  if (/sedativ|benzodiazep|sleep\s*med|blood\s*thinner|anticoagul|warfarin/i.test(notesLower)) {
    interactParts.push(t(lang, "plant_detail_interact_sedatives_bloodthinners"));
  }
  const interactions =
    interactParts.length > 0 ? interactParts.join(" · ") : t(lang, "plant_detail_interact_none");

  const hasDetail = types.length > 0 || contras.length > 0 || Boolean(notes);
  const showGrid =
    Boolean(tox.level) ||
    contras.length > 0 ||
    types.length > 0 ||
    merged.lookalike_risk === true;

  if (!showGrid && !hasDetail) return null;

  return (
    <section aria-labelledby="plant-safety-heading" className="mt-10">
      <h2
        id="plant-safety-heading"
        className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
      >
        {t(lang, "plant_detail_safety_heading")}
      </h2>
      <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
        {t(lang, "plant_detail_safety_intro")}
      </p>

      {merged.lookalike_risk ? (
        <div
          className="mt-4 flex gap-2 rounded-xl border border-amber-600 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-500/60 dark:bg-amber-950/35 dark:text-amber-50"
          role="status"
        >
          <span className="select-none" aria-hidden>
            ⚠️
          </span>
          <p>{t(lang, "plant_detail_safety_confusable_warning")}</p>
        </div>
      ) : null}

      {showGrid ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-stone-200 bg-white/70 px-3 py-2 dark:border-stone-700 dark:bg-stone-900/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t(lang, "plant_detail_safety_level")}
            </p>
            <p className="mt-1 text-sm text-stone-900 dark:text-stone-100">
              {humanToxicityBand(tox.level ?? "unknown", lang)}
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white/70 px-3 py-2 dark:border-stone-700 dark:bg-stone-900/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t(lang, "plant_detail_safety_avoid")}
            </p>
            <p className="mt-1 text-sm text-stone-900 dark:text-stone-100">{avoid}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white/70 px-3 py-2 dark:border-stone-700 dark:bg-stone-900/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t(lang, "plant_detail_safety_interactions")}
            </p>
            <p className="mt-1 text-sm text-stone-900 dark:text-stone-100">{interactions}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white/70 px-3 py-2 dark:border-stone-700 dark:bg-stone-900/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
              {t(lang, "plant_detail_safety_lookalike")}
            </p>
            <p className="mt-1 text-sm text-stone-900 dark:text-stone-100">
              {merged.lookalike_risk
                ? t(lang, "plant_detail_safety_lookalike_yes")
                : t(lang, "plant_detail_safety_lookalike_no")}
            </p>
          </div>
        </div>
      ) : null}

      {hasDetail ? (
        <dl className="mt-4 space-y-3 text-sm">
          {types.length > 0 ? (
            <div>
              <dt className="font-medium text-stone-800 dark:text-stone-200">
                {t(lang, "plant_detail_tox_flags")}
              </dt>
              <dd>
                <ul className="mt-1 list-disc pl-5 text-stone-700 dark:text-stone-300">
                  {types.map((x) => (
                    <li key={x}>{humanToxicityType(x, lang)}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
          {contras.length > 0 ? (
            <div>
              <dt className="font-medium text-stone-800 dark:text-stone-200">
                {t(lang, "plant_detail_contra_heading")}
              </dt>
              <dd>
                <ul className="mt-1 list-disc pl-5 text-stone-700 dark:text-stone-300">
                  {contras.map((c) => (
                    <li key={c}>{humanContraindication(c, lang)}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
          {notes ? (
            <div>
              <dt className="font-medium text-stone-800 dark:text-stone-200">
                {t(lang, "plant_detail_tox_notes")}
              </dt>
              <dd className="mt-1 text-stone-700 dark:text-stone-300">{notes}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}
