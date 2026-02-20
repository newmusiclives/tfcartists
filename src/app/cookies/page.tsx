import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | TrueFans RADIO Network",
  description:
    "Cookie Policy for the TrueFans RADIO Network. Learn about the cookies we use and how to manage them.",
  openGraph: {
    title: "Cookie Policy | TrueFans RADIO Network",
    description:
      "Cookie Policy for the TrueFans RADIO Network. Learn about the cookies we use and how to manage them.",
    url: "https://truefans-radio.netlify.app/cookies",
    siteName: "TrueFans RADIO Network",
    type: "website",
  },
};

export default function CookiePolicyPage() {
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
          Cookie Policy
        </h1>
        <p className="mt-2 text-gray-500 text-sm">
          Last Updated: February 2026
        </p>

        <div className="mt-10 space-y-10 text-gray-700 leading-relaxed">
          {/* 1. What Are Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              1. What Are Cookies
            </h2>
            <p>
              Cookies are small text files that are placed on your device
              (computer, tablet, or mobile phone) when you visit a website. They
              are widely used to make websites work more efficiently, to provide
              a better user experience, and to give website operators information
              about how their site is being used. Cookies may be set by the
              website you are visiting (&quot;first-party cookies&quot;) or by
              third-party services that provide content or functionality on the
              website (&quot;third-party cookies&quot;).
            </p>
          </section>

          {/* 2. How We Use Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              2. How We Use Cookies
            </h2>
            <p className="mb-3">
              TrueFans RADIO Network uses cookies and similar technologies for
              the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Authentication:</strong> We use cookies to identify you
                when you log in to your account. Our authentication system
                (NextAuth) sets session cookies that keep you signed in as you
                navigate between pages, so you do not have to re-enter your
                credentials on each visit.
              </li>
              <li>
                <strong>Preferences:</strong> We use cookies to remember your
                settings and preferences, such as your selected radio station,
                volume level, and display options, so your experience is
                consistent each time you return.
              </li>
              <li>
                <strong>Analytics:</strong> We use analytics cookies (including
                Google Analytics) to understand how visitors interact with our
                website. This helps us measure traffic, identify popular content,
                and improve the overall user experience. Analytics data is
                collected in aggregate and does not personally identify you.
              </li>
              <li>
                <strong>Session Management:</strong> We use session cookies to
                maintain your connection to our radio stream and to track your
                listening session for features such as rewards, community
                engagement, and content personalization.
              </li>
            </ul>
          </section>

          {/* 3. Types of Cookies We Use */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              3. Types of Cookies We Use
            </h2>

            {/* Essential Cookies */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Essential Cookies
              </h3>
              <p className="mb-2">
                These cookies are strictly necessary for the operation of our
                website. Without them, core functionality such as account login,
                secure areas, and session management would not work. Essential
                cookies cannot be disabled.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-amber-900 border-b border-gray-200">
                        Cookie
                      </th>
                      <th className="text-left px-4 py-2 font-semibold text-amber-900 border-b border-gray-200">
                        Purpose
                      </th>
                      <th className="text-left px-4 py-2 font-semibold text-amber-900 border-b border-gray-200">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs">
                        next-auth.session-token
                      </td>
                      <td className="px-4 py-2">
                        Authenticates your logged-in session
                      </td>
                      <td className="px-4 py-2">Session / 30 days</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs">
                        next-auth.csrf-token
                      </td>
                      <td className="px-4 py-2">
                        Protects against cross-site request forgery
                      </td>
                      <td className="px-4 py-2">Session</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">
                        next-auth.callback-url
                      </td>
                      <td className="px-4 py-2">
                        Stores redirect URL after login
                      </td>
                      <td className="px-4 py-2">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Functional Cookies
              </h3>
              <p className="mb-2">
                These cookies enable enhanced functionality and personalization.
                They may be set by us or by third-party providers whose services
                we have integrated. If you disable these cookies, some features
                may not work as expected.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-amber-900 border-b border-gray-200">
                        Cookie
                      </th>
                      <th className="text-left px-4 py-2 font-semibold text-amber-900 border-b border-gray-200">
                        Purpose
                      </th>
                      <th className="text-left px-4 py-2 font-semibold text-amber-900 border-b border-gray-200">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs">
                        station-preference
                      </td>
                      <td className="px-4 py-2">
                        Remembers your selected radio station
                      </td>
                      <td className="px-4 py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">
                        player-volume
                      </td>
                      <td className="px-4 py-2">
                        Stores your preferred playback volume
                      </td>
                      <td className="px-4 py-2">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analytics Cookies
              </h3>
              <p className="mb-2">
                These cookies help us understand how visitors use our website by
                collecting information in an aggregated, anonymous form. This
                data helps us improve the website and tailor content to our
                audience.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-amber-900 border-b border-gray-200">
                        Cookie
                      </th>
                      <th className="text-left px-4 py-2 font-semibold text-amber-900 border-b border-gray-200">
                        Purpose
                      </th>
                      <th className="text-left px-4 py-2 font-semibold text-amber-900 border-b border-gray-200">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs">_ga</td>
                      <td className="px-4 py-2">
                        Google Analytics: distinguishes unique visitors
                      </td>
                      <td className="px-4 py-2">2 years</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs">_ga_*</td>
                      <td className="px-4 py-2">
                        Google Analytics: maintains session state
                      </td>
                      <td className="px-4 py-2">2 years</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">_gid</td>
                      <td className="px-4 py-2">
                        Google Analytics: distinguishes visitors (24h)
                      </td>
                      <td className="px-4 py-2">24 hours</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 4. Managing Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              4. Managing Cookies
            </h2>
            <p className="mb-3">
              You can control and manage cookies in several ways:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Browser Settings:</strong> Most web browsers allow you
                to manage cookies through their settings. You can typically find
                these in the &quot;Options,&quot; &quot;Preferences,&quot; or
                &quot;Privacy&quot; section of your browser. You can choose to
                block all cookies, accept all cookies, or be notified when a
                cookie is set.
              </li>
              <li>
                <strong>Google Analytics Opt-Out:</strong> You can opt out of
                Google Analytics tracking by installing the{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 underline hover:text-amber-900"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>
                .
              </li>
              <li>
                <strong>Deleting Cookies:</strong> You can delete cookies that
                have already been set on your device through your browser
                settings. Note that deleting cookies may cause you to lose
                preferences and may require you to log in again.
              </li>
            </ul>
            <p className="mt-3">
              Please be aware that disabling or deleting certain cookies may
              affect the functionality of our website. Essential cookies are
              required for the Service to operate, and disabling them may prevent
              you from logging in or accessing core features.
            </p>
          </section>

          {/* 5. Updates to This Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              5. Updates to This Policy
            </h2>
            <p>
              We may update this Cookie Policy from time to time to reflect
              changes in the cookies we use or for other operational, legal, or
              regulatory reasons. When we make changes, we will update the
              &quot;Last Updated&quot; date at the top of this page. We
              encourage you to review this policy periodically to stay informed
              about how we use cookies.
            </p>
          </section>

          {/* 6. Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">
              6. Contact Information
            </h2>
            <p>
              If you have any questions about our use of cookies or this Cookie
              Policy, please contact us:
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
              href="/privacy"
              className="text-amber-700 hover:text-amber-900 font-medium transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-amber-700 hover:text-amber-900 font-medium transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
