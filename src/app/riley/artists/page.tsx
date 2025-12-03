"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Search, Filter, TrendingUp, Music, DollarSign, User, Mail, Phone, Calendar } from "lucide-react";
import { ARTIST_CAPACITY, AIRPLAY_TIER_SHARES, AIRPLAY_TIER_PRICING, AIRPLAY_TIER_PLAYS_PER_MONTH } from "@/lib/calculations/station-capacity";

// Mock data - in production this would come from the database
const artistsData = [
  {
    id: 1,
    name: "Sarah Blake",
    email: "sarah@example.com",
    phone: "555-0101",
    tier: "SILVER",
    status: "ACTIVE",
    joinedAt: "Jan 2024",
    tracksSubmitted: 4,
    playsThisMonth: 16,
    poolShares: 25,
    monthlyEarnings: 24.25,
    engagement: "high",
    genre: "Americana"
  },
  {
    id: 2,
    name: "Jake Rivers",
    email: "jake@example.com",
    phone: "555-0102",
    tier: "GOLD",
    status: "ACTIVE",
    joinedAt: "Dec 2023",
    tracksSubmitted: 6,
    playsThisMonth: 48,
    poolShares: 75,
    monthlyEarnings: 72.75,
    engagement: "high",
    genre: "Folk"
  },
  {
    id: 3,
    name: "Maya Santos",
    email: "maya@example.com",
    phone: "555-0103",
    tier: "BRONZE",
    status: "ACTIVE",
    joinedAt: "Jan 2024",
    tracksSubmitted: 2,
    playsThisMonth: 4,
    poolShares: 5,
    monthlyEarnings: 4.85,
    engagement: "medium",
    genre: "Roots"
  },
  {
    id: 4,
    name: "Alex Turner",
    email: "alex@example.com",
    phone: "555-0104",
    tier: "PLATINUM",
    status: "ACTIVE",
    joinedAt: "Nov 2023",
    tracksSubmitted: 12,
    playsThisMonth: 192,
    poolShares: 200,
    monthlyEarnings: 194.00,
    engagement: "high",
    genre: "Singer-Songwriter"
  },
  {
    id: 5,
    name: "Emma Davis",
    email: "emma@example.com",
    phone: "555-0105",
    tier: "FREE",
    status: "ACTIVE",
    joinedAt: "Jan 2024",
    tracksSubmitted: 1,
    playsThisMonth: 1,
    poolShares: 1,
    monthlyEarnings: 0.97,
    engagement: "low",
    genre: "Folk"
  },
  {
    id: 6,
    name: "Marcus Cole",
    email: "marcus@example.com",
    phone: "555-0106",
    tier: "BRONZE",
    status: "ACTIVE",
    joinedAt: "Jan 2024",
    tracksSubmitted: 3,
    playsThisMonth: 4,
    poolShares: 5,
    monthlyEarnings: 4.85,
    engagement: "medium",
    genre: "Bluegrass"
  },
  {
    id: 7,
    name: "Lisa Wong",
    email: "lisa@example.com",
    phone: "555-0107",
    tier: "SILVER",
    status: "ACTIVE",
    joinedAt: "Dec 2023",
    tracksSubmitted: 5,
    playsThisMonth: 16,
    poolShares: 25,
    monthlyEarnings: 24.25,
    engagement: "high",
    genre: "Indie Folk"
  },
  {
    id: 8,
    name: "John Smith",
    email: "john@example.com",
    phone: "555-0108",
    tier: "FREE",
    status: "ACTIVE",
    joinedAt: "Jan 2024",
    tracksSubmitted: 1,
    playsThisMonth: 1,
    poolShares: 1,
    monthlyEarnings: 0.97,
    engagement: "high",
    genre: "Americana"
  },
];

