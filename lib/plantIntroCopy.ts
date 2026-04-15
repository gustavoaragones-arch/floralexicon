import type { PlantDetailModel } from "@/lib/plantDetailData";
import { humanConditionLabel, humanUseLabel } from "@/lib/plantHumanLabels";
import { ti, t, type Locale } from "@/lib/i18n";

/** Consumer-style theme phrases for definitional / FAQ copy (not raw ids). */
function themePhraseForCondition(id: string, lang: Locale): string {
  const k = id.trim().toLowerCase();
  if (k.includes("digest")) return t(lang, "plant_detail_theme_digestive");
  if (k.includes("inflam")) return t(lang, "plant_detail_theme_inflammation");
  if (k.includes("respir") || k.includes("cough")) return t(lang, "plant_detail_theme_respiratory");
  if (k.includes("women") || k.includes("menstru") || k.includes("uter"))
    return t(lang, "plant_detail_theme_womens");
  if (k.includes("anxiety") || k.includes("stress") || k.includes("sleep"))
    return t(lang, "plant_detail_theme_relax");
  if (k.includes("derma") || k.includes("skin") || k.includes("wound"))
    return t(lang, "plant_detail_theme_skin");
  if (k.includes("pain") || k.includes("musculo") || k.includes("arthr"))
    return t(lang, "plant_detail_theme_pain");
  return humanConditionLabel(id);
}

export function topThemesForPlant(
  model: PlantDetailModel,
  lang: Locale,
  max: number
): string[] {
  const cond = model.merged?.conditions?.filter(Boolean) ?? [];
  if (cond.length) {
    return cond.slice(0, max).map((id) => themePhraseForCondition(id, lang));
  }
  const uses = model.core.primary_uses.map((u) => u.trim()).filter(Boolean);
  return uses.slice(0, max).map((u) => humanUseLabel(u, lang));
}

export function topTwoThemesForHeader(model: PlantDetailModel, lang: Locale): string[] {
  return topThemesForPlant(model, lang, 2);
}

export function topThreeThemesForDefinition(model: PlantDetailModel, lang: Locale): string[] {
  const base = topThemesForPlant(model, lang, 3);
  if (base.length >= 3) return base;
  const uses = model.core.primary_uses.map((u) => u.trim()).filter(Boolean);
  for (const u of uses) {
    const label = humanUseLabel(u, lang);
    if (!base.includes(label)) base.push(label);
    if (base.length >= 3) break;
  }
  return base.slice(0, 3);
}

export function buildDefinitionalLines(
  model: PlantDetailModel,
  lang: Locale
): { line1: string; line2: string | null } {
  const { core, displayNames } = model;
  const themes = topThreeThemesForDefinition(model, lang);
  let themeStr = t(lang, "plant_detail_theme_general");
  if (themes.length === 1) themeStr = themes[0]!;
  else if (themes.length > 1) {
    themeStr = `${themes.slice(0, -1).join(", ")} ${t(lang, "plant_detail_def_and")} ${themes[themes.length - 1]}`;
  }

  const kind =
    core.primary_uses.some((u) => u.toLowerCase().includes("medicinal")) ||
    (model.merged?.uses?.some((u) => u.toLowerCase().includes("medicinal")) ?? false)
      ? t(lang, "plant_detail_kind_medicinal_herb")
      : t(lang, "plant_detail_kind_plant");

  const line1 = ti(lang, "plant_detail_def_line1", {
    scientific: core.scientific_name,
    kind,
    themes: themeStr,
  });

  const examples = displayNames.filter((n) => n !== core.scientific_name).slice(0, 3);
  const line2 =
    examples.length > 0
      ? ti(lang, "plant_detail_def_line2", {
          examples: examples.join(lang === "es" ? " · " : " · "),
        })
      : null;

  return { line1, line2 };
}
