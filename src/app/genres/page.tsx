import Link from "next/link";
import { Mic, ArrowRight } from "lucide-react";
import { STATION_TEMPLATES } from "@/lib/station-templates";

export const metadata = {
  title: "Station Genres | TrueFans RADIO",
  description:
    "Explore 10 ready-to-launch radio station genres — from Americana to Jazz, Hip-Hop to Latin. Pick a template and go live in minutes.",
};

export default function GenresPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-lg text-amber-800">
            TrueFans RADIO
          </Link>
          <Link
            href="/operator/signup"
            className="text-sm font-medium text-amber-700 hover:text-amber-900"
          >
            Operator Sign Up
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Station Genres
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from 10 professionally designed radio station templates.
            Each comes with AI DJs, scheduling, and branding ready to go.
          </p>
        </div>

        {/* Genre Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {STATION_TEMPLATES.map((tpl) => (
            <Link
              key={tpl.id}
              href={`/genres/${tpl.id}`}
              className="group bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Color accent bar */}
              <div
                className="h-2"
                style={{ backgroundColor: tpl.primaryColor }}
              />

              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-amber-800 transition-colors">
                  {tpl.name}
                </h2>
                <p
                  className="text-sm font-medium mb-3"
                  style={{ color: tpl.primaryColor }}
                >
                  {tpl.tagline}
                </p>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {tpl.description}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Mic className="w-3.5 h-3.5" />
                    <span>
                      {tpl.djPresets.length} AI DJ{tpl.djPresets.length !== 1 ? "s" : ""}
                    </span>
                  </span>
                  <span className="capitalize">{tpl.musicEra} era</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/operator/signup"
            className="inline-flex items-center space-x-2 bg-amber-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-amber-800 transition-colors"
          >
            <span>Launch Your Station</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-3 text-sm text-gray-500">
            No credit card required to get started
          </p>
        </div>
      </div>
    </main>
  );
}
