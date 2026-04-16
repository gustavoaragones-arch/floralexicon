import { CoreConceptPrefetch } from "@/components/CoreConceptPrefetch";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SetHtmlLang } from "@/components/SetHtmlLang";
import { SiteDisclaimer } from "@/components/SiteDisclaimer";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import { getInlineClientNameIndexScript } from "@/lib/buildClientNameIndexScript";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FloraLexicon",
  url: SITE_URL,
  contactPoint: {
    "@type": "ContactPoint",
    email: CONTACT_EMAIL,
    contactType: "customer support",
  },
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  return (
    <>
      <CoreConceptPrefetch lang={lang} />
      <SetHtmlLang lang={lang} />
      <script
        dangerouslySetInnerHTML={{
          __html: getInlineClientNameIndexScript(),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />
      <Header lang={lang} />
      <div className="flex-1">{children}</div>
      <SiteDisclaimer lang={lang} />
      <Footer lang={lang} />
    </>
  );
}
