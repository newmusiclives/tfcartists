import Link from "next/link";
import {
  Radio,
  TrendingUp,
  Users,
  Heart,
  Globe,
  Music,
  BarChart3,
  Megaphone,
  Mail,
} from "lucide-react";

const activeStation = {
  name: "North Country Radio",
  callsign: "NCR",
  genre: "Americana, Country, Singer-Songwriter",
  tagline: "Where the music finds you.",
  status: "live" as const,
};

const futureStations = [
  {
    name: "Southern Soul Radio",
    callsign: "SSR",
    genre: "Soul, R&B, Blues",
  },
  {
    name: "Pacific Coast Sound",
    callsign: "PCS",
    genre: "Indie, Alternative, Surf Rock",
  },
  {
    name: "Heartland Hits",
    callsign: "HLH",
    genre: "Classic Country, Bluegrass, Folk",
  },
  {
    name: "Urban Frequency",
    callsign: "URB",
    genre: "Hip-Hop, R&B, Neo-Soul",
  },
  {
    name: "Mountain Echo Radio",
    callsign: "MER",
    genre: "Folk, Acoustic, Appalachian",
  },
];

const aiTeams = [
  {
    name: "Riley",
    role: "Artist Relations & Sales",
    description:
      "Manages outreach to independent artists, builds the pipeline from discovery to onboarding, and handles booking and submissions.",
    icon: <Users className="w-8 h-8" />,
    color: "purple",
  },
  {
    name: "Harper",
    role: "Revenue & Sponsorship",
    description:
      "Secures sponsor deals, manages advertising inventory, tracks billing, and maximizes monetization across the station.",
    icon: <Heart className="w-8 h-8" />,
    color: "green",
  },
  {
    name: "Cassidy",
    role: "Music & Programming",
    description:
      "Reviews submissions, manages rotation tiers, plans daily schedules, and ensures programming quality stays high.",
    icon: <Music className="w-8 h-8" />,
    color: "amber",
  },
  {
    name: "Elliot",
    role: "Analytics & Growth",
    description:
      "Tracks listener metrics, runs growth campaigns, manages community engagement, and produces viral content.",
    icon: <BarChart3 className="w-8 h-8" />,
    color: "blue",
  },
];

export default function NetworkPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Globe className="w-6 h-6 text-amber-700" />
              <span className="font-bold text-xl text-gray-900">
                TrueFans RADIO Network
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/station"
                className="text-amber-700 hover:text-amber-800 font-medium transition-colors"
              >
                NCR
              </Link>
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Section A: Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Globe className="w-4 h-4" />
          <span>AI-Powered Radio Network</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
          TrueFans RADIO
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-600">
            Network
          </span>
        </h1>

        <p className="text-2xl text-gray-700 max-w-3xl mx-auto mb-4">
          AI-Powered Radio Stations for Every Genre and Community
        </p>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A growing network of independent radio stations, each run by a
          dedicated operator and powered by 4 AI teams. Every station champions
          independent artists and builds real community around music.
        </p>
      </section>

      {/* Section B: Station Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
          Station Lineup
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-xl mx-auto">
          North Country Radio is live now. More stations are coming as the
          network grows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Active Station: NCR */}
          <div className="relative bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 rounded-2xl shadow-lg border-2 border-amber-400 overflow-hidden lg:col-span-1 md:col-span-2">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center space-x-1.5 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>LIVE</span>
              </span>
            </div>
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-4">
                <Radio className="w-10 h-10 text-amber-700" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {activeStation.name}
                  </h3>
                  <span className="text-sm font-mono font-bold text-amber-700">
                    {activeStation.callsign}
                  </span>
                </div>
              </div>
              <p className="text-amber-800 italic mb-3">
                &ldquo;{activeStation.tagline}&rdquo;
              </p>
              <p className="text-gray-700 text-sm mb-6">
                {activeStation.genre}
              </p>
              <Link
                href="/station"
                className="inline-flex items-center space-x-2 bg-amber-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-amber-800 transition-colors"
              >
                <Radio className="w-4 h-4" />
                <span>Go to Station</span>
              </Link>
            </div>
          </div>

          {/* Future Stations */}
          {futureStations.map((station) => (
            <div
              key={station.callsign}
              className="bg-gray-50 rounded-2xl shadow-sm border border-gray-200 p-8 opacity-75"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Radio className="w-8 h-8 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-700">
                      {station.name}
                    </h3>
                    <span className="text-xs font-mono font-bold text-gray-400">
                      {station.callsign}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-sm mb-4">{station.genre}</p>
              <span className="inline-block bg-gray-200 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Section C: The 4 AI Teams Model */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            Every Station Gets 4 AI Teams
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Each station in the TrueFans RADIO Network is powered by the same
            proven model: 4 specialized AI teams that handle everything from
            artist relations to growth analytics.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiTeams.map((team) => (
              <div
                key={team.name}
                className={`rounded-2xl p-6 shadow-md border ${
                  team.color === "purple"
                    ? "bg-purple-50 border-purple-200"
                    : team.color === "green"
                    ? "bg-green-50 border-green-200"
                    : team.color === "amber"
                    ? "bg-amber-50 border-amber-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div
                  className={`mb-4 ${
                    team.color === "purple"
                      ? "text-purple-600"
                      : team.color === "green"
                      ? "text-green-600"
                      : team.color === "amber"
                      ? "text-amber-600"
                      : "text-blue-600"
                  }`}
                >
                  {team.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {team.name}
                </h3>
                <p
                  className={`text-sm font-semibold mb-3 ${
                    team.color === "purple"
                      ? "text-purple-600"
                      : team.color === "green"
                      ? "text-green-600"
                      : team.color === "amber"
                      ? "text-amber-600"
                      : "text-blue-600"
                  }`}
                >
                  {team.role}
                </p>
                <p className="text-gray-600 text-sm">{team.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-amber-100 to-orange-100 px-8 py-4 rounded-xl border border-amber-200">
              <TrendingUp className="w-6 h-6 text-amber-700" />
              <p className="text-amber-900 font-medium">
                Same 4 teams. Same playbook. Every station. Infinitely
                replicable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section D: Operate a Station CTA */}
      <section className="bg-gradient-to-r from-amber-700 via-amber-800 to-orange-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Megaphone className="w-12 h-12 text-amber-300 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">
            Want to Operate a Station?
          </h2>
          <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
            Join the TrueFans RADIO Network as a station operator. We provide
            the AI teams, the platform, and the audience. You bring the genre
            expertise and local community.
          </p>
          <a
            href="mailto:operate@truefansradio.com?subject=Station%20Operator%20Inquiry"
            className="inline-flex items-center space-x-2 bg-white text-amber-800 px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-50 transition-colors shadow-xl"
          >
            <Mail className="w-5 h-5" />
            <span>Apply to Operate</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4">
            <span className="text-2xl font-bold text-white">
              TrueFans RADIO Network
            </span>
          </div>
          <p className="text-lg italic text-amber-400 mb-6">
            Real music. Real communities. Real support.
          </p>
          <p className="text-sm">
            Powered by <strong>Riley</strong>, <strong>Harper</strong>,{" "}
            <strong>Cassidy</strong>, and <strong>Elliot</strong>
          </p>
          <p className="text-xs mt-4">
            &copy; 2025 TrueFans RADIO. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
