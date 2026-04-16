"use client";

import {
  DisambiguationCard,
  resetFloralexiconViewPlantClickDedupe,
} from "@/components/search/DisambiguationCard";
import {
  behavioralBoostPercent,
  readClickCountsForHub,
} from "@/lib/plantClickSignals";
import { normalizeHubKey } from "@/lib/hubKey";
import type { DisambiguationRow } from "@/lib/search";
import type { Locale } from "@/lib/i18n";
import { useEffect, useState } from "react";

type Props = {
  lang: Locale;
  hubKey: string;
  /** Canonical `/name/[slug]` for this search hub (all result cards link here). */
  nameSlug: string;
  initialRows: DisambiguationRow[];
  hasMultiplePlants: boolean;
  /** Trimmed search query for analytics hooks on result cards. */
  searchQuery?: string;
  /** `?country=` from search URL (passed through for analytics). */
  searchCountryParam?: string;
};

/**
 * Applies local click-history boost after hydration (self-improving ranking, client-only).
 */
export function DisambiguationResultsClient({
  lang,
  hubKey,
  nameSlug,
  initialRows,
  hasMultiplePlants,
  searchQuery = "",
  searchCountryParam,
}: Props) {
  const hubKeyNorm = normalizeHubKey(hubKey);
  const [rows, setRows] = useState(initialRows);
  const [openWhyId, setOpenWhyId] = useState<string | null>(
    () => initialRows[0]?.plantId ?? null
  );

  useEffect(() => {
    resetFloralexiconViewPlantClickDedupe();
  }, [searchQuery, hubKeyNorm]);

  useEffect(() => {
    const counts = readClickCountsForHub(hubKeyNorm);
    const next = [...initialRows].sort((a, b) => {
      const da =
        a.confidencePercent + behavioralBoostPercent(a.plantId, counts);
      const db =
        b.confidencePercent + behavioralBoostPercent(b.plantId, counts);
      if (db !== da) return db - da;
      const sa = (a.plant?.scientific_name ?? "\uFFFF").toLowerCase();
      const sb = (b.plant?.scientific_name ?? "\uFFFF").toLowerCase();
      return sa.localeCompare(sb);
    });
    setRows(next);
  }, [hubKeyNorm, initialRows]);

  useEffect(() => {
    setOpenWhyId((prev) => {
      if (prev === null) return null;
      const ids = new Set(rows.map((r) => r.plantId));
      if (ids.has(prev)) return prev;
      return rows[0]?.plantId ?? null;
    });
  }, [rows]);

  return (
    <ul className="mt-6 flex flex-col gap-8">
      {rows.map((row, i) => (
        <li key={row.plantId} className="list-none">
          <DisambiguationCard
            lang={lang}
            row={row}
            index={i}
            showIndex={hasMultiplePlants}
            hubKey={hubKeyNorm}
            nameSlug={nameSlug}
            searchQuery={searchQuery}
            searchCountryParam={searchCountryParam}
            resultCount={rows.length}
            isWhyOpen={openWhyId === row.plantId}
            onWhyOpenChange={(open) => {
              if (open) {
                setOpenWhyId(row.plantId);
              } else {
                setOpenWhyId((cur) =>
                  cur === row.plantId ? null : cur
                );
              }
            }}
          />
        </li>
      ))}
    </ul>
  );
}
