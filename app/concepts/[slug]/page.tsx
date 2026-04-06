import { defaultLocale } from "@/lib/i18n";
import { redirect } from "next/navigation";

type Props = { params: { slug: string } };

/** `/concepts/[slug]` → default-locale concept page. */
export default function ConceptSlugRootRedirect({ params }: Props) {
  redirect(`/${defaultLocale}/concepts/${params.slug}`);
}
