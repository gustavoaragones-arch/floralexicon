import type { PlantDetailModel } from "@/lib/plantDetailData";
import { topThreeThemesForDefinition } from "@/lib/plantIntroCopy";
import { humanToxicityBand } from "@/lib/plantHumanLabels";
import { ti, t, type Locale } from "@/lib/i18n";

type Props = { lang: Locale; model: PlantDetailModel; publicName: string };

export function PlantFaq({ lang, model, publicName }: Props) {
  const themes = topThreeThemesForDefinition(model, lang);
  const themesStr = themes.length
    ? themes.join(" · ")
    : t(lang, "plant_detail_value_not_listed");

  const safety = model.merged?.toxicity?.level
    ? humanToxicityBand(model.merged.toxicity.level, lang)
    : t(lang, "plant_detail_tox_unknown");

  const q1 = ti(lang, "plant_detail_faq_q_daily", { name: publicName });
  const a1 = t(lang, "plant_detail_faq_a_daily");
  const q2 = ti(lang, "plant_detail_faq_q_used", { name: publicName });
  const a2 = ti(lang, "plant_detail_faq_a_used", { themes: themesStr });
  const q3 = ti(lang, "plant_detail_faq_q_safe", { name: publicName });
  const a3 = ti(lang, "plant_detail_faq_a_safe", { safety, themes: themesStr });
  const q4 = ti(lang, "plant_detail_faq_q_confused", { name: publicName });
  const a4 = t(lang, "plant_detail_faq_a_confused");

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: q1, acceptedAnswer: { "@type": "Answer", text: a1 } },
      { "@type": "Question", name: q2, acceptedAnswer: { "@type": "Answer", text: a2 } },
      { "@type": "Question", name: q3, acceptedAnswer: { "@type": "Answer", text: a3 } },
      { "@type": "Question", name: q4, acceptedAnswer: { "@type": "Answer", text: a4 } },
    ],
  };

  const items = [
    { q: q1, a: a1 },
    { q: q2, a: a2 },
    { q: q3, a: a3 },
    { q: q4, a: a4 },
  ];

  return (
    <section aria-labelledby="plant-faq-heading" className="mt-12">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- JSON-LD for FAQ rich results
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h2
        id="plant-faq-heading"
        className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
      >
        {t(lang, "plant_detail_faq_heading")}
      </h2>
      <dl className="mt-4 space-y-5">
        {items.map((item) => (
          <div
            key={item.q}
            className="rounded-xl border border-stone-200 bg-white/60 px-4 py-3 dark:border-stone-700 dark:bg-stone-900/40"
          >
            <dt className="text-sm font-semibold text-stone-900 dark:text-stone-100">{item.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
