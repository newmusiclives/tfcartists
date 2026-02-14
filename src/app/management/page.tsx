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

// --- Station Build Playbook Phases ---
interface PlaybookPhase {
  id: string;
  phase: number;
  name: string;
  team: string;
  teamColor: string;
  teamHref: string;
  description: string;
  tasks: { name: string; status: "done" | "in_progress" | "blocked" | "todo"; owner: string }[];
}

const PLAYBOOK_PHASES: PlaybookPhase[] = [
  {
    id: "foundation",
    phase: 1,
    name: "Station Foundation",
    team: "Station Ops",
    teamColor: "amber",
    teamHref: "/station-admin",
    description: "Core station infrastructure: identity, music library, DJs, schedule, and stream",
    tasks: [
      { name: "Station identity & branding", status: "done", owner: "Station Ops" },
      { name: "Music library (1,200 songs)", status: "done", owner: "Station Ops" },
      { name: "DJ roster (12 DJs configured)", status: "done", owner: "Station Ops" },
      { name: "Schedule (24/7 coverage)", status: "done", owner: "Station Ops" },
      { name: "Clock templates (5 rotation patterns)", status: "done", owner: "Station Ops" },
      { name: "Show features (34 AI segments)", status: "done", owner: "Station Ops" },
      { name: "Show transitions (14 intros/outros)", status: "done", owner: "Station Ops" },
      { name: "Stream engineering & audio processing", status: "done", owner: "Station Ops" },
    ],
  },
  {
    id: "curation",
    phase: 2,
    name: "Content & Curation",
    team: "Team Cassidy",
    teamColor: "teal",
    teamHref: "/cassidy",
    description: "Rotation curation, tier structure, quality standards, and review pipeline",
    tasks: [
      { name: "Define tier structure (Bronze/Silver/Gold/Platinum)", status: "done", owner: "Cassidy Monroe" },
      { name: "Set quality standards & review criteria", status: "done", owner: "Dakota Wells" },
      { name: "Initial rotation curation (200 artists)", status: "in_progress", owner: "Maya Reeves" },
      { name: "80/20 indie transformation plan", status: "in_progress", owner: "Cassidy Monroe" },
      { name: "Progression pathway design", status: "in_progress", owner: "Jesse Coleman" },
      { name: "Audience analytics baseline", status: "todo", owner: "Whitley Cross" },
    ],
  },
  {
    id: "artists",
    phase: 3,
    name: "Artist Acquisition",
    team: "Team Riley",
    teamColor: "purple",
    teamHref: "/riley",
    description: "Artist discovery, outreach, onboarding, tier subscriptions, and revenue pool",
    tasks: [
      { name: "Artist discovery pipeline active", status: "done", owner: "Grace Holland" },
      { name: "Outreach campaigns running", status: "in_progress", owner: "Grace Holland" },
      { name: "Tier subscription system live", status: "done", owner: "Marcus Tate" },
      { name: "Pool share calculator operational", status: "done", owner: "Jordan Cross" },
      { name: "Quality vetting pipeline active", status: "in_progress", owner: "Sienna Park" },
      { name: "Upgrade opportunity engine active", status: "in_progress", owner: "Riley Carpenter" },
      { name: "Hit 100 paying artists target", status: "todo", owner: "Riley Carpenter" },
    ],
  },
  {
    id: "revenue",
    phase: 4,
    name: "Revenue Generation",
    team: "Team Harper",
    teamColor: "green",
    teamHref: "/harper",
    description: "Sponsor acquisition, ad operations, billing, and artist pool distribution",
    tasks: [
      { name: "Sponsor tier packages defined", status: "done", owner: "Harper AI" },
      { name: "Sponsor outreach pipeline active", status: "in_progress", owner: "Blake Morrison" },
      { name: "Ad operations & scheduling live", status: "in_progress", owner: "Dakota Chen" },
      { name: "Billing & invoicing system active", status: "in_progress", owner: "Riley Nguyen" },
      { name: "Hit 50 sponsors target", status: "todo", owner: "Cameron Wells" },
      { name: "Premium add-on upselling active", status: "todo", owner: "Harper AI" },
      { name: "First artist pool payout processed", status: "todo", owner: "Riley Nguyen" },
    ],
  },
  {
    id: "growth",
    phase: 5,
    name: "Audience Growth",
    team: "Team Elliot",
    teamColor: "blue",
    teamHref: "/elliot",
    description: "Social content, community building, habit formation, and listener campaigns",
    tasks: [
      { name: "Social media accounts active", status: "done", owner: "Nova Lane" },
      { name: "Viral content engine running", status: "in_progress", owner: "Nova Lane" },
      { name: "Artist fan activation system", status: "in_progress", owner: "River Maxwell" },
      { name: "Community platform (Discord/Facebook)", status: "todo", owner: "Sage Hart" },
      { name: "Habit formation messaging", status: "todo", owner: "Orion Pike" },
      { name: "Hit 500 DAU target", status: "todo", owner: "Elliot Brooks" },
      { name: "First growth campaign launched", status: "todo", owner: "Elliot Brooks" },
    ],
  },
];

