"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone, TrendingUp, Users, DollarSign, Calendar, Target, Zap } from "lucide-react";

interface CampaignData {
  id: string;
  name: string;
  type: string;
  status: string;
  targetAudience: string;
  channel: string;
  managedBy: string;
  goalType: string;
  goalTarget: number;
  goalReached: number;
  startDate: string;
  endDate: string | null;
  metrics: {
    totalResponses: number;
    conversions: number;
    conversionRate: number;
    progress: number;
  };
}

export default function GrowthCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "viral_push",
    targetAudience: "new_listeners",
    goalType: "listeners",
    goalTarget: 100,
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/elliot/campaigns?status=all");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLaunchCampaign(e: React.FormEvent) {
    e.preventDefault();
    setLaunching(true);
    try {
      const res = await fetch("/api/elliot/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: "", type: "viral_push", targetAudience: "new_listeners", goalType: "listeners", goalTarget: 100 });
        await fetchCampaigns();
      }
    } catch (error) {
      console.error("Error launching campaign:", error);
    } finally {
      setLaunching(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading campaigns...</div>
      </main>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const completedCampaigns = campaigns.filter((c) => c.status === "completed");
  const totalConversions = campaigns.reduce((sum, c) => sum + (c.metrics?.conversions || 0), 0);
  const totalResponses = campaigns.reduce((sum, c) => sum + (c.metrics?.totalResponses || 0), 0);
  const avgConversionRate = totalResponses > 0 ? Math.round((totalConversions / totalResponses) * 100 * 10) / 10 : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/elliot"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Elliot Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <Megaphone className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Growth Campaigns</h1>
              <p className="text-gray-600">
                Plan, launch, and optimize listener acquisition campaigns
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Zap className="w-6 h-6 text-purple-600" />}
            label="Active Campaigns"
            value={activeCampaigns.length}
            subtitle="running now"
          />
          <MetricCard
            icon={<Target className="w-6 h-6 text-green-600" />}
            label="Total Campaigns"
            value={campaigns.length}
            subtitle={`${completedCampaigns.length} completed`}
          />
          <MetricCard
            icon={<Users className="w-6 h-6 text-blue-600" />}
            label="Total Conversions"
            value={totalConversions}
            subtitle="from campaign responses"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
            label="Conversion Rate"
            value={`${avgConversionRate}%`}
            subtitle={`${totalResponses} total responses`}
          />
        </section>

        {/* Campaign Launch Form */}
        {showForm && (
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Launch New Campaign</h2>
            <form onSubmit={handleLaunchCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Summer Listening Challenge"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="artist_referral">Artist Referral</option>
                    <option value="viral_push">Viral Push</option>
                    <option value="habit_builder">Habit Builder</option>
                    <option value="community_event">Community Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="new_listeners">New Listeners</option>
                    <option value="at_risk">At Risk</option>
                    <option value="power_users">Power Users</option>
                    <option value="all">All Listeners</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
                  <select
                    value={formData.goalType}
                    onChange={(e) => setFormData({ ...formData, goalType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="listeners">New Listeners</option>
                    <option value="sessions">Sessions</option>
                    <option value="retention">Retention</option>
                    <option value="virality">Virality</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Target</label>
                  <input
                    type="number"
                    value={formData.goalTarget}
                    onChange={(e) => setFormData({ ...formData, goalTarget: parseInt(e.target.value) || 0 })}
                    required
                    min={1}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={launching || !formData.name}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {launching ? "Launching..." : "Launch Campaign"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-600 hover:text-gray-900 px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Active Campaigns */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Active Campaigns</h2>
              <p className="text-gray-600 text-sm mt-1">
                Currently running growth initiatives
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create New Campaign
              </button>
            )}
          </div>

          <div className="space-y-4">
            {activeCampaigns.length > 0 ? (
              activeCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No active campaigns. Launch your first campaign to get started.
              </div>
            )}
          </div>
        </section>

        {/* Completed Campaigns */}
        {completedCampaigns.length > 0 && (
          <section className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Completed Campaigns</h2>
            <div className="space-y-4">
              {completedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            icon={<Target className="w-8 h-8 text-purple-600" />}
            title="A/B Test Creator"
            description="Test different campaign variants"
            buttonText="Create Test"
          />
          <ActionCard
            icon={<TrendingUp className="w-8 h-8 text-green-600" />}
            title="Campaign Analytics"
            description="Deep dive into performance data"
            buttonText="View Analytics"
          />
          <ActionCard
            icon={<Calendar className="w-8 h-8 text-blue-600" />}
            title="Budget Planner"
            description="Plan quarterly marketing budget"
            buttonText="Plan Budget"
          />
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
}) {
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

function CampaignCard({ campaign }: { campaign: CampaignData }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string; border: string }> = {
    active: { bg: "bg-green-100", text: "text-green-700", label: "Active", border: "border-green-300" },
    paused: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Paused", border: "border-yellow-300" },
    completed: { bg: "bg-gray-100", text: "text-gray-700", label: "Completed", border: "border-gray-300" },
  };
  const config = statusConfig[campaign.status] || statusConfig.active;
  const progress = campaign.metrics?.progress || 0;

  return (
    <div className={`border-2 ${config.border} rounded-lg p-5 bg-white`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">{campaign.name}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.text} font-medium`}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{campaign.type}</span>
            <span>•</span>
            <span>Managed by {campaign.managedBy}</span>
            <span>•</span>
            <span>Target: {campaign.targetAudience}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Responses</div>
          <div className="text-lg font-bold text-gray-900">{campaign.metrics?.totalResponses || 0}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Conversions</div>
          <div className="text-lg font-bold text-green-600">{campaign.metrics?.conversions || 0}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Conv. Rate</div>
          <div className="text-lg font-bold text-purple-600">{(campaign.metrics?.conversionRate || 0).toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Goal</div>
          <div className="text-lg font-bold text-gray-900">{campaign.goalReached}/{campaign.goalTarget}</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Goal Progress: {campaign.goalType}</span>
          <span className="font-semibold text-gray-900">{Math.round(progress)}%</span>
        </div>
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-600 h-full transition-all"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, description, buttonText }: any) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full font-medium">
        {buttonText}
      </button>
    </div>
  );
}
