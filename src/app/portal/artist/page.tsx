"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SharedNav } from "@/components/shared-nav";
import {
  Music,
  DollarSign,
  TrendingUp,
  Upload,
  Clock,
  Star,
  Loader2,
  Radio,
  ChevronRight,
  BarChart3,
  FileText,
  Settings,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Headphones,
  Calendar,
  ArrowLeft,
} from "lucide-react";

/* ---------- Types ---------- */

interface ArtistProfile {
  id: string;
  name: string;
  genre: string;
  email: string;
  bio: string | null;
  airplayTier: string;
  airplayShares: number;
  xpTotal: number;
  xpLevel: number;
  status: string;
  conversationCount: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface DashboardStats {
  playsThisMonth: number;
  listenerReach: number;
  earningsThisMonth: number;
  earningsPaid: boolean;
  currentTier: string;
  shares: number;
  xpTotal: number;
  xpLevel: number;
  totalPlays: number;
  trackCount: number;
  tracksInRotation: number;
}

interface EarningsRecord {
  id: string;
  period: string;
  tier: string;
  shares: number;
  earnings: number;
  paid: boolean;
  paidAt: string | null;
}

interface TrackRecord {
  id: string;
  trackTitle: string;
  genre: string | null;
  duration: number | null;
  status: string;
  addedToRotation: boolean;
  playCount: number;
  playsThisMonth: number;
  submittedAt: string;
  reviewedAt: string | null;
}

interface PaymentRecord {
  id: string;
  tier: string;
  amount: number;
  period: string;
  status: string;
  paymentMethod: string;
  transactionId: string | null;
  date: string;
}

interface PayoutRecord {
  id: string;
  period: string;
  earnings: number;
  shares: number;
  tier: string;
  paidAt: string | null;
}

/* ---------- Constants ---------- */

const TIER_INFO: Record<string, { name: string; shares: number; cost: number; color: string }> = {
  FREE: { name: "Free", shares: 1, cost: 0, color: "gray" },
  TIER_5: { name: "Starter", shares: 5, cost: 5, color: "blue" },
  TIER_20: { name: "Growth", shares: 25, cost: 20, color: "purple" },
  TIER_50: { name: "Pro", shares: 75, cost: 50, color: "amber" },
  TIER_120: { name: "Premium", shares: 200, cost: 120, color: "green" },
};

type PortalTab = "dashboard" | "tracks" | "earnings" | "payments" | "analytics" | "settings";

/* ---------- Component ---------- */

export default function ArtistPortalPage() {
  // Auth state
  const [artistId, setArtistId] = useState("");
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"lookup" | "portal">("lookup");
  const [activeTab, setActiveTab] = useState<PortalTab>("dashboard");

  // Dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<any>(null);
  const [tracks, setTracks] = useState<TrackRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<PayoutRecord[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);

  // Track upload state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadGenre, setUploadGenre] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile edit state
  const [editBio, setEditBio] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editSocials, setEditSocials] = useState({ instagram: "", twitter: "", spotify: "", website: "" });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const profileImageRef = useRef<HTMLInputElement>(null);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(false);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  /* ---------- Artist Lookup ---------- */

