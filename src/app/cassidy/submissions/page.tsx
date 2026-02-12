"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  Music,
  Clock,
  CheckCircle,
  BarChart3,
  Filter,
  XCircle,
  Send,
} from "lucide-react";
import type {
  CassidyStats,
  SubmissionListItem,
} from "@/types/cassidy";
import { SubmissionStatus, RotationTier } from "@/types/cassidy";

type FilterTab = "ALL" | `${SubmissionStatus}`;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "JUDGED", label: "Judged" },
  { key: "PLACED", label: "Placed" },
  { key: "NOT_PLACED", label: "Not Placed" },
];

export default function CassidySubmissionsPage() {
  const [stats, setStats] = useState<CassidyStats | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({
    tier: RotationTier.BRONZE as RotationTier,
    spinsWeekly: 5,
    rationale: "",
  });
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/cassidy/stats");
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchSubmissions() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (activeTab !== "ALL") {
          params.set("status", activeTab);
        }
        const res = await fetch(`/api/cassidy/submissions?${params}`);
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data.submissions || []);
        }
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, [activeTab]);

  async function handleAssignTier(submissionId: string) {
    setAssignLoading(true);
    try {
      const res = await fetch("/api/cassidy/tiers/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          tierAwarded: assignForm.tier,
          rotationSpinsWeekly: assignForm.spinsWeekly,
          decisionRationale: assignForm.rationale,
        }),
      });
      if (res.ok) {
        setAssigningId(null);
        setAssignForm({ tier: RotationTier.BRONZE, spinsWeekly: 5, rationale: "" });
        // Refresh submissions
        const params = new URLSearchParams({ limit: "50" });
        if (activeTab !== "ALL") params.set("status", activeTab);
        const refreshRes = await fetch(`/api/cassidy/submissions?${params}`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setSubmissions(data.submissions || []);
        }
        // Refresh stats
        const statsRes = await fetch("/api/cassidy/stats");
        if (statsRes.ok) setStats(await statsRes.json());
      }
    } catch (error) {
      console.error("Error assigning tier:", error);
    } finally {
      setAssignLoading(false);
    }
  }

  const statusConfig: Record<
    string,
    { bg: string; text: string; icon: React.ReactNode; label: string }
  > = {
    PENDING: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      icon: <Clock className="w-4 h-4" />,
      label: "Pending",
    },
    IN_REVIEW: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: <BarChart3 className="w-4 h-4" />,
      label: "In Review",
    },
    JUDGED: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: <CheckCircle className="w-4 h-4" />,
      label: "Judged",
    },
    PLACED: {
      bg: "bg-teal-100",
      text: "text-teal-700",
      icon: <Award className="w-4 h-4" />,
      label: "Placed",
    },
    NOT_PLACED: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: <XCircle className="w-4 h-4" />,
      label: "Not Placed",
    },
  };

  const tierSpins: Record<string, number> = {
    BRONZE: 5,
    SILVER: 12,
    GOLD: 22,
    PLATINUM: 30,
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/cassidy"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Music className="w-8 h-8 text-teal-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Review Queue
              </h1>
              <p className="text-gray-600">
                Submission review and tier assignment
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Bar */}
        {stats && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.pendingSubmissions}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
              <div className="text-sm text-gray-600">In Review</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.inReview}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
              <div className="text-sm text-gray-600">Judged This Week</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.judgedThisWeek}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-teal-200 shadow-sm">
              <div className="text-sm text-gray-600">Placement Rate</div>
              <div className="text-2xl font-bold text-teal-600">
                {stats.placementRate}%
              </div>
            </div>
          </section>
        )}

        {/* Filter Tabs */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-6 overflow-x-auto">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Submission List */}
          {loading ? (
            <div className="text-center py-12 text-gray-600">
              Loading submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No submissions found for this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => {
                const config = statusConfig[submission.status] ||
                  statusConfig.PENDING;
                return (
                  <div key={submission.id}>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-300 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Music className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="font-semibold text-gray-900">
                              {submission.artistName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {submission.trackTitle}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Judges</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {submission.judgesCompleted}/
                            {submission.totalJudges}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-600">Submitted</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {submission.submittedAt}
                          </div>
                        </div>

                        <div
                          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${config.bg} ${config.text}`}
                        >
                          {config.icon}
                          <span className="text-sm font-medium">
                            {submission.tierAwarded || config.label}
                          </span>
                        </div>

                        {submission.status === "JUDGED" && (
                          <button
                            onClick={() =>
                              setAssigningId(
                                assigningId === submission.id
                                  ? null
                                  : submission.id
                              )
                            }
                            className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                          >
                            Assign Tier
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tier Assignment Form */}
                    {assigningId === submission.id && (
                      <div className="mt-2 p-4 bg-teal-50 rounded-lg border border-teal-200">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Assign Tier for {submission.artistName} &mdash; &ldquo;{submission.trackTitle}&rdquo;
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tier
                            </label>
                            <select
                              value={assignForm.tier}
                              onChange={(e) => {
                                const tier = e.target.value as RotationTier;
                                setAssignForm({
                                  ...assignForm,
                                  tier,
                                  spinsWeekly: tierSpins[tier] || 5,
                                });
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                              <option value="BRONZE">Bronze (4-6 spins/wk)</option>
                              <option value="SILVER">Silver (10-14 spins/wk)</option>
                              <option value="GOLD">Gold (20-25 spins/wk)</option>
                              <option value="PLATINUM">Platinum (30+ spins/wk)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Spins/Week
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={assignForm.spinsWeekly}
                              onChange={(e) =>
                                setAssignForm({
                                  ...assignForm,
                                  spinsWeekly: parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rationale
                            </label>
                            <input
                              type="text"
                              value={assignForm.rationale}
                              onChange={(e) =>
                                setAssignForm({
                                  ...assignForm,
                                  rationale: e.target.value,
                                })
                              }
                              placeholder="Decision rationale..."
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 mt-4">
                          <button
                            onClick={() => handleAssignTier(submission.id)}
                            disabled={assignLoading || !assignForm.rationale}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-4 h-4" />
                            <span>
                              {assignLoading ? "Assigning..." : "Confirm Assignment"}
                            </span>
                          </button>
                          <button
                            onClick={() => setAssigningId(null)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
