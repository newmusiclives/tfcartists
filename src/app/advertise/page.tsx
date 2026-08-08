"use client";

import { useState } from "react";
import Link from "next/link";
import { Radio, ArrowLeft, Check, Loader2, Moon, Mic } from "lucide-react";
import {
  SPONSOR_PACKAGE_LIST,
  totalAiringsPerMonth,
  type SponsorPackageKey,
} from "@/lib/sponsors/packages";

/**
 * Advertise on the station, without talking to anybody.
 *
 * Imports the package table directly rather than the capacity model, so the
 * prices on this page are the same values the payment layer charges - the
 * previous arrangement had the rate card, this kind of page and Manifest each
 * holding their own copy, disagreeing by up to 2-3x.
 */

const MAX_COPY = 220;

type FormState = {
  businessName: string;
  email: string;
  phone: string;
  city: string;
  businessType: string;
  adCopy: string;
};

const EMPTY: FormState = {
  businessName: "",
  email: "",
  phone: "",
  city: "",
  businessType: "",
  adCopy: "",
};

export default function AdvertisePage() {
  const [selected, setSelected] = useState<SponsorPackageKey | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");

  const pkg = selected ? SPONSOR_PACKAGE_LIST.find((p) => p.key === selected) ?? null : null;
  const remaining = MAX_COPY - form.adCopy.length;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errorField === key) {
      setError("");
      setErrorField("");
    }
  }

  async function handleSubmit() {
    if (!selected) return;
    setLoading(true);
    setError("");
    setErrorField("");

    try {
      const res = await fetch("/api/sponsors/self-serve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, packageKey: selected }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Nothing has been charged.");
        setErrorField(data.field || "");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError("Payment could not be started. Nothing has been charged.");
      }
    } catch {
      setError("Network error. Nothing has been charged - please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 dark:from-amber-950 via-white dark:via-zinc-900 to-orange-50 dark:to-orange-950">
      <header className="bg-white/80 dark:bg-zinc-950/90 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5 text-amber-600 dark:text-amber-300" />
              <span className="font-semibold">Advertise on TrueFans RADIO</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Put your business on the radio
          </h1>
          <p className="text-xl text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto mb-6">
            Choose a package, write your ad, pay by card. One of our presenters
            voices it and it goes to air. No sales call, no contract meeting.
          </p>

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="flex items-start space-x-4">
              <Moon className="w-6 h-6 text-amber-600 dark:text-amber-300 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h2 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                  Every package airs twice
                </h2>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  You pay for daytime spots between 6am and 6pm. We run your ad
                  again overnight, free, so you get roughly double the airtime
                  you bought.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {SPONSOR_PACKAGE_LIST.map((p) => {
            const isSelected = selected === p.key;
            const bonus = totalAiringsPerMonth(p.key) - p.spotsPerMonth;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelected(p.key)}
                aria-pressed={isSelected}
                className={`text-left rounded-xl border-2 p-6 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isSelected
                    ? "border-amber-500 bg-white dark:bg-zinc-900 shadow-lg"
                    : "border-gray-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/70 hover:border-amber-300"
                }`}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{p.name}</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  ${p.price}
                  <span className="text-base font-normal text-gray-500 dark:text-zinc-400">/month</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">{p.pitch}</p>
                <ul className="text-sm text-gray-700 dark:text-zinc-300 space-y-1">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>
                      {p.spotsPerDay} paid {p.spotsPerDay === 1 ? "spot" : "spots"} a day
                      {" "}({p.spotsPerMonth}/month)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{bonus} free overnight airings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Voiced by a station presenter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Cancel any month</span>
                  </li>
                </ul>
              </button>
            );
          })}
        </div>

        {/* Booking form */}
        {pkg && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {pkg.name} — ${pkg.price}/month
            </h2>
            <p className="text-gray-600 dark:text-zinc-400 mb-6">
              {pkg.spotsPerMonth} paid spots plus {totalAiringsPerMonth(pkg.key) - pkg.spotsPerMonth} free
              overnight airings each month.
            </p>

            <div className="space-y-4">
              <Field
                label="Business name"
                value={form.businessName}
                onChange={(v) => set("businessName", v)}
                invalid={errorField === "businessName"}
                required
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => set("email", v)}
                invalid={errorField === "email"}
                hint="Where we send your receipt and monthly play report."
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone (optional)" value={form.phone} onChange={(v) => set("phone", v)} />
                <Field label="Town or city (optional)" value={form.city} onChange={(v) => set("city", v)} />
              </div>
              <Field
                label="What kind of business? (optional)"
                value={form.businessType}
                onChange={(v) => set("businessType", v)}
                hint="Bakery, garage, venue — helps us place your ad well."
              />

              <div>
                <label
                  htmlFor="adCopy"
                  className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1"
                >
                  Your ad <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <textarea
                  id="adCopy"
                  rows={4}
                  value={form.adCopy}
                  maxLength={MAX_COPY}
                  onChange={(e) => set("adCopy", e.target.value)}
                  placeholder="Hartley's Bakery on Mill Street — sourdough out of the oven at seven every morning, and the coffee's on us before eight."
                  className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errorField === "adCopy"
                      ? "border-red-500"
                      : "border-gray-300 dark:border-zinc-600"
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" />
                    About 30 words — that is a 15-second spot.
                  </p>
                  <p
                    className={`text-sm tabular-nums ${
                      remaining < 20 ? "text-amber-700 dark:text-amber-400" : "text-gray-500 dark:text-zinc-400"
                    }`}
                  >
                    {remaining} left
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-800 dark:text-red-200"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-3 font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting checkout…
                </>
              ) : (
                <>Continue to payment — ${pkg.price}/month</>
              )}
            </button>
            <p className="mt-3 text-center text-sm text-gray-500 dark:text-zinc-400">
              You will see the amount again before you pay. Nothing is charged until you confirm.
            </p>
          </div>
        )}

        {!pkg && (
          <p className="text-center text-gray-600 dark:text-zinc-400">
            Pick a package above to get started.
          </p>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
  required,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
  required?: boolean;
  invalid?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-900 dark:text-zinc-100 mb-1">
        {label}
        {required && <span className="text-red-600 dark:text-red-400"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
          invalid ? "border-red-500" : "border-gray-300 dark:border-zinc-600"
        }`}
      />
      {hint && <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}
