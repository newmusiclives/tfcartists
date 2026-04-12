"use client";

import Link from "next/link";
import { CheckCircle2, Radio, ArrowRight, Settings, Music, Users, Mic } from "lucide-react";

export default function SetupSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Your Station is Live!</h1>
        <p className="text-gray-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
          Your station has been created with AI DJ personalities and a default schedule.
          Here&apos;s what to do next:
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Link
            href="/station-admin/music"
            className="flex items-center gap-3 p-4 bg-white border rounded-xl hover:shadow-md transition-shadow text-left"
          >
            <Music className="w-8 h-8 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Upload Music</p>
              <p className="text-sm text-gray-500 dark:text-zinc-500">Add tracks to your station library</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/station-admin/dj-editor"
            className="flex items-center gap-3 p-4 bg-white border rounded-xl hover:shadow-md transition-shadow text-left"
          >
            <Mic className="w-8 h-8 text-purple-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Customize DJs</p>
              <p className="text-sm text-gray-500 dark:text-zinc-500">Edit AI DJ personalities and voices</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/station-admin/schedule-editor"
            className="flex items-center gap-3 p-4 bg-white border rounded-xl hover:shadow-md transition-shadow text-left"
          >
            <Radio className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Set Schedule</p>
              <p className="text-sm text-gray-500 dark:text-zinc-500">Configure show times and rotations</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/admin/settings"
            className="flex items-center gap-3 p-4 bg-white border rounded-xl hover:shadow-md transition-shadow text-left"
          >
            <Settings className="w-8 h-8 text-gray-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Admin Settings</p>
              <p className="text-sm text-gray-500 dark:text-zinc-500">Configure stream, payments, API keys</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left">
          <h3 className="font-semibold text-amber-800 mb-2">Getting Started Checklist</h3>
          <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
            <li className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-amber-400" /> Upload at least 50 tracks to your music library
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-amber-400" /> Customize your AI DJ personalities and voice settings
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-amber-400" /> Configure your streaming server (Liquidsoap/Icecast)
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-amber-400" /> Set up your show schedule with clock templates
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-amber-400" /> Configure Manifest Financial for artist payments
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-amber-400" /> Invite your first artists via the onboarding page
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-amber-400" /> Share your station URL and embed player
            </li>
          </ul>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium"
        >
          <Users className="w-5 h-5" /> Go to Admin Dashboard
        </Link>
      </div>
    </main>
  );
}
