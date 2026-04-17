import { getCountryDisplayName } from "@/lib/countries";
import { joinWithAnd } from "@/lib/programmaticSeo";
import { ti, type Locale } from "@/lib/i18n";
import type { ResolvedPlantContext } from "@/lib/resolver";

const prose =
  "text-sm leading-relaxed text-stone-600 dark:text-stone-400";

type NameProgrammaticSeoBlocksProps = {
  lang: Locale;
  displayName: string;
  hasMatches: boolean;
  plantContexts?: ResolvedPlantContext[];
};

function collectCountryLabels(
  contexts: ResolvedPlantContext[],
  lang: Locale
): string[] {
  const codes = new Set<string>();
  for (const ctx of contexts) {
    for (const c of ctx.countries) {
      const k = c.trim().toUpperCase();
      if (k) codes.add(k);
    }
  }
  return Array.from(codes)
    .sort((a, b) =>
      getCountryDisplayName(a, lang).localeCompare(
        getCountryDisplayName(b, lang),
        lang === "es" ? "es" : "en",
        { sensitivity: "base" }
      )
    )
    .map((code) => getCountryDisplayName(code, lang));
}

function collectUseLabels(contexts: ResolvedPlantContext[]): string[] {
  const set = new Set<string>();
  for (const ctx of contexts) {
    if (!ctx.plant) continue;
    for (const u of ctx.plant.primary_uses) {
      const low = u.trim().toLowerCase();
      if (low) set.add(low);
    }
  }
  return Array.from(set)
    .sort()
    .map((u) => u.charAt(0).toUpperCase() + u.slice(1));
}

export function NameProgrammaticSeoBlocks({
  lang,
  displayName,
  hasMatches,
  plantContexts = [],
}: NameProgrammaticSeoBlocksProps) {
  if (!hasMatches) {
    return (
      <div className={`mt-8 space-y-3 ${prose}`}>
        <p>{ti(lang, "prog_name_no_index", { name: displayName })}</p>
      </div>
    );
  }

  const countries = collectCountryLabels(plantContexts, lang);
  const uses = collectUseLabels(plantContexts);

  return (
    <div className={`mt-6 space-y-3 ${prose}`}>
      <p>
        {countries.length > 0 ? (
          <>
            {ti(lang, "prog_name_intro_countries", {
              name: displayName,
              countries: joinWithAnd(countries),
            })}
          </>
        ) : (
          <>{ti(lang, "prog_name_intro_fallback", { name: displayName })}</>
        )}
      </p>
      {uses.length > 0 ? (
        <p>
          {ti(lang, "prog_name_uses", { uses: joinWithAnd(uses) })}
        </p>
      ) : null}
    </div>
  );
}
