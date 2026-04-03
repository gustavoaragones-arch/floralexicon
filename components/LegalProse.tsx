import type { ReactNode } from "react";

type LegalProseProps = {
  title: string;
  children: ReactNode;
};

/** Shared layout for About, Contact, and legal pages. */
export function LegalProse({ title, children }: LegalProseProps) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 sm:text-4xl">
        {title}
      </h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        {children}
      </div>
    </main>
  );
}
