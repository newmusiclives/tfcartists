"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio, Building2, ArrowRight, Loader2 } from "lucide-react";

export default function OperatorSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organizationName: "",
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/operator/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <Radio className="w-8 h-8 text-amber-700" />
            <span className="text-2xl font-bold text-gray-900">TrueFans RADIO</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Your Station</h1>
          <p className="text-gray-600">Create your operator account to launch your own AI-powered radio station.</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <h2 className="text-lg font-bold text-green-800 mb-2">Check Your Email</h2>
            <p className="text-green-700 mb-3">
              We've sent a verification link to your email address. Please click it to activate your account.
            </p>
            <p className="text-sm text-green-600">
              Once verified, you can <Link href="/login" className="font-medium underline">log in here</Link>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-amber-700 text-white py-3 rounded-lg font-semibold hover:bg-amber-800 transition-colors disabled:opacity-50"
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

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-amber-700 hover:text-amber-800 font-medium">
                Log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
