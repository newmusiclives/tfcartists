"use client";

import { operatorPlans } from "@/lib/tiers";
import { ARTIST_CAPACITY } from "@/lib/calculations/station-capacity";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio, Building2, ArrowRight, ArrowLeft, Loader2, Check, Star } from "lucide-react";

// Plans come from TIERS - the same definition that enforces the limits and
// bills the operator. This page used to declare its own array, which is how the
// site ended up quoting $200 for a plan the model priced at $150 and promising
// 2 DJs where the entitlement code grants 4.
const OPERATOR_PLANS = operatorPlans().map((p, i) => ({
  id: p.id,
  name: p.name,
  price: p.monthlyPrice,
  fee: `${p.revenueSharePct}%`,
  setup: p.setupFee,
  stations: p.stations,
  djs: String(p.djs),
  artists: ARTIST_CAPACITY.TOTAL,
  recommended: i === 1,
}));

export default function OperatorSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [form, setForm] = useState({
    organizationName: "",
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/operator/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, plan: selectedPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      router.push("/station-admin/wizard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const activePlan = OPERATOR_PLANS.find((p) => p.id === selectedPlan);

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className={step === 1 ? "w-full max-w-4xl" : "w-full max-w-md"}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <Radio className="w-8 h-8 text-amber-700 dark:text-amber-300" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">TrueFans RADIO</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Start Your Station</h1>
          <p className="text-gray-600 dark:text-zinc-400">
            {step === 1
              ? "Choose the plan that fits your station."
              : "Create your operator account to get started."}
          </p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? "bg-amber-700 text-white" : "bg-amber-200 text-amber-800 dark:text-amber-200"}`}>1</span>
            <span className="w-8 h-0.5 bg-amber-200" />
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? "bg-amber-700 text-white" : "bg-amber-200 text-amber-800 dark:text-amber-200"}`}>2</span>
          </div>
        </div>

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {OPERATOR_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 text-left transition-all border-2 hover:shadow-lg ${
                    selectedPlan === plan.id
                      ? "border-amber-700 ring-2 ring-amber-200"
                      : "border-transparent"
                  }`}
                >
                  {plan.recommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> RECOMMENDED
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                  <div className="mb-3">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                    <span className="text-gray-600 dark:text-zinc-400">/mo</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-600 dark:text-amber-300 mt-0.5 flex-shrink-0" />
                      {plan.fee} platform fee
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-600 dark:text-amber-300 mt-0.5 flex-shrink-0" />
                      {plan.setup === 0 ? "Free setup" : `$${plan.setup.toLocaleString()} setup`}
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-600 dark:text-amber-300 mt-0.5 flex-shrink-0" />
                      {plan.stations} station{plan.stations > 1 ? "s" : ""}
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-600 dark:text-amber-300 mt-0.5 flex-shrink-0" />
                      {plan.djs} DJ{plan.djs !== "1" ? "s" : ""}
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-600 dark:text-amber-300 mt-0.5 flex-shrink-0" />
                      {plan.artists.toLocaleString()} artists
                    </li>
                  </ul>
                </button>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                type="button"
                disabled={!selectedPlan}
                onClick={() => setStep(2)}
                className="inline-flex items-center space-x-2 bg-amber-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Account Details */}
        {step === 2 && (
          <>
            {activePlan && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 text-sm text-amber-800 dark:text-amber-200 text-center">
                <span className="font-semibold">{activePlan.name}</span> plan selected — ${activePlan.price}/mo
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 space-y-5">
              {error && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Station / Organization Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="orgName"
                    type="text"
                    required
                    placeholder="e.g. Mountain Country Radio"
                    className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={form.organizationName}
                    onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Full name"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(null); }}
                  className="flex items-center space-x-1 px-4 py-3 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center space-x-2 bg-amber-700 text-white py-3 rounded-lg font-semibold hover:bg-amber-800 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-sm text-gray-600 dark:text-zinc-400">
                Already have an account?{" "}
                <Link href="/login" className="text-amber-700 dark:text-amber-300 hover:text-amber-800 font-medium">
                  Log in
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
