"use server";

import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { resolveCanonicalNameKey } from "@/lib/data";
import { redirect } from "next/navigation";

export async function searchName(formData: FormData) {
  const raw = formData.get("q");
  const q = typeof raw === "string" ? raw : "";
  const key = resolveCanonicalNameKey(q);
  if (!key) return;

  const langRaw = formData.get("lang");
  const lang: Locale =
    typeof langRaw === "string" && isLocale(langRaw) ? langRaw : "en";

  const slug = key.replace(/\s+/g, "-");
  redirect(localePath(lang, `/name/${slug}`));
}
