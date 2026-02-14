"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  DollarSign,
  Headphones,
} from "lucide-react";

interface StationData {
  id: string;
  name: string;
  callSign: string | null;
  tagline: string | null;
  genre: string;
  primaryColor: string | null;
  isActive: boolean;
  _count?: {
    songs: number;
    clockTemplates: number;
    stationDJs: number;
  };
}

interface StationKPIs {
  station: { id: string; name: string; callSign: string } | null;
  kpis: {
    totalRevenue: number;
    artistCount: number;
    paidArtists: number;
    sponsorCount: number;
    activeSponsors: number;
    listenerCount: number;
    recentSessions: number;
    songCount: number;
    djCount: number;
  };
}

const futureStations = [
  { name: "Southern Soul Radio", callsign: "SSR", genre: "Soul, R&B, Blues" },
  { name: "Pacific Coast Sound", callsign: "PCS", genre: "Indie, Alternative, Surf Rock" },
  { name: "Heartland Hits", callsign: "HLH", genre: "Classic Country, Bluegrass, Folk" },
  { name: "Urban Frequency", callsign: "URB", genre: "Hip-Hop, R&B, Neo-Soul" },
  { name: "Mountain Echo Radio", callsign: "MER", genre: "Folk, Acoustic, Appalachian" },
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
  const [stations, setStations] = useState<StationData[]>([]);
  const [stationKPIs, setStationKPIs] = useState<Record<string, StationKPIs>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const stationsRes = await fetch("/api/stations");
        if (stationsRes.ok) {
          const data = await stationsRes.json();
          const stationList: StationData[] = data.stations || [];
          setStations(stationList);

          // Fetch KPIs for each active station
          const kpiPromises = stationList
            .filter((s) => s.isActive)
            .map(async (s) => {
              try {
                const res = await fetch(`/api/management/stats?stationId=${s.id}`);
                if (res.ok) {
                  const kpiData = await res.json();
                  return { stationId: s.id, data: kpiData };
                }
              } catch {
                // Non-critical
              }
              return null;
            });

          const kpiResults = await Promise.all(kpiPromises);
          const kpiMap: Record<string, StationKPIs> = {};
          for (const result of kpiResults) {
            if (result) kpiMap[result.stationId] = result.data;
          }
          setStationKPIs(kpiMap);
        }
      } catch {
        // Will show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Aggregate network-wide stats
  const networkStats = {
    totalStations: stations.filter((s) => s.isActive).length,
    totalArtists: Object.values(stationKPIs).reduce((sum, k) => sum + (k.kpis?.artistCount || 0), 0),
    totalListeners: Object.values(stationKPIs).reduce((sum, k) => sum + (k.kpis?.listenerCount || 0), 0),
    totalRevenue: Object.values(stationKPIs).reduce((sum, k) => sum + (k.kpis?.totalRevenue || 0), 0),
    totalSongs: Object.values(stationKPIs).reduce((sum, k) => sum + (k.kpis?.songCount || 0), 0),
  };

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
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/station" className="text-amber-700 hover:text-amber-800 font-medium transition-colors">
                NCR
              </Link>
              <Link href="/management" className="text-gray-600 hover:text-gray-900 transition-colors">
                Management
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
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

      {/* Network-Wide Stats */}
      {!loading && networkStats.totalStations > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border text-center">
              <Radio className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{networkStats.totalStations}</div>
              <div className="text-xs text-gray-500">Active Stations</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border text-center">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{networkStats.totalArtists}</div>
              <div className="text-xs text-gray-500">Artists</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border text-center">
              <Headphones className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{networkStats.totalListeners}</div>
              <div className="text-xs text-gray-500">Listeners</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border text-center">
              <Music className="w-6 h-6 text-teal-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{networkStats.totalSongs.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Songs</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border text-center">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">${networkStats.totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Monthly Revenue</div>
            </div>
          </div>
        </section>
      )}

      {/* Station Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
          Station Lineup
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-xl mx-auto">
          {loading ? "Loading stations..." : `${stations.filter((s) => s.isActive).length} station${stations.filter((s) => s.isActive).length !== 1 ? "s" : ""} live. More coming as the network grows.`}
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Active Stations from DB */}
            {stations.filter((s) => s.isActive).map((station) => {
              const kpi = stationKPIs[station.id];
              return (
                <div
                  key={station.id}
                  className="relative bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 rounded-2xl shadow-lg border-2 overflow-hidden"
                  style={{ borderColor: station.primaryColor || "#d97706" }}
                >
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center space-x-1.5 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span>LIVE</span>
                    </span>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center space-x-3 mb-4">
                      <Radio className="w-10 h-10" style={{ color: station.primaryColor || "#b45309" }} />
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{station.name}</h3>
                        {station.callSign && (
                          <span className="text-sm font-mono font-bold" style={{ color: station.primaryColor || "#b45309" }}>
                            {station.callSign}
                          </span>
                        )}
                      </div>
                    </div>
                    {station.tagline && (
                      <p className="text-gray-700 italic mb-2">&ldquo;{station.tagline}&rdquo;</p>
                    )}
                    <p className="text-gray-600 text-sm mb-4">{station.genre}</p>

                    {/* Live KPIs */}
                    {kpi && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-white/60 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-gray-900">{kpi.kpis.artistCount}</div>
                          <div className="text-[10px] text-gray-500">Artists</div>
                        </div>
                        <div className="bg-white/60 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-gray-900">{kpi.kpis.listenerCount}</div>
                          <div className="text-[10px] text-gray-500">Listeners</div>
                        </div>
                        <div className="bg-white/60 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-gray-900">{kpi.kpis.songCount.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-500">Songs</div>
                        </div>
                      </div>
                    )}

                    <Link
                      href="/station"
                      className="inline-flex items-center space-x-2 text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: station.primaryColor || "#b45309" }}
                    >
                      <Radio className="w-4 h-4" />
                      <span>Go to Station</span>
                    </Link>
                  </div>
                </div>
              );
            })}

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
        )}
      </section>

      {/* The 4 AI Teams */}
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

      {/* Operate a Station CTA */}
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/station-admin/wizard"
              className="inline-flex items-center space-x-2 bg-white text-amber-800 px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-50 transition-colors shadow-xl"
            >
              <Radio className="w-5 h-5" />
              <span>Create a Station</span>
            </Link>
            <a
              href="mailto:operate@truefansradio.com?subject=Station%20Operator%20Inquiry"
              className="inline-flex items-center space-x-2 border-2 border-white/50 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-white/10 transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span>Contact Us</span>
            </a>
          </div>
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
