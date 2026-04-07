"use client";

import type { WhyBullet } from "@/lib/search";
import { t, ti, type Locale } from "@/lib/i18n";

type Props = {
  lang: Locale;
  bullets: WhyBullet[];
};

export default function WhyDetails({ lang, bullets }: Props) {
  return (
    <ul className="list-disc space-y-1.5 border-t border-stone-200 px-3 py-3 pl-8 text-sm text-stone-700 dark:border-stone-700 dark:text-stone-300">
      {bullets.map((b, bi) => (
        <li key={`${b.i18nKey}-${bi}`}>
          {b.vars ? ti(lang, b.i18nKey, b.vars) : t(lang, b.i18nKey)}
        </li>
      ))}
    </ul>
  );
}
