"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Users,
  Radio,
  CalendarDays,
  ListMusic,
  Megaphone,
  MessageCircle,
  Shield,
  BarChart3,
  CheckCircle,
  Clock,
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
  photoUrl: string;
  responsibilities: string[];
  tools: string[];
  dashboardLink?: string;
  stats: {
    label: string;
    value: string | number;
  }[];
}

export default function ParkerTeamPage() {
  const teamMembers: TeamMember[] = [
    {
      id: "parker",
      name: "Parker Hayes",
      role: "Station Director",
      title: "Team Lead & Station Oversight",
      avatar: "PH",
      color: "rose",
      photoUrl: "/team/parker-hayes.png",
      icon: <Radio className="w-6 h-6" />,
      responsibilities: [
        "Strategic oversight and cross-team coordination",
        "FCC compliance monitoring and enforcement",
        "Emergency broadcast protocols",
        "Performance reviews and team management",
        "Budget management and resource allocation",
        "Station-wide policy decisions",
      ],
      tools: ["Station Dashboard", "Compliance Monitor", "Team Reports", "Budget Tracker"],
      dashboardLink: "/parker",
      stats: [
        { label: "Station Uptime", value: "99.9%" },
        { label: "Team Performance", value: "96/100" },
        { label: "Compliance Rating", value: "A+" },
      ],
    },
    {
      id: "sage",
      name: "Sage Calloway",
      role: "Program Director",
      title: "Programming & Format Strategy",
      avatar: "SC",
      color: "indigo",
      photoUrl: "/team/sage-calloway.png",
      icon: <CalendarDays className="w-6 h-6" />,
      responsibilities: [
        "Show scheduling and daypart strategy",
        "Format compliance and clock management",
        "Show-prep coordination with DJs",
        "Special event programming",
        "Syndication management",
        "Daypart performance analysis",
      ],
      tools: ["Schedule Editor", "Format Clock", "Daypart Analytics", "Show Prep System"],
      dashboardLink: "/parker/programming",
      stats: [
        { label: "Schedule Fill Rate", value: "100%" },
        { label: "Format Compliance", value: "98%" },
        { label: "Listener Retention", value: "72%" },
      ],
    },
    {
      id: "wren",
      name: "Wren Nakamura",
      role: "Music Director",
      title: "Music Rotation & Library Management",
      avatar: "WN",
      color: "violet",
      photoUrl: "/team/wren-nakamura.png",
      icon: <ListMusic className="w-6 h-6" />,
      responsibilities: [
        "Music rotation management and scheduling",
        "New music evaluation and adds",
        "Category balance optimization",
        "Request tracking and fulfillment",
        "Library maintenance and metadata",
        "Music research and trend analysis",
      ],
      tools: ["Music Library", "Rotation Planner", "Request Tracker", "Category Analyzer"],
      dashboardLink: "/parker/music",
      stats: [
        { label: "Library Size", value: "2,400+" },
        { label: "Rotation Freshness", value: "High" },
        { label: "Category Balance", value: "94%" },
      ],
    },
    {
      id: "nolan",
      name: "Nolan Torres",
      role: "Traffic Manager",
      title: "Commercial Scheduling & Ad Ops",
      avatar: "NT",
      color: "orange",
      photoUrl: "/team/nolan-torres.png",
      icon: <Megaphone className="w-6 h-6" />,
      responsibilities: [
        "Commercial scheduling and spot placement",
        "Ad inventory management and optimization",
        "Spot load balancing across dayparts",
        "Make-good tracking and resolution",
        "Avail reporting for sales team",
        "Sponsor fulfillment verification",
      ],
      tools: ["Traffic Log", "Avail Report", "Make-Good Tracker", "Sponsor Dashboard"],
      dashboardLink: "/parker/traffic",
      stats: [
        { label: "Fill Rate", value: "87%" },
        { label: "Avails Remaining", value: "24" },
        { label: "Make-Goods Pending", value: "3" },
      ],
    },
    {
      id: "ivy",
      name: "Ivy Brennan",
      role: "Listener Services Director",
      title: "Community Engagement & Feedback",
      avatar: "IB",
      color: "teal",
      photoUrl: "/team/ivy-brennan.png",
      icon: <MessageCircle className="w-6 h-6" />,
      responsibilities: [
        "Listener feedback management and response",
        "Request line coordination",
        "Contest planning and execution",
        "Community engagement initiatives",
        "Social media monitoring and response",
        "Listener satisfaction surveys",
      ],
      tools: ["Request Board", "Contest Manager", "Feedback Inbox", "Survey Builder"],
      dashboardLink: "/parker/listeners",
      stats: [
        { label: "Requests This Week", value: 48 },
        { label: "Satisfaction Score", value: "4.7/5" },
        { label: "Contest Participation", value: "320" },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; badge: string; hover: string }> = {
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
      violet: {
        bg: "bg-violet-50",
        text: "text-violet-600",
        badge: "bg-violet-100 text-violet-700",
        hover: "hover:border-violet-400",
      },
      orange: {
        bg: "bg-orange-50",
        text: "text-orange-600",
        badge: "bg-orange-100 text-orange-700",
        hover: "hover:border-orange-400",
      },
      teal: {
        bg: "bg-teal-50",
        text: "text-teal-600",
        badge: "bg-teal-100 text-teal-700",
        hover: "hover:border-teal-400",
      },
    };
    return colors[color] || colors.rose;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/parker" className="text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Parker&apos;s Team</h1>
                <p className="text-sm text-gray-600">Station Management & Operations</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/parker" className="text-gray-600 hover:text-gray-900 text-sm">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Overview */}
        <div className="bg-gradient-to-r from-rose-600 to-orange-600 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Team Parker</h2>
              <p className="text-rose-100 text-lg mb-4">
                Station Management & Day-to-Day Operations
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div>
                  <div className="text-3xl font-bold">5</div>
                  <div className="text-rose-100 text-sm">Team Members</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-rose-100 text-sm">Station Coverage</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-rose-100 text-sm">Format Compliance</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">A+</div>
                  <div className="text-rose-100 text-sm">Compliance Rating</div>
                </div>
              </div>
            </div>
            <Radio className="w-16 h-16 text-rose-200" />
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
                  <span className="text-rose-600 mt-1">&#10003;</span>
                  <span>Oversee day-to-day station operations and programming</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-600 mt-1">&#10003;</span>
                  <span>Manage music rotation, scheduling, and format compliance</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-600 mt-1">&#10003;</span>
                  <span>Handle commercial traffic, ad inventory, and sponsor fulfillment</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-600 mt-1">&#10003;</span>
                  <span>Engage listeners through requests, contests, and community building</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Station Operations</h4>
              <div className="space-y-3">
                <div className="bg-rose-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Live Programming</div>
                  <div className="text-2xl font-bold text-rose-600">6am - 6pm</div>
                  <div className="text-xs text-gray-500">12 DJs across weekday & weekend shifts</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Automation</div>
                  <div className="text-2xl font-bold text-indigo-600">6pm - 6am</div>
                  <div className="text-xs text-gray-500">AI-managed overnight programming</div>
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
                        <Image src={member.photoUrl} alt={member.name} width={64} height={64} className="w-16 h-16 rounded-xl object-cover shadow-md" />
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

        {/* Team Workflow */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Station Operations Workflow</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <WorkflowStep
              number="1"
              title="Programming"
              description="Sage builds the show schedule and manages format compliance"
              color="indigo"
              icon={<CalendarDays className="w-5 h-5" />}
            />
            <WorkflowStep
              number="2"
              title="Music"
              description="Wren curates rotation, evaluates new music, and balances categories"
              color="violet"
              icon={<ListMusic className="w-5 h-5" />}
            />
            <WorkflowStep
              number="3"
              title="Traffic"
              description="Nolan schedules commercials and manages ad inventory"
              color="orange"
              icon={<Megaphone className="w-5 h-5" />}
            />
            <WorkflowStep
              number="4"
              title="Listener Services"
              description="Ivy manages requests, contests, and community engagement"
              color="teal"
              icon={<MessageCircle className="w-5 h-5" />}
            />
            <WorkflowStep
              number="5"
              title="Director Review"
              description="Parker reviews operations and coordinates across all teams"
              color="rose"
              icon={<Shield className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Team Dashboards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <QuickLink
              href="/parker"
              title="Parker Hayes"
              description="Station overview"
              icon={<Radio className="w-6 h-6" />}
              color="rose"
            />
            <QuickLink
              href="/parker/programming"
              title="Sage Calloway"
              description="Programming"
              icon={<CalendarDays className="w-6 h-6" />}
              color="indigo"
            />
            <QuickLink
              href="/parker/music"
              title="Wren Nakamura"
              description="Music library"
              icon={<ListMusic className="w-6 h-6" />}
              color="violet"
            />
            <QuickLink
              href="/parker/traffic"
              title="Nolan Torres"
              description="Traffic & ads"
              icon={<Megaphone className="w-6 h-6" />}
              color="orange"
            />
            <QuickLink
              href="/parker/listeners"
              title="Ivy Brennan"
              description="Listener services"
              icon={<MessageCircle className="w-6 h-6" />}
              color="teal"
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
    violet: "bg-violet-600",
    orange: "bg-orange-600",
    teal: "bg-teal-600",
    rose: "bg-rose-600",
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
    rose: "bg-rose-100 text-rose-600 hover:bg-rose-200",
    indigo: "bg-indigo-100 text-indigo-600 hover:bg-indigo-200",
    violet: "bg-violet-100 text-violet-600 hover:bg-violet-200",
    orange: "bg-orange-100 text-orange-600 hover:bg-orange-200",
    teal: "bg-teal-100 text-teal-600 hover:bg-teal-200",
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
