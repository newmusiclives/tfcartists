import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitize";
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
import { RandomListenerCount } from "@/components/random-listener-count";
import { prisma } from "@/lib/db";

const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app";

export const metadata: Metadata = {
  title: `${NETWORK_NAME} | Independent Radio for Real Music`,
  description:
    "Launch your own 24/7 radio station in minutes. Automated hosting, artist discovery, sponsor management, and listener growth — all built in.",
};

export const revalidate = 300;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: NETWORK_NAME,
  description:
    "Independent radio platform for artists, businesses, and communities.",
  url: SITE_URL,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "All",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "499",
    priceCurrency: "USD",
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: NETWORK_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logos/ncr-og.png`,
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${SITE_URL}/contact`,
  },
};

const radioJsonLd = {
  "@context": "https://schema.org",
  "@type": "RadioStation",
  name: process.env.NEXT_PUBLIC_STATION_NAME || "North Country Radio",
  url: SITE_URL,
  broadcastDisplayName: process.env.NEXT_PUBLIC_STATION_NAME || "North Country Radio",
  broadcastTimezone: process.env.STATION_TIMEZONE || "America/Denver",
  genre: process.env.NEXT_PUBLIC_STATION_GENRE || "Americana",
  description: "24/7 independent radio station championing local and independent artists.",
  parentOrganization: {
    "@type": "Organization",
    name: NETWORK_NAME,
  },
};

async function getMetrics() {
  try {
    const [sponsorCount, songCount] = await Promise.all([
      prisma.sponsor.count({ where: { deletedAt: null } }),
      prisma.song.count({ where: { isActive: true } }),
    ]);
    return { artistCount: 500, sponsorCount, songCount: Math.floor(songCount / 100) * 100 };
  } catch {
    return { artistCount: 500, sponsorCount: 25, songCount: 1200 };
  }
}

