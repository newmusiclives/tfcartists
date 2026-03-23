import type { Metadata } from "next";
import Link from "next/link";
import { SharedNav } from "@/components/shared-nav";
import {
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Radio,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Music Licensing | TrueFans RADIO",
  description:
    "Understanding music licensing obligations for internet radio station operators. Learn about ASCAP, BMI, SESAC, SoundExchange, and estimated costs.",
};

export default function LicensingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <SharedNav />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
            <Shield className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Music Licensing for Internet Radio
          </h1>
          <p className="text-xl sm:text-2xl font-medium bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-6">
            Understanding your obligations as a station operator
          </p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            <AlertTriangle className="w-4 h-4 inline-block mr-1 -mt-0.5" />
            This page is for informational purposes only and does not constitute legal advice.
            Consult a qualified music licensing attorney for guidance specific to your situation.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-20 space-y-10">
        {/* Do You Need a License? */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <span>Do You Need a License?</span>
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <p className="text-lg font-semibold text-amber-800 mb-3">
              Yes — if you stream music publicly, you need performance rights licenses.
            </p>
            <p className="text-gray-700">
              TrueFans RADIO is a technology platform that provides the tools to run an internet
              radio station. Station operators are responsible for obtaining their own music
              licenses before streaming copyrighted content. This applies to any publicly
              accessible stream, regardless of audience size.
            </p>
          </div>
        </section>

        {/* The Three PROs */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-amber-600" />
            <span>The Three PROs</span>
          </h2>
          <p className="text-gray-600 mb-6">
            Performance Rights Organizations collect royalties on behalf of songwriters and
            publishers for the public performance of their compositions.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-100">
              <h3 className="text-lg font-bold text-gray-900 mb-1">ASCAP</h3>
              <p className="text-sm text-amber-700 font-medium mb-3">ascap.com</p>
              <p className="text-gray-700 text-sm">
                Covers approximately 900,000 songwriters, composers, and music publishers.
                Internet radio license available through their website.
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-100">
              <h3 className="text-lg font-bold text-gray-900 mb-1">BMI</h3>
              <p className="text-sm text-amber-700 font-medium mb-3">bmi.com</p>
              <p className="text-gray-700 text-sm">
                Covers approximately 1.2 million songwriters and publishers. Digital streaming
                license available for internet radio operators.
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-100">
              <h3 className="text-lg font-bold text-gray-900 mb-1">SESAC</h3>
              <p className="text-sm text-amber-700 font-medium mb-3">sesac.com</p>
              <p className="text-gray-700 text-sm">
                Invitation-only PRO covering approximately 30,000 songwriters. Contact SESAC
                directly for internet radio licensing rates.
              </p>
            </div>
          </div>
        </section>

        {/* SoundExchange */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Radio className="w-6 h-6 text-amber-600" />
            <span>SoundExchange</span>
          </h2>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <p className="text-gray-700 mb-3">
              SoundExchange is <span className="font-semibold">separate from the PROs</span>.
              While PROs cover the underlying musical composition (the song itself),
              SoundExchange covers the{" "}
              <span className="font-semibold">digital performance of sound recordings</span>{" "}
              (the specific recording you play).
            </p>
            <p className="text-gray-700">
              Any internet radio station that streams recorded music needs a SoundExchange
              license in addition to PRO licenses. Register at{" "}
              <span className="font-medium text-amber-700">soundexchange.com</span>.
            </p>
          </div>
        </section>

        {/* Estimated Costs */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-amber-600" />
            <span>Estimated Costs</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-amber-200">
                  <th className="py-3 pr-4 text-sm font-semibold text-gray-900">Organization</th>
                  <th className="py-3 pr-4 text-sm font-semibold text-gray-900">
                    Estimated Annual Cost
                  </th>
                  <th className="py-3 text-sm font-semibold text-gray-900">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 pr-4 font-medium text-gray-900">ASCAP</td>
                  <td className="py-3 pr-4 text-gray-700">~$600 – $1,000/year</td>
                  <td className="py-3 text-sm text-gray-600">Small webcaster rate</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-gray-900">BMI</td>
                  <td className="py-3 pr-4 text-gray-700">~$600 – $1,000/year</td>
                  <td className="py-3 text-sm text-gray-600">Small webcaster rate</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-gray-900">SESAC</td>
                  <td className="py-3 pr-4 text-gray-700">Varies</td>
                  <td className="py-3 text-sm text-gray-600">Contact for quote</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-gray-900">SoundExchange</td>
                  <td className="py-3 pr-4 text-gray-700">Revenue-based</td>
                  <td className="py-3 text-sm text-gray-600">
                    Typically 15–25% of revenue or minimum fee
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            &ldquo;Small webcaster&rdquo; rates generally apply to stations under certain revenue
            and listener thresholds. Rates are subject to change — verify current pricing
            directly with each organization.
          </p>
        </section>

        {/* What TrueFans RADIO Provides */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-amber-600" />
            <span>What TrueFans RADIO Provides</span>
          </h2>
          <ul className="space-y-3">
            {[
              "Technology platform only — we are not a music licensor",
              "Operators must obtain their own licenses before going live",
              "We recommend securing all licenses during the setup phase",
              "Our AI tools do not replace legal counsel",
            ].map((item) => (
              <li key={item} className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Alternative: Original/Licensed Music Only */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span>Alternative: Original / Licensed Music Only</span>
          </h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-gray-700">
              If you <span className="font-semibold">only</span> play music from artists who
              have directly submitted their work and granted you permission to stream it — like
              the artists on your TrueFans station — you may have different licensing
              requirements. However, licensing law is nuanced and varies by jurisdiction.{" "}
              <span className="font-semibold">
                Consult a music attorney to confirm your obligations.
              </span>
            </p>
          </div>
        </section>

        {/* Resources */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
            <ExternalLink className="w-6 h-6 text-amber-600" />
            <span>Resources</span>
          </h2>
          <ul className="space-y-4">
            {[
              {
                label: "ASCAP Internet License Application",
                href: "https://www.ascap.com/music-users/types/internet-mobile",
              },
              {
                label: "BMI Digital License",
                href: "https://www.bmi.com/licensing",
              },
              {
                label: "SoundExchange Registration",
                href: "https://www.soundexchange.com",
              },
              {
                label: "U.S. Copyright Office",
                href: "https://www.copyright.gov",
              },
            ].map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-amber-700 hover:text-amber-800 font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-gray-500 italic">
            We recommend consulting a music licensing attorney in your jurisdiction before
            launching your station.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-lg p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to launch?
          </h2>
          <p className="text-amber-100 text-lg mb-8">
            Get your licenses, then launch your station.
          </p>
          <Link
            href="/operate"
            className="inline-block bg-white text-amber-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-50 transition-colors shadow-lg"
          >
            Start Your Station
          </Link>
        </section>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center max-w-2xl mx-auto">
          Disclaimer: The information on this page is provided for general informational
          purposes only and does not constitute legal advice. TrueFans RADIO makes no
          representations or warranties regarding the accuracy or completeness of this
          information. Station operators should seek independent legal counsel regarding their
          specific licensing obligations.
        </p>
      </div>
    </main>
  );
}
