"use client";

import { buildPlantImageAlt } from "@/lib/plantImageAlt";
import { useCallback, useState } from "react";

function LeafPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 text-center">
      <svg
        className="h-14 w-14 text-stone-400 dark:text-stone-500"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M32 8C18 8 8 22 8 36c0 8 4 14 12 18 2-12 8-22 18-28-6 8-10 18-10 30 8-4 14-12 16-22 2 10 8 18 16 22 0-12-4-22-10-30 10 6 16 16 18 28 8-4 12-10 12-18 0-14-10-28-24-28z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
        Image coming soon
      </span>
    </div>
  );
}

type PlantReferenceImageProps = {
  plantId: string;
  scientificName: string;
  /** Search / common name on name pages (enriches alt when distinct from binomial). */
  queryLabel?: string;
  primaryUses?: string[];
  plantType?: string;
};

/**
 * `/public/images/plants/{plant_id}.jpg` — native img + lazy load + fallback placeholder.
 */
export function PlantReferenceImage({
  plantId,
  scientificName,
  queryLabel,
  primaryUses,
  plantType,
}: PlantReferenceImageProps) {
  const [broken, setBroken] = useState(false);
  const src = `/images/plants/${encodeURIComponent(plantId)}.jpg`;
  const alt = buildPlantImageAlt(scientificName, {
    queryLabel,
    primaryUses,
    plantType,
  });

  const onError = useCallback(() => {
    setBroken(true);
  }, []);

  if (broken) {
    return (
      <div
        role="img"
        aria-label={`Image coming soon: ${alt}`}
        className="aspect-square w-full max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800/80"
      >
        <div className="flex h-full w-full items-center justify-center">
          <LeafPlaceholder />
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full max-w-full overflow-hidden rounded-2xl bg-stone-200 ring-1 ring-inset ring-stone-200/80 dark:bg-stone-800 dark:ring-stone-700">
      {/* eslint-disable-next-line @next/next/no-img-element -- intentional: static public assets, onError fallback */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        onError={onError}
      />
    </div>
  );
}
