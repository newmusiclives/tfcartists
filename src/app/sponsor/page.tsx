"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Radio, ArrowLeft, Building2, Check, Target, TrendingUp, Megaphone, BarChart3 } from "lucide-react";
import { useStation } from "@/contexts/StationContext";

const SPONSORSHIP_TIERS = [
  {
    name: "Bronze",
    price: "$50/mo",
    color: "amber",
    features: [
      "Logo on station website",
      "2 sponsor mentions per day",
      "Monthly analytics report",
    ],
  },
  {
    name: "Silver",
    price: "$100/mo",
    color: "gray",
    features: [
      "Everything in Bronze",
      "6 sponsor mentions per day",
      "Social media features",
      "Quarterly artist meet & greet",
    ],
  },
  {
    name: "Gold",
    price: "$200/mo",
    color: "yellow",
    features: [
      "Everything in Silver",
      "12 sponsor mentions per day",
      "Branded content segments",
      "Event sponsorship priority",
      "Dedicated account manager",
    ],
  },
  {
    name: "Platinum",
    price: "$400/mo",
    color: "indigo",
    features: [
      "Everything in Gold",
      "Exclusive show sponsorship",
      "Custom branded segments",
      "VIP event access",
      "Co-branded campaigns",
      "Priority placement",
    ],
  },
];

const BUSINESS_TYPES = [
  { value: "music_venue", label: "Music Venue" },
  { value: "restaurant_bar", label: "Restaurant / Bar" },
  { value: "retail", label: "Retail Store" },
  { value: "music_shop", label: "Music / Instrument Shop" },
  { value: "craft_maker", label: "Craft / Artisan Maker" },
  { value: "professional_services", label: "Professional Services" },
  { value: "media_entertainment", label: "Media / Entertainment" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "other", label: "Other" },
];

export default function SponsorPage() {
  const router = useRouter();
  const { currentStation } = useStation();
  const tierRef = useRef<HTMLDivElement>(null);
  const [selectedTier, setSelectedTier] = useState("");
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    city: "",
    businessType: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const scrollToTiers = () => {
    tierRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.businessName || !form.email) {
      setError("Business name and email are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sponsors/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sponsorshipTier: selectedTier || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError("We already have an inquiry from this email. Our team will follow up soon!");
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }

      router.push("/sponsor/thank-you");
    } catch {
      setError("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const tierColorClasses: Record<string, { bg: string; border: string; ring: string; text: string }> = {
    amber: { bg: "bg-amber-50", border: "border-amber-300", ring: "ring-amber-500", text: "text-amber-700" },
    gray: { bg: "bg-gray-50", border: "border-gray-300", ring: "ring-gray-500", text: "text-gray-700" },
    yellow: { bg: "bg-yellow-50", border: "border-yellow-400", ring: "ring-yellow-500", text: "text-yellow-700" },
    indigo: { bg: "bg-indigo-50", border: "border-indigo-300", ring: "ring-indigo-500", text: "text-indigo-700" },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 text-green-700 hover:text-green-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <Radio className="w-5 h-5" />
              <span className="font-bold">{currentStation.name}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <Building2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Reach Music Lovers Who Support Local
          </h1>
          <p className="text-xl sm:text-2xl font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6">
            Sponsor {currentStation.name} and grow with the community.
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Our listeners are engaged, loyal, and passionate about supporting local businesses. Put your brand in front of people who care about their community.
          </p>
          <button
            onClick={scrollToTiers}
            className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
          >
            View Sponsorship Tiers
          </button>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 px-4 bg-white/60">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Why Sponsors Choose {currentStation.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: Target,
                title: "Targeted Reach",
                desc: "Your message reaches local music fans who actively support independent businesses.",
              },
              {
                icon: Megaphone,
                title: "Community Goodwill",
                desc: "Be known as a business that supports local arts, culture, and independent artists.",
              },
              {
                icon: TrendingUp,
                title: "Brand Alignment",
                desc: "Associate your brand with authentic music, creativity, and community values.",
              },
              {
                icon: BarChart3,
                title: "Real Analytics",
                desc: "Get monthly reports on listener engagement, impressions, and campaign performance.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-green-100 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mb-4">
                  <item.icon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Choose a Tier", desc: "Pick the sponsorship level that fits your goals and budget." },
              { step: "2", title: "Submit Inquiry", desc: "Tell us about your business and we'll be in touch." },
              { step: "3", title: "Get Matched", desc: "Our team crafts a custom sponsorship plan for you." },
              { step: "4", title: "Go Live", desc: "Your brand hits the airwaves and reaches our audience." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-full font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers + Form */}
      <div ref={tierRef} className="max-w-4xl mx-auto px-4 py-16">
        {/* Sponsorship Tiers */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Choose Your Sponsorship Level</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SPONSORSHIP_TIERS.map((tier) => {
              const colors = tierColorClasses[tier.color];
              const isSelected = selectedTier === tier.name.toLowerCase();
              return (
                <button
                  key={tier.name}
                  type="button"
                  onClick={() => setSelectedTier(isSelected ? "" : tier.name.toLowerCase())}
                  className={`text-left p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? `${colors.bg} ${colors.border} ring-2 ${colors.ring}`
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold text-lg ${isSelected ? colors.text : "text-gray-900"}`}>
                      {tier.name}
                    </span>
                    {isSelected && <Check className={`w-5 h-5 ${colors.text}`} />}
                  </div>
                  <div className={`text-xl font-bold mb-3 ${isSelected ? colors.text : "text-gray-700"}`}>
                    {tier.price}
                  </div>
                  <ul className="space-y-1.5">
                    {tier.features.map((f) => (
                      <li key={f} className="text-sm text-gray-600 flex items-start space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inquiry Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Tell Us About Your Business</h2>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Your business name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                id="contactName"
                type="text"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@business.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                id="city"
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Your city"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
                Business Type
              </label>
              <select
                id="businessType"
                value={form.businessType}
                onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors bg-white"
              >
                <option value="">Select type...</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {submitting ? (
              <span>Submitting...</span>
            ) : (
              <span>Submit Sponsorship Inquiry</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
