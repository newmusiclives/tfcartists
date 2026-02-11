"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Mail,
  Phone,
  MessageCircle,
  Plus,
  Filter,
  Users,
  TrendingUp,
  Calendar,
  Send,
  ExternalLink,
  Instagram,
  Music,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

type ContactStatus = "new" | "contacted" | "responded" | "invited" | "submitted" | "upgraded" | "not_interested";
type DiscoverySource = "instagram" | "spotify" | "venue" | "referral" | "website";

interface ArtistLead {
  id: number;
  name: string;
  genre: string;
  location: string;
  source: DiscoverySource;
  socialHandle?: string;
  email?: string;
  phone?: string;
  website?: string;
  followers?: number;
  lastShow?: string;
  status: ContactStatus;
  firstContact?: string;
  lastContact?: string;
  notes?: string;
  nextFollowUp?: string;
}

export default function OutreachPage() {
  const [view, setView] = useState<"discovery" | "campaigns" | "contacts">("discovery");
  const [filterStatus, setFilterStatus] = useState<ContactStatus | "all">("all");
  const [filterSource, setFilterSource] = useState<DiscoverySource | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<ArtistLead | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);

  const [leads, setLeads] = useState<ArtistLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const [discoveredRes, contactedRes] = await Promise.all([
          fetch("/api/artists?status=DISCOVERED&limit=20"),
          fetch("/api/artists?status=CONTACTED&limit=20"),
        ]);

        const discoveredData = discoveredRes.ok ? await discoveredRes.json() : { artists: [] };
        const contactedData = contactedRes.ok ? await contactedRes.json() : { artists: [] };

        const allArtists = [...(discoveredData.artists || []), ...(contactedData.artists || [])];

        const statusMap: Record<string, ContactStatus> = {
          DISCOVERED: "new",
          CONTACTED: "contacted",
          ENGAGED: "responded",
          QUALIFIED: "invited",
          ONBOARDING: "submitted",
          ACTIVATED: "upgraded",
          REJECTED: "not_interested",
        };

        const sourceMap: Record<string, DiscoverySource> = {
          instagram: "instagram",
          tiktok: "instagram",
          spotify: "spotify",
          venue: "venue",
          referral: "referral",
          manual: "website",
          website: "website",
        };

        const mapped: ArtistLead[] = allArtists.map((a: any, index: number) => ({
          id: index + 1,
          name: a.name || "Unknown",
          genre: a.genre || "Unknown",
          location: a.nextShowCity || "",
          source: sourceMap[a.discoverySource] || "website",
          socialHandle: a.sourceHandle || undefined,
          email: a.email || undefined,
          phone: a.phone || undefined,
          website: a.sourceUrl || undefined,
          followers: a.followerCount || undefined,
          lastShow: a.nextShowVenue ? `${a.nextShowVenue}${a.nextShowDate ? ` - ${new Date(a.nextShowDate).toLocaleDateString()}` : ""}` : undefined,
          status: statusMap[a.status] || "new",
          firstContact: a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined,
          lastContact: a.lastContactedAt ? new Date(a.lastContactedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined,
          nextFollowUp: a.nextFollowUpAt ? new Date(a.nextFollowUpAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined,
          notes: a.bio || undefined,
        }));

        setLeads(mapped);
      } catch (err) {
        console.error("Error fetching leads:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const stats = {
    totalLeads: leads.length,
    newLeads: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => ["contacted", "responded", "invited", "submitted", "upgraded"].includes(l.status)).length,
    converted: leads.filter((l) => l.status === "submitted" || l.status === "upgraded").length,
    followUpsToday: leads.filter((l) => l.nextFollowUp === "Jan 20, 2024").length,
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    const matchesSource = filterSource === "all" || lead.source === filterSource;
    const matchesSearch =
      searchQuery === "" ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSource && matchesSearch;
  });

  const getStatusColor = (status: ContactStatus) => {
    const colors = {
      new: "bg-blue-100 text-blue-700",
      contacted: "bg-yellow-100 text-yellow-700",
      responded: "bg-purple-100 text-purple-700",
      invited: "bg-indigo-100 text-indigo-700",
      submitted: "bg-green-100 text-green-700",
      upgraded: "bg-pink-100 text-pink-700",
      not_interested: "bg-gray-100 text-gray-600",
    };
    return colors[status];
  };

  const getStatusIcon = (status: ContactStatus) => {
    const icons = {
      new: <Plus className="w-4 h-4" />,
      contacted: <Mail className="w-4 h-4" />,
      responded: <MessageCircle className="w-4 h-4" />,
      invited: <Send className="w-4 h-4" />,
      submitted: <Music className="w-4 h-4" />,
      upgraded: <TrendingUp className="w-4 h-4" />,
      not_interested: <XCircle className="w-4 h-4" />,
    };
    return icons[status];
  };

  const getStatusLabel = (status: ContactStatus) => {
    const labels = {
      new: "New Lead",
      contacted: "Contacted",
      responded: "Responded",
      invited: "Invited",
      submitted: "Track Submitted",
      upgraded: "Upgraded",
      not_interested: "Not Interested",
    };
    return labels[status];
  };

  const getSourceIcon = (source: DiscoverySource) => {
    const icons = {
      instagram: <Instagram className="w-4 h-4" />,
      spotify: <Music className="w-4 h-4" />,
      venue: <MapPin className="w-4 h-4" />,
      referral: <Users className="w-4 h-4" />,
      website: <ExternalLink className="w-4 h-4" />,
    };
    return icons[source];
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading artist leads...</p>
        </div>
      </main>
    );
  }

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
                <h1 className="text-xl font-bold text-gray-900">Artist Outreach</h1>
                <p className="text-sm text-gray-600">Grace Holland's Discovery & Contact System</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <StatCard icon={<Users className="w-6 h-6 text-purple-600" />} value={stats.totalLeads} label="Total Leads" />
          <StatCard icon={<Plus className="w-6 h-6 text-blue-600" />} value={stats.newLeads} label="New Leads" />
          <StatCard icon={<Mail className="w-6 h-6 text-yellow-600" />} value={stats.contacted} label="Contacted" />
          <StatCard icon={<CheckCircle className="w-6 h-6 text-green-600" />} value={stats.converted} label="Converted" />
          <StatCard icon={<Clock className="w-6 h-6 text-orange-600" />} value={stats.followUpsToday} label="Follow-ups Today" />
        </div>

        {/* View Tabs */}
        <div className="bg-white rounded-t-xl border-b">
          <div className="flex space-x-2 p-2">
            <TabButton active={view === "discovery"} onClick={() => setView("discovery")} label="Artist Discovery" icon={<Search className="w-4 h-4" />} />
            <TabButton active={view === "campaigns"} onClick={() => setView("campaigns")} label="Campaigns" icon={<Send className="w-4 h-4" />} />
            <TabButton active={view === "contacts"} onClick={() => setView("contacts")} label="Contact List" icon={<Users className="w-4 h-4" />} />
          </div>
        </div>

        {/* Discovery View */}
        {view === "discovery" && (
          <div className="bg-white rounded-b-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Discover New Artists</h2>
              <div className="flex items-center space-x-3">
                <Link
                  href="/riley/workflows"
                  className="inline-flex items-center space-x-2 border border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Automated Workflows</span>
                </Link>
                <button
                  onClick={() => setShowNewLeadModal(true)}
                  className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Lead Manually</span>
                </button>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, genre, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ContactStatus | "all")}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="new">New Leads</option>
                <option value="contacted">Contacted</option>
                <option value="responded">Responded</option>
                <option value="invited">Invited</option>
                <option value="submitted">Submitted</option>
                <option value="upgraded">Upgraded</option>
                <option value="not_interested">Not Interested</option>
              </select>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value as DiscoverySource | "all")}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Sources</option>
                <option value="instagram">Instagram</option>
                <option value="spotify">Spotify</option>
                <option value="venue">Venue</option>
                <option value="referral">Referral</option>
                <option value="website">Website</option>
              </select>
            </div>

            {/* Artist Leads Table */}
            <div className="space-y-3">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="border rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {getStatusIcon(lead.status)}
                          <span>{getStatusLabel(lead.status)}</span>
                        </span>
                        <span className="inline-flex items-center space-x-1 text-gray-600 text-sm">
                          {getSourceIcon(lead.source)}
                          <span className="capitalize">{lead.source}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Genre:</span> {lead.genre}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {lead.location}
                        </div>
                        {lead.followers && (
                          <div>
                            <span className="font-medium">Followers:</span> {lead.followers.toLocaleString()}
                          </div>
                        )}
                        {lead.lastShow && (
                          <div>
                            <span className="font-medium">Last Show:</span> {lead.lastShow}
                          </div>
                        )}
                      </div>
                      {lead.nextFollowUp && (
                        <div className="mt-2 inline-flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          <Calendar className="w-4 h-4" />
                          <span>Follow up: {lead.nextFollowUp}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      {lead.socialHandle && (
                        <a
                          href={`https://instagram.com/${lead.socialHandle.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-colors"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredLeads.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No artists found matching your filters.</p>
              </div>
            )}
          </div>
        )}

        {/* Campaigns View */}
        {view === "campaigns" && (
          <div className="bg-white rounded-b-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Outreach Campaigns</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CampaignCard
                title="Initial Artist Outreach"
                description="Introduce TrueFans RADIO and FREE airplay opportunity"
                stats={{ sent: 23, opened: 18, responded: 12 }}
                type="initial"
              />
              <CampaignCard
                title="Track Submission Invitation"
                description="Follow-up with artists who showed interest"
                stats={{ sent: 12, opened: 10, responded: 8 }}
                type="invitation"
              />
              <CampaignCard title="Tier Upgrade Campaign" description="Invite FREE artists to upgrade to paid tiers" stats={{ sent: 15, opened: 11, responded: 5 }} type="upgrade" />
              <CampaignCard
                title="Re-engagement Campaign"
                description="Reconnect with artists who haven't responded"
                stats={{ sent: 8, opened: 4, responded: 2 }}
                type="reengagement"
              />
            </div>
          </div>
        )}

        {/* Contacts View */}
        {view === "contacts" && (
          <div className="bg-white rounded-b-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Contact Management</h2>
              <div className="flex items-center space-x-2">
                <button className="inline-flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artist</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Follow-up</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.genre}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {getStatusIcon(lead.status)}
                          <span>{getStatusLabel(lead.status)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 text-sm text-gray-600 capitalize">
                          {getSourceIcon(lead.source)}
                          <span>{lead.source}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{lead.firstContact || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{lead.lastContact || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{lead.nextFollowUp || "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button onClick={() => setSelectedLead(lead)} className="text-purple-600 hover:text-purple-700 font-medium">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} onUpdate={(updated) => {
        setLeads(leads.map(l => l.id === updated.id ? updated : l));
        setSelectedLead(null);
      }} />}

      {/* New Lead Modal */}
      {showNewLeadModal && <NewLeadModal onClose={() => setShowNewLeadModal(false)} onAdd={(newLead) => {
        setLeads([...leads, { ...newLead, id: leads.length + 1 }]);
        setShowNewLeadModal(false);
      }} />}
    </main>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="flex items-center space-x-3">
        <div>{icon}</div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        active ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function CampaignCard({ title, description, stats, type }: { title: string; description: string; stats: { sent: number; opened: number; responded: number }; type: string }) {
  return (
    <div className="border rounded-xl p-6 hover:border-purple-300 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Send className="w-6 h-6 text-purple-600" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-2xl font-bold text-gray-900">{stats.sent}</div>
          <div className="text-xs text-gray-600">Sent</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">{stats.opened}</div>
          <div className="text-xs text-gray-600">Opened</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">{stats.responded}</div>
          <div className="text-xs text-gray-600">Responded</div>
        </div>
      </div>
      <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">View Campaign</button>
    </div>
  );
}

function LeadDetailModal({ lead, onClose, onUpdate }: { lead: ArtistLead; onClose: () => void; onUpdate: (updated: ArtistLead) => void }) {
  const [activeTab, setActiveTab] = useState<"details" | "communication" | "templates">("details");
  const [notes, setNotes] = useState(lead.notes || "");
  const [status, setStatus] = useState(lead.status);

  const initialOutreachTemplate = `Hi ${lead.name}!

I discovered your music ${lead.source === "instagram" ? "on Instagram" : lead.source === "venue" ? `at ${lead.lastShow}` : `on ${lead.source}`} and absolutely love your ${lead.genre} sound!

I work with TrueFans RADIO - North Country Radio, and we're building a station that gives emerging artists like you FREE airplay to real listeners across Vermont and beyond.

🎵 Here's what we offer:
• FREE radio airplay (no cost to you!)
• Real listeners tuning in 24/7
• Monthly revenue sharing from our sponsor pool
• Professional track rotation alongside other local artists
• Zero upfront investment - just your great music

Would you be interested in getting your music on the radio? It takes just 5 minutes to get started, and your first track could be playing this week.

Let me know if you'd like to learn more!

Best,
Grace Holland
Artist Relations - TrueFans RADIO
grace@truefansradio.com`;

  const trackInvitationTemplate = `Hi ${lead.name}!

Thanks for your interest in TrueFans RADIO!

I'm excited to invite you to submit your first track for airplay. Here's what happens next:

📤 Track Submission:
1. Visit: truefansradio.com/submit
2. Upload your best track (MP3, WAV, or FLAC)
3. Add basic info (track name, release date, genre)
4. Submit for review

✅ What happens next:
• Our quality team reviews within 48 hours
• If approved, your track goes into rotation immediately
• You'll get play stats and listener data
• Monthly revenue sharing from our Artist Pool

🎯 FREE Tier Benefits:
• Minimum 10 plays per month guaranteed
• 1 share in our monthly Artist Pool ($0.97/share = ~$0.97/month)
• Plus you can upgrade anytime for more plays & bigger pool share

Ready to get your music on the radio?

Submit here: truefansradio.com/submit

Let me know if you have any questions!

Best,
Grace`;

  const upgradeTemplate = `Hi ${lead.name}!

I've been watching your performance on TrueFans RADIO and wanted to reach out with some exciting news.

📊 Your Current Stats:
• Tier: FREE (10 plays/month minimum)
• Your music is getting more plays than allocated!
• Listeners are really engaging with your sound

🎯 Upgrade Opportunity - BRONZE Tier ($5/month):
• 40 plays per month (4x more exposure)
• 5 pool shares (5x bigger revenue share = ~$4.85/month)
• Nearly pays for itself from pool earnings alone!
• Priority support and track review

Your music is clearly resonating with our audience. An upgrade would:
1. Get your music in front of 4x more listeners
2. Increase your monthly revenue share
3. Build your fanbase faster

Would you like to upgrade? I can help you get set up today.

Just reply to this email or visit: truefansradio.com/upgrade

Best,
Grace`;

  const handleSave = () => {
    onUpdate({ ...lead, notes, status });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{lead.name}</h2>
              <p className="text-gray-600">
                {lead.genre} • {lead.location}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mt-4">
            <TabButton active={activeTab === "details"} onClick={() => setActiveTab("details")} label="Details" icon={<Users className="w-4 h-4" />} />
            <TabButton active={activeTab === "communication"} onClick={() => setActiveTab("communication")} label="Communication" icon={<MessageCircle className="w-4 h-4" />} />
            <TabButton active={activeTab === "templates"} onClick={() => setActiveTab("templates")} label="Templates" icon={<Mail className="w-4 h-4" />} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                        {lead.email}
                      </a>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  )}
                  {lead.socialHandle && (
                    <div className="flex items-center space-x-2">
                      <Instagram className="w-4 h-4 text-gray-400" />
                      <a href={`https://instagram.com/${lead.socialHandle.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {lead.socialHandle}
                      </a>
                    </div>
                  )}
                  {lead.website && (
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {lead.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Source */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Status & Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as ContactStatus)} className="w-full px-4 py-2 border rounded-lg">
                      <option value="new">New Lead</option>
                      <option value="contacted">Contacted</option>
                      <option value="responded">Responded</option>
                      <option value="invited">Invited</option>
                      <option value="submitted">Track Submitted</option>
                      <option value="upgraded">Upgraded</option>
                      <option value="not_interested">Not Interested</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discovery Source</label>
                    <div className="px-4 py-2 border rounded-lg bg-gray-50 capitalize">{lead.source}</div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {(lead.firstContact || lead.lastContact || lead.nextFollowUp) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    {lead.firstContact && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>First Contact: {lead.firstContact}</span>
                      </div>
                    )}
                    {lead.lastContact && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Last Contact: {lead.lastContact}</span>
                      </div>
                    )}
                    {lead.nextFollowUp && (
                      <div className="flex items-center space-x-2 text-orange-600">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">Next Follow-up: {lead.nextFollowUp}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {(lead.followers || lead.lastShow) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                  <div className="space-y-2 text-sm">
                    {lead.followers && (
                      <div className="text-gray-600">
                        <span className="font-medium">Social Following:</span> {lead.followers.toLocaleString()} followers
                      </div>
                    )}
                    {lead.lastShow && (
                      <div className="text-gray-600">
                        <span className="font-medium">Recent Performance:</span> {lead.lastShow}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add notes about this artist..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                <button onClick={handleSave} className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                  Save Changes
                </button>
                <button onClick={onClose} className="flex-1 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {activeTab === "communication" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-blue-900 mb-1">Quick Actions</div>
                    <div className="space-y-2">
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}?subject=TrueFans RADIO - Get FREE Airplay&body=${encodeURIComponent(initialOutreachTemplate)}`}
                          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mr-2"
                        >
                          Send Initial Outreach
                        </a>
                      )}
                      {lead.email && lead.status === "responded" && (
                        <a
                          href={`mailto:${lead.email}?subject=Submit Your Track - TrueFans RADIO&body=${encodeURIComponent(trackInvitationTemplate)}`}
                          className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium mr-2"
                        >
                          Send Track Invitation
                        </a>
                      )}
                      {lead.email && (lead.status === "submitted" || lead.status === "upgraded") && (
                        <a
                          href={`mailto:${lead.email}?subject=Upgrade Your Airplay - TrueFans RADIO&body=${encodeURIComponent(upgradeTemplate)}`}
                          className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                        >
                          Send Upgrade Pitch
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Communication History</h3>
                <div className="space-y-3">
                  {lead.firstContact && (
                    <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-900">Initial Contact Sent</span>
                        <span className="text-sm text-blue-700">{lead.firstContact}</span>
                      </div>
                      <p className="text-sm text-blue-800">Sent initial outreach email introducing TrueFans RADIO and FREE airplay opportunity.</p>
                    </div>
                  )}
                  {lead.status === "responded" && (
                    <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-green-900">Artist Responded</span>
                        <span className="text-sm text-green-700">{lead.lastContact}</span>
                      </div>
                      <p className="text-sm text-green-800">Artist expressed interest in learning more about the program.</p>
                    </div>
                  )}
                  {lead.status === "invited" && (
                    <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-purple-900">Track Invitation Sent</span>
                        <span className="text-sm text-purple-700">{lead.lastContact}</span>
                      </div>
                      <p className="text-sm text-purple-800">Sent track submission invitation with instructions.</p>
                    </div>
                  )}
                  {lead.status === "submitted" && (
                    <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-indigo-900">Track Submitted</span>
                        <span className="text-sm text-indigo-700">{lead.lastContact}</span>
                      </div>
                      <p className="text-sm text-indigo-800">Artist submitted track for review. Now under quality control review.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "templates" && (
            <div className="space-y-6">
              <EmailTemplate title="Initial Artist Outreach" description="First contact introducing TrueFans RADIO" content={initialOutreachTemplate} email={lead.email} />
              <EmailTemplate title="Track Submission Invitation" description="Follow-up after positive response" content={trackInvitationTemplate} email={lead.email} />
              <EmailTemplate title="Tier Upgrade Pitch" description="Invite to upgrade to paid tier" content={upgradeTemplate} email={lead.email} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmailTemplate({ title, description, content, email }: { title: string; description: string; content: string; email?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={handleCopy} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Mail className="w-4 h-4 text-gray-600" />}
          </button>
          {email && (
            <a
              href={`mailto:${email}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(content)}`}
              className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <Send className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono">{content}</div>
    </div>
  );
}

function NewLeadModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (lead: Omit<ArtistLead, "id">) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    genre: "",
    location: "",
    source: "instagram" as DiscoverySource,
    socialHandle: "",
    email: "",
    phone: "",
    website: "",
    followers: 0,
    lastShow: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      status: "new",
      followers: formData.followers || undefined,
      lastShow: formData.lastShow || undefined,
      socialHandle: formData.socialHandle || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Artist Lead</h2>
              <p className="text-gray-600">Manually add a discovered artist</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Artist Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Genre *</label>
              <input
                type="text"
                required
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discovery Source *</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as DiscoverySource })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="instagram">Instagram</option>
              <option value="spotify">Spotify</option>
              <option value="venue">Venue/Live Show</option>
              <option value="referral">Referral</option>
              <option value="website">Website</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Social Handle</label>
              <input
                type="text"
                placeholder="@username"
                value={formData.socialHandle}
                onChange={(e) => setFormData({ ...formData, socialHandle: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Followers</label>
              <input
                type="number"
                value={formData.followers || ""}
                onChange={(e) => setFormData({ ...formData, followers: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Show</label>
              <input
                type="text"
                placeholder="Venue name - Date"
                value={formData.lastShow}
                onChange={(e) => setFormData({ ...formData, lastShow: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Any additional notes about this artist..."
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button type="submit" className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
              Add Artist Lead
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
