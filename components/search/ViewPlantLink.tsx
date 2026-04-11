"use client";

import { recordPlantClick } from "@/lib/plantClickSignals";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  hubKey: string;
  plantId: string;
  className?: string;
  /** Fires after local click recording (e.g. `floralexicon:click` for analytics). */
  onAnalytics?: () => void;
  children: ReactNode;
};

export function ViewPlantLink({
  href,
  hubKey,
  plantId,
  className,
  onAnalytics,
  children,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        recordPlantClick(hubKey, plantId);
        onAnalytics?.();
      }}
    >
      {children}
    </Link>
  );
}
