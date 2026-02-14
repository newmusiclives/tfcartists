"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Users,
  Music,
  Radio,
  TrendingUp,
  Award,
  Headphones,
  BarChart3,
  Heart,
  Sparkles,
  Mic,
  BookOpen,
  Wand2,
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

export default function CassidyTeamPage() {
  const teamMembers: TeamMember[] = [
    {
      id: "cassidy",
      name: "Cassidy Monroe",
      role: "Music Director",
      title: "Head of Curation & Final Authority",
      avatar: "CM",
      color: "teal",
      photoUrl: "/team/cassidy-monroe.png",
      icon: <Award className="w-6 h-6" />,
      responsibilities: [
        "Final tier placement decisions (Bronze/Silver/Gold/Platinum)",
        "Strategic rotation planning and 80/20 transformation",
        "Panel discussion leadership and synthesis",
        "Artist progression pathway design",
        "Cross-team coordination (Riley, Harper, Elliott)",
        "Quality standards and brand integrity",
      ],
      tools: ["Tier Assignment Dashboard", "Panel Analytics", "Strategic Planner", "Artist Journey Tracker"],
      dashboardLink: "/cassidy",
      stats: [
        { label: "Submissions This Month", value: 42 },
        { label: "Placement Rate", value: "95%" },
        { label: "Avg Review Time", value: "5.3 days" },
      ],
    },
    {
      id: "dakota",
      name: "Dakota Wells",
      role: "Production Engineer",
      title: "Technical Assessment Specialist",
      avatar: "DW",
      color: "cyan",
      photoUrl: "/team/dakota-wells.png",
      icon: <Headphones className="w-6 h-6" />,
      responsibilities: [
        "Production quality and warmth assessment",
        "Mix balance and sonic clarity evaluation",
        "Broadcast technical standards verification",
        "Organic vs. over-produced sound analysis",
        "Technical upgrade guidance for Bronze artists",
        "Critical gatekeeper for Gold/Platinum consideration",
      ],
      tools: ["Audio Analyzer", "Mix Review Dashboard", "Technical Scorecard", "Production Quality Metrics"],
      stats: [
        { label: "Tracks Reviewed", value: 42 },
        { label: "Avg Production Score", value: "78/100" },
        { label: "Gold+ Approved", value: 8 },
      ],
    },
    {
      id: "maya",
      name: "Maya Reeves",
      role: "Program Director",
      title: "Commercial Viability & Playlist Strategy",
      avatar: "MR",
      color: "blue",
      photoUrl: "/team/maya-reeves.png",
      icon: <Radio className="w-6 h-6" />,
      responsibilities: [
        "Rotation compatibility and flow assessment",
        "Commercial appeal within indie context",
        "Daypart programming fit analysis",
        "Audience demographic alignment",
        "Determines appropriate rotation frequency",
        "Strategic genre balance maintenance",
      ],
      tools: ["Rotation Planner", "Daypart Analyzer", "Audience Insights", "Programming Strategy Board"],
      stats: [
        { label: "Rotation Slots Filled", value: 156 },
        { label: "80/20 Progress", value: "45%" },
        { label: "Listener Retention", value: "92%" },
      ],
    },
    {
      id: "jesse",
      name: "Jesse Coleman",
      role: "Artist Relations",
      title: "Performance & Development Specialist",
      avatar: "JC",
      color: "indigo",
      photoUrl: "/team/jesse-coleman.png",
      icon: <Mic className="w-6 h-6" />,
      responsibilities: [
        "Vocal performance and emotional delivery",
        "Artist authenticity and stage presence",
        "Long-term career development potential",
        "Live performance translation assessment",
        "Progression pathway recommendations",
        "Artist support and relationship building",
      ],
      tools: ["Performance Evaluator", "Artist Development Tracker", "Progression Planner", "Talent Pipeline"],
      stats: [
        { label: "Artists Mentored", value: 67 },
        { label: "Progression Requests", value: 14 },
        { label: "Upgrade Success Rate", value: "62%" },
      ],
    },
    {
      id: "sam",
      name: "Dr. Sam Chen",
      role: "Musicologist",
      title: "Cultural Context & Artistic Merit",
      avatar: "SC",
      color: "purple",
      photoUrl: "/team/dr-sam-chen.png",
      icon: <BookOpen className="w-6 h-6" />,
      responsibilities: [
        "Musical composition quality evaluation",
        "Cultural significance and historical context",
        "Innovation within tradition assessment",
        "Lyrical depth and storytelling analysis",
        "Validates artistic credibility",
        "Genre authenticity verification",
      ],
      tools: ["Composition Analyzer", "Cultural Context Database", "Genre Classification", "Academic Framework"],
      stats: [
        { label: "Compositions Analyzed", value: 42 },
        { label: "Cultural Insights", value: 38 },
        { label: "Genre Authenticity", value: "94%" },
      ],
    },
    {
      id: "whitley",
      name: "Whitley Cross",
      role: "Audience Development",
      title: "Growth Potential & Analytics",
      avatar: "WC",
      color: "emerald",
      photoUrl: "/team/whitley-cross.png",
      icon: <TrendingUp className="w-6 h-6" />,
      responsibilities: [
        "Market positioning and demographic analysis",
        "Streaming performance and trend tracking",
        "Social media engagement and fanbase assessment",
        "Viral/breakout potential identification",
        "Influences progression timing and tier ceiling",
        "Data-driven growth predictions",
      ],
      tools: ["Streaming Analytics", "Social Media Tracker", "Growth Predictor", "Market Positioning Tool"],
      stats: [
        { label: "Artists Tracked", value: 200 },
        { label: "Breakout Predictions", value: 12 },
        { label: "Social Growth Avg", value: "+23%" },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; badge: string; hover: string }> = {
      teal: {
        bg: "bg-teal-50",
        text: "text-teal-600",
        badge: "bg-teal-100 text-teal-700",
        hover: "hover:border-teal-400",
      },
      cyan: {
        bg: "bg-cyan-50",
        text: "text-cyan-600",
        badge: "bg-cyan-100 text-cyan-700",
        hover: "hover:border-cyan-400",
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
    return colors[color] || colors.teal;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/cassidy" className="text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Cassidy's Team</h1>
                <p className="text-sm text-gray-600">Submission Review & Rotation Curation</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/cassidy" className="text-gray-600 hover:text-gray-900 text-sm">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Team Overview */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Team Cassidy</h2>
              <p className="text-teal-100 text-lg mb-4">
                Submission Review Panel & Rotation Curation
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div>
                  <div className="text-3xl font-bold">6</div>
                  <div className="text-teal-100 text-sm">Expert Judges</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">200</div>
                  <div className="text-teal-100 text-sm">Artists in Rotation</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">95%</div>
                  <div className="text-teal-100 text-sm">Placement Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">5-7</div>
                  <div className="text-teal-100 text-sm">Days Review Time</div>
                </div>
              </div>
            </div>
            <Users className="w-16 h-16 text-teal-200" />
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
                  <span className="text-teal-600 mt-1">✓</span>
                  <span>Expert review of all artist submissions (5-7 day process)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-teal-600 mt-1">✓</span>
                  <span>Assign tier placements (Bronze, Silver, Gold, Platinum)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-teal-600 mt-1">✓</span>
                  <span>Maintain 95% placement rate with tiered support system</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-teal-600 mt-1">✓</span>
                  <span>Provide detailed feedback and progression pathways</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-teal-600 mt-1">✓</span>
                  <span>Drive 80/20 mainstream-to-indie transformation</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">The Four-Tier System</h4>
              <div className="space-y-2">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-amber-900">🥉 Bronze</span>
                    <span className="text-xs text-amber-700">60% of artists</span>
                  </div>
                  <div className="text-sm text-amber-800">4-6 spins/week • Entry point • Development focus</div>
                </div>
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">🥈 Silver</span>
                    <span className="text-xs text-gray-700">25% of artists</span>
                  </div>
                  <div className="text-sm text-gray-800">10-14 spins/week • Featured status • Growth focus</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-yellow-900">🥇 Gold</span>
                    <span className="text-xs text-yellow-700">12% of artists</span>
                  </div>
                  <div className="text-sm text-yellow-800">20-25 spins/week • Heavy rotation • Premium support</div>
                </div>
                <div className="bg-purple-50 border border-purple-300 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-purple-900">💎 Platinum</span>
                    <span className="text-xs text-purple-700">3% of artists</span>
                  </div>
                  <div className="text-sm text-purple-800">30+ spins/week • Anchor artists • Maximum support</div>
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

        {/* Review Process */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Review Process (5-7 Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <WorkflowStep
              number="1"
              title="Submission"
              description="Riley's team invites artist and submits track with discovery context"
              color="teal"
              icon={<Music className="w-5 h-5" />}
            />
            <WorkflowStep
              number="2"
              title="Independent Review"
              description="All 6 judges independently score and provide detailed feedback (Days 1-3)"
              color="cyan"
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <WorkflowStep
              number="3"
              title="Panel Discussion"
              description="Team meets to discuss, debate, and build consensus (Day 4)"
              color="blue"
              icon={<Users className="w-5 h-5" />}
            />
            <WorkflowStep
              number="4"
              title="Final Decision"
              description="Cassidy assigns tier, spins/week, and progression pathway (Days 5-7)"
              color="purple"
              icon={<Award className="w-5 h-5" />}
            />
          </div>
        </div>

        {/* Cross-Team Coordination */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Cross-Team Integration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-semibold text-purple-900">← Riley's Team</h4>
              </div>
              <p className="text-sm text-purple-800">
                Discovers artists, submits for review with context, receives tier decisions, manages artist communication
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-900">→ Harper's Team</h4>
              </div>
              <p className="text-sm text-green-800">
                Receives tier inventory (Gold/Platinum artists), matches sponsors with artists, creates partnership opportunities
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-blue-900">→ Elliott's Team</h4>
              </div>
              <p className="text-sm text-blue-800">
                Receives curated content, promotes placed artists, drives listener engagement, provides feedback on performance
              </p>
            </div>
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
    teal: "bg-teal-600",
    cyan: "bg-cyan-600",
    blue: "bg-blue-600",
    purple: "bg-purple-600",
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
