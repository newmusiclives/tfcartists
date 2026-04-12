import { SharedNav } from "@/components/shared-nav";
import { Mail, Radio, Globe, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <SharedNav />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Radio className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Contact Us</h1>
          <p className="text-gray-600 dark:text-zinc-400">
            Get in touch with the North Country Radio team.
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Email</h2>
              <a
                href="mailto:hello@truefansconnect.com"
                className="text-amber-600 hover:text-amber-700"
              >
                hello@truefansconnect.com
              </a>
              <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
                For general inquiries, artist submissions, and sponsorship questions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Website</h2>
              <a
                href="https://truefansconnect.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                truefansconnect.com
              </a>
              <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
                Learn more about TrueFans CONNECT and how to support independent artists.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Radio className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">North Country Radio</h2>
              <p className="text-sm text-gray-700 dark:text-zinc-300">
                Part of the TrueFans Radio Network
              </p>
              <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
                24/7 Americana and country music featuring independent artists.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Based In</h2>
              <p className="text-sm text-gray-700 dark:text-zinc-300">
                Pacific Northwest, USA
              </p>
              <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
                Broadcasting online to listeners everywhere.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-amber-900 mb-2">For Artists</h3>
          <p className="text-sm text-amber-700 mb-3">
            Want to get your music on North Country Radio? Submit your tracks through the Artist Portal.
          </p>
          <a
            href="/portal/artist"
            className="inline-block bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-700"
          >
            Artist Portal
          </a>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-blue-900 mb-2">For Sponsors</h3>
          <p className="text-sm text-blue-700 mb-3">
            Interested in reaching our engaged audience of Americana fans? Learn about sponsorship.
          </p>
          <a
            href="/portal/sponsor"
            className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Sponsor Portal
          </a>
        </div>
      </div>
    </div>
  );
}
