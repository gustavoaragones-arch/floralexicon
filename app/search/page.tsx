import { defaultLocale } from "@/lib/i18n";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

/** `/search?q=…` → `/{defaultLocale}/search?q=…` (then resolves to name hub). */
export default function SearchRootRedirect({ searchParams }: Props) {
  const q = searchParams.q;
  const raw = typeof q === "string" ? q : Array.isArray(q) ? q[0] : "";
  const qs = raw ? `?q=${encodeURIComponent(raw)}` : "";
  redirect(`/${defaultLocale}/search${qs}`);
}
