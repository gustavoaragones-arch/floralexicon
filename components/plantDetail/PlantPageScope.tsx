import { t, type Locale } from "@/lib/i18n";

type Props = { lang: Locale };

export function PlantPageScope({ lang }: Props) {
  return (
    <p className="mt-6 max-w-3xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
      {t(lang, "plant_detail_page_scope")}
    </p>
  );
}
