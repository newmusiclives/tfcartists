"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Mail,
  MessageCircle,
  Upload,
  CheckCircle,
  UserCheck,
  TrendingUp,
  ChevronRight,
  Clock,
  AlertCircle,
  Users,
  Target,
  Phone,
  Instagram,
  ExternalLink,
  ArrowRight,
  X,
  Zap,
} from "lucide-react";

type PipelineStage = "discovered" | "contacted" | "responded" | "invited" | "submitted" | "approved" | "activated";

interface Artist {
  id: number;
  name: string;
  genre: string;
  location: string;
  stage: PipelineStage;
  assignedTo: string;
  discoverySource: string;
  email?: string;
  phone?: string;
  socialHandle?: string;
  website?: string;
  daysInStage: number;
  nextAction: string;
  priority: "high" | "medium" | "low";
  notes?: string;
  trackName?: string;
  submittedDate?: string;
}

export default function PipelinePage() {
  const [selectedStage, setSelectedStage] = useState<PipelineStage | "all">("all");
  const [selectedPriority, setSelectedPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const handleViewAllStages = () => {
    setSelectedStage("all");
    setSelectedPriority("all");
  };

  // Mock pipeline data with full details
  const [artists, setArtists] = useState<Artist[]>([
    {
      id: 1,
      name: "Sarah Martinez",
      genre: "Indie Folk",
      location: "Burlington, VT",
      stage: "discovered",
      assignedTo: "Grace Holland",
      discoverySource: "Instagram",
      email: "sarah@example.com",
      socialHandle: "@sarahmartinezmusic",
      daysInStage: 1,
      nextAction: "Send initial outreach email",
      priority: "high",
      notes: "Strong Instagram presence (2,400 followers). Recent show at Higher Ground. Very engaged with local music scene.",
    },
    {
      id: 2,
      name: "The Wanderers",
      genre: "Americana",
      location: "Montpelier, VT",
      stage: "contacted",
      assignedTo: "Grace Holland",
      discoverySource: "Venue",
      email: "band@thewanderers.com",
      phone: "(802) 555-0123",
      website: "thewanderers.com",
      daysInStage: 3,
      nextAction: "Follow up on initial email",
      priority: "medium",
      notes: "Contacted via email on Jan 18. No response yet. Follow up scheduled for Jan 22. Band has great live energy.",
    },
    {
      id: 3,
      name: "Jake Rivers",
      genre: "Country/Rock",
      location: "St. Johnsbury, VT",
      stage: "responded",
      assignedTo: "Grace Holland",
      discoverySource: "Spotify",
      email: "jake.rivers@example.com",
      socialHandle: "@jakerivers",
      daysInStage: 2,
      nextAction: "Send track submission invitation",
      priority: "high",
      notes: "Very interested! Responded within 2 hours. Ready to submit track. Has 1,850 Spotify followers.",
    },
    {
      id: 4,
      name: "Emma Stone & The Pebbles",
      genre: "Rock",
      location: "Brattleboro, VT",
      stage: "invited",
      assignedTo: "Grace Holland",
      discoverySource: "Referral",
      email: "emma@stoneandpebbles.com",
      phone: "(802) 555-0199",
      daysInStage: 5,
      nextAction: "Send reminder to submit track",
      priority: "medium",
      notes: "Referred by John Smith. Sent submission invite on Jan 17. Following up this week.",
    },
    {
      id: 5,
      name: "Chris Taylor",
      genre: "Blues",
      location: "Rutland, VT",
      stage: "submitted",
      assignedTo: "Sienna Park",
      discoverySource: "Instagram",
      email: "chris@example.com",
      trackName: "Midnight Highway",
      submittedDate: "Jan 20, 2024",
      daysInStage: 1,
      nextAction: "Quality review in progress",
      priority: "high",
      notes: "Submitted 'Midnight Highway'. Excellent audio quality (320kbps MP3). Fast response time. Very professional.",
    },
    {
      id: 6,
      name: "Maya Santos",
      genre: "Latin Pop",
      location: "Burlington, VT",
      stage: "submitted",
      assignedTo: "Sienna Park",
      discoverySource: "Instagram",
      email: "maya@example.com",
      trackName: "Desert Moon",
      submittedDate: "Jan 19, 2024",
      daysInStage: 2,
      nextAction: "Quality review in progress",
      priority: "medium",
      notes: "Submitted 'Desert Moon'. Good audio quality. Under quality review by Sienna.",
    },
    {
      id: 7,
      name: "Alex Turner",
      genre: "Alternative",
      location: "Montpelier, VT",
      stage: "approved",
      assignedTo: "Marcus Tate",
      discoverySource: "Spotify",
      email: "alex@example.com",
      trackName: "Fading Light",
      daysInStage: 1,
      nextAction: "Activate FREE tier account",
      priority: "high",
      notes: "Track 'Fading Light' approved! Setting up station account and scheduling first plays. Great production quality.",
    },
    {
      id: 8,
      name: "Lisa Chen",
      genre: "Indie Rock",
      location: "Burlington, VT",
      stage: "activated",
      assignedTo: "Marcus Tate",
      discoverySource: "Venue",
      email: "lisa@example.com",
      trackName: "Electric Dreams",
      daysInStage: 7,
      nextAction: "Monitor performance for upgrade opportunity",
      priority: "low",
      notes: "Active on FREE tier. Getting 15 plays/month (above 10 minimum). Strong engagement. Potential upgrade candidate soon.",
    },
  ]);

  const pipelineStages = [
    { key: "discovered" as const, label: "Discovered", count: artists.filter(a => a.stage === "discovered").length, color: "gray", assignedTo: "Grace" },
    { key: "contacted" as const, label: "Contacted", count: artists.filter(a => a.stage === "contacted").length, color: "blue", assignedTo: "Grace" },
    { key: "responded" as const, label: "Responded", count: artists.filter(a => a.stage === "responded").length, color: "indigo", assignedTo: "Grace" },
    { key: "invited" as const, label: "Invited", count: artists.filter(a => a.stage === "invited").length, color: "purple", assignedTo: "Grace" },
    { key: "submitted" as const, label: "Submitted", count: artists.filter(a => a.stage === "submitted").length, color: "yellow", assignedTo: "Sienna" },
    { key: "approved" as const, label: "Approved", count: artists.filter(a => a.stage === "approved").length, color: "green", assignedTo: "Marcus" },
    { key: "activated" as const, label: "Activated", count: artists.filter(a => a.stage === "activated").length, color: "emerald", assignedTo: "Jordan" },
  ];

  const stats = {
    totalInPipeline: artists.length,
    highPriority: artists.filter(a => a.priority === "high").length,
    needsAction: artists.filter(a => a.daysInStage > 3).length,
    conversionRate: Math.round((artists.filter(a => a.stage === "activated").length / artists.length) * 100),
  };

  const filteredArtists = artists.filter(artist => {
    const matchesStage = selectedStage === "all" || artist.stage === selectedStage;
    const matchesPriority = selectedPriority === "all" || artist.priority === selectedPriority;
    return matchesStage && matchesPriority;
  });

  const moveArtistToStage = (artistId: number, newStage: PipelineStage) => {
    setArtists(artists.map(a =>
      a.id === artistId
        ? {
            ...a,
            stage: newStage,
            daysInStage: 0,
            assignedTo: getAssignedTo(newStage)
          }
        : a
    ));
    setShowActionModal(false);
    setSelectedArtist(null);
  };

  const getAssignedTo = (stage: PipelineStage): string => {
    if (["discovered", "contacted", "responded", "invited"].includes(stage)) return "Grace Holland";
    if (stage === "submitted") return "Sienna Park";
    if (stage === "approved" || stage === "activated") return "Marcus Tate";
    return "Jordan Cross";
  };

  const getStageColor = (stage: PipelineStage) => {
    const colors = {
      discovered: "bg-gray-100 text-gray-700 border-gray-300",
      contacted: "bg-blue-100 text-blue-700 border-blue-300",
      responded: "bg-indigo-100 text-indigo-700 border-indigo-300",
      invited: "bg-purple-100 text-purple-700 border-purple-300",
      submitted: "bg-yellow-100 text-yellow-700 border-yellow-300",
      approved: "bg-green-100 text-green-700 border-green-300",
      activated: "bg-emerald-100 text-emerald-700 border-emerald-300",
    };
    return colors[stage];
  };

  const getStageIcon = (stage: PipelineStage) => {
    const icons = {
      discovered: <Search className="w-4 h-4" />,
      contacted: <Mail className="w-4 h-4" />,
      responded: <MessageCircle className="w-4 h-4" />,
      invited: <Upload className="w-4 h-4" />,
      submitted: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      activated: <UserCheck className="w-4 h-4" />,
    };
    return icons[stage];
  };

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    const colors = {
      high: "bg-red-100 text-red-700 border-red-300",
      medium: "bg-orange-100 text-orange-700 border-orange-300",
      low: "bg-gray-100 text-gray-600 border-gray-300",
    };
    return colors[priority];
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/riley" className="text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Artist Pipeline</h1>
                <p className="text-sm text-gray-600">Complete journey from discovery to activation</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/riley/workflows"
                className="inline-flex items-center space-x-2 border border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium"
              >
                <Zap className="w-4 h-4" />
                <span>Workflows</span>
              </Link>
              <Link
                href="/riley/outreach"
                className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <span>Outreach Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6 text-purple-600" />}
            label="Total in Pipeline"
            value={stats.totalInPipeline}
            color="purple"
          />
          <StatCard
            icon={<Target className="w-6 h-6 text-red-600" />}
            label="High Priority"
            value={stats.highPriority}
            color="red"
          />
          <StatCard
            icon={<AlertCircle className="w-6 h-6 text-orange-600" />}
            label="Needs Action"
            value={stats.needsAction}
            color="orange"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            label="Conversion Rate"
            value={`${stats.conversionRate}%`}
            color="green"
          />
        </div>

        {/* Pipeline Stages */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Pipeline Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {pipelineStages.map((stage, idx) => (
              <button
                key={stage.key}
                type="button"
                onClick={() => setSelectedStage(stage.key)}
                className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedStage === stage.key
                    ? "border-purple-500 bg-purple-100 shadow-lg ring-2 ring-purple-200"
                    : "border-gray-200 hover:border-purple-300 hover:shadow-md hover:bg-purple-50"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stage.count}</div>
                  <div className="text-xs font-medium text-gray-600 mb-2">{stage.label}</div>
                  <div className="text-xs text-gray-500">{stage.assignedTo}</div>
                </div>
                {idx < pipelineStages.length - 1 && (
                  <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 text-gray-400 hidden lg:block" />
                )}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={handleViewAllStages}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer hover:scale-105 ${
                selectedStage === "all"
                  ? "bg-purple-600 text-white shadow-lg ring-2 ring-purple-300"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200 hover:shadow-md"
              }`}
            >
              {selectedStage === "all" ? "✓ Viewing All Stages" : "View All Stages"} ({artists.length} artists)
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-gray-900">
                {selectedStage === "all" ? "All Artists" : `${selectedStage.charAt(0).toUpperCase() + selectedStage.slice(1)} Stage`}
                {" "}({filteredArtists.length})
              </h3>
              {selectedStage !== "all" && (
                <button
                  type="button"
                  onClick={handleViewAllStages}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium underline"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as any)}
                className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Artist Cards */}
          <div className="space-y-4">
            {filteredArtists.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No artists found in this stage.</p>
              </div>
            ) : (
              filteredArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="border-2 rounded-lg p-4 hover:border-purple-300 transition-all hover:shadow-md cursor-pointer"
                  onClick={() => setSelectedArtist(artist)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{artist.name}</h4>
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStageColor(artist.stage)}`}>
                          {getStageIcon(artist.stage)}
                          <span>{artist.stage.charAt(0).toUpperCase() + artist.stage.slice(1)}</span>
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(artist.priority)}`}>
                          {artist.priority.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Genre:</span> {artist.genre}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {artist.location}
                        </div>
                        <div>
                          <span className="font-medium">Source:</span> {artist.discoverySource}
                        </div>
                        <div className={artist.daysInStage > 3 ? "text-orange-600 font-semibold" : ""}>
                          <span className="font-medium">Days in Stage:</span> {artist.daysInStage}
                        </div>
                      </div>

                      {artist.trackName && (
                        <div className="bg-purple-50 rounded px-3 py-2 mb-3 text-sm">
                          <span className="font-medium text-purple-900">Track:</span>{" "}
                          <span className="text-purple-700">{artist.trackName}</span>
                          {artist.submittedDate && (
                            <span className="text-purple-600 ml-2">• Submitted {artist.submittedDate}</span>
                          )}
                        </div>
                      )}

                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <div className="flex items-start space-x-2">
                          <Target className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-xs font-medium text-blue-900 mb-1">Next Action</div>
                            <div className="text-sm text-blue-800">{artist.nextAction}</div>
                            <div className="text-xs text-blue-600 mt-1">Assigned to: {artist.assignedTo}</div>
                          </div>
                        </div>
                      </div>

                      {artist.notes && (
                        <div className="text-sm text-gray-600 italic bg-gray-50 rounded px-3 py-2">
                          <span className="font-medium not-italic">Notes:</span> {artist.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {artist.email && (
                        <a
                          href={`mailto:${artist.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {artist.phone && (
                        <a
                          href={`tel:${artist.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      {artist.socialHandle && (
                        <a
                          href={`https://instagram.com/${artist.socialHandle.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-colors"
                          title="View Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArtist(artist);
                          setShowActionModal(true);
                        }}
                        className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                        title="Move Stage"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ActionCard
            title="Grace's Outreach"
            count={artists.filter(a => ["discovered", "contacted", "responded", "invited"].includes(a.stage)).length}
            description="Artists in discovery & outreach"
            href="/riley/outreach"
            color="indigo"
          />
          <ActionCard
            title="Sienna's Queue"
            count={artists.filter(a => a.stage === "submitted").length}
            description="Tracks awaiting review"
            href="/riley/submissions"
            color="green"
          />
          <ActionCard
            title="Marcus's Roster"
            count={artists.filter(a => ["approved", "activated"].includes(a.stage)).length}
            description="Active artists to manage"
            href="/riley/artists"
            color="blue"
          />
          <ActionCard
            title="Jordan's Payments"
            count={artists.filter(a => a.stage === "activated").length}
            description="Artists eligible for payouts"
            href="/riley/pool-calculator"
            color="emerald"
          />
        </div>
      </div>

      {/* Artist Detail Modal */}
      {selectedArtist && !showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedArtist(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-6 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedArtist.name}</h2>
                  <p className="text-gray-600">{selectedArtist.genre} • {selectedArtist.location}</p>
                </div>
                <button onClick={() => setSelectedArtist(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Current Status</h3>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border-2 ${getStageColor(selectedArtist.stage)}`}>
                    {getStageIcon(selectedArtist.stage)}
                    <span className="font-medium">{selectedArtist.stage.charAt(0).toUpperCase() + selectedArtist.stage.slice(1)}</span>
                  </span>
                  <span className={`px-4 py-2 rounded-lg border-2 ${getPriorityColor(selectedArtist.priority)}`}>
                    {selectedArtist.priority.toUpperCase()} Priority
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  {selectedArtist.email && (
                    <a href={`mailto:${selectedArtist.email}`} className="flex items-center space-x-3 text-blue-600 hover:underline">
                      <Mail className="w-4 h-4" />
                      <span>{selectedArtist.email}</span>
                    </a>
                  )}
                  {selectedArtist.phone && (
                    <a href={`tel:${selectedArtist.phone}`} className="flex items-center space-x-3 text-green-600 hover:underline">
                      <Phone className="w-4 h-4" />
                      <span>{selectedArtist.phone}</span>
                    </a>
                  )}
                  {selectedArtist.socialHandle && (
                    <a
                      href={`https://instagram.com/${selectedArtist.socialHandle.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 text-pink-600 hover:underline"
                    >
                      <Instagram className="w-4 h-4" />
                      <span>{selectedArtist.socialHandle}</span>
                    </a>
                  )}
                  {selectedArtist.website && (
                    <a
                      href={selectedArtist.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 text-purple-600 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{selectedArtist.website}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Discovery Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Discovery Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Source:</span>
                    <div className="font-medium">{selectedArtist.discoverySource}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Days in Stage:</span>
                    <div className="font-medium">{selectedArtist.daysInStage} days</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Assigned To:</span>
                    <div className="font-medium">{selectedArtist.assignedTo}</div>
                  </div>
                  {selectedArtist.submittedDate && (
                    <div>
                      <span className="text-gray-600">Submitted:</span>
                      <div className="font-medium">{selectedArtist.submittedDate}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Track Info */}
              {selectedArtist.trackName && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Track Information</h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="font-medium text-purple-900">{selectedArtist.trackName}</div>
                    {selectedArtist.submittedDate && (
                      <div className="text-sm text-purple-700 mt-1">Submitted on {selectedArtist.submittedDate}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Next Action */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Next Action</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900">{selectedArtist.nextAction}</div>
                      <div className="text-sm text-blue-700 mt-1">Assigned to: {selectedArtist.assignedTo}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedArtist.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                    {selectedArtist.notes}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowActionModal(true)}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Move to Next Stage
                </button>
                <button
                  onClick={() => setSelectedArtist(null)}
                  className="flex-1 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Stage Modal */}
      {selectedArtist && showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowActionModal(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-6">
              <h2 className="text-xl font-bold text-gray-900">Move Artist to Next Stage</h2>
              <p className="text-sm text-gray-600 mt-1">Choose the next pipeline stage for {selectedArtist.name}</p>
            </div>

            <div className="p-6 space-y-3">
              {pipelineStages.map((stage) => (
                <button
                  key={stage.key}
                  onClick={() => moveArtistToStage(selectedArtist.id, stage.key)}
                  disabled={stage.key === selectedArtist.stage}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    stage.key === selectedArtist.stage
                      ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                      : "border-gray-200 hover:border-purple-400 hover:bg-purple-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${stage.key === selectedArtist.stage ? "bg-gray-200 text-gray-500" : "bg-purple-100 text-purple-600"}`}>
                        {getStageIcon(stage.key)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{stage.label}</div>
                        <div className="text-sm text-gray-600">{stage.assignedTo}</div>
                      </div>
                    </div>
                    {stage.key === selectedArtist.stage && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Current</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t p-6">
              <button
                onClick={() => setShowActionModal(false)}
                className="w-full border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: "bg-purple-50",
    red: "bg-red-50",
    orange: "bg-orange-50",
    green: "bg-green-50",
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-6 border-2 border-transparent hover:border-purple-300 transition-all`}>
      <div className="flex items-center space-x-3 mb-2">
        {icon}
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function ActionCard({
  title,
  count,
  description,
  href,
  color,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-300 hover:bg-indigo-200",
    green: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200",
    blue: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200",
  };

  return (
    <Link href={href} className={`block p-6 rounded-xl border-2 ${colorClasses[color]} transition-all hover:shadow-lg`}>
      <div className="text-4xl font-bold mb-2">{count}</div>
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-sm opacity-80">{description}</div>
      <div className="mt-3 inline-flex items-center space-x-1 text-sm font-medium">
        <span>View Dashboard</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
}
