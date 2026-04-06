"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CreditCard,
  Radio,
  Megaphone,
  Building2,
  Check,
  Lock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { SharedNav } from "@/components/shared-nav";

/**
 * Plan catalog — mirrors the pricing defined in the API routes:
 *   Artist tiers: src/app/api/artists/[id]/subscribe/route.ts
 *   Sponsor tiers: src/app/api/sponsors/[id]/contract/route.ts
 *   Operator plans: src/app/operate/page.tsx
 */
const PLANS: Record<
  string,
  Record<
    string,
    { name: string; price: number; interval: string; fee?: string; features: string[] }
  >
> = {
  operator: {
    launch: {
      name: "Launch",
      price: 199,
      interval: "month",
      fee: "15% of revenue",
      features: [
        "1 AI-powered radio station",
        "AI DJ automation with Gemini voices",
        "Basic scheduling",
        "Up to 500 songs",
        "15% platform fee on revenue",
      ],
    },
    growth: {
      name: "Growth",
      price: 299,
      interval: "month",
      fee: "10% of revenue",
      features: [
        "Up to 3 stations",
        "Advanced AI DJs with cloned voices",
        "Full scheduling suite",
        "Unlimited songs",
        "Sponsor management",
        "10% platform fee on revenue",
      ],
    },
    scale: {
      name: "Scale",
      price: 449,
      interval: "month",
      fee: "7% of revenue",
      features: [
        "Up to 10 stations",
        "White-label branding",
        "API access",
        "Analytics dashboard",
        "Custom integrations",
        "7% platform fee on revenue",
      ],
    },
    network: {
      name: "Network",
      price: 899,
      interval: "month",
      fee: "5% of revenue",
      features: [
        "Unlimited stations",
        "White-label branding",
        "API access",
        "Dedicated support",
        "Multi-operator network",
        "Revenue sharing tools",
        "5% platform fee on revenue",
      ],
    },
  },
  artist: {
    TIER_5: {
      name: "Starter Airplay",
      price: 5,
      interval: "month",
      features: ["5 airplay shares per rotation", "Basic analytics", "Artist profile page"],
    },
    TIER_20: {
      name: "Growth Airplay",
      price: 15,
      interval: "month",
      features: [
        "25 airplay shares per rotation",
        "Priority scheduling",
        "Detailed analytics",
        "Social promotion",
      ],
    },
    TIER_50: {
      name: "Pro Airplay",
      price: 40,
      interval: "month",
      features: [
        "75 airplay shares per rotation",
        "Peak-hour priority",
        "Full analytics suite",
        "Newsletter features",
      ],
    },
    TIER_120: {
      name: "Premium Airplay",
      price: 100,
      interval: "month",
      features: [
        "200 airplay shares per rotation",
        "Top-of-rotation priority",
        "Dedicated account support",
        "Cross-station syndication",
        "Exclusive artist spotlights",
      ],
    },
  },
  sponsor: {
    local_hero: {
      name: "Local Hero Sponsorship",
      price: 30,
      interval: "month",
      features: [
        "2 ad spots per hour",
        "Basic sponsor page",
        "Monthly performance report",
      ],
    },
    tier_1: {
      name: "Tier 1 Sponsorship",
      price: 80,
      interval: "month",
      features: [
        "5 ad spots per hour",
        "Featured sponsor page",
        "Weekly reports",
        "Social media mentions",
      ],
    },
    tier_2: {
      name: "Tier 2 Sponsorship",
      price: 150,
      interval: "month",
      features: [
        "10 ad spots per hour",
        "Premium placement",
        "Real-time dashboard",
        "Custom ad production",
        "Newsletter sponsorship",
      ],
    },
    tier_3: {
      name: "Tier 3 Sponsorship",
      price: 300,
      interval: "month",
      features: [
        "20 ad spots per hour",
        "Exclusive show sponsorship",
        "Dedicated account manager",
        "Custom integrations",
        "Cross-station network ads",
        "Event sponsorship rights",
      ],
    },
  },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "";
  const plan = searchParams.get("plan") || searchParams.get("tier") || "";
  const artistId = searchParams.get("artistId") || searchParams.get("entityId") || "";
  const sponsorId = searchParams.get("sponsorId") || searchParams.get("entityId") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const planGroup = PLANS[type];
  const selectedPlan = planGroup?.[plan];

  const typeIcon =
    type === "artist" ? Radio : type === "sponsor" ? Megaphone : Building2;
  const TypeIcon = typeIcon;

  const typeLabel =
    type === "operator"
      ? "Station Operator"
      : type === "artist"
        ? "Artist Airplay"
        : "Sponsor";

  const backHref =
    type === "artist"
      ? "/airplay"
      : type === "sponsor"
        ? "/sponsor"
        : "/operate";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      let endpoint: string;
      let payload: Record<string, unknown>;

      if (type === "artist") {
        endpoint = `/api/artists/${artistId}/subscribe`;
        payload = { tier: plan, name, email };
      } else if (type === "sponsor") {
        endpoint = `/api/sponsors/${sponsorId}/contract`;
        payload = { tier: plan, name, email, durationMonths: 1 };
      } else {
        // Operator — they should have already signed up
        endpoint = "/api/operator/signup";
        payload = {
          organizationName: name,
          name,
          email,
          plan,
          password: "",
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // If Manifest returns a hosted checkout URL, redirect
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Otherwise show success state
      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (success && selectedPlan) {
    return (
      <div className="min-h-screen bg-stone-50">
        <SharedNav />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">
              Purchase Confirmed!
            </h1>
            <p className="text-stone-600 mb-6">
              Your <span className="font-semibold">{selectedPlan.name}</span>{" "}
              subscription is now active at{" "}
              <span className="font-semibold">
                ${selectedPlan.price}/{selectedPlan.interval}
              </span>
              .
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-amber-900 mb-2">Next Steps</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                {type === "operator" && (
                  <>
                    <li>1. Check your email for login credentials</li>
                    <li>2. Visit your operator dashboard to configure your station</li>
                    <li>3. Upload music and set up your schedule</li>
                  </>
                )}
                {type === "artist" && (
                  <>
                    <li>1. Your airplay tier has been upgraded</li>
                    <li>2. Visit your artist portal to review your rotation</li>
                    <li>3. Upload new tracks to maximize your airplay</li>
                  </>
                )}
                {type === "sponsor" && (
                  <>
                    <li>1. Your sponsorship contract is now active</li>
                    <li>2. Visit your sponsor portal to manage ad creatives</li>
                    <li>3. Review performance reports weekly</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              {type === "operator" && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 transition-colors"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {type === "artist" && (
                <Link
                  href="/portal/artist"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 transition-colors"
                >
                  Go to Artist Portal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {type === "sponsor" && (
                <Link
                  href="/portal/sponsor"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 transition-colors"
                >
                  Go to Sponsor Portal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link
                href="/"
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                Return to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid plan — show a helpful fallback
  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-stone-50">
        <SharedNav />
        <div className="flex items-center justify-center p-4 mt-16">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-stone-900 mb-4">
              Plan Not Found
            </h1>
            <p className="text-stone-600 mb-6">
              We could not find a plan matching your selection. Please choose a
              plan from one of our pricing pages.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/airplay"
                className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
              >
                Artist Airplay Plans
              </Link>
              <Link
                href="/sponsor"
                className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
              >
                Sponsor Plans
              </Link>
              <Link
                href="/operate"
                className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
              >
                Station Operator Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <SharedNav />

      {/* Header */}
      <div className="bg-amber-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-amber-100 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to plans
          </Link>
          <h1 className="text-3xl font-bold">Complete Your Subscription</h1>
          <p className="text-amber-100 mt-1">
            Secure checkout powered by Manifest Financial
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Order Summary — right on desktop, top on mobile */}
          <div className="md:col-span-2 md:order-2">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
              <h3 className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-4">
                Order Summary
              </h3>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TypeIcon className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">
                    {typeLabel}
                  </p>
                  <h2 className="text-lg font-bold text-stone-900">
                    {selectedPlan.name}
                  </h2>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-stone-900">
                  ${selectedPlan.price}
                </span>
                <span className="text-stone-500">/{selectedPlan.interval}</span>
              </div>

              {selectedPlan.fee && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                  Platform fee: {selectedPlan.fee}
                </p>
              )}

              <ul className="space-y-2">
                {selectedPlan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-stone-700"
                  >
                    <Check className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t border-stone-200 space-y-2">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Subtotal</span>
                  <span>${selectedPlan.price}.00</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-stone-900">
                  <span>Due today</span>
                  <span>${selectedPlan.price}.00/mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="md:col-span-3 md:order-1 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-amber-700" />
                <h2 className="text-xl font-bold text-stone-900">
                  Your Information
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="checkout-name"
                    className="block text-sm font-medium text-stone-700 mb-1"
                  >
                    {type === "sponsor"
                      ? "Business Name"
                      : type === "operator"
                        ? "Organization Name"
                        : "Full Name"}
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      type === "sponsor"
                        ? "Acme Corp"
                        : type === "operator"
                          ? "My Radio Network"
                          : "Jane Doe"
                    }
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow text-stone-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-email"
                    className="block text-sm font-medium text-stone-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow text-stone-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-card"
                    className="block text-sm font-medium text-stone-700 mb-1"
                  >
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      id="checkout-card"
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, "").slice(0, 19))}
                      placeholder="4242 4242 4242 4242"
                      className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow text-stone-900"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  </div>
                  <p className="mt-1.5 text-xs text-stone-500">
                    Payments processed securely via Manifest Financial.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Complete Purchase — ${selectedPlan.price}/mo
                    </>
                  )}
                </button>

                <p className="text-xs text-stone-500 text-center">
                  By completing this purchase you agree to our terms of service.
                  Cancel anytime from your account billing page.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
