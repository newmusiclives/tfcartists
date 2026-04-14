"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Radio,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Loader2,
  AlertCircle,
  Gift,
  BarChart3,
} from "lucide-react";

interface AffiliateStats {
  totalReferrals: number;
  activeStations: number;
  monthlyCommission: number;
  lifetimeEarnings: number;
  totalClicks: number;
}

interface Referral {
  operatorEmail: string;
  signupDate: string;
  plan: string;
  status: string;
  commission: number;
}

interface Payout {
  month: string;
  amount: number;
  status: string;
  paidAt?: string;
}

interface AffiliateData {
  name: string;
  email: string;
  company: string;
  website: string;
  referralCode: string;
  status: string;
  createdAt: string;
  stats: AffiliateStats;
  referrals: Referral[];
  payouts: Payout[];
}

export default function AffiliateDashboardPage() {
  const [email, setEmail] = useState("");
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const fetchData = useCallback(async (affiliateEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/affiliates?email=${encodeURIComponent(affiliateEmail)}`);
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Failed to load affiliate data");
        return;
      }
      const result = await res.json();
      setData(result);
      setAuthenticated(true);
      localStorage.setItem("tfr_affiliate_email", affiliateEmail);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("tfr_affiliate_email");
    if (saved) {
      setEmail(saved);
      fetchData(saved);
    }
  }, [fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) fetchData(email.trim());
  };

  const copyLink = () => {
    if (!data) return;
    const link = `${window.location.origin}/api/affiliates/track?ref=${data.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("tfr_affiliate_email");
    setData(null);
    setAuthenticated(false);
    setEmail("");
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  // Login screen
  if (!authenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-4">
              <Radio className="w-8 h-8 text-amber-500" />
              <span className="text-2xl font-bold text-white">TrueFans RADIO</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Affiliate Portal</h1>
            <p className="text-zinc-400">Enter your affiliate email to access your dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-5">
            {error && (
              <div className="flex items-start gap-2 bg-red-950/50 border border-red-900 rounded-lg p-3 text-sm text-red-300">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@agency.com"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-2.5 rounded-lg font-semibold hover:bg-amber-500 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Access Dashboard"}
            </button>

            <p className="text-center text-sm text-zinc-500">
              Not an affiliate yet?{" "}
              <a href="/affiliate/signup" className="text-amber-500 hover:text-amber-400 font-medium">
                Apply here
              </a>
            </p>
          </form>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/api/affiliates/track?ref=${data.referralCode}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-amber-500" />
            <span className="text-lg font-bold text-white">TrueFans RADIO</span>
            <span className="text-zinc-600">|</span>
            <span className="text-sm text-zinc-400">Affiliate Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{data.company}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {data.name}</h1>
          <p className="text-zinc-400 mt-1">
            Affiliate since {formatDate(data.createdAt)} &middot; Code: <span className="font-mono text-amber-500">{data.referralCode}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total Referrals"
            value={data.stats.totalReferrals.toString()}
            sub={`${data.stats.totalClicks} link clicks`}
          />
          <StatCard
            icon={<Radio className="w-5 h-5" />}
            label="Active Stations"
            value={data.stats.activeStations.toString()}
            sub="Currently subscribed"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Monthly Commission"
            value={formatCurrency(data.stats.monthlyCommission)}
            sub="This month"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Lifetime Earnings"
            value={formatCurrency(data.stats.lifetimeEarnings)}
            sub="All time"
          />
        </div>

        {/* Referral Link */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-amber-500" />
            Your Referral Link
          </h2>
          <p className="text-sm text-zinc-400 mb-4">
            Share this link with potential station operators. When they sign up, they will be attributed to your account.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 font-mono text-sm text-zinc-300 truncate">
              {referralLink}
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-500 transition-colors whitespace-nowrap"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Direct signup link: <span className="font-mono">{typeof window !== "undefined" ? window.location.origin : ""}/operator/signup?ref={data.referralCode}</span>
          </p>
        </div>

        {/* Commission Structure */}
        <div className="bg-gradient-to-br from-amber-950/40 to-zinc-900 border border-amber-900/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-500" />
            Commission Structure
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/60 rounded-lg p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-amber-500 mb-1">20%</div>
              <div className="text-sm text-zinc-300 font-medium">Recurring Commission</div>
              <div className="text-xs text-zinc-500 mt-1">On all subscription revenue for 12 months</div>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-amber-500 mb-1">$50</div>
              <div className="text-sm text-zinc-300 font-medium">Activation Bonus</div>
              <div className="text-xs text-zinc-500 mt-1">Per station that goes live and starts streaming</div>
            </div>
            <div className="bg-zinc-900/60 rounded-lg p-4 border border-zinc-800">
              <div className="text-2xl font-bold text-amber-500 mb-1">Monthly</div>
              <div className="text-sm text-zinc-300 font-medium">Payout Schedule</div>
              <div className="text-xs text-zinc-500 mt-1">Paid on active subscriptions each month</div>
            </div>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" />
              Referral History
            </h2>
            <span className="text-sm text-zinc-500">{data.referrals.length} referrals</span>
          </div>
          {data.referrals.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">No referrals yet</p>
              <p className="text-sm text-zinc-600 mt-1">Share your referral link to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-800/50 text-left">
                    <th className="px-6 py-3 text-zinc-400 font-medium">Operator</th>
                    <th className="px-6 py-3 text-zinc-400 font-medium">Signup Date</th>
                    <th className="px-6 py-3 text-zinc-400 font-medium">Plan</th>
                    <th className="px-6 py-3 text-zinc-400 font-medium">Status</th>
                    <th className="px-6 py-3 text-zinc-400 font-medium text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {data.referrals.map((ref, i) => (
                    <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-3 text-zinc-300 font-mono text-xs">{ref.operatorEmail}</td>
                      <td className="px-6 py-3 text-zinc-400">{formatDate(ref.signupDate)}</td>
                      <td className="px-6 py-3">
                        <span className="inline-block bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-medium capitalize">
                          {ref.plan}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={ref.status} />
                      </td>
                      <td className="px-6 py-3 text-right text-zinc-300 font-medium">
                        {formatCurrency(ref.commission)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout History */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Payout History
            </h2>
          </div>
          {data.payouts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DollarSign className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">No payouts yet</p>
              <p className="text-sm text-zinc-600 mt-1">Payouts appear here once you have active referred stations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-800/50 text-left">
                    <th className="px-6 py-3 text-zinc-400 font-medium">Month</th>
                    <th className="px-6 py-3 text-zinc-400 font-medium">Amount</th>
                    <th className="px-6 py-3 text-zinc-400 font-medium">Status</th>
                    <th className="px-6 py-3 text-zinc-400 font-medium">Paid On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {data.payouts.map((payout, i) => (
                    <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-3 text-zinc-300">{payout.month}</td>
                      <td className="px-6 py-3 text-zinc-300 font-medium">{formatCurrency(payout.amount)}</td>
                      <td className="px-6 py-3">
                        <StatusBadge status={payout.status} />
                      </td>
                      <td className="px-6 py-3 text-zinc-400">
                        {payout.paidAt ? formatDate(payout.paidAt) : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center gap-2 text-zinc-400 mb-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{sub}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-950 text-emerald-400 border-emerald-800",
    pending: "bg-amber-950 text-amber-400 border-amber-800",
    churned: "bg-red-950 text-red-400 border-red-800",
    paid: "bg-emerald-950 text-emerald-400 border-emerald-800",
    processing: "bg-blue-950 text-blue-400 border-blue-800",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium border capitalize ${
        styles[status] || "bg-zinc-800 text-zinc-400 border-zinc-700"
      }`}
    >
      {status}
    </span>
  );
}
