"use server";

import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { resolveSearchNavigation } from "@/lib/resolver";
import { redirect } from "next/navigation";

/** POST handler: indexed names go to the name hub; otherwise search fallback. */
export async function searchName(formData: FormData) {
  const raw = formData.get("q");
  const q = typeof raw === "string" ? raw.trim() : "";
  const langRaw = formData.get("lang");
  const lang: Locale =
    typeof langRaw === "string" && isLocale(langRaw) ? langRaw : "en";
  if (q) {
    const nav = resolveSearchNavigation(q);
    if (nav.type === "name") {
      redirect(localePath(lang, `/name/${nav.slug}`));
    }
    redirect(localePath(lang, `/search?q=${encodeURIComponent(q)}`));
  }
  redirect(localePath(lang, "/search"));
}
