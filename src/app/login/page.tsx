"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Radio, AlertCircle, Building2, Users, Mail } from "lucide-react";

type LoginMode = "team" | "operator";

/** Returns true when the value looks like an email address. */
function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [mode, setMode] = useState<LoginMode>("team");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-detect mode when the user types an email address
  const isEmailInput = looksLikeEmail(username);
  const effectiveMode = isEmailInput ? "operator" : mode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Both team and operator login go through the same NextAuth credentials provider.
      // Team uses username (admin, riley, etc.), operator/user uses email.
      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials. Please check your username/email and password.");
      } else if (result?.ok) {
        // Email logins go to operator dashboard, team logins go to admin
        const redirect = effectiveMode === "operator" ? "/operator/dashboard" : callbackUrl;
        router.push(redirect);
        router.refresh();
      }
    } catch {
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-xl">
            <Radio className="w-12 h-12 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">TrueFans RADIO</h1>
          <p className="text-purple-200">Sign in to access your dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("team"); setUsername(""); setError(""); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                mode === "team"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode("operator"); setUsername(""); setError(""); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                mode === "operator"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Operator</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                {effectiveMode === "operator" ? "Email" : "Username or Email"}
              </label>
              <div className="relative">
                <input
                  id="username"
                  type={effectiveMode === "operator" ? "email" : "text"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder={mode === "team" ? "e.g. admin, riley, or you@email.com" : "you@example.com"}
                  required
                  disabled={isLoading}
                />
                {isEmailInput && mode === "team" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Mail className="w-4 h-4 text-amber-600" />
                  </span>
                )}
              </div>
              {isEmailInput && mode === "team" && (
                <p className="text-xs text-amber-600 mt-1">
                  Detected email address — signing in as organization user
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white py-3 rounded-lg font-medium focus:ring-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                effectiveMode === "team"
                  ? "bg-purple-600 hover:bg-purple-700 focus:ring-purple-300"
                  : "bg-amber-700 hover:bg-amber-800 focus:ring-amber-300"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {effectiveMode === "operator" && (
            <div className="mt-4 text-center">
              <Link href="/operator/signup" className="text-sm text-amber-700 hover:text-amber-800 font-medium">
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {effectiveMode === "team"
                ? "Contact your administrator for credentials. You can also sign in with your email."
                : "Organization accounts manage station programming and settings."}
            </p>
          </div>
        </div>

        <p className="text-center text-purple-200 text-sm mt-6">
          &copy; {new Date().getFullYear()} TrueFans RADIO Network
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
