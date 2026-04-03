import { LegalProse } from "@/components/LegalProse";
import {
  alternateLanguageUrls,
  isLocale,
  localePath,
  t,
  type Locale,
} from "@/lib/i18n";
import { CONTACT_EMAIL, OPERATOR_LEGAL_NAME, SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { lang: string } };

export function generateMetadata({ params }: Props): Metadata {
  if (!isLocale(params.lang)) return {};
  const lang = params.lang as Locale;
  const alt = alternateLanguageUrls("/terms");
  const description = `${t(lang, "meta_terms_desc_prefix")} ${OPERATOR_LEGAL_NAME}.`;
  return {
    title: t(lang, "page_terms_title"),
    description,
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

export default function TermsPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  return (
    <LegalProse title={t(lang, "page_terms_title")}>
      {lang === "es" ? (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
          {t(lang, "legal_english_only_notice")}
        </p>
      ) : null}
      <p className="text-xs text-stone-500 dark:text-stone-500">
        {OPERATOR_LEGAL_NAME} · FloraLexicon ({SITE_URL.replace(/^https?:\/\//, "")}) · Effective
        Date: January 1, 2026 · Last Updated: January 1, 2026
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        1. Acceptance of Terms
      </h2>
      <p>
        By accessing or using FloraLexicon at {SITE_URL} (the &quot;Site&quot;), you agree to be
        bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms,
        do not use the Site.
      </p>
      <p>
        The Site is owned and operated by {OPERATOR_LEGAL_NAME} (&quot;Albor Digital,&quot;
        &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) as part of its digital product
        portfolio. These Terms apply to your use of FloraLexicon and any supplemental terms
        presented on the Site, which are incorporated by reference.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        2. Who We Are
      </h2>
      <p>
        {OPERATOR_LEGAL_NAME} is an independent digital product studio registered in the State of
        Wyoming, United States. We design, build, and operate our own digital products and tools.
        FloraLexicon is one such product.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        3. The Service
      </h2>
      <p>
        FloraLexicon provides informational plant name resolution: mapping common and regional
        names to scientific taxonomy and related reference content. The Site is provided for
        educational and informational purposes only. We reserve the right to modify, suspend, or
        discontinue any part of the Site at any time without prior notice. We will not be liable to
        you or any third party for any such modification, suspension, or discontinuation.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        4. User Eligibility
      </h2>
      <p>
        You must be at least 13 years of age to use the Site. If you are under 18, you represent
        that you have obtained parental or guardian consent. By using the Site, you represent and
        warrant that you meet these eligibility requirements.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        5. Accounts
      </h2>
      <p>
        FloraLexicon does not require you to create an account to access public content. If we
        introduce accounts or registered features in the future, you will be responsible for
        maintaining the confidentiality of your credentials and for all activity under your
        account. You agree to notify us promptly at{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-flora-forest underline underline-offset-2 dark:text-emerald-400"
        >
          {CONTACT_EMAIL}
        </a>{" "}
        of any unauthorized use. We may terminate or suspend accounts at our sole discretion,
        including for violation of these Terms.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        6. Acceptable Use
      </h2>
      <p>You agree not to use the Site to:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>violate any applicable law or regulation;</li>
        <li>
          infringe on the intellectual property rights of {OPERATOR_LEGAL_NAME} or any third party;
        </li>
        <li>transmit harmful, abusive, or offensive content;</li>
        <li>attempt to gain unauthorized access to our systems or other users&apos; data;</li>
        <li>
          scrape, harvest, or extract data from the Site at scale without our prior written
          permission;
        </li>
        <li>
          use the Site in any manner that interferes with its operation or integrity; or
        </li>
        <li>misrepresent your affiliation with any person or entity.</li>
      </ul>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        7. Intellectual Property
      </h2>
      <p>
        All content, design, code, and materials within the Site — including text, graphics, logos,
        interface elements, and software — are the exclusive property of {OPERATOR_LEGAL_NAME} or
        its licensors and are protected by applicable intellectual property laws.
      </p>
      <p>
        You are granted a limited, non-exclusive, non-transferable, revocable license to access and
        use the Site for personal, non-commercial purposes in accordance with these Terms. No
        rights are transferred to you beyond what is expressly stated here.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        8. User-Generated Content
      </h2>
      <p>
        If we enable features that allow you to submit content, you grant {OPERATOR_LEGAL_NAME} a
        non-exclusive, worldwide, royalty-free license to use, reproduce, and display that
        content solely to provide and improve the Site. You retain ownership of your content and
        are solely responsible for it.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        9. Fees
      </h2>
      <p>
        FloraLexicon is currently provided without charge for public browsing. If we introduce
        paid features or subscriptions, additional terms will be disclosed at the point of use.
        Where fees apply, they will be stated in U.S. dollars and governed by the terms presented
        at checkout, except where non-refundable fees are prohibited by law.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        10. Third-Party Services
      </h2>
      <p>
        The Site may integrate with or link to third-party services (such as analytics or hosting
        providers). Those third parties have their own terms and privacy policies.{" "}
        {OPERATOR_LEGAL_NAME} is not responsible for the practices or content of any third-party
        service.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        11. Disclaimer of Warranties
      </h2>
      <p>
        THE SITE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF
        ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT
        THAT THE SITE WILL BE ERROR-FREE, UNINTERRUPTED, OR FREE OF VIRUSES OR OTHER HARMFUL
        COMPONENTS.
      </p>
      <p>
        For additional disclaimers regarding plant information and professional advice, see our{" "}
        <Link
          href={localePath(lang, "/disclaimer")}
          className="text-flora-forest underline underline-offset-2 dark:text-emerald-400"
        >
          {t(lang, "terms_see_disclaimer")}
        </Link>
        .
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        12. Limitation of Liability
      </h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {OPERATOR_LEGAL_NAME.toUpperCase()} AND
        ITS OWNER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
        PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SITE, EVEN IF WE HAVE BEEN
        ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM
        SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING
        THE CLAIM OR (B) USD $50.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        13. Indemnification
      </h2>
      <p>
        You agree to indemnify, defend, and hold harmless {OPERATOR_LEGAL_NAME} and its owner from
        any claims, damages, liabilities, costs, or expenses (including reasonable legal fees)
        arising from your use of the Site, your violation of these Terms, or your violation of
        any third-party rights.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        14. Governing Law and Disputes
      </h2>
      <p>
        These Terms are governed by the laws of the State of Wyoming, United States, without regard
        to its conflict of law provisions. Any dispute arising from these Terms or your use of the
        Site shall first be addressed through good-faith negotiation. If unresolved, disputes shall
        be submitted to binding arbitration in accordance with the rules of the American Arbitration
        Association.
      </p>
      <p>
        Notwithstanding the above, you agree that {OPERATOR_LEGAL_NAME} may seek injunctive relief
        in any court of competent jurisdiction.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        15. Changes to These Terms
      </h2>
      <p>
        We reserve the right to update these Terms at any time. Changes will be posted on this
        page with a revised effective date. Your continued use of the Site after any changes
        constitutes your acceptance of the revised Terms, to the extent permitted by law.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        16. Contact
      </h2>
      <p>
        For questions about these Terms:{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-flora-forest underline underline-offset-2 dark:text-emerald-400"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
    </LegalProse>
  );
}
