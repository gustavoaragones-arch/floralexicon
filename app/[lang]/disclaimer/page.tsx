import { LegalProse } from "@/components/LegalProse";
import { alternateLanguageUrls, isLocale, t, ti, type Locale } from "@/lib/i18n";
import { OPERATOR_LEGAL_NAME } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const alt = alternateLanguageUrls("/disclaimer");
  return {
    title: t(lang, "disclaimer_title"),
    description: t(lang, "meta_disclaimer_desc"),
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

export default function DisclaimerPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  return (
    <LegalProse title={t(lang, "disclaimer_title")}>
      <p>{t(lang, "disclaimer_p1")}</p>
      <p>{t(lang, "disclaimer_p2")}</p>
      <p>{t(lang, "disclaimer_p3")}</p>
      <p>{t(lang, "disclaimer_p4")}</p>
      <p>{ti(lang, "disclaimer_p5", { operator: OPERATOR_LEGAL_NAME })}</p>
      <p>{t(lang, "disclaimer_p6")}</p>
    </LegalProse>
  );
}
