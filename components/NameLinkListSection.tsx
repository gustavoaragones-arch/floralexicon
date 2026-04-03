import type { NameIndexLink } from "@/lib/data";
import { localePath, type Locale } from "@/lib/i18n";
import Link from "next/link";

const linkClass =
  "text-stone-800 underline decoration-stone-300 underline-offset-2 hover:text-flora-forest hover:decoration-flora-forest dark:text-stone-200 dark:hover:text-emerald-300 dark:hover:decoration-emerald-400";

type NameLinkListSectionProps = {
  lang: Locale;
  id: string;
  title: string;
  links: NameIndexLink[];
};

export function NameLinkListSection({
  lang,
  id,
  title,
  links,
}: NameLinkListSectionProps) {
  if (links.length === 0) return null;

  return (
    <section
      className="mt-12 border-t border-stone-200 pt-10 dark:border-stone-800"
      aria-labelledby={id}
    >
      <h2
        id={id}
        className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100"
      >
        {title}
      </h2>
      <ul className="mt-4 columns-1 gap-x-10 sm:columns-2">
        {links.map(({ slug, label }) => (
          <li key={slug} className="mb-2 break-inside-avoid">
            <Link href={localePath(lang, `/name/${slug}`)} className={linkClass}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
