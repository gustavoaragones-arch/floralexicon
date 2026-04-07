"use server";

import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { redirect } from "next/navigation";

/** Legacy POST handler: sends users to the disambiguation search page. */
export async function searchName(formData: FormData) {
  const raw = formData.get("q");
  const q = typeof raw === "string" ? raw.trim() : "";
  const langRaw = formData.get("lang");
  const lang: Locale =
    typeof langRaw === "string" && isLocale(langRaw) ? langRaw : "en";
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  redirect(localePath(lang, `/search${qs}`));
}
