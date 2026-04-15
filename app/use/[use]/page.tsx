import { UseClusterSeoPageContent } from "@/components/UseClusterSeoPageContent";
import { getUseClusterConfig, getUseClusterSlugs } from "@/lib/useClusters";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: { use: string } };

export function generateStaticParams() {
  return getUseClusterSlugs().map((use) => ({ use }));
}

export function generateMetadata({ params }: Props): Metadata {
  const cfg = getUseClusterConfig(params.use);
  if (!cfg) return {};
  return {
    title: `${cfg.title} | FloraLexicon`,
    description: cfg.description,
  };
}

export default function UseClusterPage({ params }: Props) {
  const cfg = getUseClusterConfig(params.use);
  if (!cfg) notFound();
  return <UseClusterSeoPageContent slug={cfg.slug} />;
}
