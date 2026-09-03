"use client";

import { useEffect, useState } from "react";

const SHOW_AFTER_PX = 480;

export function BackToTopButton({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={label}
      title={label}
      className="fixed bottom-6 right-6 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-flora-forest bg-flora-forest text-lg font-semibold text-white shadow-lg transition-colors hover:border-flora-forest-hover hover:bg-flora-forest-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-flora-forest/40 dark:border-emerald-600 dark:bg-emerald-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-600"
    >
      ↑
    </button>
  );
}