export default async function MarketingPage() {
  const metrics = await getMetrics();

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(JSON.stringify(jsonLd)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(JSON.stringify(orgJsonLd)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(JSON.stringify(radioJsonLd)) }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-gray-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Radio className="w-6 h-6 text-amber-400" />
              <span className="font-bold text-xl text-white">{NETWORK_NAME}</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#artists" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Artists</a>
              <a href="#operators" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Operators</a>
              <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Pricing</Link>
              <Link href="/station" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Demo Station</Link>
              <Link
                href="/player"
                className="inline-flex items-center space-x-1 bg-amber-500 hover:bg-amber-400 text-gray-950 px-4 py-2 rounded-lg transition-colors text-sm font-bold"
              >
                <Play className="w-4 h-4" />
                <span>Listen Live</span>
              </Link>
            </div>
            <div className="md:hidden">
              <Link
                href="/player"
                className="inline-flex items-center space-x-1 bg-amber-500 text-gray-950 px-3 py-1.5 rounded-lg text-sm font-bold"
              >
                <Play className="w-3 h-3" />
                <span>Listen</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/15 via-gray-950 to-gray-950" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-amber-400 font-medium tracking-widest uppercase text-sm mb-8">
              Independent Radio Network
            </p>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-8">
              <span className="text-white">Your own radio station.</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                Built for real music.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Launch a 24/7 radio station with automated hosting, artist discovery,
              sponsor management, and listener growth. No broadcast license.
              No expensive equipment. Live in 5 minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/onboard"
                className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-gray-950 px-8 py-4 rounded-xl text-lg font-bold transition-colors shadow-lg shadow-amber-500/20 w-full sm:w-auto justify-center"
              >
                <Music className="w-5 h-5" />
                <span>Submit Your Music Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/operate"
                className="inline-flex items-center space-x-2 border border-white/20 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/5 transition-colors w-full sm:w-auto justify-center"
              >
                <Radio className="w-5 h-5" />
                <span>Launch a Station</span>
              </Link>
            </div>

            {/* Social proof metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-amber-400">{metrics.artistCount.toLocaleString()}+</div>
                <div className="text-sm text-gray-500 dark:text-zinc-500">Artists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-amber-400">{metrics.songCount.toLocaleString()}+</div>
                <div className="text-sm text-gray-500 dark:text-zinc-500">Songs in Rotation</div>
              </div>
              <RandomListenerCount />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-amber-400">24/7</div>
                <div className="text-sm text-gray-500 dark:text-zinc-500">Live Radio</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Built for Everyone in Music</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Whether you make music, run a business, or want to build a community around sound.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Artists */}
            <div id="artists" className="scroll-mt-20 bg-gray-900/80 rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-6">
                <Music className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Independent Artists</h3>
              <p className="text-gray-400 mb-6">
                Get your music on real radio — for free. Every submission is reviewed
                and placed in rotation based on quality, not budget.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Free radio airplay on live stations",
                  "Artist features and spotlights on air",
                  "92% of sponsor revenue goes to artists",
                  "Real listener data and analytics",
                  "Upgrade for priority rotation",
                ].map((item) => (
                  <li key={item} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/onboard"
                className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-500 transition-colors"
              >
                <span>Submit Music Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Businesses / Sponsors */}
            <div className="bg-gray-900/80 rounded-2xl p-8 border border-green-500/20 hover:border-green-500/40 transition-colors">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl mb-6">
                <Building2 className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Businesses & Sponsors</h3>
              <p className="text-gray-400 mb-6">
                Reach engaged music fans through authentic radio sponsorships.
                Professional ads that sound natural, not robotic.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "4 sponsorship tiers from $100/mo",
                  "Professionally produced radio ads",
                  "Targeted to music-loving audiences",
                  "Performance dashboard and analytics",
                  "Support independent artists with every dollar",
                ].map((item) => (
                  <li key={item} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sponsor"
                className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-500 transition-colors"
              >
                <span>Become a Sponsor</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Station Operators */}
            <div id="operators" className="scroll-mt-20 bg-gray-900/80 rounded-2xl p-8 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
                <Radio className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Station Operators</h3>
              <p className="text-gray-400 mb-6">
                Run your own radio station as a real business.
                Smart automation handles the work while you build the brand.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Launch in 5 minutes with genre templates",
                  "Automated outreach, sales, growth, curation",
                  "Keep 100% of artist subscriptions",
                  "20% commission on sponsor revenue",
                  "Earn up to $50K/year at capacity",
                ].map((item) => (
                  <li key={item} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/operate"
                className="inline-flex items-center space-x-2 bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-500 transition-colors"
              >
                <span>Launch a Station</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-white/5 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Four operations teams run every station. Same playbook. Infinitely scalable.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                accent: "purple",
                name: "Riley",
                role: "Artist Discovery",
                desc: "Finds emerging artists on social platforms, runs automated outreach, and onboards new talent to the station.",
              },
              {
                icon: Mic,
                accent: "amber",
                name: "Cassidy",
                role: "Music Curation",
                desc: "Reviews every submission with a panel approach. Assigns rotation tiers. Builds playlists that flow.",
              },
              {
                icon: Headphones,
                accent: "blue",
                name: "Elliot",
                role: "Listener Growth",
                desc: "Creates content, activates artist fans, builds community, and turns casual listeners into daily habit.",
              },
              {
                icon: DollarSign,
                accent: "green",
                name: "Harper",
                role: "Sponsor Revenue",
                desc: "Identifies local businesses, pitches sponsorships, manages ad inventory, and maximizes station revenue.",
              },
            ].map((agent) => (
              <div
                key={agent.name}
                className="bg-gray-800/50 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-${agent.accent}-500/10 border border-${agent.accent}-500/20 rounded-xl mb-4`}>
                  <agent.icon className={`w-6 h-6 text-${agent.accent}-400`} />
                </div>
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                  <p className={`text-sm font-semibold text-${agent.accent}-400`}>{agent.role}</p>
                </div>
                <p className="text-sm text-gray-400">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything You Need</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Radio, title: "24/7 Live Streaming", desc: "Automated hosts with professional voices. Station imaging, smooth transitions, and non-stop music." },
              { icon: Zap, title: "5-Minute Setup", desc: "Choose from genre templates. Customize branding, hosts, and schedule. Your station goes live immediately." },
              { icon: Shield, title: "Production Ready", desc: "Error monitoring, security headers, rate limiting, CSRF protection. Enterprise-grade from day one." },
              { icon: Globe, title: "Embeddable Player", desc: "Drop a player widget on any website. Customizable colors. Works on WordPress, Shopify, anywhere." },
              { icon: TrendingUp, title: "Analytics Dashboard", desc: "Track listeners, top songs, sponsor performance, and revenue in real-time." },
              { icon: Sparkles, title: "Automated Content", desc: "Voice tracks, station imaging, sponsor ads, and newsletter content — all produced automatically." },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start space-x-4 p-5">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 py-20 border-t border-white/5 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Different plans for different needs. Artists can always start free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Artists */}
            <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-colors">
              <div className="text-purple-400 font-semibold text-sm mb-2">For Artists</div>
              <div className="text-3xl font-bold text-white mb-1">Free</div>
              <div className="text-sm text-gray-500 dark:text-zinc-500 mb-6">to get started</div>
              <ul className="space-y-2 mb-6">
                {["Radio airplay", "Artist profile", "Listener analytics", "Upgrade from $5/mo"].map((item) => (
                  <li key={item} className="flex items-center space-x-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/onboard" className="block text-center bg-purple-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-purple-500 transition-colors text-sm">
                Submit Music
              </Link>
            </div>

            {/* Sponsors */}
            <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-6 hover:border-green-500/30 transition-colors">
              <div className="text-green-400 font-semibold text-sm mb-2">For Sponsors</div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">$30</span>
                <span className="text-sm text-gray-500 ml-1">/mo</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-zinc-500 mb-6">a dollar a day</div>
              <ul className="space-y-2 mb-6">
                {["30 ad spots/mo", "Professionally produced ads", "Performance dashboard", "4 tiers up to $300/mo"].map((item) => (
                  <li key={item} className="flex items-center space-x-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/sponsor" className="block text-center bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-500 transition-colors text-sm">
                Get Started
              </Link>
            </div>

            {/* Operators */}
            <div className="bg-gray-800/50 border-2 border-amber-500/40 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-gray-950 text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <div className="text-amber-400 font-semibold text-sm mb-2">For Operators</div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">$200</span>
                <span className="text-sm text-gray-500 ml-1">/mo</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-zinc-500 mb-6">launch your station</div>
              <ul className="space-y-2 mb-6">
                {["Full automated station", "2 hosts, 24/7 live", "Full operations team included", "No broadcast license needed"].map((item) => (
                  <li key={item} className="flex items-center space-x-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/operate" className="block text-center bg-amber-500 text-gray-950 px-4 py-2.5 rounded-lg font-bold hover:bg-amber-400 transition-colors text-sm">
                Learn More
              </Link>
              <p className="text-xs text-center text-gray-500 dark:text-zinc-500 mt-2"><Link href="/pricing" className="text-amber-400/70 hover:text-amber-400">See all plans</Link></p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Station */}
      <section id="demo" className="scroll-mt-20 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-amber-400 font-medium tracking-widest uppercase text-xs mb-4">
                Live Demo Station
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">North Country Radio</h2>
              <p className="text-lg text-amber-400/80 mb-2 italic font-serif">&ldquo;Where the Music Finds You&rdquo;</p>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Our flagship Americana station. Live 24/7 with curated independent
                music, real sponsors, and a growing listener community. This is what your
                station could sound like.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">{metrics.artistCount}</div>
                  <div className="text-gray-500 text-sm">Artists</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">{metrics.songCount.toLocaleString()}</div>
                  <div className="text-gray-500 text-sm">Songs</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">{metrics.sponsorCount}</div>
                  <div className="text-gray-500 text-sm">Sponsors</div>
                </div>
                <RandomListenerCount variant="demo" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/player"
                  className="inline-flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-400 text-gray-950 px-6 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-amber-500/20"
                >
                  <Play className="w-5 h-5" />
                  <span>Listen Live Now</span>
                </Link>
                <Link
                  href="/station"
                  className="inline-flex items-center justify-center space-x-2 border border-white/20 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/5 transition-colors"
                >
                  <span>Explore Station</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
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
                        className="w-1 bg-amber-400 rounded-full animate-equalizer"
                        style={{
                          height: `${12 + Math.random() * 20}px`,
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-amber-400/80 font-medium tracking-wider">NOW PLAYING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The TrueFans Promise */}
      <section className="py-20 border-t border-white/5 bg-gray-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-14">The TrueFans Promise</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="text-5xl font-bold text-amber-400 mb-3">92%</div>
              <div className="text-lg font-semibold text-white mb-2">Goes to Artists</div>
              <p className="text-sm text-gray-400">Industry-leading revenue share. Sponsor money funds the people who make the music.</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-amber-400 mb-3">100%</div>
              <div className="text-lg font-semibold text-white mb-2">Transparent</div>
              <p className="text-sm text-gray-400">Every dollar tracked, every play counted. Real-time dashboards for artists, sponsors, and operators.</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-amber-400 mb-3">0</div>
              <div className="text-lg font-semibold text-white mb-2">Gatekeepers</div>
              <p className="text-sm text-gray-400">Every submission reviewed on musical merit. No payola. No politics. Just good music.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Join the TrueFans RADIO Network today. Artists start free. Operators launch in 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboard"
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-purple-500 transition-colors w-full sm:w-auto justify-center"
            >
              <Music className="w-5 h-5" />
              <span>Submit Music Free</span>
            </Link>
            <Link
              href="/listen/register"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-500 transition-colors w-full sm:w-auto justify-center"
            >
              <Headphones className="w-5 h-5" />
              <span>Start Listening</span>
            </Link>
            <Link
              href="/sponsor"
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-500 transition-colors w-full sm:w-auto justify-center"
            >
              <Building2 className="w-5 h-5" />
              <span>Sponsor a Station</span>
            </Link>
            <Link
              href="/operate"
              className="inline-flex items-center space-x-2 bg-amber-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-amber-500 transition-colors w-full sm:w-auto justify-center"
            >
              <Radio className="w-5 h-5" />
              <span>Launch a Station</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-3">For Artists</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-zinc-500">
                <li><Link href="/onboard" className="hover:text-white transition-colors">Submit Music</Link></li>
                <li><Link href="/station" className="hover:text-white transition-colors">Browse Station</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">For Business</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-zinc-500">
                <li><Link href="/sponsor" className="hover:text-white transition-colors">Sponsor a Station</Link></li>
                <li><Link href="/operate" className="hover:text-white transition-colors">Operate a Station</Link></li>
                <li><Link href="/network" className="hover:text-white transition-colors">The Network</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Listen</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-zinc-500">
                <li><Link href="/player" className="hover:text-white transition-colors">Web Player</Link></li>
                <li><Link href="/schedule" className="hover:text-white transition-colors">Schedule</Link></li>
                <li><Link href="/listen/register" className="hover:text-white transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-zinc-500">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><a href="mailto:support@truefans.radio" className="hover:text-white transition-colors">Contact</a></li>
                <li><Link href="/newsletter" className="hover:text-white transition-colors">Newsletter</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600 dark:text-zinc-400">&copy; {new Date().getFullYear()} {NETWORK_NAME} Network. All rights reserved.</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-zinc-400">
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
