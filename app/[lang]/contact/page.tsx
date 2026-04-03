import { LegalProse } from "@/components/LegalProse";
import { alternateLanguageUrls, isLocale, t, type Locale } from "@/lib/i18n";
import { CONTACT_EMAIL } from "@/lib/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const alt = alternateLanguageUrls("/contact");
  return {
    title: t(lang, "contact_title"),
    description: `${t(lang, "meta_contact_desc_prefix")} ${CONTACT_EMAIL} ${t(lang, "meta_contact_desc_suffix")}`,
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

export default function ContactPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  return (
    <LegalProse title={t(lang, "contact_title")}>
      <p>{t(lang, "contact_lead")}</p>
      <p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-medium text-flora-forest underline decoration-stone-300 underline-offset-2 hover:decoration-flora-forest dark:text-emerald-400 dark:hover:decoration-emerald-400"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
    </LegalProse>
  );
}