  const lookupArtist = async () => {
    if (!artistId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let res: Response;
      if (artistId.includes("@")) {
        res = await fetch(`/api/artists?search=${encodeURIComponent(artistId)}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          const artists = data.artists || [];
          if (artists.length > 0) {
            setArtist(artists[0]);
            setView("portal");
          } else {
            setError("No artist found with that email.");
          }
          return;
        }
      } else {
        res = await fetch(`/api/artists/${artistId}`);
        if (res.ok) {
          const data = await res.json();
          setArtist(data.artist || data);
          setView("portal");
          return;
        }
      }
      if (res!.status === 404) {
        setError("Artist not found. Check your ID or email and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Data Fetching ---------- */

  useEffect(() => {
    if (!artist?.id || view !== "portal") return;

    // Initialize profile edit fields
    setEditBio(artist.bio || "");
    setEditGenre(artist.genre || "");
    const meta = artist.metadata || {};
    const socials = meta.socialLinks || {};
    setEditSocials({
      instagram: socials.instagram || "",
      twitter: socials.twitter || "",
      spotify: socials.spotify || "",
      website: socials.website || "",
    });

    // Load dashboard stats
    loadStats();
  }, [artist?.id, view]);

  useEffect(() => {
    if (!artist?.id) return;
    if (activeTab === "earnings") loadEarnings();
    if (activeTab === "tracks") loadTracks();
    if (activeTab === "payments") loadPayments();
    if (activeTab === "analytics") loadStats();
  }, [activeTab, artist?.id]);

  const loadStats = async () => {
    if (!artist?.id) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/portal/artist/stats?artistId=${artist.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadEarnings = async () => {
    if (!artist?.id) return;
    setEarningsLoading(true);
    try {
      const res = await fetch(`/api/portal/artist/earnings?artistId=${artist.id}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setEarnings(data.earnings || []);
        setEarningsSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Failed to load earnings", err);
    } finally {
      setEarningsLoading(false);
    }
  };

  const loadTracks = async () => {
    if (!artist?.id) return;
    setTracksLoading(true);
    try {
      const res = await fetch(`/api/portal/artist/tracks?artistId=${artist.id}`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
      }
    } catch (err) {
      console.error("Failed to load tracks", err);
    } finally {
      setTracksLoading(false);
    }
  };

  const loadPayments = async () => {
    if (!artist?.id) return;
    setPaymentsLoading(true);
    try {
      const res = await fetch(`/api/portal/artist/payments?artistId=${artist.id}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setPayouts(data.payouts || []);
        setPendingPayouts(data.pendingPayouts || []);
        setPaymentSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Failed to load payments", err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  /* ---------- Track Upload ---------- */

  const handleTrackSubmit = async () => {
    if (!artist?.id || !uploadTitle.trim()) return;
    setUploading(true);
    setUploadSuccess(false);
    try {
      const formData = new FormData();
      formData.append("artistId", artist.id);
      formData.append("trackTitle", uploadTitle);
      if (uploadGenre) formData.append("genre", uploadGenre);
      if (uploadNotes) formData.append("notes", uploadNotes);
      if (uploadFile) formData.append("audioFile", uploadFile);

      const res = await fetch("/api/portal/artist/tracks/submit", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setUploadSuccess(true);
        setUploadTitle("");
        setUploadGenre("");
        setUploadNotes("");
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        // Refresh track list
        setTimeout(() => {
          loadTracks();
          setUploadSuccess(false);
          setShowUploadForm(false);
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit track");
      }
    } catch {
      setError("Network error during upload");
    } finally {
      setUploading(false);
    }
  };

  /* ---------- Profile Save ---------- */

  const handleProfileSave = async () => {
    if (!artist?.id) return;
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      const formData = new FormData();
      formData.append("artistId", artist.id);
      formData.append("bio", editBio);
      formData.append("genre", editGenre);
      formData.append(
        "socialLinks",
        JSON.stringify(editSocials)
      );
      if (profileImage) formData.append("profileImage", profileImage);

      const res = await fetch("/api/portal/artist/profile", {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        setProfileSaved(true);
        const data = await res.json();
        if (data.artist) {
          setArtist((prev) =>
            prev ? { ...prev, bio: data.artist.bio, genre: data.artist.genre, metadata: data.artist.metadata } : prev
          );
        }
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch {
      setError("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  /* ---------- Helpers ---------- */

  const tier = artist ? TIER_INFO[artist.airplayTier] || TIER_INFO.FREE : TIER_INFO.FREE;

  const formatPeriod = (p: string) => {
    const [year, month] = p.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      live: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      expired: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
        {status}
      </span>
    );
  };

  /* ---------- Lookup View ---------- */

  if (view === "lookup") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <SharedNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <Radio className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Artist Portal</h1>
          <p className="text-gray-600 mb-8">
            Manage your tracks, view earnings, download invoices, and track your airplay performance.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupArtist()}
              placeholder="Enter your Artist ID or email"
              className="flex-1 border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            <button
              onClick={lookupArtist}
              disabled={loading}
              className="bg-amber-500 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Go
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <p className="text-xs text-gray-400 mt-3">
            Enter your Artist ID (from your welcome email) or the email you signed up with.
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Portal View ---------- */

  const tabs: { id: PortalTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "tracks", label: "Tracks", icon: <Music className="w-4 h-4" /> },
    { id: "earnings", label: "Earnings", icon: <DollarSign className="w-4 h-4" /> },
    { id: "payments", label: "Payments", icon: <FileText className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{artist?.name}</h1>
            <p className="text-gray-500">{artist?.genre} &middot; {artist?.email}</p>
          </div>
          <button
            onClick={() => { setView("lookup"); setArtist(null); setActiveTab("dashboard"); }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Switch Artist
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto bg-white rounded-lg p-1 shadow-sm border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-amber-100 text-amber-900"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-sm">
              Dismiss
            </button>
          </div>
        )}

        {/* ========== DASHBOARD TAB ========== */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Tier Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Current Tier</p>
                  <p className="text-2xl font-bold text-gray-900">{tier.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {tier.shares} shares &middot; ${tier.cost}/month
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Level</p>
                  <p className="text-3xl font-bold text-amber-600">{artist?.xpLevel || 1}</p>
                  <p className="text-xs text-gray-400">{artist?.xpTotal || 0} XP</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<Headphones className="w-5 h-5 text-blue-500" />}
                  label="Plays This Month"
                  value={stats.playsThisMonth.toLocaleString()}
                />
                <StatCard
                  icon={<DollarSign className="w-5 h-5 text-green-500" />}
                  label="Earnings This Month"
                  value={`$${stats.earningsThisMonth.toFixed(2)}`}
                />
                <StatCard
                  icon={<Users className="w-5 h-5 text-purple-500" />}
                  label="Listener Reach"
                  value={stats.listenerReach.toLocaleString()}
                />
                <StatCard
                  icon={<Music className="w-5 h-5 text-amber-500" />}
                  label="Tracks in Rotation"
                  value={`${stats.tracksInRotation} / ${stats.trackCount}`}
                />
                <StatCard
                  icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
                  label="Total All-Time Plays"
                  value={stats.totalPlays.toLocaleString()}
                />
                <StatCard
                  icon={<Star className="w-5 h-5 text-amber-500" />}
                  label="Current Shares"
                  value={stats.shares.toString()}
                />
                <StatCard
                  icon={<Radio className="w-5 h-5 text-rose-500" />}
                  label="Status"
                  value={artist?.status?.replace(/_/g, " ") || "Active"}
                />
                <StatCard
                  icon={<Calendar className="w-5 h-5 text-teal-500" />}
                  label="Member Since"
                  value={artist?.createdAt ? new Date(artist.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "-"}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm border">
                <p>No stats available yet. Keep submitting tracks and building your audience!</p>
              </div>
            )}

            {/* Tier Upgrade CTA */}
            {artist?.airplayTier !== "TIER_120" && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-2">Upgrade Your Tier</h3>
                <p className="text-sm text-amber-700 mb-4">
                  Higher tiers mean more shares in the revenue pool and more airplay for your music.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(TIER_INFO)
                    .filter(([key]) => key !== "FREE" && key !== artist?.airplayTier)
                    .map(([key, info]) => (
                      <Link
                        key={key}
                        href="/airplay"
                        className="bg-white rounded-lg p-3 border text-center hover:border-amber-400 hover:shadow-md transition-all"
                      >
                        <p className="font-semibold text-sm">{info.name}</p>
                        <p className="text-lg font-bold text-amber-600">${info.cost}/mo</p>
                        <p className="text-xs text-gray-500">{info.shares} shares</p>
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => { setActiveTab("tracks"); setShowUploadForm(true); }}
                className="bg-white rounded-xl p-5 shadow-sm border hover:border-purple-300 hover:shadow-md transition-all text-left"
              >
                <Upload className="w-5 h-5 text-purple-500 mb-2" />
                <p className="font-semibold text-gray-900">Submit a Track</p>
                <p className="text-sm text-gray-500 mt-1">Upload music for curator review</p>
              </button>
              <button
                onClick={() => setActiveTab("earnings")}
                className="bg-white rounded-xl p-5 shadow-sm border hover:border-green-300 hover:shadow-md transition-all text-left"
              >
                <DollarSign className="w-5 h-5 text-green-500 mb-2" />
                <p className="font-semibold text-gray-900">View Earnings</p>
                <p className="text-sm text-gray-500 mt-1">Monthly revenue breakdown</p>
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className="bg-white rounded-xl p-5 shadow-sm border hover:border-blue-300 hover:shadow-md transition-all text-left"
              >
                <BarChart3 className="w-5 h-5 text-blue-500 mb-2" />
                <p className="font-semibold text-gray-900">Analytics</p>
                <p className="text-sm text-gray-500 mt-1">Plays, reach, peak hours</p>
              </button>
            </div>
          </div>
        )}

        {/* ========== TRACKS TAB ========== */}
        {activeTab === "tracks" && (
          <div className="space-y-6">
            {/* Upload form */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-500" />
                  <h2 className="font-semibold">Submit New Track</h2>
                </div>
                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  {showUploadForm ? "Cancel" : "New Submission"}
                </button>
              </div>

              {showUploadForm && (
                <div className="p-6 space-y-4">
                  {uploadSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-800">Track submitted for review!</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Track Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Enter track title"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                      <input
                        type="text"
                        value={uploadGenre}
                        onChange={(e) => setUploadGenre(e.target.value)}
                        placeholder="e.g., Hip Hop, R&B, Indie"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Audio File (MP3, WAV, OGG &mdash; max 50MB)
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.wav,.ogg,audio/*"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes for Curators
                    </label>
                    <textarea
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                      placeholder="Any context for the review panel (optional)"
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                  </div>

                  <button
                    onClick={handleTrackSubmit}
                    disabled={uploading || !uploadTitle.trim()}
                    className="bg-purple-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" /> Submit Track
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Track List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center gap-2">
                <Music className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold">Your Tracks</h2>
                <span className="text-sm text-gray-400 ml-auto">{tracks.length} track{tracks.length !== 1 ? "s" : ""}</span>
              </div>

              {tracksLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : tracks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Music className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No tracks submitted yet.</p>
                  <button
                    onClick={() => setShowUploadForm(true)}
                    className="text-sm text-purple-600 hover:underline mt-2"
                  >
                    Submit your first track
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-6 py-3 font-medium text-gray-500">Title</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Genre</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 font-medium text-gray-500 text-right">Total Plays</th>
                        <th className="px-4 py-3 font-medium text-gray-500 text-right">This Month</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tracks.map((track) => (
                        <tr key={track.id} className="border-t hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-gray-900">
                            {track.trackTitle}
                            {track.addedToRotation && (
                              <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-400" title="In rotation" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{track.genre || "-"}</td>
                          <td className="px-4 py-3">{statusBadge(track.status)}</td>
                          <td className="px-4 py-3 text-right font-medium">{track.playCount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{track.playsThisMonth.toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {new Date(track.submittedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== EARNINGS TAB ========== */}
        {activeTab === "earnings" && (
          <div className="space-y-6">
            {/* Summary cards */}
            {earningsSummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border">
                  <p className="text-sm text-gray-500">Total Earned</p>
                  <p className="text-2xl font-bold text-gray-900">${earningsSummary.totalEarned.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border">
                  <p className="text-sm text-gray-500">Paid Out</p>
                  <p className="text-2xl font-bold text-green-600">${earningsSummary.totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border">
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">${earningsSummary.totalPending.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Earnings chart (simple bar representation) */}
            {earnings.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="font-semibold">Monthly Earnings</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {[...earnings].reverse().map((e) => {
                      const maxEarning = Math.max(...earnings.map((x) => x.earnings), 1);
                      const pct = (e.earnings / maxEarning) * 100;
                      return (
                        <div key={e.id} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-16 text-right flex-shrink-0">
                            {formatPeriod(e.period)}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                            <div
                              className={`h-full rounded-full ${e.paid ? "bg-green-400" : "bg-amber-400"}`}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-20 text-right">${e.earnings.toFixed(2)}</span>
                          <span className="w-5 flex-shrink-0">
                            {e.paid ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-500" />
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-green-400" /> Paid
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-amber-400" /> Pending
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Earnings table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold">Earnings History</h2>
              </div>

              {earningsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : earnings.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No earnings yet. Earnings are distributed monthly via Manifest Financial.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-6 py-3 font-medium text-gray-500">Period</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Tier</th>
                        <th className="px-4 py-3 font-medium text-gray-500 text-right">Shares</th>
                        <th className="px-4 py-3 font-medium text-gray-500 text-right">Earnings</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.map((e) => (
                        <tr key={e.id} className="border-t hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium">{formatPeriod(e.period)}</td>
                          <td className="px-4 py-3 text-gray-600">{e.tier}</td>
                          <td className="px-4 py-3 text-right">{e.shares}</td>
                          <td className="px-4 py-3 text-right font-medium">${e.earnings.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            {e.paid ? (
                              <span className="text-green-600 flex items-center gap-1 text-xs">
                                <CheckCircle className="w-3 h-3" /> Paid
                              </span>
                            ) : (
                              <span className="text-amber-600 flex items-center gap-1 text-xs">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/portal/artist/invoice?artistId=${artist?.id}&period=${e.period}`}
                              className="text-amber-600 hover:text-amber-800 flex items-center gap-1 text-xs font-medium"
                            >
                              <Download className="w-3 h-3" /> Download
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== PAYMENTS TAB ========== */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            {/* Summary */}
            {paymentSummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border">
                  <p className="text-sm text-gray-500">Total Subscription Payments</p>
                  <p className="text-2xl font-bold text-gray-900">${paymentSummary.totalPayments.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border">
                  <p className="text-sm text-gray-500">Total Earnings Paid Out</p>
                  <p className="text-2xl font-bold text-green-600">${paymentSummary.totalPayouts.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border">
                  <p className="text-sm text-gray-500">Pending Payout</p>
                  <p className="text-2xl font-bold text-amber-600">${paymentSummary.pendingAmount.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Manifest Financial note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                All payments are processed through <strong>Manifest Financial</strong>.
                Payouts are deposited to your registered bank account monthly.
              </p>
            </div>

            {/* Pending payouts */}
            {pendingPayouts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <h2 className="font-semibold">Pending Payouts</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-6 py-3 font-medium text-gray-500">Period</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Tier</th>
                        <th className="px-4 py-3 font-medium text-gray-500 text-right">Shares</th>
                        <th className="px-4 py-3 font-medium text-gray-500 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPayouts.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="px-6 py-3 font-medium">{formatPeriod(p.period)}</td>
                          <td className="px-4 py-3 text-gray-600">{p.tier}</td>
                          <td className="px-4 py-3 text-right">{p.shares}</td>
                          <td className="px-4 py-3 text-right font-medium text-amber-600">${p.earnings.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Subscription payments */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold">Subscription Payments</h2>
              </div>

              {paymentsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                </div>
              ) : payments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No subscription payments recorded.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-6 py-3 font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Period</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Tier</th>
                        <th className="px-4 py-3 font-medium text-gray-500 text-right">Amount</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-t hover:bg-gray-50">
                          <td className="px-6 py-3 text-gray-600">{new Date(p.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-medium">{formatPeriod(p.period)}</td>
                          <td className="px-4 py-3 text-gray-600">{p.tier}</td>
                          <td className="px-4 py-3 text-right font-medium">${p.amount.toFixed(2)}</td>
                          <td className="px-4 py-3">{statusBadge(p.status)}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{p.paymentMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Paid earnings */}
            {payouts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h2 className="font-semibold">Completed Payouts</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-6 py-3 font-medium text-gray-500">Period</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Tier</th>
                        <th className="px-4 py-3 font-medium text-gray-500 text-right">Shares</th>
                        <th className="px-4 py-3 font-medium text-gray-500 text-right">Amount</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Paid On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p) => (
                        <tr key={p.id} className="border-t hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium">{formatPeriod(p.period)}</td>
                          <td className="px-4 py-3 text-gray-600">{p.tier}</td>
                          <td className="px-4 py-3 text-right">{p.shares}</td>
                          <td className="px-4 py-3 text-right font-medium text-green-600">${p.earnings.toFixed(2)}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== ANALYTICS TAB ========== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {statsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <>
                {/* Performance overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    icon={<Headphones className="w-5 h-5 text-blue-500" />}
                    label="Plays This Month"
                    value={(stats?.playsThisMonth || 0).toLocaleString()}
                  />
                  <StatCard
                    icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                    label="All-Time Plays"
                    value={(stats?.totalPlays || 0).toLocaleString()}
                  />
                  <StatCard
                    icon={<Users className="w-5 h-5 text-purple-500" />}
                    label="Listener Reach"
                    value={(stats?.listenerReach || 0).toLocaleString()}
                  />
                  <StatCard
                    icon={<Music className="w-5 h-5 text-amber-500" />}
                    label="In Rotation"
                    value={`${stats?.tracksInRotation || 0} tracks`}
                  />
                </div>

                {/* Plays over time chart (from earnings) */}
                {earnings.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b">
                      <h2 className="font-semibold">Earnings Trend</h2>
                      <p className="text-xs text-gray-500 mt-1">Monthly earnings over the last 12 months</p>
                    </div>
                    <div className="p-6">
                      <div className="flex items-end gap-2 h-40">
                        {[...earnings].reverse().map((e) => {
                          const maxEarning = Math.max(...earnings.map((x) => x.earnings), 1);
                          const heightPct = (e.earnings / maxEarning) * 100;
                          return (
                            <div key={e.id} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-[10px] text-gray-500">${e.earnings.toFixed(0)}</span>
                              <div
                                className={`w-full rounded-t ${e.paid ? "bg-green-400" : "bg-amber-400"}`}
                                style={{ height: `${Math.max(heightPct, 4)}%` }}
                                title={`${formatPeriod(e.period)}: $${e.earnings.toFixed(2)}`}
                              />
                              <span className="text-[10px] text-gray-400">{e.period.split("-")[1]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Track performance */}
                {tracks.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b">
                      <h2 className="font-semibold">Track Performance</h2>
                    </div>
                    <div className="p-6 space-y-3">
                      {tracks
                        .sort((a, b) => b.playCount - a.playCount)
                        .slice(0, 10)
                        .map((track) => {
                          const maxPlays = Math.max(...tracks.map((t) => t.playCount), 1);
                          const pct = (track.playCount / maxPlays) * 100;
                          return (
                            <div key={track.id} className="flex items-center gap-3">
                              <span className="text-sm text-gray-700 w-40 truncate flex-shrink-0" title={track.trackTitle}>
                                {track.trackTitle}
                              </span>
                              <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-blue-400"
                                  style={{ width: `${Math.max(pct, 2)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-16 text-right">
                                {track.playCount.toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Peak hours insight */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="px-6 py-4 border-b">
                    <h2 className="font-semibold">Listening Insights</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">Morning</p>
                        <p className="text-xs text-gray-500 mt-1">6am - 12pm</p>
                        <p className="text-sm font-medium text-gray-700 mt-2">Peak Discovery</p>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <p className="text-2xl font-bold text-amber-600">Midday</p>
                        <p className="text-xs text-gray-500 mt-1">12pm - 5pm</p>
                        <p className="text-sm font-medium text-gray-700 mt-2">Steady Listening</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">Evening</p>
                        <p className="text-xs text-gray-500 mt-1">5pm - 10pm</p>
                        <p className="text-sm font-medium text-gray-700 mt-2">Peak Engagement</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-600">Late Night</p>
                        <p className="text-xs text-gray-500 mt-1">10pm - 6am</p>
                        <p className="text-sm font-medium text-gray-700 mt-2">Niche Audience</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-4 text-center">
                      Time slots based on Mountain Time (station timezone). Detailed per-track breakdowns coming soon.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========== SETTINGS TAB ========== */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold">Profile Settings</h2>
              </div>

              <div className="p-6 space-y-5">
                {profileSaved && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-800">Profile saved successfully!</p>
                  </div>
                )}

                {/* Profile image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                  <div className="flex items-center gap-4">
                    {artist?.metadata?.profileImage ? (
                      <img
                        src={artist.metadata.profileImage}
                        alt={artist.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <Music className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <input
                      ref={profileImageRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                      className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={4}
                    placeholder="Tell listeners about yourself..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  />
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                  <input
                    type="text"
                    value={editGenre}
                    onChange={(e) => setEditGenre(e.target.value)}
                    placeholder="e.g., Hip Hop, R&B, Indie Rock"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  />
                </div>

                {/* Social Links */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Social Links</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Instagram</label>
                      <input
                        type="text"
                        value={editSocials.instagram}
                        onChange={(e) => setEditSocials({ ...editSocials, instagram: e.target.value })}
                        placeholder="@yourusername"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Twitter / X</label>
                      <input
                        type="text"
                        value={editSocials.twitter}
                        onChange={(e) => setEditSocials({ ...editSocials, twitter: e.target.value })}
                        placeholder="@yourusername"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Spotify</label>
                      <input
                        type="text"
                        value={editSocials.spotify}
                        onChange={(e) => setEditSocials({ ...editSocials, spotify: e.target.value })}
                        placeholder="https://open.spotify.com/artist/..."
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Website</label>
                      <input
                        type="text"
                        value={editSocials.website}
                        onChange={(e) => setEditSocials({ ...editSocials, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Save */}
                <button
                  onClick={handleProfileSave}
                  disabled={savingProfile}
                  className="bg-amber-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </button>
              </div>
            </div>

            {/* Account info (read-only) */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold">Account Information</h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Artist ID</span>
                  <span className="font-mono text-gray-700">{artist?.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-700">{artist?.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tier</span>
                  <span className="text-gray-700">{tier.name} ({artist?.airplayTier})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Member Since</span>
                  <span className="text-gray-700">
                    {artist?.createdAt ? new Date(artist.createdAt).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Processor</span>
                  <span className="text-gray-700">Manifest Financial</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Stat Card Component ---------- */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="mb-2">{icon}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
