"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CreditCard, Radio, Megaphone, Building2, Check } from "lucide-react";

/**
 * Plan catalog — mirrors the pricing defined in src/lib/payments/manifest.ts
 * so we can display details client-side without an extra fetch.
 */
const PLANS: Record<
  string,
  Record<string, { name: string; price: number; interval: string; features: string[] }>
> = {
  artist: {
    TIER_5: {
      name: "Starter Airplay",
      price: 5,
      interval: "month",
      features: ["5 airplay shares per rotation", "Basic analytics", "Artist profile page"],
    },
    TIER_20: {
      name: "Growth Airplay",
      price: 20,
      interval: "month",
      features: ["25 airplay shares per rotation", "Priority scheduling", "Detailed analytics", "Social promotion"],
    },
    TIER_50: {
      name: "Pro Airplay",
      price: 50,
      interval: "month",
      features: ["75 airplay shares per rotation", "Peak-hour priority", "Full analytics suite", "Newsletter features"],
    },
    TIER_120: {
      name: "Premium Airplay",
      price: 120,
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
    bronze: {
      name: "Bronze Sponsorship",
      price: 100,
      interval: "month",
      features: ["2 ad spots per hour", "Basic sponsor page", "Monthly performance report"],
    },
    silver: {
      name: "Silver Sponsorship",
      price: 300,
      interval: "month",
      features: ["5 ad spots per hour", "Featured sponsor page", "Weekly reports", "Social media mentions"],
    },
    gold: {
      name: "Gold Sponsorship",
      price: 500,
      interval: "month",
      features: [
        "10 ad spots per hour",
        "Premium placement",
        "Real-time dashboard",
        "Custom ad production",
        "Newsletter sponsorship",
      ],
    },
    platinum: {
      name: "Platinum Sponsorship",
      price: 1000,
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
  station: {
    starter: {
      name: "Starter Station",
      price: 49,
      interval: "month",
      features: ["1 station", "AI DJ automation", "Basic scheduling", "Up to 500 songs"],
    },
    pro: {
      name: "Pro Station",
      price: 149,
      interval: "month",
      features: [
        "Up to 3 stations",
        "Advanced AI DJs",
        "Full scheduling suite",
        "Unlimited songs",
        "Sponsor management",
        "Analytics dashboard",
      ],
    },
    enterprise: {
      name: "Enterprise Network",
      price: 499,
      interval: "month",
      features: [
        "Unlimited stations",
        "White-label branding",
        "API access",
        "Dedicated support",
        "Custom integrations",
        "Multi-operator network",
        "Revenue sharing tools",
      ],
    },
  },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "";
  const tier = searchParams.get("tier") || "";
  const entityId = searchParams.get("entityId") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const planGroup = PLANS[type];
  const plan = planGroup?.[tier];

  const typeIcon = type === "artist" ? Radio : type === "sponsor" ? Megaphone : Building2;
  const TypeIcon = typeIcon;

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

      if (type === "station") {
        // Station provisioning goes through operator signup
        endpoint = "/api/operator/signup";
        payload = {
          organizationName: name,
          name,
          email,
          password: "", // The signup flow will handle password setup via email
        };
      } else {
        // Artist / sponsor subscriptions
        endpoint = "/api/payments/subscribe";
        payload = {
          type: type === "artist" ? "airplay" : "sponsorship",
          entityId,
          tier,
          email,
          name,
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

      // For artist/sponsor — redirect to Manifest's hosted checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // For station — redirect to verification / success page
      if (data.success && type === "station") {
        window.location.href = `/operate?signup=success&org=${data.organizationId || ""}`;
        return;
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Invalid plan — show a helpful fallback
  if (!plan) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-4">Plan Not Found</h1>
          <p className="text-stone-600 mb-6">
            We could not find a plan matching your selection. Please choose a plan from one of our
            pricing pages.
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
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-amber-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href={type === "artist" ? "/airplay" : type === "sponsor" ? "/sponsor" : "/operate"}
            className="inline-flex items-center gap-2 text-amber-100 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to plans
          </Link>
          <h1 className="text-3xl font-bold">Complete Your Subscription</h1>
          <p className="text-amber-100 mt-1">Secure checkout powered by Manifest Financial</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Plan Summary — right on desktop, top on mobile */}
          <div className="md:col-span-2 md:order-2">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TypeIcon className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-500 font-medium">
                    {type} plan
                  </p>
                  <h2 className="text-lg font-bold text-stone-900">{plan.name}</h2>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-stone-900">${plan.price}</span>
                <span className="text-stone-500">/{plan.interval}</span>
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-stone-700">
                    <Check className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t border-stone-200">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Billed monthly</span>
                  <span className="font-semibold text-stone-900">${plan.price}/mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="md:col-span-3 md:order-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-amber-700" />
                <h2 className="text-xl font-bold text-stone-900">Your Information</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="checkout-name" className="block text-sm font-medium text-stone-700 mb-1">
                    {type === "sponsor" ? "Business Name" : "Full Name"}
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={type === "sponsor" ? "Acme Corp" : "Jane Doe"}
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow text-stone-900"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-email" className="block text-sm font-medium text-stone-700 mb-1">
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
                      Continue to Payment — ${plan.price}/mo
                    </>
                  )}
                </button>

                <p className="text-xs text-stone-500 text-center">
                  You will be redirected to Manifest Financial&apos;s secure checkout to complete
                  payment. Cancel anytime from your dashboard.
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
