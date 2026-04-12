"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Users,
  CheckCircle,
} from "lucide-react";

const DJ_SCHEDULE = {
  weekday: [
    { time: "6:00 AM - 9:00 AM", dj: "Hank Westwood", daypart: "Morning Drive", status: "live" },
    { time: "9:00 AM - 12:00 PM", dj: "Loretta Merrick", daypart: "Midday", status: "live" },
    { time: "12:00 PM - 3:00 PM", dj: "Marcus 'Doc' Holloway", daypart: "Afternoon", status: "live" },
    { time: "3:00 PM - 6:00 PM", dj: "Cody Rampart", daypart: "Drive Time", status: "live" },
    { time: "6:00 PM - 6:00 AM", dj: "Automation", daypart: "Overnight", status: "auto" },
  ],
  saturday: [
    { time: "6:00 AM - 9:00 AM", dj: "Jo McAllister", daypart: "Morning Drive", status: "live" },
    { time: "9:00 AM - 12:00 PM", dj: "Paul Saunders", daypart: "Midday", status: "live" },
    { time: "12:00 PM - 3:00 PM", dj: "Ezra Stone", daypart: "Afternoon", status: "live" },
    { time: "3:00 PM - 6:00 PM", dj: "Levi Bridges", daypart: "Drive Time", status: "live" },
    { time: "6:00 PM - 6:00 AM", dj: "Automation", daypart: "Overnight", status: "auto" },
  ],
  sunday: [
    { time: "6:00 AM - 9:00 AM", dj: "Sam Turnbull", daypart: "Morning Drive", status: "live" },
    { time: "9:00 AM - 12:00 PM", dj: "Ruby Finch", daypart: "Midday", status: "live" },
    { time: "12:00 PM - 3:00 PM", dj: "Mark Faulkner", daypart: "Afternoon", status: "live" },
    { time: "3:00 PM - 6:00 PM", dj: "Iris Langley", daypart: "Drive Time", status: "live" },
    { time: "6:00 PM - 6:00 AM", dj: "Automation", daypart: "Overnight", status: "auto" },
  ],
};

const DAYPART_ANALYSIS = [
  { name: "Morning Drive", time: "6am - 9am", listeners: "High", retention: "78%", format: "99%", color: "rose" },
  { name: "Midday", time: "9am - 12pm", listeners: "Medium", retention: "65%", format: "97%", color: "indigo" },
  { name: "Afternoon", time: "12pm - 3pm", listeners: "High", retention: "74%", format: "98%", color: "violet" },
  { name: "Drive Time", time: "3pm - 6pm", listeners: "High", retention: "72%", format: "98%", color: "orange" },
  { name: "Overnight", time: "6pm - 6am", listeners: "Low", retention: "45%", format: "100%", color: "gray" },
];

export default function ProgrammingPage() {
  const [activeDay, setActiveDay] = useState<"weekday" | "saturday" | "sunday">("weekday");

  const schedule = DJ_SCHEDULE[activeDay];

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-zinc-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/parker"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Parker Dashboard</span>
            </Link>
            <Link
              href="/station-admin/schedule-editor"
              className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Edit Schedule</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <CalendarDays className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Program Director Dashboard</h1>
              <p className="text-gray-600 dark:text-zinc-400">Managed by Sage Calloway</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Format Compliance Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="text-sm font-medium text-gray-600 dark:text-zinc-400">Format Compliance</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">98%</div>
            <div className="text-xs text-green-600">Within guidelines</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <CalendarDays className="w-6 h-6 text-indigo-600" />
              <div className="text-sm font-medium text-gray-600 dark:text-zinc-400">Schedule Fill Rate</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">100%</div>
            <div className="text-xs text-indigo-600">All shifts covered</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Users className="w-6 h-6 text-violet-600" />
              <div className="text-sm font-medium text-gray-600 dark:text-zinc-400">Active DJs</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">12</div>
            <div className="text-xs text-violet-600">Across all shifts</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Clock className="w-6 h-6 text-rose-600" />
              <div className="text-sm font-medium text-gray-600 dark:text-zinc-400">Live Hours/Day</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">16</div>
            <div className="text-xs text-rose-600">6am - 10pm daily</div>
          </div>
        </section>

        {/* Weekly Schedule Grid */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly DJ Schedule</h2>
            <div className="flex space-x-2">
              {(["weekday", "saturday", "sunday"] as const).map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeDay === day
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {schedule.map((slot, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  slot.status === "live"
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-gray-200 dark:border-zinc-800 bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    slot.status === "live" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`} />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{slot.dj}</div>
                    <div className="text-sm text-gray-600 dark:text-zinc-400">{slot.daypart}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600 dark:text-zinc-400">{slot.time}</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    slot.status === "live"
                      ? "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {slot.status === "live" ? "Live DJ" : "Automation"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Daypart Analysis */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Daypart Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daypart</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listener Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retention</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format Compliance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:divide-zinc-800">
                {DAYPART_ANALYSIS.map((dp, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{dp.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-400">{dp.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dp.listeners === "High" ? "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400" :
                        dp.listeners === "Medium" ? "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400" :
                        dp.listeners === "Low-Med" ? "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {dp.listeners}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{dp.retention}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{dp.format}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Show Prep Status */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Show Prep Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { dj: "Hank Westwood", shift: "Morning Drive", prep: "Ready", color: "green" },
              { dj: "Loretta Merrick", shift: "Midday", prep: "Ready", color: "green" },
              { dj: "Doc Holloway", shift: "Afternoon", prep: "In Progress", color: "yellow" },
              { dj: "Cody Rampart", shift: "Evening", prep: "Pending", color: "gray" },
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-900 dark:text-white">{item.dj}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.color === "green" ? "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400" :
                    item.color === "yellow" ? "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {item.prep}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-zinc-400">{item.shift}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="flex flex-wrap gap-4">
          <Link href="/station-admin/schedule-editor" className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            <CalendarDays className="w-4 h-4" />
            <span>Schedule Editor</span>
          </Link>
          <Link href="/station-admin/clocks" className="inline-flex items-center space-x-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors">
            <Clock className="w-4 h-4" />
            <span>Radio Clocks</span>
          </Link>
          <Link href="/station-admin/dj-editor" className="inline-flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors">
            <Users className="w-4 h-4" />
            <span>DJ Editor</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
