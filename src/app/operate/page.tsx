"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  Radio,
  ArrowLeft,
  Settings,
  DollarSign,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  Building2,
  Target,
  Music,
  Wand2,
  CalendarDays,
  Clock,
  Mic,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { useStation } from "@/contexts/StationContext";
import { STATION_TEMPLATES } from "@/lib/station-templates";

export default function OperatePage() {
  const { currentStation } = useStation();
  const ctaRef = useRef<HTMLDivElement>(null);

  const scrollToCTA = () => {
    ctaRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Section 1: Nav Bar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 text-amber-700 hover:text-amber-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <Radio className="w-5 h-5" />
              <span className="font-bold">{currentStation.name}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Section 2: Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
            <Settings className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Run Your Own AI-Powered Radio Station
          </h1>
          <p className="text-xl sm:text-2xl font-medium bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-6">
            Build a real business. Earn up to $100K/year. Launch in minutes.
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            No broadcast license needed. No expensive equipment. Our AI agents handle artist outreach,
            sponsor sales, listener growth, and music curation while you focus on building your brand and community.
          </p>
          <button
            onClick={scrollToCTA}
            className="bg-amber-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg"
          >
            See How It Works
          </button>
        </div>
      </section>

      {/* Section 3: Benefits Grid */}
      <section className="py-16 px-4 bg-white/60">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Why Operate a Station?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: DollarSign,
                title: "Two Revenue Streams",
                desc: "Artist subscription fees are 100% yours. Plus earn 20% commission on all sponsor revenue. Two income sources from day one.",
              },
              {
                icon: Sparkles,
                title: "AI Does the Heavy Lifting",
                desc: "Four AI agents handle artist outreach, sponsor sales, listener growth, and music curation. You manage the strategy, they do the work.",
              },
              {
                icon: Zap,
                title: "Launch in Minutes",
                desc: "Choose from 5 genre templates with pre-built DJ personalities, schedules, and station branding. Your station can be live in about 5 minutes.",
              },
              {
                icon: TrendingUp,
                title: "Scalable Business Model",
                desc: "Grow at your own pace to 340 artists and 125 sponsors. The AI scales with you — no additional staff needed.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-100 rounded-lg mb-4">
                  <item.icon className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { step: "1", title: "Choose a Template", desc: "Pick a genre that fits your vision." },
              { step: "2", title: "Brand Your Station", desc: "Name it, set colors, write a tagline." },
              { step: "3", title: "Configure AI DJs", desc: "Customize personalities and voices." },
              { step: "4", title: "Set Your Schedule", desc: "Assign DJ shifts and automation." },
              { step: "5", title: "Launch & Earn", desc: "Go live and start building revenue." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-600 text-white rounded-full font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Revenue Model */}
      <section className="py-20 px-4 bg-gradient-to-r from-amber-800 to-orange-700 text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Revenue Model</h2>
          <p className="text-amber-200 text-center mb-10 max-w-2xl mx-auto">
            Two revenue streams working together. Artist subscriptions you keep 100%. Sponsor revenue where you earn 20% commission.
          </p>

          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { value: "$8,350/mo", label: "Gross Revenue at Capacity" },
              { value: "~$100K/yr", label: "Annual Earning Potential" },
              { value: "$3,350/mo", label: "Net Profit After Expenses" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-amber-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Artist Subscriptions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold mb-1">Artist Subscriptions</h3>
              <p className="text-amber-200 text-sm mb-4">100% retained by you</p>
              <div className="space-y-2">
                {[
                  { tier: "Free", price: "$0/mo", artists: "Unlimited" },
                  { tier: "Bronze", price: "$5/mo", artists: "80 artists" },
                  { tier: "Silver", price: "$20/mo", artists: "40 artists" },
                  { tier: "Gold", price: "$50/mo", artists: "30 artists" },
                  { tier: "Platinum", price: "$120/mo", artists: "10 artists" },
                ].map((row) => (
                  <div key={row.tier} className="flex items-center justify-between text-sm py-1.5 border-b border-white/10 last:border-0">
                    <span className="font-medium">{row.tier}</span>
                    <span className="text-amber-200">{row.price}</span>
                    <span className="text-amber-300 text-xs">{row.artists}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 text-sm font-semibold text-amber-100">
                At capacity: ~$3,900/month
              </div>
            </div>

            {/* Sponsor Revenue */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold mb-1">Sponsor Revenue</h3>
              <p className="text-amber-200 text-sm mb-4">20% commission (80% funds artist pool)</p>
              <div className="space-y-2">
                {[
                  { tier: "Bronze", price: "$50/mo" },
                  { tier: "Silver", price: "$100/mo" },
                  { tier: "Gold", price: "$200/mo" },
                  { tier: "Platinum", price: "$400/mo" },
                ].map((row) => (
                  <div key={row.tier} className="flex items-center justify-between text-sm py-1.5 border-b border-white/10 last:border-0">
                    <span className="font-medium">{row.tier}</span>
                    <span className="text-amber-200">{row.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 text-sm font-semibold text-amber-100">
                At 125 sponsors: ~$4,450/month your commission
              </div>
            </div>
          </div>

          <p className="text-center text-amber-300 text-sm mt-6">
            Estimated ~$5K/month in operating expenses (streaming, AI services, platform fees).
          </p>
        </div>
      </section>

      {/* Section 6: Station Templates Showcase */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            5 Ready-Made Templates
          </h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Each template comes with pre-built DJ personalities, schedules, and station branding. Choose one and customize it to make it yours.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {STATION_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-2" style={{ backgroundColor: template.primaryColor }} />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{template.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{template.genre}</p>
                  <div className="text-xs text-gray-400">
                    {template.djPresets.length} DJ{template.djPresets.length !== 1 ? "s" : ""} included
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: AI Agents Grid */}
      <section className="py-16 px-4 bg-white/60">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            Your AI Team
          </h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Four specialized AI agents work around the clock to grow your station. Each one handles a critical part of the business.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                name: "Riley",
                color: "purple",
                icon: Users,
                role: "Artist Outreach",
                capacity: "340 artists",
                desc: "Discovers emerging artists, runs outreach campaigns, manages onboarding, and handles upgrade opportunities.",
              },
              {
                name: "Harper",
                color: "green",
                icon: Building2,
                role: "Sponsor Sales",
                capacity: "125 sponsors",
                desc: "Identifies potential sponsors, pitches packages, manages relationships, and tracks billing.",
              },
              {
                name: "Elliot",
                color: "blue",
                icon: Target,
                role: "Listener Growth",
                capacity: "6,000+ listeners",
                desc: "Creates viral content, activates artist fans, builds community, and drives habit formation.",
              },
              {
                name: "Cassidy",
                color: "teal",
                icon: Music,
                role: "Music Curation",
                capacity: "8,640 tracks/mo",
                desc: "Reviews submissions, assigns rotation tiers, manages playlists, and ensures quality programming.",
              },
            ].map((agent) => (
              <div
                key={agent.name}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`inline-flex items-center justify-center w-10 h-10 bg-${agent.color}-100 rounded-lg`}>
                    <agent.icon className={`w-5 h-5 text-${agent.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    <p className={`text-xs text-${agent.color}-600 font-medium`}>{agent.role}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{agent.desc}</p>
                <div className={`text-xs font-medium text-${agent.color}-700 bg-${agent.color}-50 px-2 py-1 rounded inline-block`}>
                  Capacity: {agent.capacity}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: Station Tools Grid */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            Station Management Tools
          </h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Everything you need to run your station, all in one place.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: Settings, title: "Admin Hub", desc: "Central command for your station" },
              { icon: Wand2, title: "Station Wizard", desc: "Guided setup and configuration" },
              { icon: Music, title: "Music Library", desc: "Manage tracks and submissions" },
              { icon: Users, title: "DJ Editor", desc: "Create and customize AI DJs" },
              { icon: CalendarDays, title: "Schedule Editor", desc: "Build your programming grid" },
              { icon: Mic, title: "Station Imaging", desc: "Jingles, sweepers, and IDs" },
              { icon: Clock, title: "Radio Clocks", desc: "Hour-by-hour format templates" },
              { icon: Sparkles, title: "Show Features", desc: "Segments, contests, and bits" },
              { icon: SlidersHorizontal, title: "Stream Engineering", desc: "Audio quality and encoding" },
            ].map((tool) => (
              <div
                key={tool.title}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <tool.icon className="w-5 h-5 text-amber-600 mb-2" />
                <h3 className="font-medium text-gray-900 text-sm">{tool.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 9: Transition + CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Build Your Station?
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            Launch in about 5 minutes. No credit card required.
          </p>
          <div
            ref={ctaRef}
            className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 sm:p-12 shadow-xl"
          >
            <h3 className="text-2xl font-bold text-white mb-3">Start Your Station Today</h3>
            <p className="text-amber-100 mb-6 max-w-lg mx-auto">
              Choose a template, customize your brand, and let the AI agents build your business.
            </p>
            <Link
              href="/station-admin/wizard"
              className="inline-flex items-center space-x-2 bg-white text-amber-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              <span>Create Your Station</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
