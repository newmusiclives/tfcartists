import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | TrueFans RADIO Network",
  description:
    "Privacy Policy for the TrueFans RADIO Network. Learn how we collect, use, and protect your personal information.",
  openGraph: {
    title: "Privacy Policy | TrueFans RADIO Network",
    description:
      "Privacy Policy for the TrueFans RADIO Network. Learn how we collect, use, and protect your personal information.",
    url: "https://truefans-radio.netlify.app/privacy",
    siteName: "TrueFans RADIO Network",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="text-amber-700 hover:text-amber-900 text-sm font-medium transition-colors"
        >
          &larr; Back to Home
        </Link>

        <h1 className="mt-8 text-4xl font-bold text-amber-900">
          Privacy Policy
        </h1>
        <p className="mt-2 text-gray-500 text-sm">
          Last Updated: February 2026
        </p>

        <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
          {/* Introduction */}
          <section>
            <p>
              TrueFans RADIO Network (&quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) operates the website at{" "}
              <a
                href="https://truefans-radio.netlify.app"
                className="text-amber-700 underline hover:text-amber-900"
              >
                truefans-radio.netlify.app
              </a>{" "}
              and related services. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you visit our
              website, use our radio streaming services, participate as an
              artist, sponsor, or listener, or otherwise interact with our
              platform.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              1. Information We Collect
            </h2>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Personal Information You Provide
            </h3>
            <p className="mb-3">
              When you register for an account, submit music, sign up as a
              sponsor, or register as a listener, we may collect:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>
                Name, email address, and phone number
              </li>
              <li>
                Artist or business name and related profile information
              </li>
              <li>
                Payment and billing information (processed through secure
                third-party payment providers)
              </li>
              <li>
                Music submissions, including audio files and metadata
              </li>
              <li>
                Sponsor business details, advertising preferences, and campaign
                information
              </li>
              <li>
                Any other information you voluntarily provide through forms,
                surveys, or communications
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Usage Data
            </h3>
            <p className="mb-3">
              We automatically collect certain information when you access our
              platform:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>
                IP address, browser type, operating system, and device
                information
              </li>
              <li>
                Pages visited, time spent on pages, and navigation paths
              </li>
              <li>
                Radio stream listening history and duration
              </li>
              <li>Referring URLs and search terms</li>
              <li>
                Interaction data such as clicks, scrolls, and feature usage
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cookies and Tracking Technologies
            </h3>
            <p>
              We use cookies and similar technologies for authentication, session
              management, analytics, and to remember your preferences. For
              detailed information, please see our{" "}
              <Link
                href="/cookies"
                className="text-amber-700 underline hover:text-amber-900"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              2. How We Use Your Information
            </h2>
            <p className="mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Provide, operate, and maintain the TrueFans RADIO Network
                platform and radio streaming services
              </li>
              <li>
                Process artist onboarding, music submissions, and airplay tier
                subscriptions
              </li>
              <li>
                Manage sponsor accounts, advertising campaigns, and billing
              </li>
              <li>
                Register listeners and provide community features
              </li>
              <li>
                Send you transactional emails, service updates, and promotional
                communications (with your consent)
              </li>
              <li>
                Analyze usage patterns to improve our services and user
                experience
              </li>
              <li>
                Detect and prevent fraud, abuse, and security incidents
              </li>
              <li>
                Comply with legal obligations and enforce our Terms of Service
              </li>
            </ul>
          </section>

          {/* 3. Information Sharing */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              3. Information Sharing
            </h2>
            <p className="mb-3">
              We do not sell your personal information. We may share your
              information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Service Providers:</strong> We share data with
                third-party providers who assist with payment processing, email
                delivery, analytics, hosting, and other operational services.
              </li>
              <li>
                <strong>Artist Profiles:</strong> If you are an artist, certain
                profile information (such as your artist name, bio, and music)
                may be publicly displayed on the platform and shared with
                listeners and sponsors.
              </li>
              <li>
                <strong>Sponsor Visibility:</strong> Sponsor business names and
                advertising content are displayed publicly as part of station
                programming.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose information
                if required by law, regulation, legal process, or government
                request.
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger,
                acquisition, or sale of assets, your information may be
                transferred as part of that transaction.
              </li>
              <li>
                <strong>With Your Consent:</strong> We may share your
                information for other purposes with your explicit consent.
              </li>
            </ul>
          </section>

          {/* 4. Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              4. Data Security
            </h2>
            <p>
              We implement reasonable administrative, technical, and physical
              security measures to protect your personal information from
              unauthorized access, alteration, disclosure, or destruction. These
              measures include encrypted data transmission (HTTPS), secure
              authentication via NextAuth, and access controls on our systems.
              However, no method of transmission over the Internet or electronic
              storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* 5. Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              5. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as your account is
              active or as needed to provide you services. We may also retain and
              use your information as necessary to comply with legal obligations,
              resolve disputes, and enforce our agreements. If you request
              deletion of your account, we will remove your personal data within
              a reasonable timeframe, except where retention is required by law.
            </p>
          </section>

          {/* 6. Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              6. Your Rights
            </h2>
            <p className="mb-3">
              Depending on your location, you may have the following rights
              regarding your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Access:</strong> Request a copy of the personal
                information we hold about you.
              </li>
              <li>
                <strong>Correction:</strong> Request that we correct any
                inaccurate or incomplete personal information.
              </li>
              <li>
                <strong>Deletion:</strong> Request that we delete your personal
                information, subject to certain legal exceptions.
              </li>
              <li>
                <strong>Opt-Out:</strong> Unsubscribe from marketing
                communications at any time by using the unsubscribe link in our
                emails or contacting us directly.
              </li>
              <li>
                <strong>Data Portability:</strong> Request a machine-readable
                copy of your data where technically feasible.
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Where processing is based on
                consent, you may withdraw that consent at any time.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at{" "}
              <a
                href="mailto:legal@truefans.radio"
                className="text-amber-700 underline hover:text-amber-900"
              >
                legal@truefans.radio
              </a>
              . We will respond to your request within 30 days.
            </p>
          </section>

          {/* 7. Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              7. Children&apos;s Privacy
            </h2>
            <p>
              Our services are not directed to individuals under the age of 13.
              We do not knowingly collect personal information from children
              under 13. If we become aware that we have collected personal
              information from a child under 13, we will take steps to delete
              that information promptly. If you believe we may have collected
              information from a child under 13, please contact us at{" "}
              <a
                href="mailto:legal@truefans.radio"
                className="text-amber-700 underline hover:text-amber-900"
              >
                legal@truefans.radio
              </a>
              .
            </p>
          </section>

          {/* 8. Third-Party Links */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              8. Third-Party Links
            </h2>
            <p>
              Our platform may contain links to third-party websites, services,
              or applications. We are not responsible for the privacy practices
              of these third parties. We encourage you to review the privacy
              policies of any third-party services you access through our
              platform.
            </p>
          </section>

          {/* 9. Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. When we make
              changes, we will revise the &quot;Last Updated&quot; date at the
              top of this page. If we make material changes, we will notify you
              by posting a prominent notice on our website or by sending you an
              email. Your continued use of our services after any changes
              constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* 10. Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              10. Contact Information
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-none mt-3 space-y-1">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:legal@truefans.radio"
                  className="text-amber-700 underline hover:text-amber-900"
                >
                  legal@truefans.radio
                </a>
              </li>
              <li>
                <strong>General Support:</strong>{" "}
                <a
                  href="mailto:support@truefans.radio"
                  className="text-amber-700 underline hover:text-amber-900"
                >
                  support@truefans.radio
                </a>
              </li>
              <li>
                <strong>Website:</strong>{" "}
                <a
                  href="https://truefans-radio.netlify.app"
                  className="text-amber-700 underline hover:text-amber-900"
                >
                  truefans-radio.netlify.app
                </a>
              </li>
            </ul>
          </section>
        </div>

        {/* Cross-links to other legal pages */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Related Legal Pages
          </h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/terms"
              className="text-amber-700 hover:text-amber-900 font-medium transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-amber-700 hover:text-amber-900 font-medium transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
