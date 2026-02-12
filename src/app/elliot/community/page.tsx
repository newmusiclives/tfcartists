"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, MessageCircle, Heart, Award, Calendar, Star, TrendingUp } from "lucide-react";

interface ElliotStats {
  totalListeners: number;
  byTier: { CASUAL: number; REGULAR: number; SUPER_FAN: number; EVANGELIST: number };
  community: { communityMembers: number; scoutCount: number };
  activity: { engagementsThisMonth: number };
}

interface ListenerData {
  id: string;
  name: string | null;
  email: string | null;
  tier: string;
  engagementScore: number;
  totalSessions: number;
  totalListeningHours: number;
  communityMember: boolean;
  createdAt: string;
  lastListenedAt: string | null;
}

export default function CommunityPage() {
  const [stats, setStats] = useState<ElliotStats | null>(null);
  const [superFans, setSuperFans] = useState<ListenerData[]>([]);
  const [evangelists, setEvangelists] = useState<ListenerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, superFansRes, evangelistsRes] = await Promise.all([
          fetch("/api/elliot/stats"),
          fetch("/api/elliot/listeners?tier=SUPER_FAN&sortBy=engagementScore&sortOrder=desc&limit=10"),
          fetch("/api/elliot/listeners?tier=EVANGELIST&sortBy=engagementScore&sortOrder=desc&limit=10"),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        if (superFansRes.ok) {
          const data = await superFansRes.json();
          setSuperFans(data.listeners || []);
        }
        if (evangelistsRes.ok) {
          const data = await evangelistsRes.json();
          setEvangelists(data.listeners || []);
        }
      } catch (error) {
        console.error("Error fetching community data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-600">Loading community...</div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-red-600">Error loading community data</div>
      </main>
    );
  }

  const topMembers = [...evangelists, ...superFans].slice(0, 10);

  function formatTimeAgo(dateStr: string | null) {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  // Presentational defaults for activity/events/topics (no dedicated DB model yet)
  const recentActivity = [
    { id: 1, user: "Community Member", action: "Started a discussion", topic: "Best Americana Albums", time: "Recently", engagement: 0 },
  ];

  const upcomingEvents = [
    { name: "Virtual Listening Party", date: "Coming soon", time: "TBD", host: "Elliot AI", attendees: 0, type: "Virtual" as const },
  ];

  const discussionTopics = [
    { topic: "New Music Fridays", posts: 0, members: stats.community.communityMembers, lastActive: "Recently" },
    { topic: "Concert Meetups", posts: 0, members: 0, lastActive: "Recently" },
  ];

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
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Hub</h1>
              <p className="text-gray-600">
                Engage with your most passionate listeners and build culture
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Users className="w-6 h-6 text-purple-600" />}
            label="Community Members"
            value={stats.community.communityMembers.toLocaleString()}
            change={`of ${stats.totalListeners.toLocaleString()} total listeners`}
            positive={true}
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            label="Engagements This Month"
            value={stats.activity.engagementsThisMonth.toLocaleString()}
            change="listener interactions"
            positive={true}
          />
          <MetricCard
            icon={<MessageCircle className="w-6 h-6 text-blue-600" />}
            label="Scouts"
            value={stats.community.scoutCount.toLocaleString()}
            change="active scout program"
            positive={true}
          />
          <MetricCard
            icon={<Award className="w-6 h-6 text-orange-600" />}
            label="Super Fans"
            value={stats.byTier.SUPER_FAN + stats.byTier.EVANGELIST}
            change={`${stats.byTier.EVANGELIST} evangelists`}
            positive={true}
          />
        </section>

        {/* Top Members Leaderboard */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Top Community Members</h2>
              <p className="text-gray-600 text-sm mt-1">
                Most engaged Super Fans and Evangelists
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {topMembers.length > 0 ? (
              topMembers.map((member, idx) => (
                <MemberCard
                  key={member.id}
                  rank={idx + 1}
                  name={member.name || member.email || "Anonymous"}
                  avatar={(member.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  tier={member.tier === "EVANGELIST" ? "Ambassador" : "Super Fan"}
                  points={member.engagementScore}
                  sessions={member.totalSessions}
                  hours={Math.round(member.totalListeningHours)}
                  joinDate={formatDate(member.createdAt)}
                  lastActive={formatTimeAgo(member.lastListenedAt)}
                  badge={member.tier === "EVANGELIST" ? "🏆" : "⭐"}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No super fans or evangelists yet. Build your community to see top members here.
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Recent Community Activity</h2>

          <div className="space-y-3">
            {stats.activity.engagementsThisMonth > 0 ? (
              recentActivity.map((activity) => (
                <ActivityRow key={activity.id} {...activity} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No community activity yet. Engagements will appear here as listeners interact.
              </div>
            )}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Upcoming Community Events</h2>
          <p className="text-gray-600 text-sm mb-6">
            Virtual and in-person events for the community
          </p>

          <div className="space-y-3">
            {upcomingEvents.map((event, idx) => (
              <EventRow key={idx} {...event} />
            ))}
          </div>

          <div className="mt-6 text-center">
            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium">
              Create New Event
            </button>
          </div>
        </section>

        {/* Discussion Topics */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Popular Discussion Topics</h2>
          <p className="text-gray-600 text-sm mb-6">
            Most active conversations in the community
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discussionTopics.map((topic) => (
              <TopicCard key={topic.topic} {...topic} />
            ))}
          </div>
        </section>

        {/* Community Programs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProgramCard
            icon={<Award className="w-8 h-8 text-purple-600" />}
            title="Ambassador Program"
            description="Recognize and reward your most engaged community leaders"
            buttonText="Manage Program"
          />
          <ProgramCard
            icon={<Star className="w-8 h-8 text-yellow-600" />}
            title="Rewards System"
            description="Points, badges, and exclusive perks for members"
            buttonText="View Rewards"
          />
          <ProgramCard
            icon={<Calendar className="w-8 h-8 text-blue-600" />}
            title="Events Calendar"
            description="Schedule and manage community events"
            buttonText="View Calendar"
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
  change,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-3 mb-3">
        {icon}
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className={`text-xs font-semibold ${positive ? 'text-green-600' : 'text-gray-600'}`}>
        {change}
      </div>
    </div>
  );
}

function MemberCard({ rank, name, avatar, tier, points, sessions, hours, joinDate, lastActive, badge }: {
  rank: number;
  name: string;
  avatar: string;
  tier: "Ambassador" | "Super Fan";
  points: number;
  sessions: number;
  hours: number;
  joinDate: string;
  lastActive: string;
  badge: string;
}) {
  const tierConfig: Record<string, { bg: string; text: string; border: string }> = {
    Ambassador: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
    "Super Fan": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  };
  const config = tierConfig[tier];

  return (
    <div className={`border-2 ${config.border} rounded-lg p-4 bg-white`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              {rank}
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              {avatar}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <div className="font-bold text-gray-900">{name}</div>
              <span className="text-lg">{badge}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.text} font-medium`}>
                {tier}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span>Score: {points}</span>
              <span>•</span>
              <span>{sessions} sessions</span>
              <span>•</span>
              <span>{hours}h listened</span>
            </div>
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-gray-600">Joined {joinDate}</div>
          <div className="text-green-600 font-medium">{lastActive}</div>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ user, action, topic, time, engagement }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
        <MessageCircle className="w-8 h-8 text-purple-600" />
        <div>
          <div className="text-sm">
            <span className="font-semibold text-gray-900">{user}</span>
            <span className="text-gray-600"> {action}</span>
          </div>
          <div className="text-sm font-medium text-gray-900 mt-1">{topic}</div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {engagement > 0 && (
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Heart className="w-4 h-4" />
            <span>{engagement}</span>
          </div>
        )}
        <div className="text-sm text-gray-500">{time}</div>
      </div>
    </div>
  );
}

function EventRow({ name, date, time, host, attendees, type }: {
  name: string;
  date: string;
  time: string;
  host: string;
  attendees: number;
  type: "Virtual" | "Hybrid" | "In-Person";
}) {
  const typeConfig: Record<string, { bg: string; text: string }> = {
    Virtual: { bg: "bg-blue-100", text: "text-blue-700" },
    Hybrid: { bg: "bg-purple-100", text: "text-purple-700" },
    "In-Person": { bg: "bg-green-100", text: "text-green-700" },
  };
  const eventConfig = typeConfig[type];

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-purple-200">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <div className="font-semibold text-gray-900">{name}</div>
          <span className={`text-xs px-2 py-1 rounded-full ${eventConfig.bg} ${eventConfig.text} font-medium`}>
            {type}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          <Calendar className="w-4 h-4 inline mr-1" />
          {date} at {time} - Host: {host}
        </div>
      </div>
      {attendees > 0 && (
        <div className="text-sm">
          <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
            {attendees} attending
          </div>
        </div>
      )}
    </div>
  );
}

function TopicCard({ topic, posts, members, lastActive }: any) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
      <div className="flex items-center space-x-2 mb-3">
        <MessageCircle className="w-5 h-5 text-purple-600" />
        <h3 className="font-bold text-gray-900">{topic}</h3>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <div className="font-bold text-gray-900">{posts}</div>
          <div className="text-xs text-gray-500">posts</div>
        </div>
        <div>
          <div className="font-bold text-gray-900">{members}</div>
          <div className="text-xs text-gray-500">members</div>
        </div>
        <div>
          <div className="text-xs text-green-600 font-medium">{lastActive}</div>
          <div className="text-xs text-gray-500">last active</div>
        </div>
      </div>
    </div>
  );
}

function ProgramCard({ icon, title, description, buttonText }: any) {
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
