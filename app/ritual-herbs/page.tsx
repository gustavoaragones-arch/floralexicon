import { UseClusterSeoPageContent } from "@/components/UseClusterSeoPageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ritual herbs | FloraLexicon",
  description:
    "Browse ritual-associated herbs from FloraLexicon: regional names, plant pages, and cross-links to country hubs.",
};

export default function RitualHerbsSeoPage() {
  return <UseClusterSeoPageContent slug="ritual-herbs" />;
}
