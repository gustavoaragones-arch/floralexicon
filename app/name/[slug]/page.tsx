import { defaultLocale } from "@/lib/i18n";
import { redirect } from "next/navigation";

type Props = { params: { slug: string } };

export default function NameRootRedirect({ params }: Props) {
  redirect(`/${defaultLocale}/name/${params.slug}`);
}
