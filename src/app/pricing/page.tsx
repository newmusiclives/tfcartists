"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Radio,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Headphones,
  Mic2,
  Music,
  Zap,
  Users,
  Building2,
  DollarSign,
  Globe,
  Sparkles,
  Play,
} from "lucide-react";

type Audience = "operators" | "artists" | "sponsors";

const OPERATOR_PLANS = [
  {
    id: "launch",
    name: "Launch",
    price: 200,
    setup: 500,
    description: "Perfect for getting started with your first station",
    features: [
      "1 AI-powered station",
      "2 AI DJ personalities",
      "12hr/day live programming",
      "5 AI management teams",
      "Basic imaging package",
      "Embeddable web player",
      "Sponsor ad management",
      "15% platform fee on revenue",
    ],
    recommended: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: 300,
    setup: 500,
    description: "Most popular — full 24/7 station with more DJs",
    features: [
      "1 AI-powered station",
      "6 AI DJ personalities",
      "24/7 live programming",
      "5 AI management teams",
      "Pro imaging package",
      "Embeddable web player",
      "Sponsor ad management",
      "Analytics dashboard",
      "10% platform fee on revenue",
    ],
    recommended: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: 500,
    setup: 1000,
    description: "Multiple stations for networks and brands",
    features: [
      "Up to 3 stations",
      "12 AI DJ personalities",
      "24/7 live programming",
      "5 AI management teams per station",
      "Enterprise imaging package",
      "Custom branding & white-label",
      "Priority support",
      "7% platform fee on revenue",
    ],
    recommended: false,
  },
  {
    id: "network",
    name: "Network",
    price: 1000,
    setup: 0,
    description: "Enterprise — unlimited scale with dedicated support",
    features: [
      "Up to 10 stations",
      "Unlimited AI DJs",
      "24/7 live programming",
      "Full AI team suite",
      "Enterprise imaging + custom voices",
      "White-label everything",
      "Dedicated account manager",
      "5% platform fee on revenue",
      "$0 setup fee",
    ],
    recommended: false,
  },
];