// --- Priority Actions ---
interface PriorityAction {
  id: string;
  priority: "critical" | "high" | "medium";
  title: string;
  description: string;
  team: string;
  teamColor: string;
  assignedTo: string;
  href: string;
  dueLabel: string;
}

const PRIORITY_ACTIONS: PriorityAction[] = [
  {
    id: "1",
    priority: "critical",
    title: "Complete initial rotation curation",
    description: "Maya Reeves needs to finalize the initial 200-artist rotation with proper daypart programming",
    team: "Cassidy",
    teamColor: "teal",
    assignedTo: "Maya Reeves",
    href: "/cassidy/rotation",
    dueLabel: "This week",
  },
  {
    id: "2",
    priority: "critical",
    title: "Launch first sponsor outreach wave",
    description: "Blake Morrison to contact 20 local businesses with sponsorship packages",
    team: "Harper",
    teamColor: "green",
    assignedTo: "Blake Morrison",
    href: "/harper/outreach",
    dueLabel: "This week",
  },
  {
    id: "3",
    priority: "high",
    title: "Scale artist outreach to 50 contacts/week",
    description: "Grace Holland to increase outreach volume to hit 100 paying artists milestone",
    team: "Riley",
    teamColor: "purple",
    assignedTo: "Grace Holland",
    href: "/riley/outreach",
    dueLabel: "Next 2 weeks",
  },
  {
    id: "4",
    priority: "high",
    title: "Launch first viral content campaign",
    description: "Nova Lane to produce 10 short-form videos showcasing DJ personalities and artist spotlights",
    team: "Elliot",
    teamColor: "blue",
    assignedTo: "Nova Lane",
    href: "/elliot/content",
    dueLabel: "Next 2 weeks",
  },
  {
    id: "5",
    priority: "high",
    title: "Set up community Discord server",
    description: "Sage Hart to launch the listener community with welcome channels, listening parties, and challenges",
    team: "Elliot",
    teamColor: "blue",
    assignedTo: "Sage Hart",
    href: "/elliot/community",
    dueLabel: "Next 2 weeks",
  },
  {
    id: "6",
    priority: "medium",
    title: "Establish audience analytics baseline",
    description: "Whitley Cross to set up tracking for listener demographics, engagement, and growth trends",
    team: "Cassidy",
    teamColor: "teal",
    assignedTo: "Whitley Cross",
    href: "/cassidy",
    dueLabel: "This month",
  },
  {
    id: "7",
    priority: "medium",
    title: "Process first artist pool payout",
    description: "Riley Nguyen to run first monthly distribution once sponsor revenue reaches $5,000",
    team: "Harper",
    teamColor: "green",
    assignedTo: "Riley Nguyen",
    href: "/harper/billing",
    dueLabel: "This month",
  },
];

// --- Management Team ---
const MANAGEMENT_TEAM = [
  {
    name: "Morgan Reed",
    role: "Station Manager (GM)",
    avatar: "MR",
    color: "bg-amber-100 text-amber-700",
    focus: "Overall station success",
    kpi: "Revenue + Growth",
  },
  {
    name: "Avery Quinn",
    role: "Operations Director",
    avatar: "AQ",
    color: "bg-orange-100 text-orange-700",
    focus: "Day-to-day execution",
    kpi: "Task completion",
  },
  {
    name: "Jordan Blake",
    role: "Strategy Director",
    avatar: "JB",
    color: "bg-red-100 text-red-700",
    focus: "Growth & milestones",
    kpi: "Target attainment",
  },
];

