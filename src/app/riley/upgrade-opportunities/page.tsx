"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, User, Mail, MessageCircle, CheckCircle } from "lucide-react";
import { AIRPLAY_TIER_PRICING, AIRPLAY_TIER_SHARES, AIRPLAY_TIER_PLAYS_PER_MONTH } from "@/lib/calculations/station-capacity";

interface OpportunityItem {
  id: string;
  artist: string;
  email: string;
  currentTier: string;
  suggestedTier: string;
  currentPlays: number;
  targetPlays: number;
  engagement: string;
  tracksSubmitted: number;
  monthsSinceJoin: number;
  reason: string;
  estimatedROI: string;
  contacted: boolean;
}

export default function UpgradeOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);
  const [filter, setFilter] = useState<"all" | "contacted" | "not_contacted">("all");

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const [freeRes, tierRes] = await Promise.all([
          fetch("/api/artists?tier=FREE&sortBy=engagementRate&sortOrder=desc&limit=10"),
          fetch("/api/artists?tier=TIER_5&sortBy=engagementRate&sortOrder=desc&limit=10"),
        ]);

        const freeData = freeRes.ok ? await freeRes.json() : { artists: [] };
        const tierData = tierRes.ok ? await tierRes.json() : { artists: [] };

        const tierNameMap: Record<string, string> = {
          FREE: "FREE",
          TIER_5: "BRONZE",
          TIER_20: "SILVER",
          TIER_50: "GOLD",
          TIER_120: "PLATINUM",
        };

        const nextTierMap: Record<string, string> = {
          FREE: "BRONZE",
          BRONZE: "SILVER",
          SILVER: "GOLD",
          GOLD: "PLATINUM",
        };

        const tierPriceMap: Record<string, number> = {
          FREE: 0, BRONZE: 5, SILVER: 20, GOLD: 50, PLATINUM: 120,
        };

        const allArtists = [...(freeData.artists || []), ...(tierData.artists || [])];

        const mapped: OpportunityItem[] = allArtists.map((a: any) => {
          const currentTier = tierNameMap[a.airplayTier] || "FREE";
          const suggestedTier = nextTierMap[currentTier] || "BRONZE";
          const engRate = a.engagementRate || 0;
          const engagement = engRate > 5 ? "high" : engRate > 2 ? "medium" : "low";
          const monthsSinceJoin = a.createdAt
            ? Math.max(1, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))
            : 1;
          const suggestedPrice = tierPriceMap[suggestedTier] || 5;
          const currentPrice = tierPriceMap[currentTier] || 0;

          return {
            id: a.id,
            artist: a.name || "Unknown",
            email: a.email || "",
            currentTier,
            suggestedTier,
            currentPlays: a.conversationCount || 0,
            targetPlays: a.airplayShares || 1,
            engagement,
            tracksSubmitted: a._count?.conversations || 0,
            monthsSinceJoin,
            reason: `${engagement === "high" ? "High" : "Growing"} engagement with ${engRate.toFixed(1)}% rate. Potential upgrade candidate.`,
            estimatedROI: `+$${(suggestedPrice * 0.97).toFixed(2)}/month from pool shares for $${suggestedPrice}/month cost`,
            contacted: a.lastContactedAt != null,
          };
        });

        setOpportunities(mapped);
      } catch (err) {
        console.error("Error fetching upgrade opportunities:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOpportunities();
  }, []);

  const filteredOpportunities = opportunities.filter(opp => {
    if (filter === "all") return true;
    if (filter === "contacted") return opp.contacted;
    if (filter === "not_contacted") return !opp.contacted;
    return true;
  });

  const stats = {
    total: opportunities.length,
    contacted: opportunities.filter(o => o.contacted).length,
    notContacted: opportunities.filter(o => !o.contacted).length,
    potentialRevenue: opportunities
      .filter(o => !o.contacted)
      .reduce((sum, o) => sum + (AIRPLAY_TIER_PRICING[o.suggestedTier as keyof typeof AIRPLAY_TIER_PRICING] - AIRPLAY_TIER_PRICING[o.currentTier as keyof typeof AIRPLAY_TIER_PRICING]), 0),
  };

  const handleContact = (id: string) => {
    setOpportunities(prev => prev.map(o =>
      o.id === id ? { ...o, contacted: true } : o
    ));
    setSelectedOpportunity(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading upgrade opportunities...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tier Upgrade Opportunities</h1>
              <p className="text-gray-600">
                Artists showing high engagement who might upgrade - Managed by Riley AI
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
            label="Total Opportunities"
            value={stats.total}
            subtitle="Identified candidates"
          />
          <StatCard
            icon={<MessageCircle className="w-6 h-6 text-green-600" />}
            label="Contacted"
            value={stats.contacted}
            subtitle="Outreach sent"
          />
          <StatCard
            icon={<Mail className="w-6 h-6 text-orange-600" />}
            label="Pending Outreach"
            value={stats.notContacted}
            subtitle="Not yet contacted"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            label="Potential Revenue"
            value={`$${stats.potentialRevenue}`}
            subtitle="Monthly if all upgrade"
          />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex space-x-2 mb-6">
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="All Opportunities"
              count={opportunities.length}
            />
            <FilterButton
              active={filter === "not_contacted"}
              onClick={() => setFilter("not_contacted")}
              label="Pending Outreach"
              count={stats.notContacted}
            />
            <FilterButton
              active={filter === "contacted"}
              onClick={() => setFilter("contacted")}
              label="Contacted"
              count={stats.contacted}
            />
          </div>

          {/* Opportunities List */}
          <div className="space-y-3">
            {filteredOpportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onSelect={setSelectedOpportunity}
              />
            ))}
            {filteredOpportunities.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No opportunities found
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Strategy */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Upgrade Strategy</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Identification Criteria</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Current plays exceeding tier allocation by 2x or more</li>
                <li>High engagement scores from listener analytics</li>
                <li>Multiple quality track submissions</li>
                <li>Active for 1+ months on current tier</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Outreach Approach</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Personalized email highlighting their strong performance</li>
                <li>Show specific data: current vs potential plays</li>
                <li>Emphasize pool share earnings potential</li>
                <li>Offer 1-month trial discount for first upgrade (optional)</li>
                <li>Include success stories from similar upgrades</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Conversion Goals</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Target: 60% of FREE artists upgrade within 90 days</li>
                <li>15% quarterly upgrade rate across all tiers</li>
                <li>Average time to first upgrade: 45 days</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Team Member Info */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-purple-100 rounded-full p-3">
              <User className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Riley Carpenter</h3>
              <p className="text-sm text-gray-600 mb-3">AI Sales Director</p>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>Responsibilities:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Identify artists ready for tier upgrades</li>
                  <li>Send personalized upgrade pitches</li>
                  <li>Track conversion rates and optimize messaging</li>
                  <li>Manage upgrade campaign sequences</li>
                  <li>Report on revenue growth from upgrades</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <OpportunityModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onContact={handleContact}
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

function FilterButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function OpportunityCard({ opportunity, onSelect }: { opportunity: OpportunityItem; onSelect: (o: OpportunityItem) => void }) {
  const currentPrice = AIRPLAY_TIER_PRICING[opportunity.currentTier as keyof typeof AIRPLAY_TIER_PRICING];
  const suggestedPrice = AIRPLAY_TIER_PRICING[opportunity.suggestedTier as keyof typeof AIRPLAY_TIER_PRICING];
  const priceDiff = suggestedPrice - currentPrice;

  const engagementColors = {
    high: "text-green-600 bg-green-50",
    medium: "text-yellow-600 bg-yellow-50",
    low: "text-gray-600 bg-gray-50",
  };

  return (
    <div className={`bg-white border-2 ${opportunity.contacted ? 'border-green-200' : 'border-blue-200'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="font-semibold text-gray-900 text-lg">{opportunity.artist}</div>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${engagementColors[opportunity.engagement as keyof typeof engagementColors] || engagementColors.low}`}>
              {opportunity.engagement.toUpperCase()} ENGAGEMENT
            </span>
            {opportunity.contacted && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Contacted</span>
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 mb-2">{opportunity.email}</div>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{opportunity.tracksSubmitted} tracks submitted</span>
            <span>{opportunity.monthsSinceJoin} months on platform</span>
            <span>{opportunity.currentPlays} plays vs {opportunity.targetPlays} allocated</span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Current</div>
            <div className="font-bold text-gray-700">{opportunity.currentTier}</div>
            <div className="text-xs text-gray-500">${currentPrice}/mo</div>
          </div>
          <div className="text-gray-400 text-2xl">→</div>
          <div className="text-center">
            <div className="text-xs text-blue-600 mb-1">Suggested</div>
            <div className="font-bold text-blue-600">{opportunity.suggestedTier}</div>
            <div className="text-xs text-blue-600">${suggestedPrice}/mo</div>
          </div>
          <div className="text-center bg-purple-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Revenue Gain</div>
            <div className="text-lg font-bold text-purple-600">+${priceDiff}</div>
            <div className="text-xs text-gray-500">per month</div>
          </div>
          <button
            onClick={() => onSelect(opportunity)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              opportunity.contacted
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {opportunity.contacted ? 'View' : 'Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OpportunityModal({
  opportunity,
  onClose,
  onContact
}: {
  opportunity: OpportunityItem;
  onClose: () => void;
  onContact: (id: string) => void;
}) {
  const currentShares = AIRPLAY_TIER_SHARES[opportunity.currentTier as keyof typeof AIRPLAY_TIER_SHARES];
  const suggestedShares = AIRPLAY_TIER_SHARES[opportunity.suggestedTier as keyof typeof AIRPLAY_TIER_SHARES];
  const currentPlaysAllocation = AIRPLAY_TIER_PLAYS_PER_MONTH[opportunity.currentTier as keyof typeof AIRPLAY_TIER_PLAYS_PER_MONTH];
  const suggestedPlaysAllocation = AIRPLAY_TIER_PLAYS_PER_MONTH[opportunity.suggestedTier as keyof typeof AIRPLAY_TIER_PLAYS_PER_MONTH];

  const emailTemplate = `Hi ${opportunity.artist},

Great news! Your music has been performing exceptionally well on North Country Radio.

📊 Your Current Stats:
• Current Tier: ${opportunity.currentTier} (${currentPlaysAllocation} plays/month)
• Actual Plays: ${opportunity.currentPlays} plays this month
• You're getting ${Math.round((opportunity.currentPlays / currentPlaysAllocation) * 100)}% more plays than your tier allocation!

🎯 Upgrade Opportunity:
Based on your strong listener engagement, we recommend upgrading to ${opportunity.suggestedTier} tier:
• ${suggestedPlaysAllocation} guaranteed plays/month
• ${suggestedShares} pool shares (vs ${currentShares} currently)
• ${opportunity.estimatedROI}

${opportunity.reason}

Ready to level up? Reply to this email or click here to upgrade.

Best,
Riley Carpenter
TrueFans RADIO™ Network`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Upgrade Opportunity</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Artist Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Artist Details</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold ml-2">{opportunity.artist}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2">{opportunity.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">Engagement:</span>
                  <span className="font-semibold ml-2">{opportunity.engagement.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Time on Platform:</span>
                  <span className="ml-2">{opportunity.monthsSinceJoin} months</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Performance Analysis</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{opportunity.currentPlays}</div>
                <div className="text-xs text-gray-600">Actual Plays</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{currentPlaysAllocation}</div>
                <div className="text-xs text-gray-600">Current Allocation</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{opportunity.tracksSubmitted}</div>
                <div className="text-xs text-gray-600">Tracks Submitted</div>
              </div>
            </div>
          </div>

          {/* Upgrade Comparison */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Upgrade Comparison</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-center mb-3">
                  <div className="text-lg font-bold text-gray-700">{opportunity.currentTier}</div>
                  <div className="text-sm text-gray-500">Current Tier</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold">${AIRPLAY_TIER_PRICING[opportunity.currentTier as keyof typeof AIRPLAY_TIER_PRICING]}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plays:</span>
                    <span className="font-semibold">{currentPlaysAllocation}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shares:</span>
                    <span className="font-semibold">{currentShares}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
                <div className="text-center mb-3">
                  <div className="text-lg font-bold text-blue-600">{opportunity.suggestedTier}</div>
                  <div className="text-sm text-blue-600">Recommended Tier</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-blue-600">${AIRPLAY_TIER_PRICING[opportunity.suggestedTier as keyof typeof AIRPLAY_TIER_PRICING]}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plays:</span>
                    <span className="font-semibold text-blue-600">{suggestedPlaysAllocation}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shares:</span>
                    <span className="font-semibold text-blue-600">{suggestedShares}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Why This Upgrade?</h3>
            <p className="text-gray-700 text-sm">{opportunity.reason}</p>
            <p className="text-gray-700 text-sm mt-2"><strong>ROI:</strong> {opportunity.estimatedROI}</p>
          </div>

          {/* Email Template */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Outreach Email Template</h3>
            <textarea
              value={emailTemplate}
              readOnly
              className="w-full p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50"
              rows={15}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 sticky bottom-0 flex items-center justify-end space-x-3">
          {!opportunity.contacted && (
            <>
              <button
                onClick={onClose}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => onContact(opportunity.id)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Mail className="w-5 h-5" />
                <span>Send Upgrade Pitch</span>
              </button>
            </>
          )}
          {opportunity.contacted && (
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
