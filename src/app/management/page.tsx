"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  Award,
  Target,
  Radio,
  TrendingUp,
  DollarSign,
  Music,
  Mic,
  Settings,
  Play,
  ChevronDown,
  ChevronRight,
  Zap,
  Shield,
  BarChart3,
  Globe,
  UserCircle,
} from "lucide-react";
import { SharedNav } from "@/components/shared-nav";
import { useStation } from "@/contexts/StationContext";

// --- Management Roles ---
const MANAGEMENT_TEAM = [
  {
    name: "Morgan Reed",
    role: "General Manager (GM)",
    avatar: "MR",
    color: "bg-amber-500/15 text-amber-400",
    focus: "Overall station success",
    kpi: "Revenue + Growth",
  },
  {
    name: "Avery Quinn",
    role: "Operations Director",
    avatar: "AQ",
    color: "bg-orange-500/15 text-orange-400",
    focus: "Day-to-day execution",
    kpi: "Task completion",
  },
  {
    name: "Jordan Blake",
    role: "Strategy Director",
    avatar: "JB",
    color: "bg-red-500/15 text-red-400",
    focus: "Growth & milestones",
    kpi: "Target attainment",
  },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
interface StatsData {
  kpis: any;
  targets: any;
  playbook: Record<string, { phase: number; name: string; team: string; total: number; done: number; progress: number }>;
  playbookOverall: { total: number; completed: number; progress: number };
  priorityActions: any[];
}

interface ActivityItem {
  id: string;
  team: string;
  action: string;
  details: string;
  timestamp: string;
  successful: boolean;
}

export default function ManagementDashboard() {
  const { currentStation } = useStation();
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch live data
  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch(`/api/management/stats?stationId=${currentStation.id}`, { cache: "no-store" }),
          fetch("/api/management/activity?limit=10", { cache: "no-store" }),
        ]);
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (activityRes.ok) {
          const data = await activityRes.json();
          setActivity(data.activity || []);
        }
      } catch {
        // Use empty state
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [currentStation.id]);

  const kpis = stats?.kpis;
  const targets = stats?.targets;
  const playbook = stats?.playbook;
  const playbookOverall = stats?.playbookOverall;
  const priorityActions = stats?.priorityActions || [];

  const overallProgress = playbookOverall?.progress || 0;
  const completedTasks = playbookOverall?.completed || 0;
  const totalTasks = playbookOverall?.total || 0;

  // Playbook phases for display
  const playbookPhases = playbook ? [
    { id: "foundation", teamColor: "amber", teamHref: "/station-admin", ...playbook.foundation },
    { id: "curation", teamColor: "teal", teamHref: "/cassidy", ...playbook.curation },
    { id: "artists", teamColor: "purple", teamHref: "/riley", ...playbook.artists },
    { id: "revenue", teamColor: "green", teamHref: "/harper", ...playbook.revenue },
    { id: "growth", teamColor: "blue", teamHref: "/elliot", ...playbook.growth },
  ] : [];

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "critical": return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500/15 text-red-400">CRITICAL</span>;
      case "high": return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500/15 text-orange-400">HIGH</span>;
      default: return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-500/15 text-yellow-400">MEDIUM</span>;
    }
  };

  const teamColorMap: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", gradient: "from-amber-500 to-orange-500" },
    teal: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/30", gradient: "from-teal-500 to-cyan-500" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", gradient: "from-purple-500 to-pink-500" },
    green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30", gradient: "from-green-500 to-emerald-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", gradient: "from-blue-500 to-cyan-500" },
  };

  const teamColorForName: Record<string, string> = {
    Riley: "purple", Harper: "green", Cassidy: "teal", Elliot: "blue",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
      <SharedNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-800/80 via-orange-900/80 to-red-900/60 text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="w-10 h-10 text-amber-200" />
                <div>
                  <h1 className="text-3xl font-bold">Station Manager</h1>
                  <p className="text-amber-100">
                    {currentStation.name} - Cross-Team Coordination & Playbook
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 mt-4">
                <div>
                  <div className="text-3xl font-bold">{overallProgress}%</div>
                  <div className="text-amber-200 text-sm">Playbook Progress</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{completedTasks}/{totalTasks}</div>
                  <div className="text-amber-200 text-sm">Tasks Complete</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{kpis?.artistCount ?? "—"}</div>
                  <div className="text-amber-200 text-sm">Artists</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{kpis?.listenerCount ?? "—"}</div>
                  <div className="text-amber-200 text-sm">Listeners</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">5</div>
                  <div className="text-amber-200 text-sm">Teams Active</div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/management/launch-plan"
                className="inline-flex items-center space-x-2 bg-white dark:bg-zinc-800 px-4 py-2 rounded-lg text-amber-700 dark:text-amber-400 font-semibold hover:bg-amber-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span>90-Day Launch Plan</span>
              </Link>
              <Link
                href="/management/team"
                className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                <UserCircle className="w-4 h-4" />
                <span>Management Team</span>
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-amber-300 border-t-amber-700 rounded-full mx-auto mb-4" />
            <p className="text-gray-600 dark:text-zinc-400">Loading live station data...</p>
          </div>
        )}

        {/* Management Team Mini Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MANAGEMENT_TEAM.map((member, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-4 flex items-center space-x-4">
              <div className={`w-12 h-12 ${member.color} rounded-lg flex items-center justify-center text-sm font-bold`}>
                {member.avatar}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">{member.name}</div>
                <div className="text-xs text-gray-600 dark:text-zinc-400">{member.role}</div>
                <div className="text-xs text-amber-400 font-medium mt-1">Focus: {member.focus}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Live KPIs */}
        {kpis && targets && (
          <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Live Station KPIs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Monthly Revenue"
                current={`$${kpis.totalRevenue.toLocaleString()}`}
                target={`$${targets.revenue.toLocaleString()}`}
                progress={Math.min(100, Math.round((kpis.totalRevenue / targets.revenue) * 100))}
                color="green"
                team="Harper + Riley"
              />
              <KPICard
                label="Total Artists"
                current={kpis.artistCount.toString()}
                target={targets.artists.toString()}
                progress={Math.min(100, Math.round((kpis.artistCount / targets.artists) * 100))}
                color="purple"
                team="Riley + Cassidy"
              />
              <KPICard
                label="Active Sponsors"
                current={kpis.activeSponsors.toString()}
                target={targets.sponsors.toString()}
                progress={Math.min(100, Math.round((kpis.activeSponsors / targets.sponsors) * 100))}
                color="green"
                team="Harper"
              />
              <KPICard
                label="Listeners"
                current={kpis.listenerCount.toLocaleString()}
                target={targets.listeners.toLocaleString()}
                progress={Math.min(100, Math.round((kpis.listenerCount / targets.listeners) * 100))}
                color="blue"
                team="Elliot"
              />
            </div>
          </section>
        )}

        {/* Team Health Overview */}
        {playbookPhases.length > 0 && (
          <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Team Health & Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {playbookPhases.map((phase) => {
                const colors = teamColorMap[phase.teamColor];
                const healthStatus = phase.progress >= 80 ? "healthy" : phase.progress >= 40 ? "active" : "needs_attention";
                const statusColors = {
                  healthy: "text-green-400 bg-green-500/10",
                  active: "text-blue-400 bg-blue-500/10",
                  needs_attention: "text-orange-400 bg-orange-500/10",
                }[healthStatus];

                return (
                  <Link key={phase.id} href={phase.teamHref} className="block group">
                    <div className={`rounded-lg p-4 border-2 ${colors.border} hover:shadow-md transition-all`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          Phase {phase.phase}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors}`}>
                          {healthStatus === "healthy" ? "Healthy" : healthStatus === "active" ? "Active" : "Needs Work"}
                        </span>
                      </div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">{phase.team}</div>
                      <div className="text-xs text-gray-600 dark:text-zinc-400 mb-3">{phase.name}</div>
                      <div className="bg-zinc-700 rounded-full h-2 overflow-hidden mb-1">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colors.gradient}`}
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-zinc-500 text-right">{phase.done}/{phase.total} done</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Priority Actions - from API */}
        {priorityActions.length > 0 && (
          <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Priority Actions</h2>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                  Auto-generated from live data — actions to keep the station build on track
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-500/10 text-red-400 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="font-medium">{priorityActions.filter((a: any) => a.priority === "critical").length} Critical</span>
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {priorityActions.map((action: any) => {
                const colors = teamColorMap[action.teamColor] || teamColorMap.amber;
                return (
                  <Link key={action.id} href={action.href} className="block group">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-amber-500/30 dark:hover:bg-amber-500/5 transition-all">
                      <div className="flex items-center space-x-4 flex-1">
                        {priorityBadge(action.priority)}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">{action.title}</div>
                          <div className="text-sm text-gray-600 dark:text-zinc-400 mt-0.5">{action.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 ml-4">
                        <div className="text-right">
                          <div className={`text-xs font-bold ${colors.text}`}>Team {action.team}</div>
                          <div className="text-xs text-gray-500 dark:text-zinc-500">{action.dueLabel}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Station Build Progress */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Station Build Playbook</h2>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                5-phase plan to build {currentStation.name} from foundation to full operation
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-1.5">
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{overallProgress}% Overall</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="h-4 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600 dark:text-zinc-400">Overall Station Build Progress</span>
              <span className="font-bold text-gray-900 dark:text-white">{completedTasks} of {totalTasks} tasks</span>
            </div>
          </div>

          {playbookPhases.length > 0 && (
            <div className="space-y-3">
              {playbookPhases.map((phase) => {
                const isExpanded = expandedPhase === phase.id;
                const colors = teamColorMap[phase.teamColor];
                return (
                  <div key={phase.id} className={`border-2 rounded-lg overflow-hidden ${isExpanded ? colors.border : "border-gray-200 dark:border-zinc-700"}`}>
                    <button
                      onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                      className={`w-full flex items-center justify-between p-4 text-left dark:hover:bg-zinc-800 transition-colors ${isExpanded ? colors.bg : ""}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient} text-white flex items-center justify-center font-bold`}>
                          {phase.phase}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{phase.name}</div>
                          <div className="text-sm text-gray-600 dark:text-zinc-400">{phase.team}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{phase.done}/{phase.total}</div>
                        </div>
                        <div className="w-20">
                          <div className="bg-zinc-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${colors.gradient}`}
                              style={{ width: `${phase.progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-zinc-500 text-right mt-0.5">{phase.progress}%</div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t dark:border-zinc-700 px-4 py-3 bg-white dark:bg-zinc-900">
                        <div className="mt-3 pt-3 flex justify-end">
                          <Link
                            href={phase.teamHref}
                            className={`inline-flex items-center space-x-2 text-sm font-medium ${colors.text} hover:underline`}
                          >
                            <span>Go to {phase.team} Dashboard</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Activity Feed */}
        {activity.length > 0 && (
          <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activity.map((item) => {
                const tc = teamColorMap[teamColorForName[item.team] || "amber"];
                return (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tc.bg} ${tc.text}`}>
                      {item.team}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-zinc-100 flex-1">{item.details}</span>
                    <span className="text-xs text-gray-500 dark:text-zinc-500">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Cross-Team Dependencies */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Cross-Team Dependencies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DependencyCard from="Riley (Artists)" to="Cassidy (Curation)" description="Artists discovered by Riley are submitted to Cassidy's panel for tier placement" status="active" fromColor="purple" toColor="teal" />
            <DependencyCard from="Cassidy (Curation)" to="Station Ops" description="Tier placements feed into rotation clocks and DJ programming" status="active" fromColor="teal" toColor="amber" />
            <DependencyCard from="Harper (Sponsors)" to="Riley (Artists)" description="80% of sponsor revenue flows to the artist pool" status="pending" fromColor="green" toColor="purple" />
            <DependencyCard from="Elliot (Growth)" to="Harper (Sponsors)" description="Listener metrics prove sponsor ROI" status="pending" fromColor="blue" toColor="green" />
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <QuickLink href="/station-admin" label="Station Ops" icon={<Settings className="w-5 h-5" />} color="amber" />
          <QuickLink href="/riley" label="Team Riley" icon={<Users className="w-5 h-5" />} color="purple" />
          <QuickLink href="/cassidy" label="Team Cassidy" icon={<Award className="w-5 h-5" />} color="teal" />
          <QuickLink href="/harper" label="Team Harper" icon={<Building2 className="w-5 h-5" />} color="green" />
          <QuickLink href="/elliot" label="Team Elliot" icon={<Target className="w-5 h-5" />} color="blue" />
          <QuickLink href="/admin" label="Admin Data" icon={<BarChart3 className="w-5 h-5" />} color="gray" />
        </section>
      </main>
    </div>
  );
}

function DependencyCard({
  from,
  to,
  description,
  status,
  fromColor,
  toColor,
}: {
  from: string;
  to: string;
  description: string;
  status: "active" | "pending" | "blocked";
  fromColor: string;
  toColor: string;
}) {
  const colorMap: Record<string, string> = {
    purple: "text-purple-400 bg-purple-500/10",
    teal: "text-teal-400 bg-teal-500/10",
    green: "text-green-400 bg-green-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  };

  return (
    <div className="border border-zinc-800 rounded-lg p-4 hover:border-amber-500/30 transition-colors">
      <div className="flex items-center space-x-2 mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorMap[fromColor]}`}>{from}</span>
        <ArrowRight className="w-4 h-4 text-zinc-500" />
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorMap[toColor]}`}>{to}</span>
      </div>
      <p className="text-sm text-zinc-300">{description}</p>
      <div className="mt-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          status === "active" ? "bg-green-500/15 text-green-400" :
          status === "blocked" ? "bg-red-500/15 text-red-400" :
          "bg-yellow-500/15 text-yellow-400"
        }`}>
          {status === "active" ? "Active" : status === "blocked" ? "Blocked" : "Pending Revenue"}
        </span>
      </div>
    </div>
  );
}

function KPICard({
  label,
  current,
  target,
  progress,
  color,
  team,
}: {
  label: string;
  current: string;
  target: string;
  progress: number;
  color: string;
  team: string;
}) {
  const barColors: Record<string, string> = {
    green: "bg-green-500",
    purple: "bg-purple-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
  };

  return (
    <div className="border border-zinc-800 rounded-lg p-4">
      <div className="text-sm text-zinc-400 mb-1">{label}</div>
      <div className="flex items-baseline space-x-2 mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{current}</span>
        <span className="text-sm text-gray-500 dark:text-zinc-500">/ {target}</span>
      </div>
      <div className="bg-zinc-700 rounded-full h-2 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full ${barColors[color]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-zinc-500">{progress}% of target</span>
        <span className="font-medium text-gray-600 dark:text-zinc-400">{team}</span>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon,
  color,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
    purple: "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20",
    teal: "bg-teal-500/10 text-teal-400 hover:bg-teal-500/20",
    green: "bg-green-500/10 text-green-400 hover:bg-green-500/20",
    blue: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
    gray: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
  };

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors ${colorClasses[color]}`}
    >
      {icon}
      <span className="text-xs font-semibold mt-2">{label}</span>
    </Link>
  );
}
