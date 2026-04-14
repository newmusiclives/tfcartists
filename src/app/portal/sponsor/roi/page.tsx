"use client";

import { useState, useCallback } from "react";
import { SharedNav } from "@/components/shared-nav";
import {
  BarChart3,
  Radio,
  Users,
  MapPin,
  DollarSign,
  TrendingUp,
  Loader2,
  Copy,
  Download,
  Mail,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Gauge,
} from "lucide-react";

interface RoiReport {
  sponsorId: string;
  sponsorName: string;
  contactName: string;
  contactEmail: string;
  month: string;
  monthLabel: string;
  tier: string;
  monthlyAmount: number;
  metrics: {
    totalAdPlays: number;
    listenersReached: number;
    citiesReached: number;
    cityList: string[];
    costPerImpression: number;
    estimatedImpressions: number;
    estimatedMarketValue: number;
  };
  adPerformance: {
    adSpotsUsed: number;
    adSpotsAllocated: number;
    fillRate: number;
    daypartBreakdown: Record<string, number>;
    ads: Array<{
      id: string;
      title: string;
      plays: number;
      tier: string;
      lastPlayed: string | null;
    }>;
  };
  reachSummary: string;
  valueStatement: string;
}

const DAYPART_LABELS: Record<string, string> = {
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  evening: "Evening",
  late_night: "Late Night",
};

const DAYPART_TIMES: Record<string, string> = {
  morning: "6am-10am",
  midday: "10am-3pm",
  afternoon: "3pm-7pm",
  evening: "7pm-12am",
  late_night: "12am-6am",
};

const DAYPART_COLORS: Record<string, string> = {
  morning: "bg-amber-500",
  midday: "bg-blue-500",
  afternoon: "bg-orange-500",
  evening: "bg-purple-500",
  late_night: "bg-indigo-700",
};

function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
}

