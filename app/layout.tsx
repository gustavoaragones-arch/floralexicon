import { DM_Sans, Fraunces, Noto_Sans_Cherokee } from "next/font/google";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const floraSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-flora-serif",
  display: "swap",
});

const floraSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-flora-sans",
  display: "swap",
});

// Fallback-only: the "cherokee" subset scopes this font's unicode-range to
// Cherokee syllabics, so it's inert (and never downloaded) for any other
// script. Fraunces/DM_Sans stay Latin-only; this just fills the gap they
// leave for Cherokee-language name entries.
const cherokeeFallback = Noto_Sans_Cherokee({
  subsets: ["cherokee"],
  variable: "--font-cherokee-fallback",
  display: "swap",
  // Rarely-used script: don't preload on every page. The browser still
  // fetches it lazily, scoped by this @font-face's unicode-range, only
  // when a page actually renders a Cherokee-block character.
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FloraLexicon",
    template: "%s | FloraLexicon",
  },
  description:
    "Plant name identification and herb name translation: resolve common names to scientific plant names across countries and languages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${floraSerif.variable} ${floraSans.variable} ${cherokeeFallback.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
