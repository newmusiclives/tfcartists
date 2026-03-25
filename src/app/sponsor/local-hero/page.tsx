"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Radio,
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Mic2,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { useStation } from "@/contexts/StationContext";

const BUSINESS_TYPES = [
  { value: "accounting", label: "Accounting & Tax Services" },
  { value: "auto_dealer", label: "Auto Dealer" },
  { value: "auto_repair", label: "Auto Repair & Service" },
  { value: "bakery", label: "Bakery" },
  { value: "bank_credit_union", label: "Bank / Credit Union" },
  { value: "bar_pub", label: "Bar / Pub" },
  { value: "beauty_salon", label: "Beauty Salon / Barbershop" },
  { value: "brewery_winery", label: "Brewery / Winery / Distillery" },
  { value: "cafe_coffee", label: "Cafe / Coffee Shop" },
  { value: "catering", label: "Catering" },
  { value: "childcare", label: "Childcare / Daycare" },
  { value: "chiropractor", label: "Chiropractor / Wellness" },
  { value: "church", label: "Church / Place of Worship" },
  { value: "cleaning_service", label: "Cleaning Service" },
  { value: "clothing_boutique", label: "Clothing / Boutique" },
  { value: "construction", label: "Construction / Contractor" },
  { value: "dentist", label: "Dentist" },
  { value: "electrician", label: "Electrician" },
  { value: "event_venue", label: "Event Venue / Hall" },
  { value: "farm_ranch", label: "Farm / Ranch / Ag Supply" },
  { value: "fitness_gym", label: "Fitness / Gym / Yoga" },
  { value: "florist", label: "Florist" },
  { value: "funeral_home", label: "Funeral Home" },
  { value: "grocery", label: "Grocery / Market" },
  { value: "hardware_store", label: "Hardware Store" },
  { value: "hotel_motel", label: "Hotel / Motel / B&B" },
  { value: "hvac", label: "HVAC / Heating & Cooling" },
  { value: "insurance", label: "Insurance Agency" },
  { value: "jewelry", label: "Jewelry Store" },
  { value: "landscaping", label: "Landscaping / Lawn Care" },
  { value: "laundromat", label: "Laundromat / Dry Cleaning" },
  { value: "lawyer", label: "Law Office / Attorney" },
  { value: "medical", label: "Medical / Doctor's Office" },
  { value: "music_store", label: "Music Store / Lessons" },
  { value: "nonprofit", label: "Nonprofit / Charity" },
  { value: "optometrist", label: "Optometrist / Eye Care" },
  { value: "pet_services", label: "Pet Store / Grooming / Vet" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "photography", label: "Photography / Videography" },
  { value: "plumber", label: "Plumber" },
  { value: "real_estate", label: "Real Estate Agent / Agency" },
  { value: "restaurant", label: "Restaurant" },
  { value: "roofing", label: "Roofing" },
  { value: "school", label: "School / Tutoring" },
  { value: "spa_massage", label: "Spa / Massage" },
  { value: "sports_recreation", label: "Sports & Recreation" },
  { value: "storage", label: "Storage Facility" },
  { value: "tech_repair", label: "Tech / Phone / Computer Repair" },
  { value: "thrift_store", label: "Thrift Store / Consignment" },
  { value: "other", label: "Other" },
];

const TIME_SLOTS = [
  { value: "morning", label: "Morning", time: "6 - 9 AM" },
  { value: "midday", label: "Midday", time: "9 AM - 12 PM" },
  { value: "afternoon", label: "Afternoon", time: "12 - 3 PM" },
  { value: "drive", label: "Drive Time", time: "3 - 6 PM" },
];

const AD_STYLES = [
  { value: "friendly_mention", label: "Friendly mention" },
  { value: "professional_read", label: "Professional read" },
  { value: "jingle_style", label: "Jingle-style" },
];

const PACKAGE_BENEFITS = [
  "30 on-air ad spots per month",
  "Social media mentions",
  "Listed on our sponsors page",
  "Monthly listener report",
  "Ad script written for you",
  "Cancel anytime",
];

type FormData = {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  exclusiveCategory: boolean;
  timeSlots: string[];
  adStyle: string;
  businessDescription: string;
};

