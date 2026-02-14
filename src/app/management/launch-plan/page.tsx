"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
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
  Rocket,
  Calendar,
  Megaphone,
  HeartHandshake,
  Headphones,
  Share2,
  MessageCircle,
  Gift,
  PartyPopper,
  ArrowLeft,
  Globe,
  Mail,
  Smartphone,
  Store,
  Star,
} from "lucide-react";
import { SharedNav } from "@/components/shared-nav";
import { useStation } from "@/contexts/StationContext";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Types ─────────────────────────────────────────────────────────

interface ActionItem {
  id: string;
  label: string;
  team: TeamKey;
  href?: string;
  detail?: string;
}

type TeamKey = "riley" | "harper" | "cassidy" | "elliot" | "ops" | "management" | "all";

interface Phase {
  id: string;
  phase: number;
  name: string;
  subtitle: string;
  timeline: string;
  icon: React.ReactNode;
  color: string;
  actions: ActionItem[];
}

// ─── Team Config ───────────────────────────────────────────────────

const TEAM_CONFIG: Record<TeamKey, { label: string; color: string; bg: string; border: string; href: string }> = {
  riley:      { label: "Riley",      color: "text-purple-700", bg: "bg-purple-50",  border: "border-purple-200", href: "/riley" },
  harper:     { label: "Harper",     color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  href: "/harper" },
  cassidy:    { label: "Cassidy",    color: "text-teal-700",   bg: "bg-teal-50",    border: "border-teal-200",   href: "/cassidy" },
  elliot:     { label: "Elliot",     color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   href: "/elliot" },
  ops:        { label: "Station Ops",color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  href: "/station-admin" },
  management: { label: "Management", color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200",    href: "/management" },
  all:        { label: "All Teams",  color: "text-gray-700",   bg: "bg-gray-100",   border: "border-gray-300",   href: "/management" },
};

// ─── Launch Phases ─────────────────────────────────────────────────

const LAUNCH_PHASES: Phase[] = [
  {
    id: "foundation",
    phase: 1,
    name: "Foundation & Station Setup",
    subtitle: "Build the infrastructure, configure teams, prepare content",
    timeline: "Days -30 to -14",
    icon: <Settings className="w-6 h-6" />,
    color: "amber",
    actions: [
      { id: "f1", label: "Complete website and streaming infrastructure", team: "ops", href: "/station-admin", detail: "Ensure stream URL works, player loads, PWA is configured" },
      { id: "f2", label: "Configure all 12 AI DJ personalities", team: "ops", href: "/station-admin/dj-editor", detail: "Set bios, voices, photos, show times, music focus for each DJ" },
      { id: "f3", label: "Set up DJ schedule (6am-6pm live, 6pm-6am automation)", team: "ops", href: "/schedule", detail: "Weekday + Weekend shift assignments across all DJ slots" },
      { id: "f4", label: "Curate initial music library (200+ tracks)", team: "cassidy", href: "/cassidy", detail: "Upload songs, categorize by genre, assign to rotation clocks" },
      { id: "f5", label: "Configure airplay tiers and revenue sharing", team: "management", href: "/admin", detail: "FREE, $5, $20, $50, $120 tiers — 80% artist pool, 20% station" },
      { id: "f6", label: "Set up payment processing (Stripe/Manifest)", team: "ops", detail: "Connect payment gateway for artist tiers and sponsor billing" },
      { id: "f7", label: "Configure analytics and tracking systems", team: "ops", href: "/admin/stream-status", detail: "Stream monitoring, listener tracking, engagement metrics" },
      { id: "f8", label: "Activate Riley team — build artist prospect pipeline", team: "riley", href: "/riley", detail: "Load 100+ artist prospects for discovery and outreach" },
      { id: "f9", label: "Activate Harper team — build sponsor prospect list", team: "harper", href: "/harper", detail: "Load 200+ local business prospects for sponsorship outreach" },
      { id: "f10", label: "Activate Elliot team — set up social channels", team: "elliot", href: "/elliot", detail: "Create TikTok, Instagram, YouTube, Facebook accounts with branding" },
      { id: "f11", label: "Music licensing agreements (ASCAP, BMI, SESAC)", team: "management", detail: "Ensure all streaming rights are properly licensed" },
      { id: "f12", label: "Build email sequences (artist, sponsor, listener)", team: "all", detail: "Welcome emails, nurture sequences, newsletters for each audience" },
    ],
  },
  {
    id: "beta",
    phase: 2,
    name: "Soft Launch & Beta Testing",
    subtitle: "Test with early adopters, collect feedback, build buzz",
    timeline: "Days -14 to -7",
    icon: <Play className="w-6 h-6" />,
    color: "blue",
    actions: [
      { id: "b1", label: "Private beta invite — 50 artists, 20 sponsors, 100 listeners", team: "management", detail: "Personal invitations to founding community members" },
      { id: "b2", label: "Test stream quality, app UX, and player performance", team: "ops", href: "/player", detail: "Verify stream on mobile, desktop, PWA — fix any issues" },
      { id: "b3", label: "Riley contacts first 100 artists, onboards 50", team: "riley", href: "/riley", detail: "Begin outreach campaign, track responses and sign-ups" },
      { id: "b4", label: "Harper contacts first 50 sponsors, closes 10", team: "harper", href: "/harper", detail: "Pitch sponsorship packages to early business prospects" },
      { id: "b5", label: "Launch Discord \"Fire Circle\" community", team: "elliot", detail: "Set up channels: welcome, general, now-playing, artist-spotlight, events" },
      { id: "b6", label: "Produce DJ intro videos (Hank, Loretta, Doc, Cody)", team: "ops", detail: "Short video clips introducing each DJ personality" },
      { id: "b7", label: "Create 10 artist spotlight videos", team: "cassidy", detail: "Feature founding artists with their music and stories" },
      { id: "b8", label: "Behind-the-scenes content — How the station works", team: "elliot", detail: "Explain AI teams, artist-first model, community mission" },
      { id: "b9", label: "Collect beta feedback and fix critical issues", team: "ops", detail: "Survey beta users, prioritize fixes before public launch" },
    ],
  },
  {
    id: "countdown",
    phase: 3,
    name: "Launch Countdown",
    subtitle: "7-day hype campaign building anticipation",
    timeline: "Days -7 to -1",
    icon: <Clock className="w-6 h-6" />,
    color: "orange",
    actions: [
      { id: "c1", label: "Day -7: \"7 Days to Launch\" — Meet the DJs campaign", team: "elliot", detail: "Post DJ profiles across all social channels" },
      { id: "c2", label: "Day -6: Artist spotlight — Featured artist stories", team: "riley", detail: "Highlight founding artists and their music" },
      { id: "c3", label: "Day -5: \"How It Works\" — Explainer video", team: "elliot", detail: "Visual breakdown of the artist-first radio model" },
      { id: "c4", label: "Day -4: Sponsor spotlight — Local businesses supporting artists", team: "harper", detail: "Feature founding sponsors and their community commitment" },
      { id: "c5", label: "Day -3: \"Join the Fire Circle\" — Discord community invite", team: "elliot", detail: "Push community sign-ups, set up welcome events" },
      { id: "c6", label: "Day -2: \"Meet the AI Teams\" — Behind-the-scenes tech", team: "management", detail: "Show how Riley, Harper, Cassidy, and Elliot power the station" },
      { id: "c7", label: "Day -1: \"Tomorrow We Launch\" — Final hype, stream preview", team: "all", detail: "All-channel push, email to waitlist, preview stream goes live" },
      { id: "c8", label: "24-hour test broadcast", team: "ops", detail: "Full stream test with all DJ slots, music rotation, ads" },
      { id: "c9", label: "Send press kit to music blogs and local media", team: "elliot", detail: "Target: No Depression, Saving Country Music, local newspapers" },
      { id: "c10", label: "Email warmup — Send welcome emails to full waitlist", team: "all", detail: "Segment by artists, sponsors, and listeners with tailored messaging" },
    ],
  },
  {
    id: "launch-week",
    phase: 4,
    name: "Launch Week",
    subtitle: "Go live! 7 days of themed campaigns to hit 1,250 listeners",
    timeline: "Days 1-7",
    icon: <Rocket className="w-6 h-6" />,
    color: "red",
    actions: [
      { id: "l1", label: "DAY 1 — \"We're Live!\" Go live at 6am with Hank Westwood", team: "ops", href: "/player", detail: "Email blast to waitlist, social media posts, first 100 listeners get Founding Member status. Target: 200 listeners" },
      { id: "l2", label: "DAY 2 — \"Meet Our Artists\" Artist momentum day", team: "riley", href: "/riley", detail: "Feature 5 artists throughout the day, share \"I'm on the radio!\" assets. Target: 400 listeners, 20 new artist sign-ups" },
      { id: "l3", label: "DAY 3 — \"Join the Fire Circle\" Community invitation", team: "elliot", detail: "Discord grand opening, first listener meet & greet (7pm), referral giveaway launch. Target: 600 listeners, 150 Discord members" },
      { id: "l4", label: "DAY 4 — \"Build Your Listening Habit\" Listener activation", team: "elliot", detail: "Habit-building prompts, push notifications, streak tracking, app install push. Target: 800 listeners, 30% return rate" },
      { id: "l5", label: "DAY 5 — \"Support Our Community\" Sponsor momentum", team: "harper", href: "/harper", detail: "Sponsor spotlight day, ROI reveals, close 10+ new sponsors. Target: 1,000 listeners" },
      { id: "l6", label: "DAY 6 — \"Your Favorite Moment\" Shared discovery", team: "elliot", detail: "Listener UGC campaign, favorite song poll, DJ Q&A sessions, contest. Target: 1,200 listeners, 100+ UGC posts" },
      { id: "l7", label: "DAY 7 — \"We're Here to Stay\" Full launch event", team: "all", detail: "4-hour live broadcast (6-10pm), artist performances, Discord party, press release. Target: 1,250+ listeners" },
    ],
  },
  {
    id: "growth-month1",
    phase: 5,
    name: "Month 1: Habit Formation & Retention",
    subtitle: "Turn launch listeners into daily users, scale artist pipeline",
    timeline: "Days 8-30",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "green",
    actions: [
      { id: "g1", label: "Riley scales to 200 total artists enrolled", team: "riley", href: "/riley", detail: "Continue outreach, onboarding, and tier upgrades. Track: 160 FREE + 40 paid" },
      { id: "g2", label: "Harper scales to 50 active sponsors", team: "harper", href: "/harper", detail: "Continue sponsor outreach, close deals, deliver ROI reports. Target: $10K/mo ad revenue" },
      { id: "g3", label: "Elliot drives 40% listener retention rate", team: "elliot", href: "/elliot", detail: "Push notifications, streak tracking, personalized DJ recommendations, weekly themes" },
      { id: "g4", label: "Cassidy curates 500+ tracks in rotation", team: "cassidy", href: "/cassidy", detail: "Review new submissions, tier placements, rotation clock optimization" },
      { id: "g5", label: "Weekly DJ Q&A events in Discord", team: "elliot", detail: "Rotating DJs host live Q&A sessions for community engagement" },
      { id: "g6", label: "Weekly email digests to all audiences", team: "all", detail: "Artist updates, sponsor ROI, listener highlights, upcoming events" },
      { id: "g7", label: "Artist referral program activation", team: "riley", detail: "Each artist shares their airplay — 50% of listeners should come from artist fanbases" },
      { id: "g8", label: "Launch NACR merch store (Week 4)", team: "management", detail: "Tees ($28), hoodies ($48), caps ($24), mugs ($18) — 50% to Artist Pool" },
      { id: "g9", label: "First monthly revenue distribution", team: "management", href: "/admin", detail: "Calculate artist earnings, process payouts, send earnings notifications" },
      { id: "g10", label: "Target: 800 DAU, $900/mo revenue by end of Month 1", team: "management", href: "/management", detail: "KPI checkpoint — adjust strategy if below targets" },
    ],
  },
  {
    id: "growth-month23",
    phase: 6,
    name: "Months 2-3: Scale to Full Operation",
    subtitle: "Hit all launch targets — 340 artists, 125 sponsors, $8,350/mo",
    timeline: "Days 31-90",
    icon: <Star className="w-6 h-6" />,
    color: "purple",
    actions: [
      { id: "s1", label: "Riley scales to 340 total artists (272 FREE + 68 paid)", team: "riley", href: "/riley", detail: "Full artist pipeline: discovery → outreach → onboard → tier upgrade" },
      { id: "s2", label: "Harper scales to 125 active sponsors", team: "harper", href: "/harper", detail: "Full sponsor pipeline: prospect → pitch → close → renew. Target: $22,250/mo ad revenue" },
      { id: "s3", label: "Elliot drives 1,250 DAU with 52% retention", team: "elliot", href: "/elliot", detail: "Viral content (50+ TikTok/Reels), referral program, community events" },
      { id: "s4", label: "Cassidy manages 1,000+ tracks with quality curation", team: "cassidy", href: "/cassidy", detail: "Submissions panel, genre diversity, rotation optimization, DJ feedback" },
      { id: "s5", label: "Press & media outreach — 5+ blog/media mentions", team: "elliot", detail: "Story angles: \"Radio that pays artists 80%\", \"AI-powered human-heart radio\"" },
      { id: "s6", label: "Monthly revenue distribution runs automatically", team: "management", href: "/admin", detail: "Cron job calculates shares, processes payouts, sends notifications" },
      { id: "s7", label: "85%+ sponsor renewal rate achieved", team: "harper", detail: "Deliver compelling ROI reports, community impact stories, renewal incentives" },
      { id: "s8", label: "Community thriving — 500+ Discord, active UGC", team: "elliot", detail: "Monthly listening parties, artist takeovers, trivia nights, contests" },
      { id: "s9", label: "Target: $8,350/mo net revenue — model proven", team: "management", href: "/management", detail: "If targets hit, the model is validated and ready for Station #2" },
      { id: "s10", label: "Plan Station #2 expansion in the TrueFans Network", team: "management", href: "/network", detail: "Choose next genre (Southern Soul, Indie Rock, etc.), recruit operator" },
    ],
  },
];

// ─── Color Maps ────────────────────────────────────────────────────

const phaseColorMap: Record<string, { bg: string; border: string; gradient: string; text: string; light: string; header: string }> = {
  amber:  { bg: "bg-amber-50",  border: "border-amber-300",  gradient: "from-amber-500 to-orange-500",  text: "text-amber-700",  light: "bg-amber-100",  header: "from-amber-600 to-orange-600" },
  blue:   { bg: "bg-blue-50",   border: "border-blue-300",   gradient: "from-blue-500 to-cyan-500",     text: "text-blue-700",   light: "bg-blue-100",   header: "from-blue-600 to-cyan-600" },
  orange: { bg: "bg-orange-50", border: "border-orange-300", gradient: "from-orange-500 to-red-400",    text: "text-orange-700", light: "bg-orange-100", header: "from-orange-600 to-red-500" },
  red:    { bg: "bg-red-50",    border: "border-red-300",    gradient: "from-red-500 to-pink-500",      text: "text-red-700",    light: "bg-red-100",    header: "from-red-600 to-pink-600" },
  green:  { bg: "bg-green-50",  border: "border-green-300",  gradient: "from-green-500 to-emerald-500", text: "text-green-700",  light: "bg-green-100",  header: "from-green-600 to-emerald-600" },
  purple: { bg: "bg-purple-50", border: "border-purple-300", gradient: "from-purple-500 to-pink-500",   text: "text-purple-700", light: "bg-purple-100", header: "from-purple-600 to-pink-600" },
};

// ─── KPI Targets ───────────────────────────────────────────────────

const KPI_MILESTONES = [
  { period: "Week 1", dau: 300, artists: 50, sponsors: 10, revenue: "$2,000" },
  { period: "Month 1", dau: 800, artists: 200, sponsors: 50, revenue: "$10,000" },
  { period: "Month 2", dau: 1000, artists: 280, sponsors: 90, revenue: "$16,000" },
  { period: "Month 3", dau: 1250, artists: 340, sponsors: 125, revenue: "$22,250" },
];

// ─── Component ─────────────────────────────────────────────────────

export default function LaunchPlanPage() {
  const { currentStation } = useStation();
  const [expandedPhase, setExpandedPhase] = useState<string | null>("foundation");
  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("launch-plan-completed");
        return saved ? new Set(JSON.parse(saved)) : new Set<string>();
      } catch { return new Set<string>(); }
    }
    return new Set<string>();
  });
  const [stats, setStats] = useState<any>(null);

  // Persist completed items
  useEffect(() => {
    localStorage.setItem("launch-plan-completed", JSON.stringify([...completed]));
  }, [completed]);

  // Fetch live stats
  useEffect(() => {
    fetch(`/api/management/stats?stationId=${currentStation.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [currentStation.id]);

  const toggleItem = useCallback((id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Calculate progress per phase
  const getPhaseProgress = (phase: Phase) => {
    const done = phase.actions.filter((a) => completed.has(a.id)).length;
    return { done, total: phase.actions.length, pct: Math.round((done / phase.actions.length) * 100) };
  };

  const totalActions = LAUNCH_PHASES.reduce((sum, p) => sum + p.actions.length, 0);
  const totalCompleted = LAUNCH_PHASES.reduce((sum, p) => sum + p.actions.filter((a) => completed.has(a.id)).length, 0);
  const overallPct = Math.round((totalCompleted / totalActions) * 100);

  // Count actions by team
  const teamActionCounts: Record<TeamKey, { total: number; done: number }> = {} as any;
  for (const phase of LAUNCH_PHASES) {
    for (const action of phase.actions) {
      if (!teamActionCounts[action.team]) teamActionCounts[action.team] = { total: 0, done: 0 };
      teamActionCounts[action.team].total++;
      if (completed.has(action.id)) teamActionCounts[action.team].done++;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SharedNav />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/management" className="text-white/70 hover:text-white text-sm flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Management
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="w-10 h-10 text-amber-200" />
                <div>
                  <h1 className="text-3xl font-bold">90-Day Launch Plan</h1>
                  <p className="text-amber-100">
                    {currentStation.name} — Step-by-step action plan using all 4 teams
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8 mt-4">
                <div>
                  <div className="text-3xl font-bold">{overallPct}%</div>
                  <div className="text-amber-200 text-sm">Overall Progress</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{totalCompleted}/{totalActions}</div>
                  <div className="text-amber-200 text-sm">Actions Complete</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">6</div>
                  <div className="text-amber-200 text-sm">Phases</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">90</div>
                  <div className="text-amber-200 text-sm">Days to Full Ops</div>
                </div>
              </div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mt-6">
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-amber-200 mt-1">
              <span>Foundation</span>
              <span>Beta</span>
              <span>Countdown</span>
              <span>Launch Week</span>
              <span>Month 1</span>
              <span>Full Operation</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Team Responsibility Matrix */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Team Responsibilities</h2>
          <p className="text-sm text-gray-600 mb-6">Each team owns a critical piece of the launch. Click any team to see their dashboard.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(["riley", "harper", "cassidy", "elliot", "ops", "management"] as TeamKey[]).map((key) => {
              const tc = TEAM_CONFIG[key];
              const counts = teamActionCounts[key] || { total: 0, done: 0 };
              const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;
              return (
                <Link key={key} href={tc.href} className="block group">
                  <div className={`rounded-xl border-2 ${tc.border} p-4 text-center hover:shadow-md transition-all`}>
                    <div className={`text-sm font-bold ${tc.color}`}>{tc.label}</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{counts.done}/{counts.total}</div>
                    <div className="text-xs text-gray-500">actions</div>
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${tc.bg.replace("50", "500").replace("bg-", "bg-")}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{pct}%</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* KPI Milestone Targets */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">KPI Milestones</h2>
          <p className="text-sm text-gray-600 mb-6">Target metrics at each stage — all teams contribute to hitting these numbers.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Milestone</th>
                  <th className="text-center py-3 px-4 font-semibold text-blue-700">
                    <div className="flex items-center justify-center gap-1"><Headphones className="w-4 h-4" /> DAU</div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-purple-700">
                    <div className="flex items-center justify-center gap-1"><Music className="w-4 h-4" /> Artists</div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-green-700">
                    <div className="flex items-center justify-center gap-1"><Store className="w-4 h-4" /> Sponsors</div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-amber-700">
                    <div className="flex items-center justify-center gap-1"><DollarSign className="w-4 h-4" /> Ad Revenue/mo</div>
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-500">Team Owner</th>
                </tr>
              </thead>
              <tbody>
                {KPI_MILESTONES.map((m, i) => (
                  <tr key={m.period} className={`border-b ${i === KPI_MILESTONES.length - 1 ? "bg-amber-50 font-semibold" : ""}`}>
                    <td className="py-3 px-4 font-medium text-gray-900">{m.period}</td>
                    <td className="py-3 px-4 text-center text-blue-700">{m.dau.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center text-purple-700">{m.artists}</td>
                    <td className="py-3 px-4 text-center text-green-700">{m.sponsors}</td>
                    <td className="py-3 px-4 text-center text-amber-700">{m.revenue}</td>
                    <td className="py-3 px-4 text-center text-gray-500 text-xs">
                      {i === 0 ? "All Teams" : i === 1 ? "Riley + Harper" : i === 2 ? "All Teams" : "Management"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stats?.kpis && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-bold text-blue-700 mb-2">Current Progress (Live)</div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-700">{stats.kpis.listenerCount}</div>
                  <div className="text-xs text-blue-600">Listeners</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-700">{stats.kpis.artistCount}</div>
                  <div className="text-xs text-purple-600">Artists</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-700">{stats.kpis.activeSponsors}</div>
                  <div className="text-xs text-green-600">Sponsors</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-amber-700">${stats.kpis.totalRevenue?.toLocaleString()}</div>
                  <div className="text-xs text-amber-600">Revenue</div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Phase-by-Phase Action Plan */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Action Plan — Phase by Phase</h2>
          <p className="text-sm text-gray-600 mb-6">Check off actions as you complete them. Progress is saved locally.</p>

          <div className="space-y-4">
            {LAUNCH_PHASES.map((phase) => {
              const progress = getPhaseProgress(phase);
              const colors = phaseColorMap[phase.color];
              const isExpanded = expandedPhase === phase.id;
              const isComplete = progress.done === progress.total;

              return (
                <div key={phase.id} className={`border-2 rounded-xl overflow-hidden transition-all ${isExpanded ? colors.border : "border-gray-200"} ${isComplete ? "ring-2 ring-green-300" : ""}`}>
                  {/* Phase Header */}
                  <button
                    onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                    className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isExpanded ? colors.bg : "hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} text-white flex items-center justify-center shadow-md`}>
                        {phase.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.light} ${colors.text}`}>
                            Phase {phase.phase}
                          </span>
                          <span className="text-xs text-gray-500">{phase.timeline}</span>
                          {isComplete && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">COMPLETE</span>
                          )}
                        </div>
                        <div className="font-bold text-gray-900 mt-1">{phase.name}</div>
                        <div className="text-sm text-gray-600">{phase.subtitle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{progress.done}/{progress.total}</div>
                        <div className="w-24">
                          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className={`h-full rounded-full bg-gradient-to-r ${colors.gradient}`} style={{ width: `${progress.pct}%` }} />
                          </div>
                          <div className="text-xs text-gray-500 text-right mt-0.5">{progress.pct}%</div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>

                  {/* Expanded Action Items */}
                  {isExpanded && (
                    <div className="border-t bg-white">
                      <div className="divide-y">
                        {phase.actions.map((action) => {
                          const isDone = completed.has(action.id);
                          const tc = TEAM_CONFIG[action.team];
                          return (
                            <div key={action.id} className={`flex items-start gap-4 p-4 transition-colors ${isDone ? "bg-green-50/50" : "hover:bg-gray-50"}`}>
                              {/* Checkbox */}
                              <button
                                onClick={() => toggleItem(action.id)}
                                className="flex-shrink-0 mt-0.5"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                                ) : (
                                  <Circle className="w-6 h-6 text-gray-300 hover:text-gray-400" />
                                )}
                              </button>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium ${isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                  {action.label}
                                </div>
                                {action.detail && (
                                  <div className={`text-sm mt-0.5 ${isDone ? "text-gray-300" : "text-gray-500"}`}>
                                    {action.detail}
                                  </div>
                                )}
                              </div>

                              {/* Team Badge + Link */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${tc.bg} ${tc.color}`}>
                                  {tc.label}
                                </span>
                                {action.href && (
                                  <Link
                                    href={action.href}
                                    className="text-gray-400 hover:text-gray-600"
                                    title={`Go to ${tc.label}`}
                                  >
                                    <ArrowRight className="w-4 h-4" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Revenue Model Summary */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Model at Full Capacity (Month 3)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-xl p-5 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-700">Sponsor Revenue</span>
              </div>
              <div className="text-3xl font-bold text-green-700">$22,250</div>
              <div className="text-sm text-green-600 mt-1">125 sponsors &times; avg $178/mo</div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-green-700">
                  <span>80% &rarr; Artist Pool</span>
                  <span className="font-bold">$17,800</span>
                </div>
                <div className="flex justify-between text-green-700">
                  <span>20% &rarr; Station</span>
                  <span className="font-bold">$4,450</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600">Owner: Team Harper</div>
            </div>

            <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-purple-700">Artist Tier Revenue</span>
              </div>
              <div className="text-3xl font-bold text-purple-700">$3,900</div>
              <div className="text-sm text-purple-600 mt-1">68 paid artists across 4 tiers</div>
              <div className="mt-3 space-y-1 text-xs text-purple-700">
                <div className="flex justify-between"><span>Tier $5 &times; 34</span><span>$170</span></div>
                <div className="flex justify-between"><span>Tier $20 &times; 20</span><span>$400</span></div>
                <div className="flex justify-between"><span>Tier $50 &times; 10</span><span>$500</span></div>
                <div className="flex justify-between"><span>Tier $120 &times; 4</span><span>$480</span></div>
              </div>
              <div className="mt-2 text-xs text-purple-600">Owner: Team Riley</div>
            </div>

            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-amber-700">Net Station Revenue</span>
              </div>
              <div className="text-3xl font-bold text-amber-700">$8,350</div>
              <div className="text-sm text-amber-600 mt-1">per month at full capacity</div>
              <div className="mt-3 space-y-1 text-sm text-amber-700">
                <div className="flex justify-between"><span>Tier revenue</span><span>$3,900</span></div>
                <div className="flex justify-between"><span>Sponsor net (20%)</span><span>$4,450</span></div>
                <div className="flex justify-between border-t border-amber-300 pt-1 font-bold"><span>Total</span><span>$8,350</span></div>
              </div>
              <div className="mt-2 text-xs text-amber-600">Owner: Management</div>
            </div>
          </div>
        </section>

        {/* Success Definition */}
        <section className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 rounded-xl shadow-sm p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Day 90 Success Definition</h2>
          <p className="text-amber-100 mb-6">If these targets are hit, the model is proven and ready to scale to Station #2.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold">1,250</div>
              <div className="text-amber-200 text-sm">Daily Active Users</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold">340</div>
              <div className="text-amber-200 text-sm">Artists Enrolled</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold">125</div>
              <div className="text-amber-200 text-sm">Active Sponsors</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold">$8,350</div>
              <div className="text-amber-200 text-sm">Monthly Net Revenue</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="bg-white/10 rounded-lg px-3 py-1.5 text-sm">52% listener retention</div>
            <div className="bg-white/10 rounded-lg px-3 py-1.5 text-sm">85%+ sponsor renewal</div>
            <div className="bg-white/10 rounded-lg px-3 py-1.5 text-sm">Active Discord community</div>
            <div className="bg-white/10 rounded-lg px-3 py-1.5 text-sm">Artists report feeling valued</div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <QuickLink href="/management" label="Management" icon={<Shield className="w-5 h-5" />} color="amber" />
          <QuickLink href="/riley" label="Team Riley" icon={<Users className="w-5 h-5" />} color="purple" />
          <QuickLink href="/cassidy" label="Team Cassidy" icon={<Award className="w-5 h-5" />} color="teal" />
          <QuickLink href="/harper" label="Team Harper" icon={<Building2 className="w-5 h-5" />} color="green" />
          <QuickLink href="/elliot" label="Team Elliot" icon={<Target className="w-5 h-5" />} color="blue" />
          <QuickLink href="/admin" label="Admin" icon={<BarChart3 className="w-5 h-5" />} color="gray" />
        </section>
      </main>
    </div>
  );
}

// ─── Shared Components ─────────────────────────────────────────────

function QuickLink({ href, label, icon, color }: { href: string; label: string; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600 hover:bg-amber-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    teal: "bg-teal-50 text-teal-600 hover:bg-teal-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    gray: "bg-gray-50 text-gray-600 hover:bg-gray-100",
  };

  return (
    <Link href={href} className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors ${colorClasses[color]}`}>
      {icon}
      <span className="text-xs font-semibold mt-2">{label}</span>
    </Link>
  );
}
