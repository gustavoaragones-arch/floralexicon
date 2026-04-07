"use client";

import { DisambiguationCard } from "@/components/search/DisambiguationCard";
import {
  behavioralBoostPercent,
  readClickCountsForHub,
} from "@/lib/plantClickSignals";
import type { DisambiguationRow } from "@/lib/search";
import type { Locale } from "@/lib/i18n";
import { useEffect, useState } from "react";

type Props = {
  lang: Locale;
  hubKey: string;
  initialRows: DisambiguationRow[];
  hasMultiplePlants: boolean;
};

/**
 * Applies local click-history boost after hydration (self-improving ranking, client-only).
 */
export function DisambiguationResultsClient({
  lang,
  hubKey,
  initialRows,
  hasMultiplePlants,
}: Props) {
  const [rows, setRows] = useState(initialRows);
  const [openWhyId, setOpenWhyId] = useState<string | null>(
    () => initialRows[0]?.plant.id ?? null
  );

  useEffect(() => {
    const counts = readClickCountsForHub(hubKey);
    const next = [...initialRows].sort((a, b) => {
      const da =
        a.confidencePercent + behavioralBoostPercent(a.plant.id, counts);
      const db =
        b.confidencePercent + behavioralBoostPercent(b.plant.id, counts);
      if (db !== da) return db - da;
      return a.plant.scientific_name.localeCompare(b.plant.scientific_name);
    });
    setRows(next);
  }, [hubKey, initialRows]);

  useEffect(() => {
    setOpenWhyId((prev) => {
      if (prev === null) return null;
      const ids = new Set(rows.map((r) => r.plant.id));
      if (ids.has(prev)) return prev;
      return rows[0]?.plant.id ?? null;
    });
  }, [rows]);

  return (
    <ul className="mt-6 flex flex-col gap-8">
      {rows.map((row, i) => (
        <li key={row.plant.id} className="list-none">
          <DisambiguationCard
            lang={lang}
            row={row}
            index={i}
            showIndex={hasMultiplePlants}
            hubKey={hubKey}
            isWhyOpen={openWhyId === row.plant.id}
            onWhyOpenChange={(open) => {
              if (open) {
                setOpenWhyId(row.plant.id);
              } else {
                setOpenWhyId((cur) =>
                  cur === row.plant.id ? null : cur
                );
              }
            }}
          />
        </li>
      ))}
    </ul>
  );
}
