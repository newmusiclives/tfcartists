"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Users,
  Target,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
  Settings,
  DollarSign,
  Radio,
  Zap,
  Globe,
  Building2,
  Award,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useStation } from "@/contexts/StationContext";

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
  teamsManaged: { name: string; color: string; href: string }[];
  stats: {
    label: string;
    value: string | number;
  }[];
}

export default function ManagementTeamPage() {
  const { currentStation } = useStation();
  const teamMembers: TeamMember[] = [
    {
      id: "morgan",
      name: "Morgan Reed",
      role: "Station Manager (GM)",
      title: "General Manager & Executive Lead",
      avatar: "MR",
      color: "amber",
      icon: <Shield className="w-6 h-6" />,
      responsibilities: [
        "Overall station success and P&L ownership",
        "Cross-team coordination and conflict resolution",
        "Station build playbook oversight and milestone tracking",
        "Executive reporting and stakeholder communication",
        "Resource allocation across all four teams",
        "Final approval on strategic decisions and launches",
      ],
      tools: ["Station Manager Dashboard", "Playbook Tracker", "KPI Dashboard", "Executive Reports"],
      teamsManaged: [
        { name: "Team Riley", color: "purple", href: "/riley" },
        { name: "Team Harper", color: "green", href: "/harper" },
        { name: "Team Cassidy", color: "teal", href: "/cassidy" },
        { name: "Team Elliot", color: "blue", href: "/elliot" },
        { name: "Station Ops", color: "amber", href: "/station-admin" },
      ],
      stats: [
        { label: "Playbook Progress", value: "52%" },
        { label: "Teams Active", value: 5 },
        { label: "Monthly Revenue", value: "$26,150" },
      ],
    },
    {
      id: "avery",
      name: "Avery Quinn",
      role: "Operations Director",
      title: "Day-to-Day Execution & Process Management",
      avatar: "AQ",
      color: "orange",
      icon: <Settings className="w-6 h-6" />,
      responsibilities: [
        "Daily operations management across all teams",
        "Task prioritization and deadline enforcement",
        "Cross-team dependency resolution",
        "Process improvement and workflow optimization",
        "Team health monitoring and blocker removal",
        "Quality assurance and standards compliance",
      ],
      tools: ["Priority Actions Board", "Team Health Monitor", "Dependency Tracker", "Process Dashboard"],
      teamsManaged: [
        { name: "Team Riley", color: "purple", href: "/riley" },
        { name: "Team Cassidy", color: "teal", href: "/cassidy" },
        { name: "Station Ops", color: "amber", href: "/station-admin" },
      ],
      stats: [
        { label: "Tasks Completed", value: "17/33" },
        { label: "In Progress", value: 9 },
        { label: "Blockers Active", value: 0 },
      ],
    },
    {
      id: "jordan-b",
      name: "Jordan Blake",
      role: "Strategy Director",
      title: "Growth Strategy & Milestone Planning",
      avatar: "JB",
      color: "red",
      icon: <Target className="w-6 h-6" />,
      responsibilities: [
        "Growth strategy development and execution tracking",
        "Milestone definition and target attainment",
        "Market analysis and competitive positioning",
        "Revenue model optimization and forecasting",
        "Partnership strategy and network expansion",
        "Data-driven decision making and analytics oversight",
      ],
      tools: ["KPI Targets Dashboard", "Revenue Projections", "Growth Analytics", "Market Intelligence"],
      teamsManaged: [
        { name: "Team Harper", color: "green", href: "/harper" },
        { name: "Team Elliot", color: "blue", href: "/elliot" },
      ],
      stats: [
        { label: "KPIs On Track", value: "2/4" },
        { label: "Revenue vs Target", value: "52%" },
        { label: "DAU Growth", value: "+18%" },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; badge: string; hover: string }> = {
      amber: {
        bg: "bg-amber-50",
        text: "text-amber-600",
        badge: "bg-amber-100 text-amber-700",
        hover: "hover:border-amber-400",
      },
      orange: {
        bg: "bg-orange-50",
        text: "text-orange-600",
        badge: "bg-orange-100 text-orange-700",
        hover: "hover:border-orange-400",
      },
      red: {
        bg: "bg-red-50",
        text: "text-red-600",
        badge: "bg-red-100 text-red-700",
        hover: "hover:border-red-400",
      },
    };
    return colors[color] || colors.amber;
  };

  const teamBadgeColors: Record<string, string> = {
    purple: "bg-purple-100 text-purple-700",
    green: "bg-green-100 text-green-700",
    teal: "bg-teal-100 text-teal-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/management" className="text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Management Team</h1>
                <p className="text-sm text-gray-600">Station Leadership & Cross-Team Coordination</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/management" className="text-gray-600 hover:text-gray-900 text-sm">
                Back to Station Manager
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Overview */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Station Management</h2>
              <p className="text-amber-100 text-lg mb-4">
                {currentStation.name} - Executive Leadership Team
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div>
                  <div className="text-3xl font-bold">3</div>
                  <div className="text-amber-200 text-sm">Management Team</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">5</div>
                  <div className="text-amber-200 text-sm">Teams Overseen</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">52%</div>
                  <div className="text-amber-200 text-sm">Playbook Progress</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">$26,150</div>
                  <div className="text-amber-200 text-sm">Monthly Revenue</div>
                </div>
              </div>
            </div>
            <Shield className="w-16 h-16 text-amber-200" />
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
                  <span className="text-amber-600 mt-1">&#10003;</span>
                  <span>Coordinate all 4 operational teams toward station launch milestones</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1">&#10003;</span>
                  <span>Execute the 5-phase Station Build Playbook from foundation to growth</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1">&#10003;</span>
                  <span>Resolve cross-team dependencies and remove blockers</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-amber-600 mt-1">&#10003;</span>
                  <span>Track KPI targets and adjust strategy to hit revenue and growth goals</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Station Targets</h4>
              <div className="space-y-3">
                <div className="bg-amber-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Revenue Target</div>
                  <div className="text-2xl font-bold text-amber-600">$50,000/month</div>
                  <div className="text-xs text-gray-500">Currently at $26,150 (52%)</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Audience Target</div>
                  <div className="text-2xl font-bold text-blue-600">5,000 DAU</div>
                  <div className="text-xs text-gray-500">Currently at 1,250 (25%)</div>
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
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="text-xs text-gray-500 mr-1">Oversees:</span>
                            {member.teamsManaged.map((team, idx) => (
                              <Link
                                key={idx}
                                href={team.href}
                                className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${teamBadgeColors[team.color]} hover:opacity-80 transition-opacity`}
                              >
                                <span>{team.name}</span>
                              </Link>
                            ))}
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
                              <span className={`${colors.text} mt-0.5`}>&bull;</span>
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

        {/* Management Workflow */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Station Build Coordination Flow</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <WorkflowStep
              number="1"
              title="Plan"
              description="Morgan sets playbook milestones and allocates resources"
              color="amber"
              icon={<Shield className="w-5 h-5" />}
            />
            <WorkflowStep
              number="2"
              title="Prioritize"
              description="Avery assigns priority actions and resolves dependencies"
              color="orange"
              icon={<Zap className="w-5 h-5" />}
            />
            <WorkflowStep
              number="3"
              title="Execute"
              description="Teams Riley, Cassidy, Harper, and Elliot deliver on tasks"
              color="blue"
              icon={<Users className="w-5 h-5" />}
            />
            <WorkflowStep
              number="4"
              title="Measure"
              description="Jordan Blake tracks KPIs and analyzes performance data"
              color="red"
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <WorkflowStep
              number="5"
              title="Adjust"
              description="Morgan adjusts strategy based on results and market feedback"
              color="amber"
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Org Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Organization Structure</h3>

          {/* GM */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl p-4 text-center w-64">
              <div className="text-lg font-bold">Morgan Reed</div>
              <div className="text-amber-100 text-sm">Station Manager (GM)</div>
            </div>
          </div>

          {/* Directors */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 text-center w-56">
              <div className="font-bold text-gray-900">Avery Quinn</div>
              <div className="text-orange-600 text-sm">Operations Director</div>
            </div>
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-center w-56">
              <div className="font-bold text-gray-900">Jordan Blake</div>
              <div className="text-red-600 text-sm">Strategy Director</div>
            </div>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Link href="/station-admin" className="block bg-amber-50 border-2 border-amber-200 rounded-lg p-3 text-center hover:border-amber-400 transition-colors">
              <Settings className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <div className="font-semibold text-sm text-gray-900">Station Ops</div>
              <div className="text-xs text-gray-500">Infrastructure</div>
            </Link>
            <Link href="/riley" className="block bg-purple-50 border-2 border-purple-200 rounded-lg p-3 text-center hover:border-purple-400 transition-colors">
              <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <div className="font-semibold text-sm text-gray-900">Team Riley</div>
              <div className="text-xs text-gray-500">Artist Acquisition</div>
            </Link>
            <Link href="/cassidy" className="block bg-teal-50 border-2 border-teal-200 rounded-lg p-3 text-center hover:border-teal-400 transition-colors">
              <Award className="w-5 h-5 text-teal-600 mx-auto mb-1" />
              <div className="font-semibold text-sm text-gray-900">Team Cassidy</div>
              <div className="text-xs text-gray-500">Content & Curation</div>
            </Link>
            <Link href="/harper" className="block bg-green-50 border-2 border-green-200 rounded-lg p-3 text-center hover:border-green-400 transition-colors">
              <Building2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <div className="font-semibold text-sm text-gray-900">Team Harper</div>
              <div className="text-xs text-gray-500">Revenue Generation</div>
            </Link>
            <Link href="/elliot" className="block bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-center hover:border-blue-400 transition-colors">
              <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="font-semibold text-sm text-gray-900">Team Elliot</div>
              <div className="text-xs text-gray-500">Audience Growth</div>
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickLink
              href="/management"
              title="Station Manager"
              description="Playbook & cross-team coordination"
              icon={<Shield className="w-6 h-6" />}
              color="amber"
            />
            <QuickLink
              href="/admin"
              title="Admin Dashboard"
              description="Financial KPIs & system data"
              icon={<BarChart3 className="w-6 h-6" />}
              color="orange"
            />
            <QuickLink
              href="/revenue/projections"
              title="Revenue Model"
              description="Revenue projections & forecasts"
              icon={<DollarSign className="w-6 h-6" />}
              color="red"
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
    amber: "bg-amber-600",
    orange: "bg-orange-600",
    blue: "bg-blue-600",
    red: "bg-red-600",
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
    amber: "bg-amber-100 text-amber-600 hover:bg-amber-200",
    orange: "bg-orange-100 text-orange-600 hover:bg-orange-200",
    red: "bg-red-100 text-red-600 hover:bg-red-200",
  };

  return (
    <Link href={href} className={`block p-4 rounded-lg ${colorClasses[color]} transition-colors`}>
      <div className="flex items-center space-x-3">
        {icon}
        <div>
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-xs opacity-80">{description}</div>
        </div>
      </div>
    </Link>
  );
}
