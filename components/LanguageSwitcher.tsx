"use client";

import type { Locale } from "@/lib/i18n";
import { isLocale } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";

const btn =
  "rounded px-2 py-1 text-xs font-semibold transition-colors hover:bg-stone-200/80 dark:hover:bg-stone-800";
const active =
  "bg-flora-forest text-white dark:bg-emerald-700";
const inactive = "text-stone-600 dark:text-stone-400";

function swapLocaleInPath(pathname: string, target: Locale): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return `/${target}`;
  if (isLocale(parts[0])) {
    parts[0] = target;
    return `/${parts.join("/")}`;
  }
  return `/${target}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function LanguageSwitcher({ lang }: { lang: Locale }) {
  const pathname = usePathname() || "/";

  return (
    <div
      className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white/60 px-1 py-0.5 dark:border-stone-700 dark:bg-stone-900/40"
      role="navigation"
      aria-label="Language"
    >
      {(["en", "es"] as const).map((code) => (
        <Link
          key={code}
          href={swapLocaleInPath(pathname, code)}
          hrefLang={code}
          className={`${btn} ${code === lang ? active : inactive}`}
          scroll={false}
        >
          {code === "en" ? "EN" : "ES"}
        </Link>
      ))}
    </div>
  );
}
