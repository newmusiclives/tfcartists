"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Target,
  TrendingUp,
  Heart,
  BarChart3,
  Sparkles,
  Share2,
  UserPlus,
  MessageCircle,
  Activity,
  Zap,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  title: string;
  avatar: string;
  color: string;
  icon: React.ReactNode;
  responsibilities: string[];
  tools: string[];
  dashboardLink?: string;
  stats: {
    label: string;
    value: string | number;
  }[];
  personality: string;
}

export default function ElliotTeamPage() {
  const teamMembers: TeamMember[] = [
    {
      id: "elliot",
      name: "Elliot Brooks",
      role: "AI Director of Listener Growth",
      title: "Team Lead & Strategy",
      avatar: "EB",
      color: "blue",
      icon: <Target className="w-6 h-6" />,
      personality: "Warm, strategic, visionary - like Head of Audience at NPR/Spotify",
      responsibilities: [
        "Design multi-channel growth campaigns",
        "Coordinate the 5-person listener growth team",
        "Own retention strategy and listener lifecycle",
        "Report DAU, session length, returning listeners",
        "Partner with sponsors to demonstrate listener impact",
        "Campaign performance analysis and optimization",
      ],
      tools: ["Campaign Dashboard", "Growth Analytics", "Team Coordination", "Retention Engine"],
      dashboardLink: "/elliot",
      stats: [
        { label: "Daily Active Users", value: "1,250" },
        { label: "Active Campaigns", value: 4 },
        { label: "Retention Rate", value: "52%" },
      ],
    },
    {
      id: "nova",
      name: "Nova Lane",
      role: "Social Amplification Lead",
      title: "Viral Content Creator",
      avatar: "NL",
      color: "purple",
      icon: <Share2 className="w-6 h-6" />,
      personality: "Energetic, fun, ultra-online - TikTok growth hacker meets content creator",
      responsibilities: [
        "Create short-form video content (TikTok, Reels, Shorts)",
        "Turn station moments into viral hooks",
        "Artist spotlights and DJ personality clips",
        "Engage comments and build social following",
        "Track social → listener conversions",
        "Ride trends and create shareable moments",
      ],
      tools: ["Content Studio", "TikTok Analytics", "Reels Dashboard", "Trend Monitor"],
      dashboardLink: "/elliot",
      stats: [
        { label: "Total Views", value: "485k" },
        { label: "Shares", value: "12.4k" },
        { label: "Conversions", value: "8.3%" },
      ],
    },
    {
      id: "river",
      name: "River Maxwell",
      role: "Artist Fan Activation Lead",
      title: "Bridge to Team Riley",
      avatar: "RM",
      color: "teal",
      icon: <UserPlus className="w-6 h-6" />,
      personality: "Empathetic, supportive, artist-first - bridge between artists and listeners",
      responsibilities: [
        "Alert artists when their track airs",
        "Create custom social share packs (clip + graphic + caption)",
        "Track listener referrals from each artist",
        "Send 'Your listeners are growing' updates",
        "Make artist promotion effortless",
        "Build the artist referral flywheel",
      ],
      tools: ["Artist Alert System", "Share Pack Generator", "Referral Tracker", "Impact Reports"],
      dashboardLink: "/elliot",
      stats: [
        { label: "Artist Referrals", value: 340 },
        { label: "Share Rate", value: "73%" },
        { label: "Fan Conversions", value: "4.2%" },
      ],
    },
    {
      id: "sage",
      name: "Sage Hart",
      role: "Community & Loyalty Lead",
      title: "Belonging Architect",
      avatar: "SH",
      color: "rose",
      icon: <Heart className="w-6 h-6" />,
      personality: "Heart-centered, warm, community-builder - like a pastor meets community manager",
      responsibilities: [
        "Build Discord/Facebook listener communities",
        "Run weekly listening parties",
        "Launch listener challenges (30-day streak)",
        "Feature 'Listener of the Week' on air",
        "Collect feedback and create traditions",
        "Run 'Listen-To-Win' campaigns",
      ],
      tools: ["Community Platform", "Event Calendar", "Engagement Tracker", "Loyalty Dashboard"],
      dashboardLink: "/elliot",
      stats: [
        { label: "Community Members", value: 680 },
        { label: "Daily Engaged", value: 215 },
        { label: "Listener Retention", value: "62%" },
      ],
    },
    {
      id: "orion",
      name: "Orion Pike",
      role: "Data & Habit Formation Lead",
      title: "Behavioral Scientist",
      avatar: "OP",
      color: "indigo",
      icon: <BarChart3 className="w-6 h-6" />,
      personality: "Analytical but human, strategic, pattern-finder - behavioral psychologist meets data scientist",
      responsibilities: [
        "Track all listening behavior patterns",
        "Identify peak listening times",
        "Build daily listening habits (3+ sessions/week)",
        "Send personalized 'You missed this' messages",
        "Create habit loops (trigger → routine → reward)",
        "Analyze retention data and churn prevention",
      ],
      tools: ["Behavior Analytics", "Habit Engine", "Session Tracker", "Retention Predictor"],
      dashboardLink: "/elliot",
      stats: [
        { label: "Avg Session", value: "28 min" },
        { label: "Habit Loops Active", value: 835 },
        { label: "Weekly Sessions", value: "3.4" },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; badge: string; hover: string }> = {
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        badge: "bg-blue-100 text-blue-700",
        hover: "hover:border-blue-400",
      },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-600",
        badge: "bg-purple-100 text-purple-700",
        hover: "hover:border-purple-400",
      },
      teal: {
        bg: "bg-teal-50",
        text: "text-teal-600",
        badge: "bg-teal-100 text-teal-700",
        hover: "hover:border-teal-400",
      },
      rose: {
        bg: "bg-rose-50",
        text: "text-rose-600",
        badge: "bg-rose-100 text-rose-700",
        hover: "hover:border-rose-400",
      },
      indigo: {
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        badge: "bg-indigo-100 text-indigo-700",
        hover: "hover:border-indigo-400",
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/elliot" className="text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Team Elliot</h1>
                <p className="text-sm text-gray-600">Listener Growth Engine Team</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/elliot" className="text-gray-600 hover:text-gray-900 text-sm">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Overview */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Team Elliot</h2>
              <p className="text-blue-100 text-lg mb-4">
                Listener Growth Engine - Acquisition, Retention & Community
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div>
                  <div className="text-3xl font-bold">5</div>
                  <div className="text-blue-100 text-sm">Team Members</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">1,250</div>
                  <div className="text-blue-100 text-sm">Daily Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">52%</div>
                  <div className="text-blue-100 text-sm">Retention Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">28 min</div>
                  <div className="text-blue-100 text-sm">Avg Session Length</div>
                </div>
              </div>
            </div>
            <Users className="w-16 h-16 text-blue-200" />
          </div>
        </div>

        {/* Team Mission */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Our Mission</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What We Do</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Build a passionate listener community that grows itself</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Convert artist fans into regular station listeners</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Create viral content that drives listener acquisition</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Engineer habit loops for long-term listener retention</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">The Growth Flywheel</h4>
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Artists bring fans → Fans become listeners</div>
                  <div className="text-xs text-gray-500">River activates artist fan bases</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Viral content → New listener discovery</div>
                  <div className="text-xs text-gray-500">Nova creates shareable moments</div>
                </div>
                <div className="bg-rose-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Community → Loyalty & retention</div>
                  <div className="text-xs text-gray-500">Sage builds belonging</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Habits → Regular listening</div>
                  <div className="text-xs text-gray-500">Orion engineers behavior</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Team Members</h3>
          <div className="space-y-6">
            {teamMembers.map((member) => {
              const colors = getColorClasses(member.color);
              return (
                <div
                  key={member.id}
                  className={`bg-white rounded-xl shadow-lg border-2 border-transparent ${colors.hover} transition-all overflow-hidden`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className={`w-16 h-16 ${colors.bg} ${colors.text} rounded-xl flex items-center justify-center text-xl font-bold`}>
                          {member.avatar}
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="text-xl font-bold text-gray-900">{member.name}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                              {member.role}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{member.title}</p>
                          <p className="text-sm text-gray-500 italic mb-2">{member.personality}</p>
                          <div className="flex items-center space-x-4">
                            {member.dashboardLink && (
                              <Link
                                href={member.dashboardLink}
                                className={`inline-flex items-center space-x-1 text-sm ${colors.text} hover:underline font-medium`}
                              >
                                <span>View Dashboard</span>
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`p-3 ${colors.bg} ${colors.text} rounded-lg`}>
                        {member.icon}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
                      {member.stats.map((stat, idx) => (
                        <div key={idx} className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                          <div className="text-xs text-gray-600">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Responsibilities & Tools */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2 text-sm">Key Responsibilities</h5>
                        <ul className="space-y-1">
                          {member.responsibilities.map((resp, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                              <span className={`${colors.text} mt-0.5`}>•</span>
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2 text-sm">Tools & Systems</h5>
                        <div className="flex flex-wrap gap-2">
                          {member.tools.map((tool, idx) => (
                            <span
                              key={idx}
                              className={`px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-medium`}
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Listener Lifecycle */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Complete Listener Journey</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <WorkflowStep
              number="1"
              title="Discovery"
              description="Nova & River drive initial listener acquisition"
              color="purple"
              icon={<Sparkles className="w-5 h-5" />}
            />
            <WorkflowStep
              number="2"
              title="Activation"
              description="Orion & Elliot get 3+ sessions in first week"
              color="indigo"
              icon={<Zap className="w-5 h-5" />}
            />
            <WorkflowStep
              number="3"
              title="Retention"
              description="Orion & Sage maintain 3+ sessions/week"
              color="blue"
              icon={<Activity className="w-5 h-5" />}
            />
            <WorkflowStep
              number="4"
              title="Loyalty"
              description="Sage turns listeners into superfans"
              color="rose"
              icon={<Heart className="w-5 h-5" />}
            />
            <WorkflowStep
              number="5"
              title="Advocacy"
              description="Listeners become growth engine themselves"
              color="teal"
              icon={<Share2 className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Growth Tactics */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Growth Tactics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TacticCard
              title="Artist Referral Flywheel"
              owner="River Maxwell"
              description="Artists promote their airplay → fans become listeners → sponsor value grows"
              kpi="340 artist referrals this month"
              color="teal"
              icon={<UserPlus className="w-5 h-5" />}
            />
            <TacticCard
              title="Viral Content Engine"
              owner="Nova Lane"
              description="Short-form video content that converts viewers to listeners"
              kpi="485k views, 12.4k shares"
              color="purple"
              icon={<Share2 className="w-5 h-5" />}
            />
            <TacticCard
              title="Habit Formation System"
              owner="Orion Pike"
              description="Personalized messaging to build 3+ session/week habits"
              kpi="52% retention rate"
              color="indigo"
              icon={<Activity className="w-5 h-5" />}
            />
            <TacticCard
              title="Community Building"
              owner="Sage Hart"
              description="Discord/Facebook groups that create belonging"
              kpi="680 community members, 62% retention"
              color="rose"
              icon={<Heart className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Team Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <QuickLink
              href="/elliot"
              title="Elliot Brooks"
              description="Growth strategy"
              icon={<Target className="w-6 h-6" />}
              color="blue"
            />
            <QuickLink
              href="/elliot"
              title="Nova Lane"
              description="Viral content"
              icon={<Share2 className="w-6 h-6" />}
              color="purple"
            />
            <QuickLink
              href="/elliot"
              title="River Maxwell"
              description="Artist activation"
              icon={<UserPlus className="w-6 h-6" />}
              color="teal"
            />
            <QuickLink
              href="/elliot"
              title="Sage Hart"
              description="Community"
              icon={<Heart className="w-6 h-6" />}
              color="rose"
            />
            <QuickLink
              href="/elliot"
              title="Orion Pike"
              description="Data & habits"
              icon={<BarChart3 className="w-6 h-6" />}
              color="indigo"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function WorkflowStep({
  number,
  title,
  description,
  color,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}) {
  const colorClasses: Record<string, string> = {
    purple: "bg-purple-600",
    indigo: "bg-indigo-600",
    blue: "bg-blue-600",
    rose: "bg-rose-600",
    teal: "bg-teal-600",
  };

  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-12 h-12 ${colorClasses[color]} text-white rounded-full text-xl font-bold mb-3`}>
        {number}
      </div>
      <div className="flex items-center justify-center mb-2 text-gray-600">{icon}</div>
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function TacticCard({
  title,
  owner,
  description,
  kpi,
  color,
  icon,
}: {
  title: string;
  owner: string;
  description: string;
  kpi: string;
  color: string;
  icon: React.ReactNode;
}) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    teal: { bg: "bg-teal-100", text: "text-teal-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
    indigo: { bg: "bg-indigo-100", text: "text-indigo-600" },
    rose: { bg: "bg-rose-100", text: "text-rose-600" },
  };

  const classes = colorClasses[color] || colorClasses.teal;

  return (
    <div className="border-2 border-gray-100 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start space-x-3">
        <div className={`p-2 ${classes.bg} ${classes.text} rounded-lg`}>{icon}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          <p className="text-xs text-gray-500 mb-2">Owned by {owner}</p>
          <p className="text-sm text-gray-700 mb-2">{description}</p>
          <div className={`text-xs font-medium ${classes.text}`}>{kpi}</div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
  icon,
  color,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600 hover:bg-blue-200",
    purple: "bg-purple-100 text-purple-600 hover:bg-purple-200",
    teal: "bg-teal-100 text-teal-600 hover:bg-teal-200",
    rose: "bg-rose-100 text-rose-600 hover:bg-rose-200",
    indigo: "bg-indigo-100 text-indigo-600 hover:bg-indigo-200",
  };

  return (
    <Link href={href} className={`block p-4 rounded-lg ${colorClasses[color]} transition-colors`}>
      <div className="flex flex-col items-center text-center space-y-2">
        {icon}
        <div>
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-xs opacity-80">{description}</div>
        </div>
      </div>
    </Link>
  );
}
