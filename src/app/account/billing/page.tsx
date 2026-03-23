"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Building2,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
  X,
  Shield,
} from "lucide-react";
import { SharedNav } from "@/components/shared-nav";

interface SessionData {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  organization?: {
    id: string;
    name: string;
    plan?: string;
    monthlyFee?: number;
    platformFeePercent?: number;
    subscriptionStart?: string;
  };
}

const PLAN_DETAILS: Record<
  string,
  { name: string; price: number; fee: string }
> = {
  launch: { name: "Launch", price: 150, fee: "15%" },
  growth: { name: "Growth", price: 250, fee: "10%" },
  scale: { name: "Scale", price: 400, fee: "7%" },
  network: { name: "Network", price: 800, fee: "5%" },
};

function getNextBillingDate(startDate?: string): string {
  if (!startDate) return "N/A";
  const start = new Date(startDate);
  const now = new Date();
  const next = new Date(start);
  while (next <= now) {
    next.setMonth(next.getMonth() + 1);
  }
  return next.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function BillingPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <SharedNav />
        <div className="flex items-center justify-center mt-32">
          <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-stone-50">
        <SharedNav />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <Shield className="w-12 h-12 text-stone-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-stone-900 mb-2">
              Sign In Required
            </h1>
            <p className="text-stone-600 mb-6">
              Please sign in to view your billing and subscription details.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-700 text-white font-semibold rounded-lg hover:bg-amber-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const org = session.organization;
  const planKey = org?.plan?.toLowerCase() || "";
  const planInfo = PLAN_DETAILS[planKey];
  const planName = planInfo?.name || org?.plan || "No Plan";
  const planPrice = org?.monthlyFee ?? planInfo?.price ?? 0;
  const platformFee =
    org?.platformFeePercent != null
      ? `${org.platformFeePercent}%`
      : planInfo?.fee || "N/A";
  const nextBilling = getNextBillingDate(org?.subscriptionStart);

  return (
    <div className="min-h-screen bg-stone-50">
      <SharedNav />

      {/* Header */}
      <div className="bg-amber-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-amber-100 mt-1">
            Manage your plan, payment method, and billing history
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Current Plan */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-700" />
              <h2 className="text-lg font-bold text-stone-900">
                Current Plan
              </h2>
            </div>
            {planPrice > 0 && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                Active
              </span>
            )}
          </div>

          {planPrice > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                  Plan
                </p>
                <p className="text-lg font-semibold text-stone-900">
                  {planName}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                  Monthly Price
                </p>
                <p className="text-lg font-semibold text-stone-900">
                  ${planPrice}/mo
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                  Platform Fee
                </p>
                <p className="text-lg font-semibold text-stone-900">
                  {platformFee}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">
                  Next Billing Date
                </p>
                <p className="text-lg font-semibold text-stone-900">
                  {nextBilling}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-stone-500">
              You are not currently subscribed to a plan.
            </p>
          )}

          <div className="mt-4 pt-4 border-t border-stone-100">
            <Link
              href="/operator/signup"
              className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 text-sm font-medium transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              {planPrice > 0 ? "Upgrade Plan" : "Choose a Plan"}
            </Link>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-amber-700" />
            <h2 className="text-lg font-bold text-stone-900">
              Payment Method
            </h2>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-stone-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700">
                  No payment method on file
                </p>
                <p className="text-xs text-stone-500">
                  Add a card to enable automatic billing
                </p>
              </div>
            </div>
            <div className="relative group">
              <button
                disabled
                className="px-4 py-2 bg-stone-200 text-stone-400 text-sm font-medium rounded-lg cursor-not-allowed"
              >
                Add Payment Method
              </button>
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                <div className="bg-stone-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  Coming soon — Manifest Financial integration in progress
                  <div className="absolute top-full right-4 w-2 h-2 bg-stone-900 rotate-45 -translate-y-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-amber-700" />
            <h2 className="text-lg font-bold text-stone-900">
              Billing History
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-xs text-stone-500 uppercase tracking-wider font-semibold">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-stone-500 uppercase tracking-wider font-semibold">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-stone-500 uppercase tracking-wider font-semibold">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-stone-500 uppercase tracking-wider font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-8 text-stone-400"
                  >
                    No invoices yet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Cancel Subscription */}
        {planPrice > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-stone-900">
                Cancel Subscription
              </h2>
            </div>
            <p className="text-sm text-stone-600 mb-4">
              Cancelling your subscription will disable your station at the end
              of your current billing period. This action cannot be undone
              without resubscribing.
            </p>
            <button
              onClick={() => setShowCancelDialog(true)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel Subscription
            </button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900">
                Cancel Subscription?
              </h3>
              <button
                onClick={() => setShowCancelDialog(false)}
                className="p-1 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>
            <p className="text-sm text-stone-600 mb-2">
              Are you sure you want to cancel your{" "}
              <span className="font-semibold">{planName}</span> plan ($
              {planPrice}/mo)?
            </p>
            <p className="text-sm text-stone-600 mb-6">
              Your station will remain active until the end of your current
              billing period. After that, streaming and AI features will be
              disabled.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-amber-800">
                To cancel your subscription, please contact support at{" "}
                <a
                  href="mailto:support@truefans.fm"
                  className="font-semibold underline"
                >
                  support@truefans.fm
                </a>{" "}
                or reach out through your operator dashboard.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 bg-stone-100 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-200 transition-colors"
              >
                Keep Subscription
              </button>
              <a
                href="mailto:support@truefans.fm?subject=Cancel Subscription"
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
