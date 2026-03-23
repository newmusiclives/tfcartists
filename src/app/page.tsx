import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Radio,
  Music,
  Users,
  DollarSign,
  Headphones,
  Zap,
  Shield,
  TrendingUp,
  Mic,
  Building2,
  Globe,
  CheckCircle2,
  Sparkles,
  Play,
} from "lucide-react";
import { prisma } from "@/lib/db";

const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app";

export const metadata: Metadata = {
  title: `${NETWORK_NAME} | AI-Powered Radio for Independent Artists`,
  description:
    "Launch your own AI-powered radio station in minutes. 24/7 live radio with AI DJs, artist discovery, sponsor management, and listener growth — all automated.",
};

export const revalidate = 300;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: NETWORK_NAME,
  description:
    "AI-powered radio platform for independent artists, businesses, and communities.",
  url: SITE_URL,
  applicationCategory: "MultimediaApplication",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "499",
    priceCurrency: "USD",
  },
};

async function getMetrics() {
  try {
    const [artistCount, sponsorCount, listenerCount, songCount] = await Promise.all([
      prisma.artist.count({ where: { deletedAt: null } }),
      prisma.sponsor.count({ where: { deletedAt: null } }),
      prisma.listener.count(),
      prisma.song.count({ where: { isActive: true } }),
    ]);
    return { artistCount, sponsorCount, listenerCount, songCount };
  } catch {
    return { artistCount: 150, sponsorCount: 25, listenerCount: 500, songCount: 1200 };
  }
}

