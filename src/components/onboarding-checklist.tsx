"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Rocket,
  X,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  complete: boolean;
}

interface OnboardingStatus {
  hasStation: boolean;
  hasSongs: boolean;
  hasDJs: boolean;
  hasSchedule: boolean;
  hasImaging: boolean;
  hasArtists: boolean;
  hasSponsors: boolean;
  hasStreamUrl: boolean;
}

function buildSteps(s: OnboardingStatus): OnboardingStep[] {
  return [
    {
      id: "station",
      title: "Choose your genre template",
      description: "Pick a genre and launch your station with the setup wizard.",
      href: "/station-admin/wizard",
      complete: s.hasStation,
    },
    {
      id: "music",
      title: "Import your music library",
      description: "Upload tracks or import from your catalog to fill your playlist.",
      href: "/station-admin/music/import",
      complete: s.hasSongs,
    },
    {
      id: "djs",
      title: "Configure your DJs",
      description: "Customize AI DJ personalities, voices, and on-air style.",
      href: "/station-admin/dj-editor",
      complete: s.hasDJs,
    },
    {
      id: "schedule",
      title: "Set up your schedule",
      description: "Assign clock templates to time slots so your station runs 24/7.",
      href: "/station-admin/schedule-editor",
      complete: s.hasSchedule,
    },
    {
      id: "imaging",
      title: "Generate station imaging",
      description: "Create jingles, IDs, and sweepers that brand your sound.",
      href: "/station-admin/imaging",
      complete: s.hasImaging,
    },
    {
      id: "artists",
      title: "Invite your first artist",
      description: "Bring an artist on board to feature their music on your station.",
      href: "/riley",
      complete: s.hasArtists,
    },
    {
      id: "sponsors",
      title: "Reach out to first sponsor",
      description: "Connect with a sponsor to monetize your station from day one.",
      href: "/harper",
      complete: s.hasSponsors,
    },
    {
      id: "stream",
      title: "Go live!",
      description: "Configure your streaming URL and start broadcasting.",
      href: "/station-admin/stream",
      complete: s.hasStreamUrl,
    },
  ];
}

const DISMISSED_KEY = "onboarding-checklist-dismissed";

export function OnboardingChecklist({
  stationData,
  artistCount,
  sponsorCount,
}: {
  stationData: {
    id?: string;
    _count?: {
      songs: number;
      stationDJs: number;
      clockTemplates: number;
      imagingVoices: number;
    };
    streamUrl?: string | null;
    clockAssignmentCount?: number;
  } | null;
  artistCount: number;
  sponsorCount: number;
}) {
  const [dismissed, setDismissed] = useState(true); // hidden until we check
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_KEY);
    setDismissed(stored === "true");
  }, []);

  const status: OnboardingStatus = {
    hasStation: !!stationData?.id,
    hasSongs: (stationData?._count?.songs ?? 0) > 0,
    hasDJs: (stationData?._count?.stationDJs ?? 0) > 0,
    hasSchedule: (stationData?.clockAssignmentCount ?? stationData?._count?.clockTemplates ?? 0) > 0,
    hasImaging: (stationData?._count?.imagingVoices ?? 0) > 0,
    hasArtists: artistCount > 0,
    hasSponsors: sponsorCount > 0,
    hasStreamUrl: !!stationData?.streamUrl,
  };

  const steps = buildSteps(status);
  const completedCount = steps.filter((s) => s.complete).length;
  const allDone = completedCount === steps.length;
  const pct = Math.round((completedCount / steps.length) * 100);

  if (dismissed || allDone) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border mb-8 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Rocket className="w-5 h-5 text-amber-700" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Getting Started</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              {completedCount} of {steps.length} complete
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label={collapsed ? "Expand checklist" : "Collapse checklist"}
          >
            {collapsed ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Dismiss checklist"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-4">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-amber-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="border-t divide-y">
          {steps.map((step) => (
            <Link
              key={step.id}
              href={step.href}
              className="flex items-start px-6 py-3 hover:bg-gray-50 transition-colors"
            >
              {step.complete ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 mt-0.5 shrink-0" />
              )}
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    step.complete ? "text-gray-400 line-through" : "text-gray-900"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-500">{step.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