export default function SponsorRoiPage() {
  const [sponsorId, setSponsorId] = useState("");
  const [month, setMonth] = useState(getMonthOptions()[0].value);
  const [report, setReport] = useState<RoiReport | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [emailHtml, setEmailHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"lookup" | "report">("lookup");

  const fetchReport = useCallback(async () => {
    if (!sponsorId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sponsors/${sponsorId}/roi-report?month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        setMarkdown(data.markdown);
        setEmailHtml(data.emailHtml);
        setView("report");
      } else if (res.status === 404) {
        setError("Sponsor not found. Check your ID and try again.");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [sponsorId, month]);

  const handleMonthChange = useCallback(
    (newMonth: string) => {
      setMonth(newMonth);
      if (report && sponsorId) {
        setLoading(true);
        setError(null);
        fetch(`/api/sponsors/${sponsorId}/roi-report?month=${newMonth}`)
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              setReport(data.report);
              setMarkdown(data.markdown);
              setEmailHtml(data.emailHtml);
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    },
    [report, sponsorId]
  );

  const copyReport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = markdown;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [markdown]);

  const downloadHtml = useCallback(() => {
    const blob = new Blob([emailHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roi-report-${report?.sponsorName?.replace(/\s+/g, "-").toLowerCase()}-${report?.month}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [emailHtml, report]);

  const mailtoLink = report
    ? `mailto:${report.contactEmail || ""}?subject=${encodeURIComponent(
        `Your ${report.monthLabel} Sponsorship Report - TrueFans Radio`
      )}&body=${encodeURIComponent(
        `Hi ${report.contactName || report.sponsorName},\n\nPlease find your monthly sponsorship performance report below.\n\n${markdown}`
      )}`
    : "#";

  // Lookup view
  if (view === "lookup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <SharedNav />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Sponsor ROI Report</h1>
          <p className="text-zinc-400 mb-8">
            View your monthly ad performance, audience reach, and return on investment.
          </p>

          <div className="space-y-3 max-w-md mx-auto">
            <input
              type="text"
              value={sponsorId}
              onChange={(e) => setSponsorId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchReport()}
              placeholder="Enter your Sponsor ID"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {getMonthOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              onClick={fetchReport}
              disabled={loading || !sponsorId.trim()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Generate Report
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 justify-center mt-4 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <p className="text-xs text-zinc-600 mt-4">
            Your Sponsor ID was provided when your sponsorship was activated.
          </p>
        </div>
      </div>
    );
  }

  // Report view
  if (!report) return null;

  const maxDaypartPlays = Math.max(
    ...Object.values(report.adPerformance.daypartBreakdown),
    1
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <SharedNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Logo placeholder */}
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
              <Radio className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{report.sponsorName}</h1>
              <p className="text-zinc-400 text-sm">
                {report.contactName} &middot;{" "}
                <span className="capitalize">{report.tier}</span> Sponsor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={month}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {getMonthOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setView("lookup");
                setReport(null);
              }}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Switch
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard
                icon={<Megaphone className="w-5 h-5 text-blue-400" />}
                label="Ad Plays"
                value={report.metrics.totalAdPlays.toLocaleString()}
                sublabel={`${report.adPerformance.adSpotsAllocated} allocated`}
              />
              <MetricCard
                icon={<Users className="w-5 h-5 text-green-400" />}
                label="Listeners Reached"
                value={report.metrics.listenersReached.toLocaleString()}
                sublabel="unique listeners"
              />
              <MetricCard
                icon={<MapPin className="w-5 h-5 text-amber-400" />}
                label="Cities Reached"
                value={String(report.metrics.citiesReached)}
                sublabel={
                  report.metrics.cityList.slice(0, 3).join(", ") || "Various"
                }
              />
              <MetricCard
                icon={<DollarSign className="w-5 h-5 text-purple-400" />}
                label="Cost Per Impression"
                value={`$${report.metrics.costPerImpression.toFixed(3)}`}
                sublabel={`$${report.monthlyAmount}/mo investment`}
              />
            </div>

            {/* Fill Rate + Value Statement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              {/* Fill Rate */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="w-5 h-5 text-zinc-400" />
                  <h2 className="font-semibold text-white">Ad Spot Utilization</h2>
                </div>
                <div className="flex items-end gap-4 mb-3">
                  <span className="text-4xl font-bold text-white">
                    {report.adPerformance.fillRate.toFixed(0)}%
                  </span>
                  <span className="text-sm text-zinc-400 pb-1">
                    fill rate
                  </span>
                </div>
                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(report.adPerformance.fillRate, 100)}%`,
                      backgroundColor:
                        report.adPerformance.fillRate >= 80
                          ? "#22c55e"
                          : report.adPerformance.fillRate >= 50
                            ? "#eab308"
                            : "#ef4444",
                    }}
                  />
                </div>
                <p className="text-sm text-zinc-400">
                  <span className="text-white font-medium">
                    {report.adPerformance.adSpotsUsed}
                  </span>{" "}
                  of{" "}
                  <span className="text-white font-medium">
                    {report.adPerformance.adSpotsAllocated}
                  </span>{" "}
                  allocated spots used this month
                </p>
              </div>

              {/* Value Statement */}
              <div className="bg-gradient-to-br from-blue-950/50 to-zinc-900 border border-blue-900/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h2 className="font-semibold text-white">Value Statement</h2>
                </div>
                <p className="text-3xl font-bold text-green-400 mb-2">
                  ${report.metrics.estimatedMarketValue.toLocaleString()}
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  At industry standard radio advertising rates, this month&apos;s exposure
                  would cost approximately{" "}
                  <span className="text-white font-medium">
                    ${report.metrics.estimatedMarketValue.toLocaleString()}
                  </span>
                  . Your investment of ${report.monthlyAmount}/month delivers strong ROI.
                </p>
              </div>
            </div>

            {/* Ad Performance - Daypart Bar Chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-zinc-400" />
                <h2 className="font-semibold text-white">Ad Plays by Daypart</h2>
              </div>
              <div className="space-y-4">
                {["morning", "midday", "afternoon", "evening", "late_night"].map(
                  (daypart) => {
                    const plays =
                      report.adPerformance.daypartBreakdown[daypart] || 0;
                    const pct =
                      maxDaypartPlays > 0
                        ? (plays / maxDaypartPlays) * 100
                        : 0;
                    return (
                      <div key={daypart} className="flex items-center gap-4">
                        <div className="w-28 flex-shrink-0">
                          <p className="text-sm font-medium text-zinc-300">
                            {DAYPART_LABELS[daypart]}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {DAYPART_TIMES[daypart]}
                          </p>
                        </div>
                        <div className="flex-1 h-8 bg-zinc-800 rounded-lg overflow-hidden relative">
                          <div
                            className={`h-full ${DAYPART_COLORS[daypart]} rounded-lg transition-all duration-500`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                          <span className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-zinc-300">
                            {plays}
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Reach Summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-zinc-400" />
                <h2 className="font-semibold text-white">Reach Summary</h2>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-4">
                {report.reachSummary}
              </p>
              {report.metrics.cityList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {report.metrics.cityList.map((city) => (
                    <span
                      key={city}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Individual Ads */}
            {report.adPerformance.ads.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="w-5 h-5 text-zinc-400" />
                  <h2 className="font-semibold text-white">Your Ads</h2>
                </div>
                <div className="divide-y divide-zinc-800">
                  {report.adPerformance.ads.map((ad) => (
                    <div
                      key={ad.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {ad.title}
                        </p>
                        <p className="text-xs text-zinc-500 capitalize">
                          {ad.tier} tier
                          {ad.lastPlayed &&
                            ` \u00b7 Last played ${new Date(ad.lastPlayed).toLocaleDateString()}`}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {ad.plays} plays
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export Actions */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4">Export & Share</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={copyReport}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? "Copied!" : "Copy as Text"}
                </button>

                <button
                  onClick={downloadHtml}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download HTML
                </button>

                <a
                  href={mailtoLink}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email to Sponsor
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="mb-3">{icon}</div>
      <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-zinc-500">{sublabel}</p>
    </div>
  );
}