const ARTIST_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 5,
    description: "Get your music on the radio",
    features: [
      "Radio airplay on partner stations",
      "Artist profile page",
      "Basic listener analytics",
      "Song submission portal",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 15,
    description: "Priority rotation and deeper insights",
    features: [
      "Everything in Starter",
      "Priority rotation placement",
      "Detailed listener demographics",
      "DJ shoutouts for new releases",
      "Feature segment eligibility",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 30,
    description: "Maximum exposure with dedicated segments",
    features: [
      "Everything in Pro",
      "Dedicated artist spotlight segments",
      "Custom DJ intro for your songs",
      "Cross-station promotion",
      "Monthly performance reports",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: 50,
    description: "Full promotion engine for serious artists",
    features: [
      "Everything in Premium",
      "Multi-station promotion",
      "Direct sponsor introductions",
      "Branded artist radio hour",
      "Priority playlist placement",
      "Quarterly performance review",
    ],
  },
];

const SPONSOR_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 30,
    description: "A dollar a day — test the waters",
    features: [
      "30 ad spots per month",
      "AI-produced audio ads",
      "Basic performance dashboard",
      "1 active ad creative",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 75,
    description: "Serious reach for local businesses",
    features: [
      "90 ad spots per month",
      "AI-produced audio ads",
      "Full performance analytics",
      "3 active ad creatives",
      "Time-of-day targeting",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 150,
    description: "Dominate the airwaves",
    features: [
      "200 ad spots per month",
      "AI-produced audio ads",
      "Full analytics + reports",
      "5 active ad creatives",
      "Time-of-day targeting",
      "Exclusive category sponsorship",
    ],
    recommended: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 300,
    description: "Multi-station sponsorship presence",
    features: [
      "500 ad spots per month",
      "Premium AI voice production",
      "Custom analytics & reporting",
      "Unlimited ad creatives",
      "Cross-station campaigns",
      "Dedicated account manager",
      "Exclusive category lock",
    ],
  },
];

const FAQ_ITEMS = [
  {
    q: "How does TrueFans Radio work?",
    a: "We pair your music library with AI-powered DJ personalities that host your station 24/7. They introduce songs, share artist stories, read listener dedications, and keep your station feeling live and personal — all fully automated.",
  },
  {
    q: "How long does it take to launch?",
    a: "Most stations are live within 48 hours. Upload your music, pick your DJs, set your schedule, and we handle the rest — streaming infrastructure, DJ voice generation, and automated playout.",
  },
  {
    q: "Do I need a broadcast license?",
    a: "No. TrueFans Radio stations stream online via Icecast, which doesn't require an FCC broadcast license. You can list your station on TuneIn, iHeart Radio, and embed it on any website.",
  },
  {
    q: "Can I customize my DJ's voice and personality?",
    a: "Absolutely. Choose from preset DJ personalities or create your own with custom names, voice styles, personality traits, and catchphrases. AI-powered voices from Google Gemini bring your DJs to life.",
  },
  {
    q: "What are AI management teams?",
    a: "Five AI agents that run your station business: Cassidy (station manager), Parker (content producer), Riley (artist discovery), Harper (sponsor sales), and Elliot (listener growth). They work autonomously to grow your station.",
  },
  {
    q: "How do I earn money?",
    a: "Two revenue streams: artist subscription fees (100% yours) and sponsor advertising (you keep 80-95% depending on your plan). The AI teams actively find and onboard sponsors for you.",
  },
  {
    q: "Can I try before I buy?",
    a: "Yes! Use our free demo to hear what your station could sound like in 60 seconds. We'll generate a custom DJ intro with your station name and genre — no credit card required.",
  },
  {
    q: "What if I want to cancel?",
    a: "Cancel anytime. No long-term contracts. Your music library and station data remain accessible for 30 days after cancellation.",
  },
];

export default function PricingPage() {
  const [audience, setAudience] = useState<Audience>("operators");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const audiences: { id: Audience; label: string; icon: typeof Building2 }[] = [
    { id: "operators", label: "Station Operators", icon: Building2 },
    { id: "artists", label: "Artists", icon: Music },
    { id: "sponsors", label: "Sponsors", icon: DollarSign },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 text-amber-700 hover:text-amber-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <Radio className="w-5 h-5" />
              <span className="font-bold">TrueFans Radio</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/demo" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors hidden sm:block">
                Try Demo
              </Link>
              <Link
                href="/operator/signup"
                className="inline-flex items-center space-x-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Whether you&apos;re an artist, sponsor, or station operator — there&apos;s a plan for you.
            No hidden fees. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Audience Toggle */}
      <section className="px-4 pb-12">
        <div className="max-w-md mx-auto">
          <div className="flex rounded-xl bg-white shadow-sm border border-gray-200 p-1">
            {audiences.map((a) => (
              <button
                key={a.id}
                onClick={() => setAudience(a.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  audience === a.id
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <a.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{a.label}</span>
                <span className="sm:hidden">{a.id === "operators" ? "Operators" : a.id === "artists" ? "Artists" : "Sponsors"}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Operator Plans */}
      {audience === "operators" && (
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {OPERATOR_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-shadow relative ${
                    plan.recommended ? "border-2 border-amber-400 shadow-lg" : "border-gray-200"
                  }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="text-amber-600 font-semibold text-sm mb-1">{plan.name}</div>
                  <div className="flex items-baseline mb-1">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-sm text-gray-500 ml-1">/mo</span>
                  </div>
                  {plan.setup > 0 && (
                    <div className="text-xs text-gray-400 mb-3">+ ${plan.setup} one-time setup</div>
                  )}
                  {plan.setup === 0 && (
                    <div className="text-xs text-green-600 font-medium mb-3">No setup fee</div>
                  )}
                  <p className="text-sm text-gray-500 mb-5">{plan.description}</p>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/operator/signup?plan=${plan.id}`}
                    className={`block text-center px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                      plan.recommended
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Artist Plans */}
      {audience === "artists" && (
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ARTIST_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="text-purple-600 font-semibold text-sm mb-1">{plan.name}</div>
                  <div className="flex items-baseline mb-1">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-sm text-gray-500 ml-1">/mo</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-5">{plan.description}</p>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/onboard"
                    className="block text-center bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm"
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sponsor Plans */}
      {audience === "sponsors" && (
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SPONSOR_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-shadow relative ${
                    "recommended" in plan && plan.recommended ? "border-2 border-green-400 shadow-lg" : "border-gray-200"
                  }`}
                >
                  {"recommended" in plan && plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      BEST VALUE
                    </div>
                  )}
                  <div className="text-green-600 font-semibold text-sm mb-1">{plan.name}</div>
                  <div className="flex items-baseline mb-1">
                    <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-sm text-gray-500 ml-1">/mo</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-5">{plan.description}</p>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/sponsor"
                    className={`block text-center px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                      "recommended" in plan && plan.recommended
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Demo CTA Banner */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-orange-700 rounded-2xl p-8 sm:p-12 text-white text-center">
            <Mic2 className="w-10 h-10 mx-auto mb-4 text-amber-200" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Hear It Before You Buy</h2>
            <p className="text-amber-100 max-w-lg mx-auto mb-6">
              Enter your station name and genre. Our AI DJ will record a personalized
              demo of what your station sounds like — in 60 seconds, free.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-white text-amber-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-50 transition-colors active:scale-[0.98]"
            >
              <Play className="w-5 h-5" />
              Try Free Demo
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <Headphones className="w-12 h-12 text-amber-600 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Launch Your Station?
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            Go from zero to live in 48 hours. AI-powered radio that sounds
            human, runs itself, and pays for itself.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/operator/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-amber-600 text-white hover:bg-amber-700 shadow-lg transition-all active:scale-[0.98]"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-amber-600 text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <Play className="w-5 h-5" />
              Try Free Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 bg-white/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4" />
            <span>TrueFans Radio</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <Link href="/demo" className="hover:text-gray-700 transition-colors">Demo</Link>
            <Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
