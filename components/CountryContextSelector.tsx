"use client";

import { getCountryDisplayName } from "@/lib/countries";
import { localePath, t, type Locale } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type CountryContextSelectorProps = {
  lang: Locale;
  slug: string;
  value?: string;
  options: string[];
  /** Outer wrapper classes (default includes top margin for standalone use). */
  wrapperClassName?: string;
};

export function CountryContextSelector({
  lang,
  slug,
  value,
  options,
  wrapperClassName,
}: CountryContextSelectorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const hubPath = localePath(lang, `/name/${slug}`);

  return (
    <div
      className={
        wrapperClassName ??
        "mt-8 rounded-2xl border border-stone-200 bg-flora-sage/35 px-4 py-4 dark:border-stone-700 dark:bg-stone-900/50"
      }
    >
      <label
        htmlFor="region-country"
        className="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-500"
      >
        {t(lang, "country_label")}
      </label>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        {t(lang, "country_helper")}
      </p>
      <select
        id="region-country"
        className="mt-3 w-full max-w-xs rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 focus:border-flora-forest focus:outline-none focus:ring-2 focus:ring-flora-forest/25 disabled:opacity-50 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30"
        value={value ?? ""}
        disabled={pending}
        onChange={(e) => {
          const code = e.target.value.trim().toUpperCase();
          const path = code
            ? `${hubPath}?country=${encodeURIComponent(code)}`
            : hubPath;
          startTransition(() => router.push(path));
        }}
      >
        <option value="">{t(lang, "country_all")}</option>
        {[...options]
          .sort((a, b) =>
            getCountryDisplayName(a, lang).localeCompare(
              getCountryDisplayName(b, lang),
              lang === "es" ? "es" : "en",
              { sensitivity: "base" }
            )
          )
          .map((c) => (
            <option key={c} value={c}>
              {getCountryDisplayName(c, lang)}
            </option>
          ))}
      </select>
    </div>
  );
}
