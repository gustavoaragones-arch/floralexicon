import { DM_Sans, Fraunces } from "next/font/google";
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
        className={`${floraSerif.variable} ${floraSans.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
