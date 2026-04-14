import type { Metadata } from "next";
import Link from "next/link";
import { SharedNav } from "@/components/shared-nav";
import {
  Radio,
  Users,
  Building2,
  TrendingUp,
  Music,
  Headphones,
  BarChart3,
  Quote,
  Star,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Case Study: North Country Radio | TrueFans RADIO",
  description:
    "How AI-powered radio serves 340 artists with zero human DJs. A deep dive into the North Country Radio station built on TrueFans RADIO.",
};

const stats = [
  { label: "Genre", value: "Americana & Country", icon: Music },
  { label: "Format", value: "24/7 AI-Powered", icon: Radio },
  { label: "DJs", value: "4 AI Personalities", icon: Headphones },
  { label: "Live Hours", value: "12hr/day", sub: "6am – 6pm", icon: Star },
  { label: "Artists", value: "340", sub: "in rotation", icon: Users },
  { label: "Songs", value: "2,000+", sub: "in library", icon: Music },
];

const djs = [
  {
    name: "Hank Westwood",
    time: "6 – 9 AM",
    vibe: "Front porch morning energy",
    color: "from-amber-500 to-yellow-500",
  },
  {
    name: "Loretta Merrick",
    time: "9 AM – Noon",
    vibe: "Road trip energy",
    color: "from-orange-500 to-amber-500",
  },
  {
    name: "Doc Holloway",
    time: "Noon – 3 PM",
    vibe: "Music historian",
    color: "from-yellow-600 to-amber-600",
  },
  {
    name: "Cody Rampart",
    time: "3 – 6 PM",
    vibe: "New generation country",
    color: "from-red-500 to-orange-500",
  },
];

const results = [
  { value: "340", label: "Artists in Rotation" },
  { value: "144", label: "Voice Tracks / Day" },
  { value: "$0", label: "DJ Salary Costs" },
  { value: "24/7", label: "Programming" },
  { value: "125", label: "Sponsor Capacity" },
  { value: "$75K/yr", label: "Revenue Potential" },
];

const timeline = [
  {
    day: "Day 1",
    title: "Choose genre template, customize branding",
  },
  {
    day: "Day 2",
    title: "Import music library, configure DJs",
  },
  {
    day: "Day 3",
    title: "Set up schedules, generate imaging",
  },
  {
    day: "Day 4",
    title: "Go live, start artist outreach",
  },
  {
    day: "Week 2+",
    title: "AI teams build pipeline automatically",
  },
];

export default function CaseStudyPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <SharedNav />

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
            <Radio className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Case Study: North Country Radio
          </h1>
          <p className="text-xl sm:text-2xl font-medium bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            How AI-powered radio serves 340 artists with zero human DJs
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20 space-y-12">
        {/* Station Overview */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Station Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 text-center"
              >
                <s.icon className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-zinc-500 mb-1">{s.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                {s.sub && (
                  <p className="text-xs text-gray-500 dark:text-zinc-500">{s.sub}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* The Challenge */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-amber-600" />
            <span>The Challenge</span>
          </h2>
          <p className="text-lg text-gray-700 dark:text-zinc-300 leading-relaxed">
            Traditional radio stations cost $50,000+ to launch and require full-time staff.
            Independent artists have almost no path to radio airplay. Local businesses
            can&apos;t afford traditional radio advertising. The industry needed a fundamentally
            different model.
          </p>
        </section>

        {/* The Solution */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <span>The Solution</span>
          </h2>
          <p className="text-lg text-gray-700 dark:text-zinc-300 leading-relaxed">
            North Country Radio launched in days using the TrueFans RADIO platform. Five AI
            teams handle everything from artist recruitment to sponsor sales to 24/7
            programming — delivering a professional broadcast experience at a fraction of
            traditional costs.
          </p>
        </section>

        {/* Meet the AI DJs */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8 flex items-center justify-center space-x-2">
            <Headphones className="w-6 h-6 text-amber-600" />
            <span>Meet the AI DJs</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {djs.map((dj) => (
              <div key={dj.name} className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg overflow-hidden">
                <div
                  className={`h-3 bg-gradient-to-r ${dj.color}`}
                />
                <div className="p-6 text-center">
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${dj.color} flex items-center justify-center text-white text-xl font-bold mx-auto mb-3`}
                  >
                    {dj.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{dj.name}</h3>
                  <p className="text-sm text-amber-700 font-medium mb-1">{dj.time}</p>
                  <p className="text-sm text-gray-500 italic">{dj.vibe}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Results */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8 flex items-center justify-center space-x-2">
            <TrendingUp className="w-6 h-6 text-amber-600" />
            <span>Results</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {results.map((r) => (
              <div
                key={r.label}
                className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-center text-white"
              >
                <p className="text-3xl sm:text-4xl font-extrabold mb-1">{r.value}</p>
                <p className="text-sm text-amber-100">{r.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue Model */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-amber-600" />
            <span>Revenue Model</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-100">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Artist Subscriptions</h3>
              <p className="text-3xl font-extrabold text-amber-700 mb-1">$3,200<span className="text-lg">/mo</span></p>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Free to $100/mo tiers — artists pay for premium rotation and analytics
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-6 border border-orange-100">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Sponsor Revenue</h3>
              <p className="text-3xl font-extrabold text-orange-700 mb-1">$16,340<span className="text-lg">/mo</span></p>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                $30 – $300/mo tiers — local businesses sponsor the station
              </p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-zinc-500 mb-1">Revenue Split</p>
                <p className="text-gray-700 dark:text-zinc-300">
                  <span className="font-bold text-amber-700 dark:text-amber-400">80%</span> to artist pool{" "}
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="font-bold text-orange-700">20%</span> to operator
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-zinc-500 mb-1">Operator Take-Home</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white">~$6,400<span className="text-base text-gray-500 dark:text-zinc-500">/mo</span></p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works — Timeline */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center space-x-2">
            <Star className="w-6 h-6 text-amber-600" />
            <span>How It Works</span>
          </h2>
          <div className="space-y-6">
            {timeline.map((step, i) => (
              <div key={step.day} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-20 text-right">
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{step.day}</span>
                </div>
                <div className="relative flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow" />
                  {i < timeline.length - 1 && (
                    <div className="w-0.5 h-8 bg-amber-200" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-gray-800 font-medium">{step.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonial */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8">
          <div className="max-w-2xl mx-auto text-center">
            <Quote className="w-10 h-10 text-amber-300 mx-auto mb-4" />
            <blockquote className="text-xl italic text-gray-700 dark:text-zinc-300 leading-relaxed mb-4">
              &ldquo;This station runs itself. I spend 30 minutes a day checking dashboards and
              the AI handles everything else.&rdquo;
            </blockquote>
            <p className="text-sm text-gray-500 font-medium">— Station Operator</p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-lg p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to launch your own station?
          </h2>
          <p className="text-amber-100 text-lg mb-8">
            Get started with TrueFans RADIO and build your AI-powered station today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/operate"
              className="bg-white text-amber-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-50 transition-colors shadow-lg"
            >
              Become an Operator
            </Link>
            <Link
              href="/schedule"
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-colors"
            >
              View Schedule
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
