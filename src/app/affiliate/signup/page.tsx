"use client";

import { useState } from "react";
import { Radio, Building2, Globe, Mail, User, Loader2, ArrowRight, Check, Megaphone } from "lucide-react";

export default function AffiliateSignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    website: "",
    promotionMethod: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ referralCode: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed. Please try again.");
        return;
      }

      setSuccess({ referralCode: data.referralCode });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Success state
  if (success) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10">
            <div className="w-16 h-16 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Welcome to the Program</h1>
            <p className="text-zinc-400 mb-8">
              Your affiliate account has been created. Here is your referral code:
            </p>

            <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-6 py-4 mb-6">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Your Referral Code</div>
              <div className="text-3xl font-bold font-mono text-amber-500">{success.referralCode}</div>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 mb-8 text-left">
              <div className="text-xs text-zinc-500 mb-1">Your referral link</div>
              <div className="font-mono text-sm text-zinc-300 break-all">
                {typeof window !== "undefined" ? window.location.origin : ""}/api/affiliates/track?ref={success.referralCode}
              </div>
            </div>

            <div className="space-y-3">
              <a
                href="/affiliate"
                className="flex items-center justify-center gap-2 w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-500 transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <Radio className="w-8 h-8 text-amber-500" />
            <span className="text-2xl font-bold text-white">TrueFans RADIO</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Affiliate Program</h1>
          <p className="text-zinc-400 max-w-md mx-auto">
            Earn recurring commissions by referring station operators to TrueFans RADIO.
            Ideal for agencies, consultants, and media professionals.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-amber-500">20%</div>
            <div className="text-xs text-zinc-400 mt-1">Recurring for 12mo</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-amber-500">$50</div>
            <div className="text-xs text-zinc-400 mt-1">Per activation</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-amber-500">Monthly</div>
            <div className="text-xs text-zinc-400 mt-1">Payouts</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-5">
          {error && (
            <div className="bg-red-950/50 border border-red-900 rounded-lg p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                id="name"
                type="text"
                required
                placeholder="Jane Smith"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                id="email"
                type="email"
                required
                placeholder="jane@agency.com"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Company / Agency Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                id="company"
                type="text"
                required
                placeholder="Digital Media Agency"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Website <span className="text-zinc-600">(optional)</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                id="website"
                type="url"
                placeholder="https://agency.com"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="promotionMethod" className="block text-sm font-medium text-zinc-300 mb-1.5">
              How will you promote TrueFans RADIO?
            </label>
            <div className="relative">
              <Megaphone className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <textarea
                id="promotionMethod"
                rows={3}
                placeholder="e.g., Blog content, client referrals, social media, podcast recommendations..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors resize-none"
                value={form.promotionMethod}
                onChange={(e) => update("promotionMethod", e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-500 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Apply as Affiliate
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-zinc-500">
            Already an affiliate?{" "}
            <a href="/affiliate" className="text-amber-500 hover:text-amber-400 font-medium">
              Access your dashboard
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
