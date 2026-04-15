import { t, type Locale } from "@/lib/i18n";

type Props = { lang: Locale };

export function PlantSourcesFootnote({ lang }: Props) {
  return (
    <p className="mt-10 text-center text-xs text-stone-500 dark:text-stone-500">
      {t(lang, "plant_detail_sources_footnote")}
    </p>
  );
}
