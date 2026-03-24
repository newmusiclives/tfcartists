import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Music,
  Upload,
  Radio,
  Users,
  Share2,
  Headphones,
  Sparkles,
  CheckCircle2,
  Play,
  Mic,
  BarChart3,
  Globe,
} from "lucide-react";

const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO";

export const metadata: Metadata = {
  title: `Artist Stations | ${NETWORK_NAME}`,
  description:
    "Your music. Your station. Your fans. Launch a personal radio station that plays your catalog alongside similar artists. Powered by AI.",
};

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Get started with your own artist station",
    features: [
      "Up to 20 songs in rotation",
      "Auto DJ with minimal personality",
      "Shareable station link",
      "Basic listener analytics",
      "Fan song requests",
    ],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Pro Artist",
    price: "$19",
    period: "/mo",
    description: "Full station with your branding",
    features: [
      "Unlimited songs in rotation",
      "Custom station branding & colors",
      "Similar artist discovery & mixing",
      "Advanced listener analytics",
      "Priority fan requests",
      "Embeddable player widget",
      "Social sharing tools",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Label",
    price: "$49",
    period: "/mo",
    description: "Multiple artist stations under one roof",
    features: [
      "Up to 10 artist stations",
      "Cross-promotion between stations",
      "Consolidated analytics dashboard",
      "Custom domain support",
      "API access",
      "Priority support",
      "White-label options",
    ],
    cta: "Contact Us",
    highlight: false,
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    icon: Upload,
    title: "Upload Your Catalog",
    description:
      "Upload your tracks or connect your distributor. We handle encoding, normalization, and metadata.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    icon: Sparkles,
    title: "We Build Your Station",
    description:
      "Our AI creates a 24/7 radio station mixing your music with similar artists your fans will love.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: Share2,
    title: "Share With Your Fans",
    description:
      "Get a shareable link, embeddable player, and social tools. Your fans tune in and discover your world.",
    color: "bg-green-100 text-green-600",
  },
];

const FEATURES = [
  {
    icon: Radio,
    title: "24/7 Live Radio",
    description: "Your station never stops. AI DJ keeps the vibe going around the clock.",
  },
  {
    icon: Users,
    title: "Similar Artist Discovery",
    description: "We mix in artists your fans will love, keeping them listening longer.",
  },
  {
    icon: Mic,
    title: "Minimal DJ Personality",
    description: "Short, tasteful intros that spotlight your music without overshadowing it.",
  },
  {
    icon: BarChart3,
    title: "Listener Analytics",
    description: "See who is listening, when, and which tracks perform best.",
  },
  {
    icon: Headphones,
    title: "Fan Requests",
    description: "Fans can request their favorite tracks right from the player.",
  },
  {
    icon: Globe,
    title: "Embeddable Player",
    description: "Drop a player widget on your website, Linktree, or social bio.",
  },
];

export default function ArtistStationLandingPage() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/logos/ncr-logo.png"
                  alt={NETWORK_NAME}
                  width={32}
                  height={32}
                  className="h-8 w-auto object-contain"
                />
                <span className="font-bold text-xl text-violet-700">Artist Stations</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                How It Works
              </a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                Pricing
              </a>
              <Link
                href="/onboard"
                className="inline-flex items-center space-x-1 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors text-sm font-semibold"
              >
                <Music className="w-4 h-4" />
                <span>Get Started</span>
              </Link>
            </div>
            <div className="md:hidden">
              <Link
                href="/onboard"
                className="inline-flex items-center space-x-1 bg-violet-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold"
              >
                <Music className="w-3 h-3" />
                <span>Start</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 sm:pt-36 sm:pb-28 bg-gradient-to-br from-violet-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-violet-100 text-violet-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Artist-Powered Radio</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              <span className="text-gray-900">Your Music.</span>
              <br />
              <span className="text-gray-900">Your Station.</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-700 via-purple-600 to-violet-600">
                Your Fans.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Launch a 24/7 radio station that plays your catalog alongside similar artists.
              AI handles the DJ work. You focus on making music.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/onboard"
                className="inline-flex items-center space-x-2 bg-violet-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-violet-700 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
              >
                <Upload className="w-5 h-5" />
                <span>Upload Your Catalog</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/player"
                className="inline-flex items-center space-x-2 border-2 border-violet-600 text-violet-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-violet-50 transition-colors w-full sm:w-auto justify-center"
              >
                <Play className="w-5 h-5" />
                <span>Hear a Demo</span>
              </Link>
            </div>

            {/* Social proof */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-500">Live Radio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">AI</div>
                <div className="text-sm text-gray-500">Powered DJ</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">Free</div>
                <div className="text-sm text-gray-500">To Start</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="scroll-mt-20 py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Three Steps to Your Own Station
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From upload to live radio in minutes. No technical skills required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <div key={step.title} className="relative text-center">
                {/* Step number connector */}
                {index < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-violet-200 to-transparent" />
                )}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.color} mb-6`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="absolute -top-2 -right-2 md:static md:mb-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 py-20 bg-gradient-to-br from-gray-50 to-violet-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete radio experience for your fans, powered by AI.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 bg-violet-100 rounded-xl mb-4">
                  <feature.icon className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Artist-Friendly Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Start free. Upgrade when you are ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-8 border ${
                  tier.highlight
                    ? "border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50 shadow-lg ring-2 ring-violet-200"
                    : "border-gray-200 bg-white"
                }`}
              >
                {tier.highlight && (
                  <div className="inline-flex items-center space-x-1 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                    <Sparkles className="w-3 h-3" />
                    <span>Most Popular</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-2">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-500">{tier.period}</span>
                </div>
                <p className="text-gray-600 text-sm mb-6">{tier.description}</p>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/onboard"
                  className={`block text-center py-3 px-6 rounded-xl font-semibold transition-colors ${
                    tier.highlight
                      ? "bg-violet-600 text-white hover:bg-violet-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Launch Your Station?
          </h2>
          <p className="text-lg text-violet-200 max-w-2xl mx-auto mb-10">
            Upload your catalog, and we will have your station live in minutes. Your fans are waiting.
          </p>
          <Link
            href="/onboard"
            className="inline-flex items-center space-x-2 bg-white text-violet-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-violet-50 transition-colors shadow-lg"
          >
            <Music className="w-5 h-5" />
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Image
                src="/logos/ncr-logo.png"
                alt={NETWORK_NAME}
                width={24}
                height={24}
                className="h-6 w-auto object-contain opacity-60"
              />
              <span className="text-sm text-gray-400">
                {NETWORK_NAME} Artist Stations
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link>
              <Link href="/about" className="hover:text-gray-300 transition-colors">About</Link>
              <Link href="/contact" className="hover:text-gray-300 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
