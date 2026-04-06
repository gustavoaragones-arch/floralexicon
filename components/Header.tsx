import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { localePath, t, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "text-stone-600 transition-colors hover:text-flora-forest dark:text-stone-400 dark:hover:text-emerald-200";

export function Header({ lang }: { lang: Locale }) {
  return (
    <header className="border-b border-stone-200/90 bg-flora-cream/85 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={localePath(lang, "/")}
            className="font-serif text-xl font-semibold tracking-tight text-flora-forest dark:text-stone-100"
          >
            FloraLexicon
          </Link>
          <LanguageSwitcher lang={lang} />
        </div>
        <nav className="flex flex-wrap items-center gap-6 text-sm font-medium" aria-label="Primary">
          <Link href={localePath(lang, "/")} className={linkClass}>
            {t(lang, "nav_home")}
          </Link>
          <Link href={localePath(lang, "/names")} className={linkClass}>
            {t(lang, "nav_plant_names")}
          </Link>
          <Link href={localePath(lang, "/plants")} className={linkClass}>
            {t(lang, "nav_plants")}
          </Link>
          <Link href={localePath(lang, "/concepts")} className={linkClass}>
            {t(lang, "nav_concepts")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
