import { loadNames, normalizeString } from "@/lib/data";
import nameVariantsJson from "@/data/nameVariants.json";

/**
 * Inline script for `app/[lang]/layout.tsx`: hydrates `window.__NAME_INDEX__` and
 * `window.__NAME_ALIAS_TO_CANON__` so the search field can route to `/name/[slug]`
 * without visiting `/search` first (server redirect remains a safety net).
 */
export function getInlineClientNameIndexScript(): string {
  const keys = new Set<string>();
  for (const e of loadNames()) {
    const k = normalizeString(e.normalized);
    if (k) keys.add(k);
  }

  const aliasToCanon: Record<string, string> = {};
  for (const [v, c] of Object.entries(
    (nameVariantsJson as { aliases?: Record<string, string> }).aliases ?? {}
  )) {
    const vk = normalizeString(v);
    const ck = normalizeString(c);
    if (vk && ck) aliasToCanon[vk] = ck;
  }

  const keysJson = JSON.stringify([...keys]);
  const aliasJson = JSON.stringify(aliasToCanon);
  return `window.__NAME_INDEX__=new Set(${keysJson});window.__NAME_ALIAS_TO_CANON__=${aliasJson};`;
}
