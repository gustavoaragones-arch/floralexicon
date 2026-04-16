import { defaultLocale } from "@/lib/i18n";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

/** `/search?q=…` → `/{defaultLocale}/search?q=…` (indexed names redirect to `/name/[slug]`). */
export default function SearchRootRedirect({ searchParams }: Props) {
  const q = searchParams.q;
  const raw = typeof q === "string" ? q : Array.isArray(q) ? q[0] : "";
  const c = searchParams.country;
  const countryRaw =
    typeof c === "string" ? c : Array.isArray(c) ? c[0] : "";
  const params = new URLSearchParams();
  if (raw) params.set("q", raw);
  if (countryRaw) params.set("country", countryRaw);
  const qs = params.toString() ? `?${params.toString()}` : "";
  redirect(`/${defaultLocale}/search${qs}`);
}
