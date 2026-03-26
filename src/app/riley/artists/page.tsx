"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Search, Filter, TrendingUp, Music, DollarSign, BarChart3, User, Mail, Phone, Calendar } from "lucide-react";
import { ARTIST_CAPACITY, AIRPLAY_TIER_SHARES, AIRPLAY_TIER_PRICING, AIRPLAY_TIER_PLAYS_PER_MONTH } from "@/lib/calculations/station-capacity";

const tierMap: Record<string, string> = {
  FREE: "FREE",
  TIER_5: "BRONZE",
  TIER_20: "SILVER",
  TIER_50: "GOLD",
  TIER_120: "PLATINUM",
};

const sharesMap: Record<string, number> = {
  FREE: 1, TIER_5: 5, TIER_20: 25, TIER_50: 75, TIER_120: 200,
};

interface RawArtist {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  airplayTier?: string;
  status?: string;
  createdAt: string;
  engagementRate?: number;
  genre?: string;
  _count?: { conversations?: number };
}

function mapArtist(a: RawArtist) {
  const tier = tierMap[a.airplayTier || "FREE"] || "FREE";
  const shares = sharesMap[a.airplayTier || "FREE"] || 1;
  const price = AIRPLAY_TIER_PRICING[tier as keyof typeof AIRPLAY_TIER_PRICING] || 0;
  return {
    id: a.id,
    name: a.name,
    email: a.email || "",
    phone: a.phone || "",
    tier,
    status: a.status,
    joinedAt: new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    tracksSubmitted: a._count?.conversations || 0,
    playsThisMonth: shares,
    poolShares: shares,
    monthlyEarnings: 0,
    engagement: (a.engagementRate || 0) >= 5 ? "high" : (a.engagementRate || 0) >= 3 ? "medium" : "low",
    genre: a.genre || "Unknown",
  };
}

type TierFilter = "ALL" | "FREE" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export default function RileyArtistsPage() {
  const [artists, setArtists] = useState<ReturnType<typeof mapArtist>[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("ALL");
  const [selectedArtist, setSelectedArtist] = useState<ReturnType<typeof mapArtist> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArtists() {
      try {
        const res = await fetch("/api/artists?limit=100");
        if (res.ok) {
          const data = await res.json();
          setArtists((data.artists || []).map(mapArtist));
        }
      } catch (error) {
        // Fetch error handled by loading state
      } finally {
        setLoading(false);
      }
    }
    fetchArtists();
  }, []);

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artist.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === "ALL" || artist.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const stats = {
    total: artists.length,
    byTier: {
      FREE: artists.filter(a => a.tier === "FREE").length,
      BRONZE: artists.filter(a => a.tier === "BRONZE").length,
      SILVER: artists.filter(a => a.tier === "SILVER").length,
      GOLD: artists.filter(a => a.tier === "GOLD").length,
      PLATINUM: artists.filter(a => a.tier === "PLATINUM").length,
    },
    totalShares: artists.reduce((sum, a) => sum + a.poolShares, 0),
    totalMonthlyRevenue: artists.reduce((sum, a) => sum + (AIRPLAY_TIER_PRICING[a.tier as keyof typeof AIRPLAY_TIER_PRICING] || 0), 0),
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-gray-600">Loading artists...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/riley"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Riley Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Artist Management</h1>
              <p className="text-gray-600">
                Manage artist roster and tier tracking - Managed by Marcus Tate
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={<Users className="w-6 h-6 text-purple-600" />}
            label="Total Artists"
            value={stats.total}
            subtitle={`of ${ARTIST_CAPACITY.TOTAL} capacity`}
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            label="Monthly Revenue"
            value={`$${stats.totalMonthlyRevenue.toLocaleString()}`}
            subtitle="From tier subscriptions"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
            label="Total Pool Shares"
            value={stats.totalShares.toLocaleString()}
            subtitle="Artist pool distribution"
          />
          <StatCard
            icon={<Music className="w-6 h-6 text-orange-600" />}
            label="Active Tracks"
            value={artists.reduce((sum, a) => sum + a.tracksSubmitted, 0)}
            subtitle="In rotation"
          />
        </div>

        {/* Tier Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Artist Distribution by Tier</h2>
          <div className="grid grid-cols-5 gap-4">
            <TierSummaryCard tier="FREE" count={stats.byTier.FREE} capacity={ARTIST_CAPACITY.FREE} />
            <TierSummaryCard tier="BRONZE" count={stats.byTier.BRONZE} capacity={ARTIST_CAPACITY.BRONZE} />
            <TierSummaryCard tier="SILVER" count={stats.byTier.SILVER} capacity={ARTIST_CAPACITY.SILVER} />
            <TierSummaryCard tier="GOLD" count={stats.byTier.GOLD} capacity={ARTIST_CAPACITY.GOLD} />
            <TierSummaryCard tier="PLATINUM" count={stats.byTier.PLATINUM} capacity={ARTIST_CAPACITY.PLATINUM} />
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search artists by name or email..."
                aria-label="Search artists by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as TierFilter)}
                aria-label="Filter by tier"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ALL">All Tiers</option>
                <option value="FREE">FREE</option>
                <option value="BRONZE">Bronze</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
              </select>
            </div>
          </div>

          {/* Artists Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Artist</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plays/Month</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pool Shares</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Earnings</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Engagement</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredArtists.map((artist) => (
                  <ArtistRow key={artist.id} artist={artist} onSelect={setSelectedArtist} />
                ))}
              </tbody>
            </table>
            {filteredArtists.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No artists found matching your criteria
              </div>
            )}
          </div>
        </div>

        {/* Team Member Info */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-purple-100 rounded-full p-3">
              <User className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Marcus Tate</h3>
              <p className="text-sm text-gray-600 mb-3">Tier Management & Analytics</p>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>Responsibilities:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Manage rotation schedules ensuring tier play guarantees</li>
                  <li>Track analytics (play count, listener engagement)</li>
                  <li>Generate monthly reports for artists</li>
                  <li>Monitor capacity utilization across tiers</li>
                  <li>Identify tier upgrade opportunities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Artist Detail Modal */}
      {selectedArtist && (
        <ArtistDetailModal
          artist={selectedArtist}
          onClose={() => setSelectedArtist(null)}
        />
      )}
    </main>
  );
}

