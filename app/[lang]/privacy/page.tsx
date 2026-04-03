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
  const alt = alternateLanguageUrls("/privacy");
  const description = `${t(lang, "meta_privacy_desc_prefix")} ${OPERATOR_LEGAL_NAME} ${t(lang, "meta_privacy_desc_suffix")}`;
  return {
    title: t(lang, "page_privacy_title"),
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

export default function PrivacyPage({ params }: Props) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  return (
    <LegalProse title={t(lang, "page_privacy_title")}>
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
        1. Introduction
      </h2>
      <p>
        {OPERATOR_LEGAL_NAME} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your
        privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
        information when you use FloraLexicon, the plant name resolution website at {SITE_URL}{" "}
        (the &quot;Site&quot;).
      </p>
      <p>
        By using the Site, you consent to the practices described in this policy. If you do not
        agree, please do not use the Site.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        2. Information We Collect
      </h2>
      <p>
        <strong className="font-medium text-stone-900 dark:text-stone-100">
          Information you provide directly:
        </strong>{" "}
        If you contact us at{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-flora-forest underline underline-offset-2 dark:text-emerald-400"
        >
          {CONTACT_EMAIL}
        </a>
        , we receive your email address, the contents of your message, and any other information
        you choose to include.
      </p>
      <p>
        <strong className="font-medium text-stone-900 dark:text-stone-100">Usage data:</strong>{" "}
        Like most websites, we and our service providers may automatically collect technical
        information such as pages visited, approximate location derived from IP address, device
        and browser type, referring URLs, and timestamps. FloraLexicon does not require you to
        create an account to browse public content.
      </p>
      <p>
        <strong className="font-medium text-stone-900 dark:text-stone-100">
          Cookies and similar technologies:
        </strong>{" "}
        We may use cookies and similar technologies for core functionality, preferences, and
        aggregated analytics. See the Cookie section below.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        3. How We Use Your Information
      </h2>
      <p>We use collected information to:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>provide, operate, and maintain the Site;</li>
        <li>respond to inquiries and support requests;</li>
        <li>improve and develop FloraLexicon;</li>
        <li>detect and prevent fraud, abuse, or misuse;</li>
        <li>comply with legal obligations; and</li>
        <li>send transactional communications related to your contact with us, where applicable.</li>
      </ul>
      <p>
        We do not sell your personal information to third parties. We do not use your data for
        targeted advertising on behalf of third parties.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        4. Legal Basis for Processing (GDPR)
      </h2>
      <p>
        If you are located in the European Economic Area, our legal bases for processing your
        personal data include: performance of a contract or steps prior to entering a contract
        (where applicable), compliance with legal obligations, our legitimate interests in
        operating and improving the Site, and — where required — your consent.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        5. Sharing of Information
      </h2>
      <p>We may share your information with:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          service providers who assist in operating the Site (e.g., hosting, analytics), under
          confidentiality and processing agreements;
        </li>
        <li>law enforcement or regulatory bodies when required by law; and</li>
        <li>
          a successor entity in the event of a merger, acquisition, or sale of assets involving
          FloraLexicon or {OPERATOR_LEGAL_NAME}.
        </li>
      </ul>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        6. Data Retention
      </h2>
      <p>
        We retain personal data for as long as necessary to fulfill the purposes outlined in this
        policy, or as required by law. Correspondence sent to {CONTACT_EMAIL} may be retained for a
        reasonable period to respond and for our records. You may request deletion where applicable
        (see Your Rights).
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        7. Your Rights
      </h2>
      <p>
        Depending on your jurisdiction, you may have the right to: access the personal data we
        hold about you; request correction of inaccurate data; request deletion; object to or
        restrict processing; withdraw consent where processing is consent-based; and receive your
        data in a portable format.
      </p>
      <p>
        To exercise these rights, contact us at{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-flora-forest underline underline-offset-2 dark:text-emerald-400"
        >
          {CONTACT_EMAIL}
        </a>
        . We will respond within a reasonable period, and within 30 days where required by
        applicable law.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        8. Children&apos;s Privacy
      </h2>
      <p>
        The Site is not directed to children under the age of 13. We do not knowingly collect
        personal information from children under 13. If we become aware that we have inadvertently
        collected such data, we will delete it promptly.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        9. Data Security
      </h2>
      <p>
        We implement reasonable administrative, technical, and physical safeguards to protect your
        data. However, no method of transmission over the internet or electronic storage is 100%
        secure. We cannot guarantee absolute security.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        10. International Transfers
      </h2>
      <p>
        Your information may be transferred to and processed in countries other than your own,
        including the United States and Canada. We take steps designed to ensure that appropriate
        safeguards are in place for such transfers in compliance with applicable law.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        11. Third-Party Links
      </h2>
      <p>
        The Site may contain links to third-party websites. We are not responsible for the privacy
        practices of those third parties and encourage you to review their privacy policies.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        12. Cookies and Similar Technologies
      </h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. We may use
        cookies and similar technologies to: (a) ensure the Site functions correctly (strictly
        necessary); (b) remember preferences where applicable; and (c) analyze aggregate usage to
        improve FloraLexicon.
      </p>
      <p>
        Some cookies may be placed by third-party analytics or infrastructure providers. You can
        control cookies through your browser settings; disabling strictly necessary cookies may
        affect functionality.
      </p>
      <p>
        Some browsers include a &quot;Do Not Track&quot; (DNT) feature. There is no consistent
        industry standard for DNT; we do not currently respond to DNT signals.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        13. Changes to This Policy
      </h2>
      <p>
        We may update this Privacy Policy periodically. Changes will be posted on this page with a
        revised effective date. Continued use of the Site after changes constitutes acceptance of
        the updated policy, to the extent permitted by law.
      </p>

      <h2 className="mt-10 text-base font-semibold text-stone-900 dark:text-stone-100">
        14. Contact
      </h2>
      <p>
        For privacy-related questions or requests:{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-flora-forest underline underline-offset-2 dark:text-emerald-400"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
      <p className="pt-6 text-xs text-stone-500 dark:text-stone-500">
        FloraLexicon is operated by {OPERATOR_LEGAL_NAME}. For general site information, see{" "}
        <Link
          href={localePath(lang, "/about")}
          className="underline underline-offset-2"
        >
          {t(lang, "privacy_about_link")}
        </Link>
        .
      </p>
    </LegalProse>
  );
}
