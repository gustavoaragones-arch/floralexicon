import { getCountryDisplayName } from "@/lib/countries";
import { t, ti, type Locale } from "@/lib/i18n";
import type { Ambiguity } from "@/lib/resolver";

type NameSeoContentProps = {
  lang: Locale;
  displayName: string;
  ambiguity: Ambiguity;
  selectedCountry?: string;
};

function buildFaq(
  lang: Locale,
  displayName: string,
  selectedCountry?: string
): { question: string; answer: string }[] {
  const name = displayName;

  return [
    {
      question: ti(lang, "faq_q_same", { name }),
      answer: t(lang, "faq_a_same"),
    },
    {
      question: selectedCountry
        ? ti(lang, "faq_q_country_named", {
            name,
            country: getCountryDisplayName(selectedCountry, lang),
          })
        : ti(lang, "faq_q_country_generic", { name }),
      answer: selectedCountry
        ? ti(lang, "faq_a_country_named", {
            country: getCountryDisplayName(selectedCountry, lang),
          })
        : t(lang, "faq_a_country_generic"),
    },
    {
      question: ti(lang, "faq_q_hub_species", { name }),
      answer: t(lang, "faq_a_hub_species"),
    },
    {
      question: ti(lang, "faq_q_hub_remedies", { name }),
      answer: t(lang, "faq_a_hub_remedies"),
    },
    {
      question: ti(lang, "faq_q_safe", { name }),
      answer: t(lang, "faq_a_safe"),
    },
  ];
}

function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function NameSeoContent({
  lang,
  displayName,
  ambiguity: _unusedAmbiguity,
  selectedCountry,
}: NameSeoContentProps) {
  void _unusedAmbiguity;
  const name = displayName.trim() || "this name";
  const faqItems = buildFaq(lang, name, selectedCountry);
  const schema = faqJsonLd(faqItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <details className="mt-10 border-t border-stone-200 pt-8 dark:border-stone-800">
        <summary className="cursor-pointer font-serif text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          {t(lang, "seo_faq_h2")}
        </summary>
        <dl className="mt-6 space-y-8 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {faqItems.map((item) => (
            <div key={item.question}>
              <dt className="font-semibold text-stone-800 dark:text-stone-200">
                {item.question}
              </dt>
              <dd className="mt-2">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </details>
    </>
  );
}
