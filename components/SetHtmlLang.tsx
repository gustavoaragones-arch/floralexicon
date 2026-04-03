"use client";

import type { Locale } from "@/lib/i18n";
import { useEffect } from "react";

export function SetHtmlLang({ lang }: { lang: Locale }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
