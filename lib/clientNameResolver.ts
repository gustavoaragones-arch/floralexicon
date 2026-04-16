import { parseSearchQuery } from "@/lib/searchQuery";
import { toUrlSlug } from "@/lib/toUrlSlug";

declare global {
  interface Window {
    /** Normalized name-map keys (space-separated, accent-folded) with an indexed hub. */
    __NAME_INDEX__?: Set<string>;
    /** Variant normalized key → canonical normalized key (matches `nameVariants.json`). */
    __NAME_ALIAS_TO_CANON__?: Record<string, string>;
  }
}

/**
 * Same normalization as `normalizeString` in `lib/data.ts` (kept local so this module
 * stays safe to import from Client Components without pulling in dataset JSON).
 */
function normalizeClientNameKey(input: string): string {
  if (input == null || typeof input !== "string") return "";
  const folded = input
    .trim()
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!folded) return "";
  return folded
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Resolve user input to a `/name/[slug]` segment when the hub exists in the preloaded index.
 * Mirrors server `resolveSearchNavigation` (parseSearchQuery + canonical key + index membership).
 */
export function resolveClientNameSlug(input: string): string | null {
  if (typeof window === "undefined") return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  const { nameForResolve } = parseSearchQuery(trimmed);
  const normalized = normalizeClientNameKey(nameForResolve);
  if (!normalized) return null;

  const idx = window.__NAME_INDEX__;
  if (!idx || typeof idx.has !== "function") return null;

  const aliasMap = window.__NAME_ALIAS_TO_CANON__;
  const canon = aliasMap?.[normalized] ?? normalized;

  if (
    process.env.NODE_ENV === "development" &&
    aliasMap != null &&
    Object.prototype.hasOwnProperty.call(aliasMap, normalized) &&
    !idx.has(canon)
  ) {
    console.warn(
      "[FloraLexicon] Alias points to missing canonical hub (client index):",
      { variant: normalized, canon }
    );
  }

  if (idx.has(canon)) return toUrlSlug(canon);
  if (idx.has(normalized)) return toUrlSlug(normalized);

  return null;
}

/**
 * Whether debounced typing should trigger navigation (avoids 1–2 char noise while
 * still allowing short indexed names like "ajo" once they resolve in the preloaded index).
 */
export function shouldDebounceNavigate(trimmed: string): boolean {
  if (typeof window === "undefined") return false;
  const t = trimmed.trim();
  if (!t) return false;

  const { nameForResolve } = parseSearchQuery(t);
  const normalized = normalizeClientNameKey(nameForResolve);
  if (!normalized) return false;
  if (normalized.length >= 3) return true;

  const idx = window.__NAME_INDEX__;
  if (!idx || typeof idx.has !== "function") return false;
  const aliasMap = window.__NAME_ALIAS_TO_CANON__;
  const canon = aliasMap?.[normalized] ?? normalized;
  return idx.has(canon) || idx.has(normalized);
}
