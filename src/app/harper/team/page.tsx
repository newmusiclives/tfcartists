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
  Calendar,
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

export default function HarperTeamPage() {
  const teamMembers: TeamMember[] = [
    {
      id: "harper",
      name: "Harper AI",
      role: "Sponsor Sales Director",
      title: "Team Lead & Strategy",
      avatar: "HA",
      color: "green",
      icon: <Sparkles className="w-6 h-6" />,
      responsibilities: [
        "Overall team strategy and coordination",
        "AI-powered sponsor discovery and qualification",
        "Revenue optimization and forecasting",
        "Upsell and package upgrade identification",
        "Performance analytics and reporting",
        "Team workflow automation",
      ],
      tools: ["AI Analytics", "Revenue Forecasting", "Upsell Detection", "Team Dashboard"],
      dashboardLink: "/harper/opportunities",
      stats: [
        { label: "Upsell Opportunities", value: 18 },
        { label: "AI Recommendations", value: 32 },
        { label: "Revenue Growth", value: "+23%" },
      ],
    },
    {
      id: "blake",
      name: "Blake Morrison",
      role: "Outreach & Business Development",
      title: "First Contact Specialist",
      avatar: "BM",
      color: "blue",
      icon: <Search className="w-6 h-6" />,
      responsibilities: [
        "Sponsor discovery (local businesses, craft makers)",
        "Initial outreach and relationship building",
        "Sponsorship package presentations",
        "Follow-up communication management",
        "Sponsor onboarding coordination",
        "Contact database maintenance",
      ],
      tools: ["Discovery Dashboard", "Email Campaigns", "Contact CRM", "Business Database"],
      dashboardLink: "/harper/outreach",
      stats: [
        { label: "Active Leads", value: 12 },
        { label: "Contacted This Week", value: 18 },
        { label: "Response Rate", value: "58%" },
      ],
    },
    {
      id: "cameron",
      name: "Cameron Wells",
      role: "Account Management & Analytics",
      title: "Sponsor Success Manager",
      avatar: "CW",
      color: "indigo",
      icon: <BarChart3 className="w-6 h-6" />,
      responsibilities: [
        "Sponsor account management (24 sponsors)",
        "Tier distribution monitoring and optimization",
        "Ad spot performance tracking",
        "Sponsor satisfaction and retention",
        "Monthly performance reports",
        "Package capacity planning",
      ],
      tools: ["Sponsor Management", "Analytics Dashboard", "Performance Reports", "ROI Calculator"],
      dashboardLink: "/harper/sponsors",
      stats: [
        { label: "Total Sponsors", value: 24 },
        { label: "Active This Month", value: 24 },
        { label: "Retention Rate", value: "96%" },
      ],
    },
    {
      id: "dakota",
      name: "Dakota Chen",
      role: "Ad Operations & Quality Control",
      title: "Broadcast Quality Manager",
      avatar: "DC",
      color: "purple",
      icon: <CheckCircle className="w-6 h-6" />,
      responsibilities: [
        "Ad spot scheduling and rotation",
        "Audio quality assessment",
        "Airtime compliance monitoring",
        "Ad content approval and standards",
        "Spot delivery verification",
        "Technical quality assurance",
      ],
      tools: ["Scheduling System", "Audio Analyzer", "Compliance Tracker", "Delivery Reports"],
      dashboardLink: "/harper/operations",
      stats: [
        { label: "Spots Scheduled", value: 720 },
        { label: "This Month", value: 648 },
        { label: "Delivery Rate", value: "99.8%" },
      ],
    },
    {
      id: "riley",
      name: "Riley Nguyen",
      role: "Billing & Revenue Operations",
      title: "Financial Operations",
      avatar: "RN",
      color: "emerald",
      icon: <DollarSign className="w-6 h-6" />,
      responsibilities: [
        "Monthly billing and invoicing ($7,800/month)",
        "Sponsor payment processing",
        "Revenue distribution (80% to artists)",
        "Financial reporting and forecasting",
        "Payment collection and follow-up",
        "Sponsor tier subscription management",
      ],
      tools: ["Billing Dashboard", "Invoice System", "Revenue Reports", "Manifest Financial API"],
      dashboardLink: "/harper/billing",
      stats: [
        { label: "Monthly Revenue", value: "$7,800" },
        { label: "Sponsors Billed", value: 24 },
        { label: "Collection Rate", value: "100%" },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; badge: string; hover: string }> = {
      green: {
        bg: "bg-green-50",
        text: "text-green-600",
        badge: "bg-green-100 text-green-700",
        hover: "hover:border-green-400",
      },
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        badge: "bg-blue-100 text-blue-700",
        hover: "hover:border-blue-400",
      },
      indigo: {
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        badge: "bg-indigo-100 text-indigo-700",
        hover: "hover:border-indigo-400",
      },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-600",
        badge: "bg-purple-100 text-purple-700",
        hover: "hover:border-purple-400",
      },
      emerald: {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        badge: "bg-emerald-100 text-emerald-700",
        hover: "hover:border-emerald-400",
      },
    };
    return colors[color] || colors.green;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/harper" className="text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Harper's Team</h1>
                <p className="text-sm text-gray-600">Sponsor Acquisition & Revenue Team</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/harper" className="text-gray-600 hover:text-gray-900 text-sm">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Overview */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Team Harper</h2>
              <p className="text-green-100 text-lg mb-4">
                Sponsor Acquisition & Revenue Generation
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div>
                  <div className="text-3xl font-bold">5</div>
                  <div className="text-green-100 text-sm">Team Members</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">24</div>
                  <div className="text-green-100 text-sm">Active Sponsors</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">$7,800</div>
                  <div className="text-green-100 text-sm">Monthly Revenue</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">80%</div>
                  <div className="text-green-100 text-sm">To Artist Pool</div>
                </div>
              </div>
            </div>
            <Users className="w-16 h-16 text-green-200" />
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
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Discover and onboard local business sponsors</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Manage 3-tier sponsorship system (Tier 1, 2, 3 + Premium)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Deliver quality ad spots across 720 monthly slots</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Fund artist pool with 80% of sponsor revenue</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Revenue Model</h4>
              <div className="space-y-3">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Base Sponsor Revenue</div>
                  <div className="text-2xl font-bold text-green-600">$5,200/month</div>
                  <div className="text-xs text-gray-500">8 Tier 1 + 10 Tier 2 + 6 Tier 3</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Premium Add-ons</div>
                  <div className="text-2xl font-bold text-emerald-600">$2,600/month</div>
                  <div className="text-xs text-gray-500">News/Weather, Sponsored Hours, Takeovers</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Artist Pool Distribution</div>
                  <div className="text-2xl font-bold text-blue-600">$6,240/month</div>
                  <div className="text-xs text-gray-500">80% of total revenue → 340 artists</div>
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
          <h3 className="text-xl font-bold text-gray-900 mb-6">Complete Sponsor Journey</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <WorkflowStep
              number="1"
              title="Discovery"
              description="Blake finds local businesses and craft makers"
              color="blue"
              icon={<Search className="w-5 h-5" />}
            />
            <WorkflowStep
              number="2"
              title="Outreach"
              description="Blake presents sponsorship packages"
              color="indigo"
              icon={<Mail className="w-5 h-5" />}
            />
            <WorkflowStep
              number="3"
              title="Ad Setup"
              description="Dakota schedules and quality-checks ad spots"
              color="purple"
              icon={<CheckCircle className="w-5 h-5" />}
            />
            <WorkflowStep
              number="4"
              title="Management"
              description="Cameron monitors performance and retention"
              color="green"
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <WorkflowStep
              number="5"
              title="Billing"
              description="Riley processes payments and distributions"
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
              href="/harper/opportunities"
              title="Harper AI"
              description="Upsell opportunities"
              icon={<Sparkles className="w-6 h-6" />}
              color="green"
            />
            <QuickLink
              href="/harper/outreach"
              title="Blake Morrison"
              description="Sponsor outreach"
              icon={<Search className="w-6 h-6" />}
              color="blue"
            />
            <QuickLink
              href="/harper/sponsors"
              title="Cameron Wells"
              description="Sponsor management"
              icon={<BarChart3 className="w-6 h-6" />}
              color="indigo"
            />
            <QuickLink
              href="/harper/operations"
              title="Dakota Chen"
              description="Ad operations"
              icon={<CheckCircle className="w-6 h-6" />}
              color="purple"
            />
            <QuickLink
              href="/harper/billing"
              title="Riley Nguyen"
              description="Billing & revenue"
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
    blue: "bg-blue-600",
    indigo: "bg-indigo-600",
    purple: "bg-purple-600",
    green: "bg-green-600",
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
    green: "bg-green-100 text-green-600 hover:bg-green-200",
    blue: "bg-blue-100 text-blue-600 hover:bg-blue-200",
    indigo: "bg-indigo-100 text-indigo-600 hover:bg-indigo-200",
    purple: "bg-purple-100 text-purple-600 hover:bg-purple-200",
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
