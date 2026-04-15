import { UseClusterSeoPageContent } from "@/components/UseClusterSeoPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Herbal teas | FloraLexicon",
  description:
    "Programmatic herbal-teas cluster page: discover tea-related herb names, matching plants, and country pages.",
};

export default function HerbalTeasSeoPage() {
  return <UseClusterSeoPageContent slug="herbal-teas" />;
}
