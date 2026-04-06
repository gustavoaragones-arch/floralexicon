import { resolveCanonicalNameKey } from "@/lib/data";
import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: { lang: string };
  searchParams: Record<string, string | string[] | undefined>;
};

/** GET `/[lang]/search?q=…` → canonical name resolution (same as the home search form). */
export default function SearchQueryPage({ params, searchParams }: Props) {
  if (!isLocale(params.lang)) redirect("/en");
  const lang = params.lang as Locale;
  const raw = searchParams.q;
  const q = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "" : "";
  const key = resolveCanonicalNameKey(q);
  if (key) {
    const slug = key.replace(/\s+/g, "-");
    redirect(localePath(lang, `/name/${slug}`));
  }
  redirect(localePath(lang, "/"));
}