export default function ManagementDashboard() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>("curation");

  // Calculate playbook progress
  const totalTasks = PLAYBOOK_PHASES.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = PLAYBOOK_PHASES.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === "done").length,
    0
  );
  const inProgressTasks = PLAYBOOK_PHASES.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === "in_progress").length,
    0
  );
  const overallProgress = Math.round((completedTasks / totalTasks) * 100);

  const getPhaseProgress = (phase: PlaybookPhase) => {
    const done = phase.tasks.filter((t) => t.status === "done").length;
    return Math.round((done / phase.tasks.length) * 100);
  };

  const getTeamHealth = (teamKey: string) => {
    const phase = PLAYBOOK_PHASES.find((p) => p.id === teamKey);
    if (!phase) return { score: 0, status: "unknown" };
    const done = phase.tasks.filter((t) => t.status === "done").length;
    const inProg = phase.tasks.filter((t) => t.status === "in_progress").length;
    const pct = Math.round(((done + inProg * 0.5) / phase.tasks.length) * 100);
    if (pct >= 80) return { score: pct, status: "healthy" };
    if (pct >= 50) return { score: pct, status: "active" };
    return { score: pct, status: "needs_attention" };
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "done": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "in_progress": return <Play className="w-4 h-4 text-blue-500" />;
      case "blocked": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "critical": return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">CRITICAL</span>;
      case "high": return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-100 text-orange-700">HIGH</span>;
      default: return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700">MEDIUM</span>;
    }
  };

  const teamColorMap: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300", gradient: "from-amber-500 to-orange-500" },
    teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-300", gradient: "from-teal-500 to-cyan-500" },
    purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300", gradient: "from-purple-500 to-pink-500" },
    green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-300", gradient: "from-green-500 to-emerald-500" },
    blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300", gradient: "from-blue-500 to-cyan-500" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Shield className="w-10 h-10 text-amber-200" />
                <div>
                  <h1 className="text-3xl font-bold">Station Manager</h1>
                  <p className="text-amber-100">
                    North Country Radio - Cross-Team Coordination & Playbook
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
                  <div className="text-3xl font-bold">{inProgressTasks}</div>
                  <div className="text-amber-200 text-sm">In Progress</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">5</div>
                  <div className="text-amber-200 text-sm">Teams Active</div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
        {/* Management Team Mini Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MANAGEMENT_TEAM.map((member, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border p-4 flex items-center space-x-4">
              <div className={`w-12 h-12 ${member.color} rounded-lg flex items-center justify-center text-sm font-bold`}>
                {member.avatar}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{member.name}</div>
                <div className="text-xs text-gray-600">{member.role}</div>
                <div className="text-xs text-amber-600 font-medium mt-1">Focus: {member.focus}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Team Health Overview */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Team Health & Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {PLAYBOOK_PHASES.map((phase) => {
              const health = getTeamHealth(phase.id);
              const progress = getPhaseProgress(phase);
              const colors = teamColorMap[phase.teamColor];
              const statusColors = {
                healthy: "text-green-600 bg-green-50",
                active: "text-blue-600 bg-blue-50",
                needs_attention: "text-orange-600 bg-orange-50",
                unknown: "text-gray-600 bg-gray-50",
              }[health.status];

              return (
                <Link key={phase.id} href={phase.teamHref} className="block group">
                  <div className={`rounded-lg p-4 border-2 ${colors.border} hover:shadow-md transition-all`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                        Phase {phase.phase}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors}`}>
                        {health.status === "healthy" ? "Healthy" : health.status === "active" ? "Active" : "Needs Work"}
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 text-sm mb-1">{phase.team}</div>
                    <div className="text-xs text-gray-600 mb-3">{phase.name}</div>
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${colors.gradient}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-right">{progress}% complete</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Priority Actions */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Priority Actions</h2>
              <p className="text-sm text-gray-600 mt-1">
                Cross-team tasks that need attention to keep the station build on track
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-700 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="font-medium">{PRIORITY_ACTIONS.filter((a) => a.priority === "critical").length} Critical</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-full">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                <span className="font-medium">{PRIORITY_ACTIONS.filter((a) => a.priority === "high").length} High</span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {PRIORITY_ACTIONS.map((action) => {
              const colors = teamColorMap[action.teamColor];
              return (
                <Link key={action.id} href={action.href} className="block group">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all">
                    <div className="flex items-center space-x-4 flex-1">
                      {priorityBadge(action.priority)}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{action.title}</div>
                        <div className="text-sm text-gray-600 mt-0.5">{action.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <div className="text-right">
                        <div className={`text-xs font-bold ${colors.text}`}>Team {action.team}</div>
                        <div className="text-xs text-gray-500">{action.assignedTo}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{action.dueLabel}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Station Build Playbook - Expandable Phases */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Station Build Playbook</h2>
              <p className="text-sm text-gray-600 mt-1">
                5-phase plan to build North Country Radio from foundation to full operation
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <span className="text-sm font-bold text-amber-700">{overallProgress}% Overall</span>
              </div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Overall Station Build Progress</span>
              <span className="font-bold text-gray-900">{completedTasks} of {totalTasks} tasks</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Phase Sections */}
          <div className="space-y-3">
            {PLAYBOOK_PHASES.map((phase) => {
              const isExpanded = expandedPhase === phase.id;
              const progress = getPhaseProgress(phase);
              const colors = teamColorMap[phase.teamColor];
              const done = phase.tasks.filter((t) => t.status === "done").length;
              const inProg = phase.tasks.filter((t) => t.status === "in_progress").length;

              return (
                <div key={phase.id} className={`border-2 rounded-lg overflow-hidden ${isExpanded ? colors.border : "border-gray-200"}`}>
                  <button
                    onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                    className={`w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors ${isExpanded ? colors.bg : ""}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient} text-white flex items-center justify-center font-bold`}>
                        {phase.phase}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{phase.name}</div>
                        <div className="text-sm text-gray-600">
                          {phase.team} - {phase.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{done}/{phase.tasks.length}</div>
                        <div className="text-xs text-gray-500">{inProg} in progress</div>
                      </div>
                      <div className="w-20">
                        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${colors.gradient}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-right mt-0.5">{progress}%</div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-4 py-3 bg-white">
                      <div className="space-y-2">
                        {phase.tasks.map((task, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              {statusIcon(task.status)}
                              <span className={`text-sm ${task.status === "done" ? "text-gray-500 line-through" : "text-gray-900"}`}>
                                {task.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs text-gray-500">{task.owner}</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                task.status === "done" ? "bg-green-100 text-green-700" :
                                task.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                                task.status === "blocked" ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>
                                {task.status === "done" ? "Done" : task.status === "in_progress" ? "Active" : task.status === "blocked" ? "Blocked" : "To Do"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t flex justify-end">
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
        </section>

        {/* Cross-Team Dependencies */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Cross-Team Dependencies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DependencyCard
              from="Riley (Artists)"
              to="Cassidy (Curation)"
              description="Artists discovered by Riley are submitted to Cassidy's panel for tier placement and rotation assignment"
              status="active"
              fromColor="purple"
              toColor="teal"
            />
            <DependencyCard
              from="Cassidy (Curation)"
              to="Station Ops"
              description="Tier placements feed into rotation clocks and DJ programming schedules"
              status="active"
              fromColor="teal"
              toColor="amber"
            />
            <DependencyCard
              from="Harper (Sponsors)"
              to="Riley (Artists)"
              description="80% of sponsor revenue flows to the artist pool, distributed by Jordan Cross"
              status="pending"
              fromColor="green"
              toColor="purple"
            />
            <DependencyCard
              from="Elliot (Growth)"
              to="Harper (Sponsors)"
              description="Listener metrics prove sponsor ROI; higher DAU enables premium pricing"
              status="pending"
              fromColor="blue"
              toColor="green"
            />
            <DependencyCard
              from="Riley (Artists)"
              to="Elliot (Growth)"
              description="Artist fans become station listeners through River Maxwell's activation system"
              status="active"
              fromColor="purple"
              toColor="blue"
            />
            <DependencyCard
              from="Cassidy (Curation)"
              to="Harper (Sponsors)"
              description="Gold/Platinum tier artists create premium sponsorship partnership opportunities"
              status="pending"
              fromColor="teal"
              toColor="green"
            />
          </div>
        </section>

        {/* Station KPI Dashboard */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Station KPI Targets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Monthly Revenue"
              current="$26,150"
              target="$50,000"
              progress={52}
              color="green"
              team="Harper + Riley"
            />
            <KPICard
              label="Artists in Rotation"
              current="200"
              target="340"
              progress={59}
              color="purple"
              team="Riley + Cassidy"
            />
            <KPICard
              label="Active Sponsors"
              current="125"
              target="200"
              progress={63}
              color="green"
              team="Harper"
            />
            <KPICard
              label="Daily Active Users"
              current="1,250"
              target="5,000"
              progress={25}
              color="blue"
              team="Elliot"
            />
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
    purple: "text-purple-600 bg-purple-50",
    teal: "text-teal-600 bg-teal-50",
    green: "text-green-600 bg-green-50",
    blue: "text-blue-600 bg-blue-50",
    amber: "text-amber-600 bg-amber-50",
  };

  return (
    <div className="border rounded-lg p-4 hover:border-amber-300 transition-colors">
      <div className="flex items-center space-x-2 mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorMap[fromColor]}`}>{from}</span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorMap[toColor]}`}>{to}</span>
      </div>
      <p className="text-sm text-gray-700">{description}</p>
      <div className="mt-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          status === "active" ? "bg-green-100 text-green-700" :
          status === "blocked" ? "bg-red-100 text-red-700" :
          "bg-yellow-100 text-yellow-700"
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
    <div className="border rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="flex items-baseline space-x-2 mb-2">
        <span className="text-2xl font-bold text-gray-900">{current}</span>
        <span className="text-sm text-gray-500">/ {target}</span>
      </div>
      <div className="bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full ${barColors[color]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{progress}% of target</span>
        <span className="font-medium text-gray-600">{team}</span>
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
    amber: "bg-amber-50 text-amber-600 hover:bg-amber-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    teal: "bg-teal-50 text-teal-600 hover:bg-teal-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    gray: "bg-gray-50 text-gray-600 hover:bg-gray-100",
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
