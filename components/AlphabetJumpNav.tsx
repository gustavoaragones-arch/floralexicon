const jumpNavLinkClass =
  "text-stone-600 transition-colors hover:text-flora-forest dark:text-stone-400 dark:hover:text-emerald-200";

type Props = {
  letters: string[];
  otherLabel: string;
  idPrefix: string;
};

export function AlphabetJumpNav({ letters, otherLabel, idPrefix }: Props) {
  return (
    <nav
      aria-label="Alphabet index"
      className="sticky top-0 z-10 -mx-6 mt-8 flex flex-wrap gap-x-3 gap-y-2 border-b border-stone-200/90 bg-flora-cream/95 px-6 py-3 text-sm font-medium backdrop-blur-sm dark:border-stone-800 dark:bg-stone-950/95"
    >
      {letters.map((letter) => (
        <a
          key={letter}
          href={`#${idPrefix}-${letter === "#" ? "other" : letter}`}
          className={jumpNavLinkClass}
        >
          {letter === "#" ? otherLabel : letter}
        </a>
      ))}
    </nav>
  );
}
