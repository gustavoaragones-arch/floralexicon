import { localePath, t, type Locale } from "@/lib/i18n";
import { OPERATOR_LEGAL_NAME } from "@/lib/site";
import Link from "next/link";

const linkClass =
  "text-stone-600 underline-offset-4 hover:text-flora-forest hover:underline dark:text-stone-400 dark:hover:text-emerald-200";

export function Footer({ lang }: { lang: Locale }) {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-flora-mist/80 dark:border-stone-800 dark:bg-stone-950/80">
      <div className="mx-auto max-w-[1000px] px-6 py-12">
        <p className="max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {t(lang, "footer_tagline_a")}{" "}
          <strong className="font-medium text-stone-800 dark:text-stone-200">
            {t(lang, "footer_tagline_b")}
          </strong>{" "}
          {t(lang, "footer_tagline_c")}
        </p>

        <div className="mt-6 space-y-2 border-t border-stone-200/80 pt-6 text-sm text-stone-600 dark:border-stone-700 dark:text-stone-400">
          <p>
            <strong className="font-medium text-stone-800 dark:text-stone-200">
              {t(lang, "footer_info_only_title")}
            </strong>
            {" — "}
            {t(lang, "footer_info_only_body")}{" "}
            <Link href={localePath(lang, "/disclaimer")} className={linkClass}>
              {t(lang, "footer_disclaimer")}
            </Link>
            .
          </p>
          <p>
            <strong className="font-medium text-stone-800 dark:text-stone-200">
              {t(lang, "footer_operated")} {OPERATOR_LEGAL_NAME}.
            </strong>
          </p>
        </div>

        <nav
          className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium"
          aria-label="Footer"
        >
          <Link href={localePath(lang, "/")} className={linkClass}>
            {t(lang, "nav_home")}
          </Link>
          <Link href={localePath(lang, "/about")} className={linkClass}>
            {t(lang, "footer_nav_about")}
          </Link>
          <Link href={localePath(lang, "/contact")} className={linkClass}>
            {t(lang, "footer_nav_contact")}
          </Link>
          <Link href={localePath(lang, "/plants")} className={linkClass}>
            {t(lang, "nav_plants")}
          </Link>
          <Link href={localePath(lang, "/names")} className={linkClass}>
            {t(lang, "footer_nav_names")}
          </Link>
          <Link href={localePath(lang, "/disclaimer")} className={linkClass}>
            {t(lang, "footer_disclaimer")}
          </Link>
          <Link href={localePath(lang, "/privacy")} className={linkClass}>
            {t(lang, "footer_nav_privacy")}
          </Link>
          <Link href={localePath(lang, "/terms")} className={linkClass}>
            {t(lang, "footer_nav_terms")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