export default function LocalHeroSignup() {
  const { currentStation } = useStation();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    businessType: "",
    exclusiveCategory: false,
    timeSlots: [],
    adStyle: "",
    businessDescription: "",
  });

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const toggleTimeSlot = (slot: string) => {
    setForm((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(slot)
        ? prev.timeSlots.filter((s) => s !== slot)
        : [...prev.timeSlots, slot],
    }));
  };

  const canProceedStep1 = form.businessName && form.contactName && form.email;
  const canProceedStep2 = true; // All step 2 fields are optional preferences

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/sponsors/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone || undefined,
          businessType: form.businessType || "other",
          sponsorshipTier: "LOCAL_HERO",
          message: `LOCAL_HERO signup${form.exclusiveCategory ? " + EXCLUSIVE CATEGORY" : ""}. Ad style: ${form.adStyle || "No preference"}. Time slots: ${form.timeSlots.length > 0 ? form.timeSlots.join(", ") : "No preference"}. Monthly: $${form.exclusiveCategory ? "75" : "30"}.`,
          adPreferences: {
            timeSlots: form.timeSlots,
            adStyle: form.adStyle,
            businessDescription: form.businessDescription,
            exclusiveCategory: form.exclusiveCategory,
            monthlyAmount: form.exclusiveCategory ? 75 : 30,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(
            "Looks like we already have your info on file. We'll be in touch soon!"
          );
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Could not connect. Please check your internet and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Success Screen ---
  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-8">
            <Sparkles className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Welcome to {currentStation.name}!
          </h1>
          <p className="text-lg text-zinc-300 mb-10 leading-relaxed">
            You&apos;re officially a Local Hero sponsor. Here&apos;s what
            happens next:
          </p>

          <div className="bg-zinc-800/60 rounded-2xl p-8 text-left space-y-5 mb-10 border border-zinc-700/50">
            {[
              {
                num: "1",
                text: "We'll craft your personalized ad script based on the info you shared.",
              },
              {
                num: "2",
                text: "Expect your first on-air mention within 48 hours.",
              },
              {
                num: "3",
                text: "You'll get a monthly report showing when your ads aired and how many listeners heard them.",
              },
            ].map((item) => (
              <div key={item.num} className="flex gap-4 items-start">
                <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-400 font-bold text-sm">
                  {item.num}
                </span>
                <p className="text-zinc-200 text-lg leading-snug">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-medium text-lg transition-colors"
          >
            <Radio className="w-5 h-5" />
            Listen to {currentStation.name}
          </Link>
        </div>
      </main>
    );
  }

  // --- Step Indicator ---
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-10">
      {[
        { num: 1, label: "Your Business" },
        { num: 2, label: "Ad Preferences" },
        { num: 3, label: "Review" },
      ].map((s, i) => (
        <div key={s.num} className="flex items-center gap-3">
          <button
            onClick={() => {
              if (s.num < step) setStep(s.num);
            }}
            className={`flex items-center gap-2 transition-colors ${
              s.num < step
                ? "cursor-pointer"
                : s.num === step
                  ? "cursor-default"
                  : "cursor-default"
            }`}
          >
            <span
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-colors ${
                s.num < step
                  ? "bg-green-500 text-white"
                  : s.num === step
                    ? "bg-green-500/20 text-green-400 ring-2 ring-green-500"
                    : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {s.num < step ? <Check className="w-4 h-4" /> : s.num}
            </span>
            <span
              className={`hidden sm:inline text-sm font-medium ${
                s.num <= step ? "text-zinc-200" : "text-zinc-500"
              }`}
            >
              {s.label}
            </span>
          </button>
          {i < 2 && (
            <div
              className={`w-8 sm:w-12 h-0.5 ${s.num < step ? "bg-green-500" : "bg-zinc-700"}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      {/* Nav */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/sponsor"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <Radio className="w-5 h-5" />
              <span className="font-semibold">{currentStation.name}</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Local Hero Sponsorship
          </h1>
          <p className="text-lg text-zinc-400">
            The easiest way to get your business on the radio.
          </p>
        </div>

        {/* Price badge */}
        <div className="flex justify-center gap-2 mb-8">
          <span className="inline-flex items-center gap-1.5 bg-green-500/15 text-green-400 px-4 py-2 rounded-full text-sm font-semibold border border-green-500/20">
            {form.exclusiveCategory ? "$75" : "$30"} / month
          </span>
          {form.exclusiveCategory && (
            <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-400 px-3 py-2 rounded-full text-xs font-semibold border border-amber-500/20">
              Includes Exclusive Category
            </span>
          )}
        </div>

        <StepIndicator />

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-5 py-4 rounded-xl text-base mb-8">
            {error}
          </div>
        )}

        {/* ============ STEP 1: Business Info ============ */}
        {step === 1 && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-green-500/15 rounded-xl">
                <Building2 className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Tell us about your business
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="businessName"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Business Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="businessName"
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(e) =>
                    updateForm({ businessName: e.target.value })
                  }
                  placeholder="e.g. Mountain View Cafe"
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="contactName"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="contactName"
                  type="text"
                  required
                  value={form.contactName}
                  onChange={(e) =>
                    updateForm({ contactName: e.target.value })
                  }
                  placeholder="e.g. Sarah Johnson"
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  placeholder="you@yourbusiness.com"
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Phone{" "}
                  <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm({ phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="businessType"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Business Type
                </label>
                <select
                  id="businessType"
                  value={form.businessType}
                  onChange={(e) =>
                    updateForm({ businessType: e.target.value })
                  }
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-base appearance-none"
                >
                  <option value="">Select your type...</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exclusive Category Upsell */}
              {form.businessType && form.businessType !== "other" && (
                <div
                  className={`rounded-xl border-2 p-5 transition-all cursor-pointer ${
                    form.exclusiveCategory
                      ? "bg-amber-500/10 border-amber-500/50"
                      : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                  }`}
                  onClick={() => updateForm({ exclusiveCategory: !form.exclusiveCategory })}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      form.exclusiveCategory
                        ? "bg-amber-500 border-amber-500"
                        : "border-zinc-600"
                    }`}>
                      {form.exclusiveCategory && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">Be the Exclusive{" "}
                          <span className="text-amber-400">
                            {BUSINESS_TYPES.find((t) => t.value === form.businessType)?.label}
                          </span>
                          {" "}Sponsor
                        </span>
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                          +$45/mo
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 leading-relaxed">
                        No other {BUSINESS_TYPES.find((t) => t.value === form.businessType)?.label.toLowerCase()} can sponsor this station.
                        You&apos;ll be the only one in your category — every listener associates your business type with your name.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              disabled={!canProceedStep1}
              onClick={() => {
                setError("");
                setStep(2);
              }}
              className="w-full mt-8 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-4 rounded-xl text-lg font-semibold hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ============ STEP 2: Ad Preferences ============ */}
        {step === 2 && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-green-500/15 rounded-xl">
                <Mic2 className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Ad Preferences
              </h2>
            </div>
            <p className="text-zinc-400 mb-6 text-base">
              These are optional -- we&apos;ll work with you to get things
              right.
            </p>

            <div className="space-y-6">
              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  When should your ads air?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {TIME_SLOTS.map((slot) => {
                    const selected = form.timeSlots.includes(slot.value);
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => toggleTimeSlot(slot.value)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          selected
                            ? "bg-green-500/10 border-green-500/50 ring-1 ring-green-500/30"
                            : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600"
                        }`}
                      >
                        <span
                          className={`block font-medium text-base ${selected ? "text-green-400" : "text-zinc-200"}`}
                        >
                          {slot.label}
                        </span>
                        <span className="block text-sm text-zinc-500 mt-0.5">
                          {slot.time}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ad Style */}
              <div>
                <label
                  htmlFor="adStyle"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Preferred ad style
                </label>
                <select
                  id="adStyle"
                  value={form.adStyle}
                  onChange={(e) => updateForm({ adStyle: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-base appearance-none"
                >
                  <option value="">No preference</option>
                  {AD_STYLES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Business Description */}
              <div>
                <label
                  htmlFor="businessDescription"
                  className="block text-sm font-medium text-zinc-300 mb-2"
                >
                  Tell us about your business
                </label>
                <p className="text-sm text-zinc-500 mb-2">
                  We&apos;ll use this to write your ad. What makes your business
                  special?
                </p>
                <textarea
                  id="businessDescription"
                  rows={4}
                  value={form.businessDescription}
                  onChange={(e) =>
                    updateForm({ businessDescription: e.target.value })
                  }
                  placeholder="e.g. Family-owned cafe with the best breakfast burritos in town. We've been serving the community for 15 years..."
                  className="w-full px-4 py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-base resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors"
              >
                Back
              </button>
              <button
                disabled={!canProceedStep2}
                onClick={() => {
                  setError("");
                  setStep(3);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-4 rounded-xl text-lg font-semibold hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Review
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ============ STEP 3: Review & Submit ============ */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-green-500/15 rounded-xl">
                  <ClipboardCheck className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Review Your Info
                </h2>
              </div>

              <div className="space-y-4">
                <SummaryRow label="Business" value={form.businessName} />
                <SummaryRow label="Contact" value={form.contactName} />
                <SummaryRow label="Email" value={form.email} />
                {form.phone && (
                  <SummaryRow label="Phone" value={form.phone} />
                )}
                {form.businessType && (
                  <SummaryRow
                    label="Type"
                    value={
                      BUSINESS_TYPES.find(
                        (t) => t.value === form.businessType
                      )?.label || form.businessType
                    }
                  />
                )}
                {form.exclusiveCategory && (
                  <SummaryRow
                    label="Exclusive"
                    value={`Only ${BUSINESS_TYPES.find((t) => t.value === form.businessType)?.label} on this station`}
                  />
                )}
                {form.timeSlots.length > 0 && (
                  <SummaryRow
                    label="Time Slots"
                    value={form.timeSlots
                      .map(
                        (s) =>
                          TIME_SLOTS.find((t) => t.value === s)?.label || s
                      )
                      .join(", ")}
                  />
                )}
                {form.adStyle && (
                  <SummaryRow
                    label="Ad Style"
                    value={
                      AD_STYLES.find((s) => s.value === form.adStyle)
                        ?.label || form.adStyle
                    }
                  />
                )}
                {form.businessDescription && (
                  <div className="pt-3 border-t border-zinc-800">
                    <p className="text-sm text-zinc-500 mb-1">
                      Business Description
                    </p>
                    <p className="text-zinc-200 text-base leading-relaxed">
                      {form.businessDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Package details */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-white mb-1">
                Local Hero Package{form.exclusiveCategory ? " + Exclusive Category" : ""}
              </h3>
              <div className="flex items-baseline gap-3 mb-5">
                <p className="text-2xl font-bold text-green-400">
                  ${form.exclusiveCategory ? "75" : "30"} / month
                </p>
                {form.exclusiveCategory && (
                  <p className="text-sm text-zinc-500">
                    ($30 base + $45 exclusivity)
                  </p>
                )}
              </div>

              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3">
                What you get
              </h4>
              <ul className="space-y-2.5">
                {PACKAGE_BENEFITS.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-zinc-200 text-base"
                  >
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
                {form.exclusiveCategory && (
                  <>
                    <li className="flex items-start gap-3 text-amber-300 text-base font-medium">
                      <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      Exclusive {BUSINESS_TYPES.find((t) => t.value === form.businessType)?.label} sponsor
                    </li>
                    <li className="flex items-start gap-3 text-amber-300 text-base font-medium">
                      <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      No competing businesses in your category
                    </li>
                    <li className="flex items-start gap-3 text-amber-300 text-base font-medium">
                      <Check className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      &quot;Brought to you exclusively by...&quot; on-air mentions
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-4 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors"
              >
                Back
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-4 rounded-xl text-lg font-bold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-500/20"
              >
                {submitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Become a Local Hero
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-2 border-b border-zinc-800/50 last:border-0">
      <span className="text-sm text-zinc-500 flex-shrink-0">{label}</span>
      <span className="text-zinc-200 text-base text-right">{value}</span>
    </div>
  );
}
