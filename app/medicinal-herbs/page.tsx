import { UseClusterSeoPageContent } from "@/components/UseClusterSeoPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medicinal herbs | FloraLexicon",
  description:
    "Programmatic medicinal-herbs cluster page: browse herb names, plants, and links to country-level herb pages.",
};

export default function MedicinalHerbsSeoPage() {
  return <UseClusterSeoPageContent slug="medicinal-herbs" />;
}
