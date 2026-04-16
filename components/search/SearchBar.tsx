"use client";

import {
  resolveClientNameSlug,
  shouldDebounceNavigate,
} from "@/lib/clientNameResolver";
import { localePath, t, type Locale } from "@/lib/i18n";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

type Props = {
  lang: Locale;
  initialQ: string;
};

/**
 * Debounced navigation: go to `/name/[slug]` or `/search?q=…` via `router.replace`
 * when {@link shouldDebounceNavigate} passes (length ≥3 or known short hub); submit
 * always runs. Name hub: blur + dedupe same slug (slug ref resets on pathname change).
 * Server redirect remains a safety net.
 */
export function SearchBar({ lang, initialQ }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initialQ);
  const skipNextDebounce = useRef(true);
  const lastNavigatedSlugRef = useRef<string | null>(null);

  useEffect(() => {
    lastNavigatedSlugRef.current = null;
  }, [pathname]);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  const inputRef = useRef<HTMLInputElement>(null);

  const pushSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const searchBase = localePath(lang, "/search");
      if (!trimmed) {
        lastNavigatedSlugRef.current = null;
        router.replace(searchBase);
        return;
      }
      const slug = resolveClientNameSlug(trimmed);
      if (slug) {
        if (lastNavigatedSlugRef.current !== slug) {
          lastNavigatedSlugRef.current = slug;
          inputRef.current?.blur();
          router.replace(localePath(lang, `/name/${slug}`));
        }
      } else {
        lastNavigatedSlugRef.current = null;
        router.replace(`${searchBase}?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [lang, router]
  );

  useEffect(() => {
    if (skipNextDebounce.current) {
      skipNextDebounce.current = false;
      return;
    }
    const tmr = window.setTimeout(() => {
      if (!shouldDebounceNavigate(q)) return;
      pushSearch(q);
    }, 450);
    return () => window.clearTimeout(tmr);
  }, [q, pushSearch]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    pushSearch(q);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-stretch"
      role="search"
    >
      <label htmlFor="search-q" className="sr-only">
        {t(lang, "search_label_sr")}
      </label>
      <input
        ref={inputRef}
        id="search-q"
        name="q"
        type="search"
        autoComplete="off"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t(lang, "search_placeholder")}
        className="min-h-12 flex-1 rounded-2xl border border-stone-300 bg-white px-5 py-2 text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-flora-forest focus:outline-none focus:ring-2 focus:ring-flora-forest/25 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30"
      />
      <button
        type="submit"
        className="min-h-12 rounded-full border border-flora-forest bg-flora-forest px-10 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:border-flora-forest-hover hover:bg-flora-forest-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-flora-forest/40 dark:border-emerald-600 dark:bg-emerald-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-600"
      >
        {t(lang, "search_button")}
      </button>
    </form>
  );
}
