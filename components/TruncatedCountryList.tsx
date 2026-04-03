"use client";

import { joinCountryNames } from "@/lib/countries";
import { t, ti, type Locale } from "@/lib/i18n";
import { useState } from "react";

const btnClass =
  "ml-0.5 inline font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400";

type TruncatedCountryListProps = {
  codes: string[];
  lang: Locale;
  /** How many country names to show before “+N more”. Default 5. */
  maxVisible?: number;
  className?: string;
};

export function TruncatedCountryList({
  codes,
  lang,
  maxVisible = 5,
  className = "",
}: TruncatedCountryListProps) {
  const [open, setOpen] = useState(false);

  if (codes.length === 0) return null;

  if (codes.length <= maxVisible) {
    return (
      <span className={className}>{joinCountryNames(codes, lang)}</span>
    );
  }

  const rest = codes.length - maxVisible;

  if (open) {
    return (
      <span className={className}>
        {joinCountryNames(codes, lang)}{" "}
        <button
          type="button"
          className={btnClass}
          onClick={() => setOpen(false)}
        >
          {t(lang, "geo_collapse_countries")}
        </button>
      </span>
    );
  }

  return (
    <span className={className}>
      {joinCountryNames(codes.slice(0, maxVisible), lang)}
      {", "}
      <button
        type="button"
        className={btnClass}
        onClick={() => setOpen(true)}
      >
        {ti(lang, "geo_expand_countries", { n: String(rest) })}
      </button>
    </span>
  );
}
