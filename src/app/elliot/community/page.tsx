"use client";

import Link from "next/link";
import { ArrowLeft, Users, MessageCircle, Heart, Award, Calendar, Star, TrendingUp } from "lucide-react";

export default function CommunityPage() {
  const communityStats = {
    totalMembers: 5600,
    activeMembers: 1250,
    growthRate: 18,
    engagementRate: 42,
    totalPosts: 3420,
    totalComments: 8950,
    superFans: 125,
    ambassadors: 25,
  };

  const topMembers = [
    {
      id: 1,
      name: "Jessica Turner",
      avatar: "JT",
      tier: "Ambassador" as const,
      points: 8450,
      posts: 124,
      likes: 3200,
      joinDate: "Jan 2024",
      lastActive: "2 hours ago",
      badge: "🏆",
    },
    {
      id: 2,
      name: "Mike Rodriguez",
      avatar: "MR",
      tier: "Super Fan" as const,
      points: 6200,
      posts: 98,
      likes: 2450,
      joinDate: "Feb 2024",
      lastActive: "5 hours ago",
      badge: "⭐",
    },
    {
      id: 3,
      name: "Sarah Chen",
      avatar: "SC",
      tier: "Ambassador" as const,
      points: 7800,
      posts: 145,
      likes: 2890,
      joinDate: "Dec 2023",
      lastActive: "1 day ago",
      badge: "🏆",
    },
    {
      id: 4,
      name: "David Williams",
      avatar: "DW",
      tier: "Super Fan" as const,
      points: 5900,
      posts: 87,
      likes: 2100,
      joinDate: "Mar 2024",
      lastActive: "3 hours ago",
      badge: "⭐",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      user: "Jessica Turner",
      action: "Started a discussion",
      topic: "Best Americana Albums of 2024",
      time: "2 hours ago",
      engagement: 42,
    },
    {
      id: 2,
      user: "Mike Rodriguez",
      action: "Shared a playlist",
      topic: "Road Trip Essentials",
      time: "4 hours ago",
      engagement: 38,
    },
    {
      id: 3,
      user: "Sarah Chen",
      action: "Posted concert photos",
      topic: "Mountain Brothers Live at Red Rocks",
      time: "6 hours ago",
      engagement: 67,
    },
    {
      id: 4,
      user: "David Williams",
      action: "Created a poll",
      topic: "Which DJ should host a special Saturday show?",
      time: "1 day ago",
      engagement: 89,
    },
  ];

  const upcomingEvents = [
    {
      name: "Virtual Listening Party",
      date: "Dec 15, 2024",
      time: "7:00 PM EST",
      host: "Hank Westwood",
      attendees: 67,
      type: "Virtual" as const,
    },
    {
      name: "Community Songwriting Workshop",
      date: "Dec 18, 2024",
      time: "6:00 PM EST",
      host: "Sarah Blake",
      attendees: 34,
      type: "Hybrid" as const,
    },
    {
      name: "Fan Q&A with The Mountain Brothers",
      date: "Dec 20, 2024",
      time: "8:00 PM EST",
      host: "Elliot AI",
      attendees: 92,
      type: "Virtual" as const,
    },
  ];

  const discussionTopics = [
    { topic: "New Music Fridays", posts: 234, members: 156, lastActive: "10 min ago" },
    { topic: "Concert Meetups", posts: 189, members: 98, lastActive: "1 hour ago" },
    { topic: "Gear & Equipment", posts: 145, members: 67, lastActive: "2 hours ago" },
    { topic: "Songwriting Tips", posts: 201, members: 134, lastActive: "30 min ago" },
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
            label="Total Members"
            value={communityStats.totalMembers.toLocaleString()}
            change={`+${communityStats.growthRate}%`}
            positive={true}
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            label="Active This Week"
            value={communityStats.activeMembers.toLocaleString()}
            change={`${communityStats.engagementRate}% engaged`}
            positive={true}
          />
          <MetricCard
            icon={<MessageCircle className="w-6 h-6 text-blue-600" />}
            label="Total Posts"
            value={communityStats.totalPosts.toLocaleString()}
            change={`${communityStats.totalComments.toLocaleString()} comments`}
            positive={true}
          />
          <MetricCard
            icon={<Award className="w-6 h-6 text-orange-600" />}
            label="Super Fans"
            value={communityStats.superFans}
            change={`${communityStats.ambassadors} ambassadors`}
            positive={true}
          />
        </section>

        {/* Top Members Leaderboard */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Top Community Members</h2>
              <p className="text-gray-600 text-sm mt-1">
                Most active and engaged community leaders
              </p>
            </div>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              View Full Leaderboard
            </button>
          </div>

          <div className="space-y-3">
            {topMembers.map((member, idx) => (
              <MemberCard key={member.id} rank={idx + 1} {...member} />
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Recent Community Activity</h2>

          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <ActivityRow key={activity.id} {...activity} />
            ))}
          </div>

          <div className="mt-6 text-center">
            <button className="text-purple-600 hover:text-purple-700 font-semibold">
              View All Activity →
            </button>
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

function MemberCard({ rank, name, avatar, tier, points, posts, likes, joinDate, lastActive, badge }: {
  rank: number;
  name: string;
  avatar: string;
  tier: "Ambassador" | "Super Fan";
  points: number;
  posts: number;
  likes: number;
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
              <span>{points.toLocaleString()} points</span>
              <span>•</span>
              <span>{posts} posts</span>
              <span>•</span>
              <span>{likes.toLocaleString()} likes</span>
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
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Heart className="w-4 h-4" />
          <span>{engagement}</span>
        </div>
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
          {date} at {time} • Host: {host}
        </div>
      </div>
      <div className="text-sm">
        <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
          {attendees} attending
        </div>
      </div>
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
