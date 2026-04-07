"use client";

import { recordPlantClick } from "@/lib/plantClickSignals";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  hubKey: string;
  plantId: string;
  className?: string;
  children: ReactNode;
};

export function ViewPlantLink({ href, hubKey, plantId, className, children }: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => recordPlantClick(hubKey, plantId)}
    >
      {children}
    </Link>
  );
}
