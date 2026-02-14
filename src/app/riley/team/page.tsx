"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Search,
  BarChart3,
  CheckCircle,
  DollarSign,
  Sparkles,
  Mail,
  MessageCircle,
  TrendingUp,
  Upload,
  Settings,
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
}

export default function RileyTeamPage() {
  const teamMembers: TeamMember[] = [
    {
      id: "riley",
      name: "Riley Carpenter",
      role: "AI Sales Director",
      title: "Team Lead & Strategy",
      avatar: "RC",
      color: "purple",
      icon: <Sparkles className="w-6 h-6" />,
      responsibilities: [
        "Overall team strategy and coordination",
        "AI-powered artist discovery and qualification",
        "Tier upgrade opportunity identification",
        "Revenue optimization and forecasting",
        "Performance analytics and reporting",
        "Team workflow automation",
      ],
      tools: ["AI Analytics", "Revenue Forecasting", "Upgrade Detection", "Team Dashboard"],
      dashboardLink: "/riley/upgrade-opportunities",
      stats: [
        { label: "Upgrade Opportunities", value: 23 },
        { label: "AI Recommendations", value: 45 },
        { label: "Conversion Rate", value: "34%" },
      ],
    },
    {
      id: "grace",
      name: "Grace Holland",
      role: "Outreach & Artist Relations",
      title: "First Contact Specialist",
      avatar: "GH",
      color: "indigo",
      icon: <Search className="w-6 h-6" />,
      responsibilities: [
        "Artist discovery across social platforms",
        "Initial outreach and relationship building",
        "Track submission invitation campaigns",
        "Follow-up communication management",
        "Artist onboarding coordination",
        "Contact database maintenance",
      ],
      tools: ["Discovery Dashboard", "Email Campaigns", "Contact CRM", "Social Media Integration"],
      dashboardLink: "/riley/outreach",
      stats: [
        { label: "Active Leads", value: 6 },
        { label: "Contacted This Week", value: 12 },
        { label: "Response Rate", value: "67%" },
      ],
    },
    {
      id: "marcus",
      name: "Marcus Tate",
      role: "Tier Management & Analytics",
      title: "Artist Success Manager",
      avatar: "MT",
      color: "blue",
      icon: <BarChart3 className="w-6 h-6" />,
      responsibilities: [
        "Artist roster management (340 artists)",
        "Tier distribution monitoring and optimization",
        "Play count tracking and reporting",
        "Artist performance analytics",
        "Engagement metrics analysis",
        "Tier capacity planning",
      ],
      tools: ["Artist Management", "Analytics Dashboard", "Performance Reports", "Tier Calculator"],
      dashboardLink: "/riley/artists",
      stats: [
        { label: "Total Artists", value: 340 },
        { label: "Active This Month", value: 328 },
        { label: "Avg Engagement", value: "8.4/10" },
      ],
    },
    {
      id: "sienna",
      name: "Sienna Park",
      role: "Content Vetting & Quality Control",
      title: "Quality Assurance Lead",
      avatar: "SP",
      color: "green",
      icon: <CheckCircle className="w-6 h-6" />,
      responsibilities: [
        "Track submission review and approval",
        "Audio quality assessment (192+ kbps)",
        "Content standards enforcement",
        "Metadata verification",
        "File format validation (MP3, WAV, FLAC)",
        "Rejection feedback and guidance",
      ],
      tools: ["Submission Queue", "Audio Analyzer", "Quality Checklist", "Approval System"],
      dashboardLink: "/riley/submissions",
      stats: [
        { label: "Pending Reviews", value: 12 },
        { label: "Approved This Month", value: 45 },
        { label: "Approval Rate", value: "94%" },
      ],
    },
    {
      id: "jordan",
      name: "Jordan Cross",
      role: "Payment Processing & Artist Support",
      title: "Financial Operations",
      avatar: "JC",
      color: "emerald",
      icon: <DollarSign className="w-6 h-6" />,
      responsibilities: [
        "Monthly pool share calculations ($6,240/month)",
        "Artist tier subscription management",
        "Payment processing and distribution",
        "Revenue pool allocation (80% to artists)",
        "Financial reporting and transparency",
        "Artist billing support",
      ],
      tools: ["Pool Calculator", "Payment Dashboard", "Revenue Reports", "Manifest Financial API"],
      dashboardLink: "/riley/pool-calculator",
      stats: [
        { label: "Monthly Pool", value: "$6,240" },
        { label: "Artists Paid", value: 340 },
        { label: "Avg Payout", value: "$18.35" },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; badge: string; hover: string }> = {
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-600",
        badge: "bg-purple-100 text-purple-700",
        hover: "hover:border-purple-400",
      },
      indigo: {
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        badge: "bg-indigo-100 text-indigo-700",
        hover: "hover:border-indigo-400",
      },
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        badge: "bg-blue-100 text-blue-700",
        hover: "hover:border-blue-400",
      },
      green: {
        bg: "bg-green-50",
        text: "text-green-600",
        badge: "bg-green-100 text-green-700",
        hover: "hover:border-green-400",
      },
      emerald: {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        badge: "bg-emerald-100 text-emerald-700",
        hover: "hover:border-emerald-400",
      },
    };
    return colors[color] || colors.purple;
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
                <h1 className="text-xl font-bold text-gray-900">Riley's Team</h1>
                <p className="text-sm text-gray-600">Artist Airplay Management Team</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/riley" className="text-gray-600 hover:text-gray-900 text-sm">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Overview */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Team Riley</h2>
              <p className="text-purple-100 text-lg mb-4">
                Artist Airplay Management & Revenue Generation
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div>
                  <div className="text-3xl font-bold">5</div>
                  <div className="text-purple-100 text-sm">Team Members</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">340</div>
                  <div className="text-purple-100 text-sm">Artists Managed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">$3,900</div>
                  <div className="text-purple-100 text-sm">Monthly Revenue</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">6,430</div>
                  <div className="text-purple-100 text-sm">Total Pool Shares</div>
                </div>
              </div>
            </div>
            <Users className="w-16 h-16 text-purple-200" />
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
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Discover and onboard emerging artists to TrueFans RADIO</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Manage 5-tier airplay system (FREE, Bronze, Silver, Gold, Platinum)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Ensure high-quality content through rigorous vetting</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 mt-1">✓</span>
                  <span>Distribute revenue pool fairly using share-based system</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Revenue Model</h4>
              <div className="space-y-3">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Artist Subscriptions (Riley's Revenue)</div>
                  <div className="text-2xl font-bold text-purple-600">$3,900/month</div>
                  <div className="text-xs text-gray-500">100% retained by station for operations</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Artist Pool (from Harper)</div>
                  <div className="text-2xl font-bold text-green-600">$6,240/month</div>
                  <div className="text-xs text-gray-500">80% of sponsor revenue → distributed to artists</div>
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

        {/* Team Workflow */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Complete Artist Journey</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <WorkflowStep
              number="1"
              title="Discovery"
              description="Grace finds artists on social platforms and venues"
              color="indigo"
              icon={<Search className="w-5 h-5" />}
            />
            <WorkflowStep
              number="2"
              title="Outreach"
              description="Grace sends personalized invitations and builds relationships"
              color="blue"
              icon={<Mail className="w-5 h-5" />}
            />
            <WorkflowStep
              number="3"
              title="Quality Review"
              description="Sienna reviews and approves submitted tracks"
              color="green"
              icon={<CheckCircle className="w-5 h-5" />}
            />
            <WorkflowStep
              number="4"
              title="Management"
              description="Marcus monitors performance and tier optimization"
              color="purple"
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <WorkflowStep
              number="5"
              title="Payments"
              description="Jordan calculates and distributes pool earnings"
              color="emerald"
              icon={<DollarSign className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Team Dashboards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <QuickLink
              href="/riley/upgrade-opportunities"
              title="Riley Carpenter"
              description="Upgrade opportunities"
              icon={<Sparkles className="w-6 h-6" />}
              color="purple"
            />
            <QuickLink
              href="/riley/outreach"
              title="Grace Holland"
              description="Artist outreach"
              icon={<Search className="w-6 h-6" />}
              color="indigo"
            />
            <QuickLink
              href="/riley/artists"
              title="Marcus Tate"
              description="Artist management"
              icon={<BarChart3 className="w-6 h-6" />}
              color="blue"
            />
            <QuickLink
              href="/riley/submissions"
              title="Sienna Park"
              description="Track submissions"
              icon={<CheckCircle className="w-6 h-6" />}
              color="green"
            />
            <QuickLink
              href="/riley/pool-calculator"
              title="Jordan Cross"
              description="Pool calculator"
              icon={<DollarSign className="w-6 h-6" />}
              color="emerald"
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
    indigo: "bg-indigo-600",
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
    emerald: "bg-emerald-600",
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
    purple: "bg-purple-100 text-purple-600 hover:bg-purple-200",
    indigo: "bg-indigo-100 text-indigo-600 hover:bg-indigo-200",
    blue: "bg-blue-100 text-blue-600 hover:bg-blue-200",
    green: "bg-green-100 text-green-600 hover:bg-green-200",
    emerald: "bg-emerald-100 text-emerald-600 hover:bg-emerald-200",
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
