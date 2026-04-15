import { UseClusterSeoPageContent } from "@/components/UseClusterSeoPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Culinary medicinal herbs | FloraLexicon",
  description:
    "Browse culinary medicinal herbs from FloraLexicon: common names, linked species, and country-level herb pages.",
};

export default function CulinaryMedicinalHerbsSeoPage() {
  return <UseClusterSeoPageContent slug="culinary-medicinal-herbs" />;
}
