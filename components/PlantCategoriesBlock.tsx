import {
  categoryListingPath,
  getPlantCategories,
  type PlantCategory,
} from "@/lib/categories";
import type { Plant } from "@/lib/data";
import { localePath, t, type I18nKey, type Locale } from "@/lib/i18n";
import Link from "next/link";

function displayNameKey(cat: PlantCategory): I18nKey {
  switch (cat) {
    case "medicinal":
      return "category_name_medicinal";
    case "culinary-medicinal":
      return "category_name_culinary_medicinal";
    case "ritual":
      return "category_name_ritual";
  }
}

function viewMoreKey(cat: PlantCategory): I18nKey {
  switch (cat) {
    case "medicinal":
      return "plant_view_more_medicinal";
    case "culinary-medicinal":
      return "plant_view_more_culinary_medicinal";
    case "ritual":
      return "plant_view_more_ritual";
  }
}

type PlantCategoriesBlockProps = {
  lang: Locale;
  plant: Plant;
};

export function PlantCategoriesBlock({ lang, plant }: PlantCategoriesBlockProps) {
  const categories = getPlantCategories(plant);
  if (categories.length === 0) return null;

  const labels = categories.map((c) => t(lang, displayNameKey(c)));

  return (
    <section
      className="mt-8 border-t border-stone-200 pt-8 dark:border-stone-800"
      aria-label={t(lang, "plant_categories_label")}
    >
      <p className="text-sm text-stone-700 dark:text-stone-300">
        <span className="font-medium text-stone-800 dark:text-stone-200">
          {t(lang, "plant_categories_label")}
        </span>{" "}
        {labels.join(", ")}
      </p>
      <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
        {categories.map((cat) => (
          <li key={cat}>
            <Link
              href={localePath(lang, categoryListingPath[cat])}
              className="text-sm font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400"
            >
              {t(lang, viewMoreKey(cat))}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
