import type { Plant } from "@/lib/data";
import { joinWithAnd } from "@/lib/programmaticSeo";
import { ti, type Locale } from "@/lib/i18n";

const prose =
  "text-sm leading-relaxed text-stone-600 dark:text-stone-400";

type PlantProgrammaticSeoBlocksProps = {
  lang: Locale;
  plant: Plant;
};

export function PlantProgrammaticSeoBlocks({
  lang,
  plant,
}: PlantProgrammaticSeoBlocksProps) {
  const uses = [...plant.primary_uses]
    .map((u) => u.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))
    .map((u) => u.charAt(0).toUpperCase() + u.slice(1).toLowerCase());

  return (
    <div className={`mt-8 space-y-3 ${prose}`}>
      <p>
        {ti(lang, "prog_plant_family", {
          scientific: plant.scientific_name,
          family: plant.family,
        })}
      </p>
      {uses.length > 0 ? (
        <p>{ti(lang, "prog_plant_uses", { uses: joinWithAnd(uses) })}</p>
      ) : null}
    </div>
  );
}