type TierFilter = "ALL" | "FREE" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export default function RileyArtistsPage() {
  const [artists, setArtists] = useState(artistsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("ALL");
  const [selectedArtist, setSelectedArtist] = useState<typeof artistsData[0] | null>(null);

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

function ArtistRow({ artist, onSelect }: { artist: typeof artistsData[0]; onSelect: (a: typeof artistsData[0]) => void }) {
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
        <span className={`px-2 py-1 rounded text-xs font-semibold ${tierColors[artist.tier]}`}>
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
        <span className={`px-2 py-1 rounded text-xs font-semibold ${engagementColors[artist.engagement]}`}>
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

function ArtistDetailModal({ artist, onClose }: { artist: typeof artistsData[0]; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "tracks" | "plays" | "revenue" | "tiers">("overview");

  // Mock historical data
  const trackHistory = [
    { date: "Jan 15, 2024", track: "Wildfire", status: "Approved", plays: 48 },
    { date: "Jan 8, 2024", track: "Mountain Road", status: "Approved", plays: 52 },
    { date: "Dec 20, 2023", track: "Silent Night Blues", status: "Approved", plays: 45 },
    { date: "Dec 5, 2023", track: "Highway Dreams", status: "Rejected", plays: 0 },
  ];

  const playHistory = [
    { month: "Jan 2024", plays: 16, allocated: 16, listeners: 1240 },
    { month: "Dec 2023", plays: 18, allocated: 16, listeners: 1380 },
    { month: "Nov 2023", plays: 14, allocated: 16, listeners: 1120 },
    { month: "Oct 2023", plays: 16, allocated: 16, listeners: 1290 },
  ];

  const revenueHistory = [
    { month: "Jan 2024", poolEarnings: 24.25, subscription: 20, net: 4.25 },
    { month: "Dec 2023", poolEarnings: 22.80, subscription: 20, net: 2.80 },
    { month: "Nov 2023", poolEarnings: 21.50, subscription: 20, net: 1.50 },
    { month: "Oct 2023", poolEarnings: 23.10, subscription: 20, net: 3.10 },
  ];

  const tierHistory = [
    { date: "Jan 1, 2024", tier: "SILVER", action: "Current Tier", price: 20 },
    { date: "Nov 15, 2023", tier: "BRONZE", action: "Upgraded from BRONZE", price: 5 },
    { date: "Oct 1, 2023", tier: "FREE", action: "Joined Platform", price: 0 },
  ];

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
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Track Submission History</h3>
              <div className="space-y-3">
                {trackHistory.map((track, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{track.track}</div>
                        <div className="text-sm text-gray-500">{track.date}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${
                          track.status === "Approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {track.status}
                        </span>
                        <div className="text-sm text-gray-600 mt-1">{track.plays} total plays</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Play History Tab */}
          {activeTab === "plays" && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Monthly Play History</h3>
              <div className="space-y-3">
                {playHistory.map((month, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-gray-900">{month.month}</div>
                      <div className="text-sm text-gray-600">{month.listeners.toLocaleString()} unique listeners</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Actual Plays</div>
                        <div className="text-2xl font-bold text-green-600">{month.plays}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Allocated Plays</div>
                        <div className="text-2xl font-bold text-gray-600">{month.allocated}</div>
                      </div>
                    </div>
                    <div className="mt-3 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${Math.min((month.plays / month.allocated) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue History Tab */}
          {activeTab === "revenue" && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue History</h3>
              <div className="space-y-3">
                {revenueHistory.map((month, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-3">{month.month}</div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Pool Earnings</div>
                        <div className="text-lg font-bold text-green-600">+${month.poolEarnings.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Subscription</div>
                        <div className="text-lg font-bold text-red-600">-${month.subscription.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Net Earnings</div>
                        <div className={`text-lg font-bold ${month.net > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {month.net > 0 ? '+' : ''}${month.net.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-purple-50 rounded-lg p-4 mt-4">
                  <div className="font-semibold text-gray-900 mb-2">Total Lifetime Earnings</div>
                  <div className="text-3xl font-bold text-purple-600">
                    ${revenueHistory.reduce((sum, m) => sum + m.net, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Net profit over {revenueHistory.length} months</div>
                </div>
              </div>
            </div>
          )}

          {/* Tier History Tab */}
          {activeTab === "tiers" && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Tier Upgrade History</h3>
              <div className="space-y-3">
                {tierHistory.map((tier, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{tier.action}</div>
                        <div className="text-sm text-gray-500">{tier.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">{tier.tier}</div>
                        <div className="text-sm text-gray-600">${tier.price}/month</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
