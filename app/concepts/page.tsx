import { defaultLocale } from "@/lib/i18n";
import { redirect } from "next/navigation";

/** `/concepts` → default-locale glossary (use `/en/concepts` or `/es/concepts` for alternates). */
export default function ConceptsRootRedirect() {
  redirect(`/${defaultLocale}/concepts`);
}