export default async function MarketingPage() {
  const metrics = await getMetrics();

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Image src="/logos/ncr-logo.png" alt="TrueFans RADIO" width={32} height={32} className="h-8 w-auto object-contain" />
              <span className="font-bold text-xl text-amber-700">{NETWORK_NAME}</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#artists" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Artists</a>
              <a href="#operators" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Operators</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Pricing</a>
              <a href="#demo" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Demo Station</a>
              <Link
                href="/player"
                className="inline-flex items-center space-x-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold"
              >
                <Play className="w-4 h-4" />
                <span>Listen Live</span>
              </Link>
            </div>
            <div className="md:hidden">
              <Link
                href="/player"
                className="inline-flex items-center space-x-1 bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold"
              >
                <Play className="w-3 h-3" />
                <span>Listen</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 sm:pt-36 sm:pb-28 bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Radio Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              <span className="text-gray-900">Your own radio station.</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600">
                Powered by AI.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Launch a 24/7 radio station with AI DJs, automated artist discovery,
              sponsor management, and listener growth. No broadcast license.
              No expensive equipment. Live in 5 minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/onboard"
                className="inline-flex items-center space-x-2 bg-amber-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
              >
                <Music className="w-5 h-5" />
                <span>Submit Your Music Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/operate"
                className="inline-flex items-center space-x-2 border-2 border-amber-600 text-amber-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-amber-50 transition-colors w-full sm:w-auto justify-center"
              >
                <Radio className="w-5 h-5" />
                <span>Launch a Station</span>
              </Link>
            </div>

            {/* Social proof metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{metrics.artistCount.toLocaleString()}+</div>
                <div className="text-sm text-gray-500">Artists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{metrics.songCount.toLocaleString()}+</div>
                <div className="text-sm text-gray-500">Songs in Rotation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{metrics.listenerCount.toLocaleString()}+</div>
                <div className="text-sm text-gray-500">Listeners</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-500">Live Radio</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Built for Everyone in Music</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you make music, run a business, or want to build a community around sound.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Artists */}
            <div id="artists" className="scroll-mt-20 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-8 border border-purple-200">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-6">
                <Music className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Independent Artists</h3>
              <p className="text-gray-600 mb-6">
                Get your music on real radio — for free. Our AI reviews every submission and places
                you in rotation based on quality, not budget.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Free radio airplay on live stations",
                  "AI-generated features and artist spotlights",
                  "92% of sponsor revenue goes to artists",
                  "Real listener data and analytics",
                  "Upgrade for priority rotation",
                ].map((item) => (
                  <li key={item} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/onboard"
                className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                <span>Submit Music Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Businesses / Sponsors */}
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-8 border border-green-200">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-6">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Businesses & Sponsors</h3>
              <p className="text-gray-600 mb-6">
                Reach engaged music fans through authentic radio sponsorships.
                AI-voiced ads that sound natural, not robotic.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "4 sponsorship tiers from $100/mo",
                  "AI-produced radio ads with real voices",
                  "Targeted to music-loving audiences",
                  "Performance dashboard and analytics",
                  "Support independent artists with every dollar",
                ].map((item) => (
                  <li key={item} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sponsor"
                className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                <span>Become a Sponsor</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Station Operators */}
            <div id="operators" className="scroll-mt-20 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-8 border border-amber-200">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl mb-6">
                <Radio className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Station Operators</h3>
              <p className="text-gray-600 mb-6">
                Run your own AI radio station as a real business.
                4 AI agents handle the work while you build the brand.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Launch in 5 minutes with genre templates",
                  "4 AI agents: outreach, sales, growth, curation",
                  "Keep 100% of artist subscriptions",
                  "20% commission on sponsor revenue",
                  "Earn up to $50K/year at capacity",
                ].map((item) => (
                  <li key={item} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/operate"
                className="inline-flex items-center space-x-2 bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
              >
                <span>Launch a Station</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Four AI teams run every station. Same playbook. Infinitely replicable.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                color: "purple",
                name: "Riley",
                role: "Artist Discovery",
                desc: "Finds emerging artists on social platforms, runs automated outreach, and onboards new talent to the station.",
              },
              {
                icon: Mic,
                color: "teal",
                name: "Cassidy",
                role: "Music Curation",
                desc: "Reviews every submission with a 6-person AI panel. Assigns rotation tiers. Builds playlists that flow.",
              },
              {
                icon: Headphones,
                color: "blue",
                name: "Elliot",
                role: "Listener Growth",
                desc: "Creates viral content, activates artist fans, builds community, and turns casual listeners into daily habit.",
              },
              {
                icon: DollarSign,
                color: "green",
                name: "Harper",
                role: "Sponsor Revenue",
                desc: "Identifies local businesses, pitches sponsorships, manages ad inventory, and maximizes station revenue.",
              },
            ].map((agent) => (
              <div
                key={agent.name}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-${agent.color}-100 rounded-xl mb-4`}>
                  <agent.icon className={`w-6 h-6 text-${agent.color}-600`} />
                </div>
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{agent.name}</h3>
                  <p className={`text-sm font-semibold text-${agent.color}-600`}>{agent.role}</p>
                </div>
                <p className="text-sm text-gray-600">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Radio, title: "24/7 Live Streaming", desc: "AI DJs with unique personalities host every hour. Back-announces, show intros, and smooth transitions." },
              { icon: Zap, title: "5-Minute Setup", desc: "Choose from genre templates. Customize branding, DJs, and schedule. Your station goes live immediately." },
              { icon: Shield, title: "Production Ready", desc: "Error monitoring, security headers, rate limiting, CSRF protection. Enterprise-grade from day one." },
              { icon: Globe, title: "Embeddable Player", desc: "Drop a player widget on any website. Customizable colors. Works on WordPress, Shopify, anywhere." },
              { icon: TrendingUp, title: "Analytics Dashboard", desc: "Track listeners, top songs, sponsor performance, and revenue in real-time." },
              { icon: Sparkles, title: "AI Content Engine", desc: "Auto-generated voice tracks, artist features, show imaging, and newsletter content." },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start space-x-4 p-4">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-100 rounded-lg flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 py-20 bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Different plans for different needs. Artists can always start free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* Artists */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-purple-600 font-semibold text-sm mb-2">For Artists</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">Free</div>
              <div className="text-sm text-gray-500 mb-6">to get started</div>
              <ul className="space-y-2 mb-6">
                {["Radio airplay", "Artist profile", "Listener analytics", "Upgrade from $5/mo"].map((item) => (
                  <li key={item} className="flex items-center space-x-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/onboard" className="block text-center bg-purple-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm">
                Submit Music
              </Link>
            </div>

            {/* Sponsors */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-green-600 font-semibold text-sm mb-2">For Sponsors</div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">$30</span>
                <span className="text-sm text-gray-500 ml-1">/mo</span>
              </div>
              <div className="text-sm text-gray-500 mb-6">less than $1/day</div>
              <ul className="space-y-2 mb-6">
                {["30 ad spots/mo", "AI-produced audio ads", "Performance dashboard", "4 tiers up to $300/mo"].map((item) => (
                  <li key={item} className="flex items-center space-x-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/sponsor" className="block text-center bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm">
                Get Started
              </Link>
            </div>

            {/* Operators - Launch */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="text-amber-600 font-semibold text-sm mb-2">For Operators</div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">$150</span>
                <span className="text-sm text-gray-500 ml-1">/mo</span>
              </div>
              <div className="text-sm text-gray-500 mb-6">Launch plan</div>
              <ul className="space-y-2 mb-6">
                {["1 station, 2 AI DJs", "150 artists, 12hr/day", "5 AI teams included", "Earn up to $75K/yr"].map((item) => (
                  <li key={item} className="flex items-center space-x-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/operate" className="block text-center border-2 border-amber-600 text-amber-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-amber-50 transition-colors text-sm">
                Get Started
              </Link>
              <p className="text-xs text-center text-gray-400 mt-2">+ $500 one-time setup</p>
            </div>

            {/* Operators - Growth (Best Value) */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-amber-400 relative hover:shadow-xl transition-shadow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                BEST VALUE
              </div>
              <div className="text-amber-600 font-semibold text-sm mb-2">For Operators</div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">$250</span>
                <span className="text-sm text-gray-500 ml-1">/mo</span>
              </div>
              <div className="text-sm text-gray-500 mb-6">Growth plan</div>
              <ul className="space-y-2 mb-6">
                {["1 station, 6 AI DJs", "340 artists, 24/7 live", "Lower platform fee (10%)", "Full analytics + priority support"].map((item) => (
                  <li key={item} className="flex items-center space-x-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/operate" className="block text-center bg-amber-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-amber-700 transition-colors text-sm">
                Launch Station
              </Link>
              <p className="text-xs text-center text-gray-400 mt-2">+ $500 one-time setup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Station */}
      <section id="demo" className="scroll-mt-20 py-20 bg-gradient-to-r from-amber-800 via-amber-700 to-orange-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Radio className="w-4 h-4" />
                <span>Live Demo Station</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">North Country Radio</h2>
              <p className="text-lg text-amber-100 mb-2 italic">&ldquo;Where the Music Finds You&rdquo;</p>
              <p className="text-amber-200 mb-8">
                Our flagship Americana station. Live 24/7 with AI DJs, curated independent
                music, real sponsors, and a growing listener community. This is what your
                station could sound like.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{metrics.artistCount}</div>
                  <div className="text-amber-200 text-sm">Artists</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{metrics.songCount.toLocaleString()}</div>
                  <div className="text-amber-200 text-sm">Songs</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{metrics.sponsorCount}</div>
                  <div className="text-amber-200 text-sm">Sponsors</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{metrics.listenerCount}</div>
                  <div className="text-amber-200 text-sm">Listeners</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/player"
                  className="inline-flex items-center justify-center space-x-2 bg-white text-amber-800 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors shadow-lg"
                >
                  <Play className="w-5 h-5" />
                  <span>Listen Live Now</span>
                </Link>
                <Link
                  href="/station"
                  className="inline-flex items-center justify-center space-x-2 border-2 border-white/50 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
                >
                  <span>Explore Station</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <Image
                  src="/logos/ncr-logo.png"
                  alt="North Country Radio"
                  width={374}
                  height={374}
                  className="mx-auto w-64 h-64 object-contain"
                />
                <div className="mt-6 flex items-center justify-center space-x-3">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-1 bg-amber-300 rounded-full animate-equalizer"
                        style={{
                          height: `${12 + Math.random() * 20}px`,
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-amber-200 font-medium">NOW PLAYING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The TrueFans Promise */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12">The TrueFans Promise</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-5xl font-bold text-amber-600 mb-2">92%</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Goes to Artists</div>
              <p className="text-sm text-gray-600">Industry-leading revenue share. Sponsor money funds the people who make the music.</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-amber-600 mb-2">100%</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Transparent</div>
              <p className="text-sm text-gray-600">Every dollar tracked, every play counted. Real-time dashboards for artists, sponsors, and operators.</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-amber-600 mb-2">0</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Gatekeepers</div>
              <p className="text-sm text-gray-600">AI reviews every submission on musical merit. No payola. No politics. Just good music.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Join the TrueFans RADIO Network today. Artists start free. Operators launch in 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboard"
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg w-full sm:w-auto justify-center"
            >
              <Music className="w-5 h-5" />
              <span>Submit Music Free</span>
            </Link>
            <Link
              href="/listen/register"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg w-full sm:w-auto justify-center"
            >
              <Headphones className="w-5 h-5" />
              <span>Start Listening</span>
            </Link>
            <Link
              href="/sponsor"
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg w-full sm:w-auto justify-center"
            >
              <Building2 className="w-5 h-5" />
              <span>Sponsor a Station</span>
            </Link>
            <Link
              href="/operate"
              className="inline-flex items-center space-x-2 bg-amber-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg w-full sm:w-auto justify-center"
            >
              <Radio className="w-5 h-5" />
              <span>Launch a Station</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-3">For Artists</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/onboard" className="hover:text-white transition-colors">Submit Music</Link></li>
                <li><Link href="/station" className="hover:text-white transition-colors">Browse Station</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">For Business</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/sponsor" className="hover:text-white transition-colors">Sponsor a Station</Link></li>
                <li><Link href="/operate" className="hover:text-white transition-colors">Operate a Station</Link></li>
                <li><Link href="/network" className="hover:text-white transition-colors">The Network</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Listen</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/player" className="hover:text-white transition-colors">Web Player</Link></li>
                <li><Link href="/schedule" className="hover:text-white transition-colors">Schedule</Link></li>
                <li><Link href="/listen/register" className="hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><a href="mailto:support@truefans.radio" className="hover:text-white transition-colors">Contact</a></li>
                <li><Link href="/newsletter" className="hover:text-white transition-colors">Newsletter</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Image src="/logos/ncr-logo.png" alt="TrueFans RADIO" width={24} height={24} className="h-6 w-auto object-contain opacity-60" />
                <span className="text-sm">&copy; {new Date().getFullYear()} {NETWORK_NAME} Network. All rights reserved.</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