function StatCard({ icon, label, value, subtitle }: { icon: React.ReactNode; label: string; value: string | number; subtitle: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-3 mb-3">
        {icon}
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function TierSummaryCard({ tier, count, capacity }: { tier: string; count: number; capacity: number }) {
  const percentage = (count / capacity) * 100;
  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 mb-1">{tier}</div>
      <div className="text-2xl font-bold text-purple-600">{count}</div>
      <div className="text-xs text-gray-500">of {capacity}</div>
      <div className="mt-2 bg-gray-200 rounded-full h-2">
        <div
          className="bg-purple-600 h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? "bg-purple-600 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

function ArtistRow({ artist, onSelect }: { artist: ReturnType<typeof mapArtist>; onSelect: (a: ReturnType<typeof mapArtist>) => void }) {
  const engagementColors = {
    high: "text-green-600 bg-green-50",
    medium: "text-yellow-600 bg-yellow-50",
    low: "text-gray-600 bg-gray-50",
  };

  const tierColors = {
    FREE: "text-gray-600 bg-gray-100",
    BRONZE: "text-orange-600 bg-orange-100",
    SILVER: "text-gray-600 bg-gray-200",
    GOLD: "text-yellow-600 bg-yellow-100",
    PLATINUM: "text-purple-600 bg-purple-100",
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-4">
        <div className="font-semibold text-gray-900">{artist.name}</div>
        <div className="text-sm text-gray-500">{artist.email}</div>
      </td>
      <td className="px-4 py-4">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${tierColors[artist.tier as keyof typeof tierColors] || tierColors.FREE}`}>
          {artist.tier}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm font-medium text-gray-900">{artist.playsThisMonth}</div>
        <div className="text-xs text-gray-500">of {AIRPLAY_TIER_PLAYS_PER_MONTH[artist.tier as keyof typeof AIRPLAY_TIER_PLAYS_PER_MONTH]}</div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm font-medium text-gray-900">{artist.poolShares}</div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm font-semibold text-green-600">${artist.monthlyEarnings.toFixed(2)}</div>
      </td>
      <td className="px-4 py-4">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${engagementColors[artist.engagement as keyof typeof engagementColors] || engagementColors.low}`}>
          {artist.engagement}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <button
          onClick={() => onSelect(artist)}
          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
        >
          View Details
        </button>
      </td>
    </tr>
  );
}

function ArtistDetailModal({ artist, onClose }: { artist: ReturnType<typeof mapArtist>; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "tracks" | "plays" | "revenue" | "tiers">("overview");

  // Historical data will be fetched from APIs when available

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{artist.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              label="Overview"
            />
            <TabButton
              active={activeTab === "tracks"}
              onClick={() => setActiveTab("tracks")}
              label="Track History"
            />
            <TabButton
              active={activeTab === "plays"}
              onClick={() => setActiveTab("plays")}
              label="Play History"
            />
            <TabButton
              active={activeTab === "revenue"}
              onClick={() => setActiveTab("revenue")}
              label="Revenue History"
            />
            <TabButton
              active={activeTab === "tiers"}
              onClick={() => setActiveTab("tiers")}
              label="Tier History"
            />
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{artist.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{artist.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Joined {artist.joinedAt}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Music className="w-4 h-4 text-gray-400" />
                    <span>{artist.genre}</span>
                  </div>
                </div>
              </div>

              {/* Tier Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Subscription Details</h3>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Current Tier</div>
                      <div className="text-2xl font-bold text-purple-600">{artist.tier}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        ${AIRPLAY_TIER_PRICING[artist.tier as keyof typeof AIRPLAY_TIER_PRICING]}/month
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Pool Shares</div>
                      <div className="text-2xl font-bold text-gray-900">{artist.poolShares}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {AIRPLAY_TIER_PLAYS_PER_MONTH[artist.tier as keyof typeof AIRPLAY_TIER_PLAYS_PER_MONTH]} plays/month
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Performance This Month</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{artist.playsThisMonth}</div>
                    <div className="text-xs text-gray-600">Total Plays</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{artist.tracksSubmitted}</div>
                    <div className="text-xs text-gray-600">Tracks Submitted</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">${artist.monthlyEarnings.toFixed(2)}</div>
                    <div className="text-xs text-gray-600">Pool Earnings</div>
                  </div>
                </div>
              </div>

              {/* Engagement */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Engagement Level</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Engagement:</span>
                    <span className={`px-3 py-1 rounded font-semibold text-sm ${
                      artist.engagement === "high" ? "bg-green-100 text-green-700" :
                      artist.engagement === "medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-200 text-gray-700"
                    }`}>
                      {artist.engagement.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <a
                  href={`mailto:${artist.email}?subject=TrueFans RADIO - Following up on your airplay&body=Hi ${artist.name},%0D%0A%0D%0AI wanted to reach out about your performance on North Country Radio.%0D%0A%0D%0AYour stats this month:%0D%0A• ${artist.playsThisMonth} plays%0D%0A• ${artist.tracksSubmitted} tracks in rotation%0D%0A• $${artist.monthlyEarnings.toFixed(2)} pool share earnings%0D%0A%0D%0ALet me know if you have any questions!%0D%0A%0D%0ABest,%0D%0AMarcus Tate%0D%0ATier Management & Analytics`}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                >
                  Contact Artist
                </a>
              </div>
            </div>
          )}

          {/* Track History Tab */}
          {activeTab === "tracks" && (
            <div className="text-center py-8">
              <Music className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Track Submission History</h3>
              <p className="text-sm text-gray-500">Track history will be available once streaming data is connected.</p>
            </div>
          )}

          {/* Play History Tab */}
          {activeTab === "plays" && (
            <div className="text-center py-8">
              <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Monthly Play History</h3>
              <p className="text-sm text-gray-500">Play history will be available once the Railway streaming backend reports play data.</p>
            </div>
          )}

          {/* Revenue History Tab */}
          {activeTab === "revenue" && (
            <div className="text-center py-8">
              <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Monthly Revenue History</h3>
              <p className="text-sm text-gray-500">Revenue tracking will be available once Manifest Financial payments are connected.</p>
            </div>
          )}

          {/* Tier History Tab */}
          {activeTab === "tiers" && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Current Tier</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Current Tier</div>
                    <div className="text-sm text-gray-500">Since joining</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">{artist.tier}</div>
                    <div className="text-sm text-gray-600">${AIRPLAY_TIER_PRICING[artist.tier as keyof typeof AIRPLAY_TIER_PRICING]}/month</div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">Full tier progression history will be available in a future update.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
