import type { PlantDetailModel } from "@/lib/plantDetailData";
import { conceptSlugForCondition } from "@/lib/conditionConceptLinks";
import { localePath, t, type Locale } from "@/lib/i18n";
import { conditionThemeOneLiner, humanConditionLabel, humanUseLabel } from "@/lib/plantHumanLabels";
import Link from "next/link";

const conceptLinkClass =
  "font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

type Props = { lang: Locale; model: PlantDetailModel };

export function PlantUses({ lang, model }: Props) {
  const { core, merged } = model;
  const conditions = merged?.conditions?.filter(Boolean) ?? [];
  const useSlugs = merged?.uses?.length
    ? merged.uses
    : core.primary_uses.map((u) => u.trim()).filter(Boolean);

  if (conditions.length === 0) {
    return (
      <section aria-labelledby="plant-uses-heading" className="mt-10">
        <h2
          id="plant-uses-heading"
          className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
        >
          {t(lang, "plant_detail_uses_heading")}
        </h2>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {t(lang, "plant_detail_uses_none")}
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-stone-800 dark:text-stone-200">
          {useSlugs.map((u) => (
            <li key={u}>{humanUseLabel(u, lang)}</li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section aria-labelledby="plant-uses-heading" className="mt-10">
      <h2
        id="plant-uses-heading"
        className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
      >
        {t(lang, "plant_detail_uses_heading")}
      </h2>
      <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">
        {t(lang, "uses")}:{" "}
        {useSlugs.map((u) => humanUseLabel(u, lang)).join(" · ")}
      </p>
      <ul className="mt-4 space-y-3">
        {conditions.map((cid) => {
          const slug = conceptSlugForCondition(cid);
          const label = humanConditionLabel(cid);
          const title = slug ? (
            <Link
              href={localePath(lang, `/concepts/${slug}`)}
              className={conceptLinkClass}
            >
              {label}
            </Link>
          ) : (
            label
          );
          return (
            <li
              key={cid}
              className="rounded-xl border border-stone-200 bg-white/60 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/40"
            >
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
              <p className="mt-1 text-sm leading-snug text-stone-700 dark:text-stone-300">
                {conditionThemeOneLiner(cid, lang)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
