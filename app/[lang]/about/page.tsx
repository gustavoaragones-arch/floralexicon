import { LegalProse } from "@/components/LegalProse";
import { alternateLanguageUrls, isLocale, t, type Locale } from "@/lib/i18n";
import { OPERATOR_LEGAL_NAME } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const alt = alternateLanguageUrls("/about");
  return {
    title: t(lang, "about_title"),
    description: t(lang, "meta_about_desc"),
    alternates: {
      canonical: lang === "es" ? alt.es : alt.en,
      languages: {
        en: alt.en,
        es: alt.es,
        "x-default": alt.xDefault,
      },
    },
  };
}

export default function AboutPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  return (
    <LegalProse title={t(lang, "about_title")}>
      <p>{t(lang, "about_p1")}</p>
      <p>{t(lang, "about_p2")}</p>
      <p>
        {t(lang, "about_p3_prefix")}{" "}
        <strong className="font-medium text-stone-900 dark:text-stone-100">
          {OPERATOR_LEGAL_NAME}
        </strong>
        {t(lang, "about_p3_suffix")}
      </p>
    </LegalProse>
  );
}
