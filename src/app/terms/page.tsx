import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | TrueFans RADIO Network",
  description:
    "Terms of Service for the TrueFans RADIO Network. Review the terms governing use of our radio streaming, artist, and sponsor platform.",
  openGraph: {
    title: "Terms of Service | TrueFans RADIO Network",
    description:
      "Terms of Service for the TrueFans RADIO Network. Review the terms governing use of our radio streaming, artist, and sponsor platform.",
    url: "https://truefans-radio.netlify.app/terms",
    siteName: "TrueFans RADIO Network",
    type: "website",
  },
};

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-gray-500 text-sm">
          Last Updated: March 2026
        </p>

        <div className="mt-10 space-y-10 text-gray-700 dark:text-zinc-300 leading-relaxed">
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the TrueFans RADIO Network website at{" "}
              <a
                href="https://truefans-radio.netlify.app"
                className="text-amber-700 underline hover:text-amber-900"
              >
                truefans-radio.netlify.app
              </a>{" "}
              and related services (collectively, the &quot;Service&quot;), you
              agree to be bound by these Terms of Service (&quot;Terms&quot;). If
              you do not agree to these Terms, you may not access or use the
              Service. These Terms constitute a legally binding agreement between
              you and TrueFans RADIO Network (&quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;).
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              2. Description of Service
            </h2>
            <p className="mb-3">
              TrueFans RADIO Network is an AI-powered radio station platform
              that provides the following services:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Radio Streaming:</strong> Live and automated radio
                broadcasting featuring americana and independent music.
              </li>
              <li>
                <strong>Artist Platform:</strong> Music submission, onboarding,
                and airplay tier management for independent artists seeking radio
                exposure.
              </li>
              <li>
                <strong>Sponsor Marketplace:</strong> Advertising and
                sponsorship packages for businesses wanting to reach our listener
                community.
              </li>
              <li>
                <strong>Listener Community:</strong> Registration, engagement
                features, rewards programs, and community interaction tools for
                listeners.
              </li>
              <li>
                <strong>Station Operations:</strong> AI-assisted programming,
                DJ scheduling, music rotation, and traffic management.
              </li>
            </ul>
            <p className="mt-3">
              <strong>Platform Role:</strong> TrueFans RADIO Network is a
              technology provider that enables station operators to create and
              manage internet radio stations. We are not a broadcaster. We
              provide the tools, infrastructure, and AI services that power
              radio stations operated by independent operators. We do not
              control or take responsibility for the programming decisions,
              music selections, or content broadcast by individual station
              operators.
            </p>
          </section>

          {/* 2a. Operator Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              2a. Station Operator Responsibilities
            </h2>
            <p className="mb-3">
              If you operate a radio station on the TrueFans RADIO Network
              platform, you are solely responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Obtaining and maintaining all necessary music performance
                licenses (e.g., ASCAP, BMI, SESAC, SoundExchange) required for
                your station&apos;s broadcasts in your jurisdiction
              </li>
              <li>
                Ensuring all content broadcast through your station complies
                with applicable local, state, national, and international laws
                and regulations
              </li>
              <li>
                Managing your station&apos;s content, programming, and
                scheduling in accordance with community standards and applicable
                broadcasting regulations
              </li>
              <li>
                Maintaining accurate records of music played and reporting as
                required by performance rights organizations
              </li>
              <li>
                Responding to and resolving any complaints, disputes, or legal
                claims related to content broadcast on your station
              </li>
              <li>
                Ensuring that advertising and sponsor content on your station
                complies with applicable advertising standards and regulations
              </li>
            </ul>
            <p className="mt-3">
              TrueFans RADIO Network does not monitor or pre-approve content
              broadcast by station operators. Failure to comply with these
              responsibilities may result in suspension or termination of your
              station and account.
            </p>
          </section>

          {/* 2b. Artist Content Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              2b. Artist Content Rights
            </h2>
            <p className="mb-3">
              By submitting music or other content to the TrueFans RADIO
              Network platform, artists acknowledge and agree to the following:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                You grant all station operators on the TrueFans RADIO Network a
                non-exclusive, royalty-free license to broadcast, stream, and
                publicly perform your submitted music through their radio
                stations on the platform
              </li>
              <li>
                You represent and warrant that you own or have the necessary
                rights, licenses, and permissions to submit the content and
                authorize its broadcast
              </li>
              <li>
                You retain full ownership and copyright of your original music
                and content at all times
              </li>
              <li>
                You may withdraw your music from the platform at any time by
                contacting us; removal will be processed within 7 business days
              </li>
              <li>
                The airplay license granted herein does not transfer any
                ownership rights and does not grant rights to download,
                redistribute, or sublicense your music outside the platform
              </li>
            </ul>
          </section>

          {/* 2c. DMCA and Copyright Takedown */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              2c. DMCA and Copyright Takedown
            </h2>
            <p className="mb-3">
              TrueFans RADIO Network respects the intellectual property rights
              of others and complies with the Digital Millennium Copyright Act
              (DMCA). If you believe that content on our platform infringes
              your copyright, please submit a takedown notice to:
            </p>
            <p className="mb-3">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:copyright@truefansradio.com"
                className="text-amber-700 underline hover:text-amber-900"
              >
                copyright@truefansradio.com
              </a>
            </p>
            <p className="mb-3">
              Your DMCA takedown notice must include the following:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>
                Identification of the copyrighted work you claim has been
                infringed
              </li>
              <li>
                Identification of the material on our platform that you claim
                is infringing, with enough detail for us to locate it
              </li>
              <li>
                Your contact information (name, address, telephone number,
                email address)
              </li>
              <li>
                A statement that you have a good-faith belief that use of the
                material is not authorized by the copyright owner, its agent,
                or the law
              </li>
              <li>
                A statement, under penalty of perjury, that the information in
                your notice is accurate and that you are the copyright owner or
                authorized to act on the owner&apos;s behalf
              </li>
              <li>
                Your physical or electronic signature
              </li>
            </ul>
            <p>
              Upon receipt of a valid DMCA takedown notice, we will remove or
              disable access to the allegedly infringing content within 48
              hours. We will notify the content provider and may provide them
              an opportunity to submit a counter-notification in accordance
              with the DMCA.
            </p>
          </section>

          {/* 3. User Accounts & Registration */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              3. User Accounts and Registration
            </h2>
            <p className="mb-3">
              Certain features of the Service require you to create an account.
              When registering, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Provide accurate, current, and complete information during
                registration
              </li>
              <li>
                Maintain and promptly update your account information to keep it
                accurate and complete
              </li>
              <li>
                Maintain the security and confidentiality of your login
                credentials
              </li>
              <li>
                Accept responsibility for all activities that occur under your
                account
              </li>
              <li>
                Notify us immediately of any unauthorized use of your account
              </li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate
              these Terms or that we reasonably believe to be fraudulent.
            </p>
          </section>

          {/* 4. Artist Subscription Tiers */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              4. Artist Subscription Tiers
            </h2>
            <p className="mb-3">
              Artists may participate in our airplay program through various
              subscription tiers:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>
                <strong>Free Tier ($0/month):</strong> Basic radio airplay with
                standard rotation placement.
              </li>
              <li>
                <strong>Paid Tiers (up to $120/month):</strong> Enhanced airplay
                frequency, priority rotation placement, promotional features,
                and additional exposure opportunities.
              </li>
            </ul>
            <p className="mb-3">
              By subscribing to a paid tier, you agree to the following:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Subscription fees are billed monthly and are non-refundable
                except as required by applicable law
              </li>
              <li>
                You may upgrade, downgrade, or cancel your subscription at any
                time; changes take effect at the start of the next billing cycle
              </li>
              <li>
                We reserve the right to modify subscription pricing with 30
                days&apos; prior notice
              </li>
              <li>
                Airplay placement is subject to our review and curation process;
                a paid tier does not guarantee specific listener counts or
                outcomes
              </li>
            </ul>
          </section>

          {/* 5. Sponsor Agreements */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              5. Sponsor Agreements
            </h2>
            <p className="mb-3">
              Sponsors may purchase advertising and sponsorship packages at
              various levels (Bronze, Silver, Gold, and Platinum). By entering
              into a sponsorship agreement, you agree to the following:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Sponsorship packages, pricing, and deliverables are as described
                at the time of purchase
              </li>
              <li>
                All advertising content must comply with applicable laws and
                regulations, including FCC guidelines where applicable
              </li>
              <li>
                We reserve the right to reject or remove advertising content
                that we deem inappropriate, misleading, or in violation of our
                policies
              </li>
              <li>
                Sponsorship fees are billed according to the terms of your
                selected package and are non-refundable except as specified in
                your agreement
              </li>
              <li>
                We do not guarantee specific listener numbers, impressions, or
                business outcomes from sponsorship
              </li>
            </ul>
          </section>

          {/* 6. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              6. Intellectual Property
            </h2>
            <p className="mb-3">
              <strong>Our Content:</strong> The TrueFans RADIO Network name,
              logo, website design, software, AI systems, and all related
              content are owned by or licensed to us and are protected by
              copyright, trademark, and other intellectual property laws. You may
              not copy, modify, distribute, or create derivative works from our
              content without prior written permission.
            </p>
            <p className="mb-3">
              <strong>Your Content:</strong> By submitting music, profiles,
              advertising materials, or other content to our platform, you grant
              us a non-exclusive, worldwide, royalty-free license to use,
              reproduce, broadcast, stream, display, and distribute your content
              in connection with operating and promoting the Service. You retain
              all ownership rights to your original content.
            </p>
            <p>
              <strong>Artist Music:</strong> Artists retain full ownership and
              copyright of their music. By submitting music for airplay, you
              represent that you have the right to authorize radio broadcast and
              streaming of your submitted works.
            </p>
          </section>

          {/* 7. Prohibited Conduct */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              7. Prohibited Conduct
            </h2>
            <p className="mb-3">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable law or regulation
              </li>
              <li>
                Submit content that infringes on the intellectual property rights
                of others
              </li>
              <li>
                Submit music or content that you do not have the rights to
                distribute or broadcast
              </li>
              <li>
                Attempt to gain unauthorized access to the Service, other user
                accounts, or our systems
              </li>
              <li>
                Interfere with or disrupt the Service, servers, or networks
                connected to the Service
              </li>
              <li>
                Use automated tools, bots, or scripts to access the Service in a
                manner that exceeds reasonable use
              </li>
              <li>
                Submit false, misleading, or fraudulent information during
                registration or in any interaction with the Service
              </li>
              <li>
                Harass, abuse, or threaten other users, artists, sponsors, or
                our staff
              </li>
              <li>
                Attempt to circumvent any content protection, access control, or
                security features of the Service
              </li>
            </ul>
          </section>

          {/* 7a. Platform Fees and Billing */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              7a. Platform Fees and Billing
            </h2>
            <p className="mb-3">
              Certain services on the TrueFans RADIO Network platform require
              payment of fees. By subscribing to a paid service, you agree to
              the following:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                All fees are stated in US dollars and are billed on a recurring
                monthly basis unless otherwise specified
              </li>
              <li>
                Payment is processed through our third-party payment provider,
                Manifest Financial. You agree to their terms of service as
                applicable to payment processing
              </li>
              <li>
                You authorize us to charge your selected payment method for all
                applicable fees on each billing date
              </li>
              <li>
                Failed payments may result in suspension of service until
                payment is resolved
              </li>
              <li>
                We reserve the right to change our pricing with 30 days&apos;
                prior written notice; continued use after the effective date of
                a price change constitutes acceptance of the new pricing
              </li>
              <li>
                Refunds are issued only as required by applicable law or at our
                sole discretion
              </li>
            </ul>
          </section>

          {/* 8. Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              8. Disclaimer of Warranties
            </h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
              AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, ERROR-FREE, OR SECURE. WE DO NOT GUARANTEE ANY
              SPECIFIC RESULTS FROM USE OF THE SERVICE, INCLUDING LISTENER
              COUNTS, REVENUE, OR EXPOSURE FOR ARTISTS AND SPONSORS.
            </p>
          </section>

          {/* 9. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              9. Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, TRUEFANS RADIO
              NETWORK AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND
              AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
              LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF
              OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE.
              OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS OR THE
              SERVICE SHALL NOT EXCEED THE AMOUNT YOU HAVE PAID TO US IN THE
              TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED DOLLARS
              ($100), WHICHEVER IS GREATER.
            </p>
          </section>

          {/* 10. Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              10. Indemnification
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless TrueFans RADIO
              Network and its officers, directors, employees, agents, and
              affiliates from and against any claims, liabilities, damages,
              losses, and expenses (including reasonable attorneys&apos; fees)
              arising out of or in any way connected with your access to or use
              of the Service, your violation of these Terms, or your
              infringement of any intellectual property or other rights of any
              third party.
            </p>
          </section>

          {/* 11. Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              11. Termination
            </h2>
            <p className="mb-3">
              We may suspend or terminate your access to the Service at any time,
              with or without cause, and with or without notice. Upon
              termination:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Your right to use the Service will immediately cease
              </li>
              <li>
                Any active subscriptions will be cancelled; no refund will be
                issued for the current billing period unless required by
                applicable law
              </li>
              <li>
                We may delete your account data in accordance with our Privacy
                Policy
              </li>
              <li>
                Provisions of these Terms that by their nature should survive
                termination will remain in effect (including Sections 6, 8, 9,
                10, and 12)
              </li>
            </ul>
            <p className="mt-3">
              You may terminate your account at any time by contacting us at{" "}
              <a
                href="mailto:support@truefans.radio"
                className="text-amber-700 underline hover:text-amber-900"
              >
                support@truefans.radio
              </a>
              .
            </p>
            <p className="mt-3">
              <strong>30-Day Notice:</strong> Either party may terminate a paid
              subscription or operator account with 30 days&apos; written
              notice. Upon providing notice, your service will continue through
              the end of the 30-day notice period. After termination, we will
              retain your data for 90 days to allow for data export, after
              which it will be permanently deleted unless retention is required
              by law.
            </p>
          </section>

          {/* 12. Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              12. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. When we
              make changes, we will update the &quot;Last Updated&quot; date at
              the top of this page. If we make material changes, we will provide
              notice through the Service or by email. Your continued use of the
              Service after the effective date of any changes constitutes your
              acceptance of the revised Terms. If you do not agree to the
              revised Terms, you must stop using the Service.
            </p>
          </section>

          {/* 13. Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              13. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the United States, without regard to conflict of law
              principles. Any disputes arising under these Terms shall be
              resolved in the courts of competent jurisdiction. You agree to
              submit to the personal jurisdiction of such courts.
            </p>
          </section>

          {/* 14. Severability */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              14. Severability
            </h2>
            <p>
              If any provision of these Terms is found to be invalid or
              unenforceable, the remaining provisions will continue in full force
              and effect. The invalid or unenforceable provision will be modified
              to the minimum extent necessary to make it valid and enforceable.
            </p>
          </section>

          {/* 15. Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              15. Contact Information
            </h2>
            <p>
              If you have any questions or concerns about these Terms, please
              contact us:
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
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Related Legal Pages
          </h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/privacy"
              className="text-amber-700 hover:text-amber-900 font-medium transition-colors"
            >
              Privacy Policy
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
