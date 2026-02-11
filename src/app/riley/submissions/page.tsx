"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Music, CheckCircle, XCircle, Clock, Play, User, Tag, Calendar } from "lucide-react";

interface SubmissionItem {
  id: string;
  artist: string;
  artistEmail: string;
  track: string;
  tier: string;
  status: string;
  submittedAt: string;
  duration: string;
  genre: string;
  audioUrl: string;
  notes: string;
}

export default function RileySubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const res = await fetch("/api/cassidy/submissions");
        if (!res.ok) throw new Error("Failed to fetch submissions");
        const data = await res.json();
        const mapped: SubmissionItem[] = (data.submissions || []).map((s: any) => {
          const statusMap: Record<string, string> = {
            PENDING: "pending",
            IN_REVIEW: "pending",
            JUDGED: "pending",
            PLACED: "approved",
            NOT_PLACED: "rejected",
          };
          return {
            id: s.id,
            artist: s.artistName || "Unknown Artist",
            artistEmail: s.artistEmail || "",
            track: s.trackTitle || "Untitled",
            tier: s.tierAwarded || "FREE",
            status: statusMap[s.status] || "pending",
            submittedAt: s.submittedAt || s.createdAt || "",
            duration: s.trackDuration ? `${Math.floor(s.trackDuration / 60)}:${String(s.trackDuration % 60).padStart(2, "0")}` : "",
            genre: s.genre || "",
            audioUrl: s.trackFileUrl || "",
            notes: s.decisionRationale || "",
          };
        });
        setSubmissions(mapped);
      } catch (err) {
        console.error("Error fetching submissions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter(s =>
    filter === "all" ? true : s.status === filter
  );

  const stats = {
    pending: submissions.filter(s => s.status === "pending").length,
    approved: submissions.filter(s => s.status === "approved").length,
    rejected: submissions.filter(s => s.status === "rejected").length,
  };

  const handleApprove = (id: string) => {
    setSubmissions(prev => prev.map(s =>
      s.id === id ? { ...s, status: "approved" as const } : s
    ));
    setSelectedSubmission(null);
  };

  const handleReject = (id: string, reason: string) => {
    setSubmissions(prev => prev.map(s =>
      s.id === id ? { ...s, status: "rejected" as const, notes: reason } : s
    ));
    setSelectedSubmission(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submissions...</p>
        </div>
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
            <Music className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Track Submissions</h1>
              <p className="text-gray-600">
                Review and approve tracks for rotation - Managed by Sienna Park
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Clock className="w-6 h-6 text-yellow-600" />}
            label="Pending Review"
            value={stats.pending}
            color="yellow"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            label="Approved"
            value={stats.approved}
            color="green"
          />
          <StatCard
            icon={<XCircle className="w-6 h-6 text-red-600" />}
            label="Rejected"
            value={stats.rejected}
            color="red"
          />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex space-x-2 mb-6">
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="All Submissions"
              count={submissions.length}
            />
            <FilterButton
              active={filter === "pending"}
              onClick={() => setFilter("pending")}
              label="Pending"
              count={stats.pending}
            />
            <FilterButton
              active={filter === "approved"}
              onClick={() => setFilter("approved")}
              label="Approved"
              count={stats.approved}
            />
            <FilterButton
              active={filter === "rejected"}
              onClick={() => setFilter("rejected")}
              label="Rejected"
              count={stats.rejected}
            />
          </div>

          {/* Submissions List */}
          <div className="space-y-3">
            {filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onSelect={setSelectedSubmission}
              />
            ))}
            {filteredSubmissions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No {filter !== "all" && filter} submissions found
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
              <h3 className="text-lg font-bold text-gray-900">Sienna Park</h3>
              <p className="text-sm text-gray-600 mb-3">Content Vetting & Quality Control</p>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>Responsibilities:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Review submitted tracks for audio quality</li>
                  <li>Ensure format fit (Americana/Roots/Folk/Singer-Songwriter)</li>
                  <li>Check for profanity and content standards</li>
                  <li>Verify professional production quality</li>
                  <li>Provide feedback to artists on rejections</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <ReviewModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </main>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-3 mb-3">
        {icon}
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function FilterButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? "bg-purple-600 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function SubmissionCard({ submission, onSelect }: { submission: SubmissionItem; onSelect: (s: SubmissionItem) => void }) {
  const statusConfig = {
    pending: {
      icon: <Clock className="w-4 h-4 text-yellow-600" />,
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
      label: "Pending Review",
    },
    approved: {
      icon: <CheckCircle className="w-4 h-4 text-green-600" />,
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      label: "Approved",
    },
    rejected: {
      icon: <XCircle className="w-4 h-4 text-red-600" />,
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      label: "Rejected",
    },
  }[submission.status] || {
    icon: <Clock className="w-4 h-4 text-gray-600" />,
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
    label: submission.status,
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 ${statusConfig.border} hover:shadow-md transition-shadow`}>
      <div className="flex items-center space-x-4 flex-1">
        <div className="bg-purple-100 rounded-lg p-3">
          <Music className="w-8 h-8 text-purple-600" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">{submission.track}</div>
          <div className="text-sm text-gray-600">{submission.artist}</div>
          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <Tag className="w-3 h-3" />
              <span>{submission.genre}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{submission.duration}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{submission.submittedAt}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-xs font-medium text-purple-600">{submission.tier} Tier</div>
        </div>
        <div className={`px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text} flex items-center space-x-1`}>
          {statusConfig.icon}
          <span className="text-xs font-medium">{statusConfig.label}</span>
        </div>
        {submission.status === "pending" && (
          <button
            onClick={() => onSelect(submission)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            Review
          </button>
        )}
        {submission.status !== "pending" && (
          <button
            onClick={() => onSelect(submission)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            View
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewModal({
  submission,
  onClose,
  onApprove,
  onReject
}: {
  submission: SubmissionItem;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Review Submission</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Track Info */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Track Title</div>
            <div className="text-2xl font-bold text-gray-900">{submission.track}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Artist</div>
              <div className="font-semibold text-gray-900">{submission.artist}</div>
              <div className="text-sm text-gray-600">{submission.artistEmail}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Tier</div>
              <div className="font-semibold text-purple-600">{submission.tier}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Genre</div>
              <div className="font-semibold text-gray-900">{submission.genre}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Duration</div>
              <div className="font-semibold text-gray-900">{submission.duration}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Submitted</div>
              <div className="font-semibold text-gray-900">{submission.submittedAt}</div>
            </div>
          </div>

          {/* Audio Player */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Audio Preview</div>
            <div className="flex items-center space-x-3">
              <button className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 transition-colors">
                <Play className="w-5 h-5" />
              </button>
              <div className="flex-1 bg-gray-300 h-2 rounded-full">
                <div className="bg-purple-600 h-2 rounded-full w-0"></div>
              </div>
              <div className="text-sm text-gray-600">0:00 / {submission.duration}</div>
            </div>
          </div>

          {/* Quality Checklist */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="font-semibold text-gray-900 mb-3">Quality Checklist</div>
            <div className="space-y-2 text-sm">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Audio quality is professional (no clipping, proper levels)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Format fits station (Americana/Roots/Folk/Singer-Songwriter)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>No profanity or inappropriate content</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span>Production quality meets standards</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          {submission.notes && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Notes</div>
              <div className="bg-gray-50 rounded-lg p-3 text-gray-700">{submission.notes}</div>
            </div>
          )}

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="bg-red-50 rounded-lg p-4">
              <div className="font-semibold text-gray-900 mb-2">Rejection Reason</div>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide specific feedback to help the artist improve..."
                className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 sticky bottom-0 flex items-center justify-end space-x-3">
          {submission.status === "pending" && (
            <>
              {!showRejectForm ? (
                <>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => onApprove(submission.id)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Approve & Add to Rotation</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onReject(submission.id, rejectionReason)}
                    disabled={!rejectionReason.trim()}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Confirm Rejection</span>
                  </button>
                </>
              )}
            </>
          )}
          {submission.status !== "pending" && (
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
