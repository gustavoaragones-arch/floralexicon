import { defaultLocale } from "@/lib/i18n";
import { redirect } from "next/navigation";

type Props = { params: { slug: string } };

export default function PlantRootRedirect({ params }: Props) {
  redirect(`/${defaultLocale}/plant/${params.slug}`);
}
