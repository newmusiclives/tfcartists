"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Building2,
  TrendingUp,
  Radio,
  ChevronDown,
  DollarSign,
  PieChart,
  FileText,
  CalendarDays,
  Music,
} from "lucide-react";
import { useState } from "react";

export function SharedNav() {
  const pathname = usePathname();
  const [rileyOpen, setRileyOpen] = useState(false);
  const [harperOpen, setHarperOpen] = useState(false);
  const [stationOpen, setStationOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Home */}
          <Link href="/admin" className="flex items-center space-x-2 font-bold text-xl text-purple-600 hover:text-purple-700">
            <Radio className="w-6 h-6" />
            <span>TrueFans RADIO™</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {/* Admin Home */}
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/admin"
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center space-x-1">
                <Home className="w-4 h-4" />
                <span>Admin</span>
              </div>
            </Link>

            {/* Riley Team Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRileyOpen(!rileyOpen)}
                onBlur={() => setTimeout(() => setRileyOpen(false), 200)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                  isActive("/riley")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Riley Team</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {rileyOpen && (
                <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border py-1 z-50">
                  <Link
                    href="/riley"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/riley/pipeline"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Artist Pipeline
                  </Link>
                  <Link
                    href="/riley/artists"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Artist List
                  </Link>
                  <Link
                    href="/riley/outreach"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Outreach Center
                  </Link>
                  <Link
                    href="/riley/submissions"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Track Submissions
                  </Link>
                  <Link
                    href="/riley/pool-calculator"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Pool Calculator
                  </Link>
                  <Link
                    href="/riley/upgrade-opportunities"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Upgrade Opportunities
                  </Link>
                </div>
              )}
            </div>

            {/* Harper Team Dropdown */}
            <div className="relative">
              <button
                onClick={() => setHarperOpen(!harperOpen)}
                onBlur={() => setTimeout(() => setHarperOpen(false), 200)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                  isActive("/harper")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Harper Team</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {harperOpen && (
                <div className="absolute left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border py-1 z-50">
                  <Link
                    href="/harper"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/harper/pipeline"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Sponsor Pipeline
                  </Link>
                  <Link
                    href="/harper/sponsors"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Sponsor List
                  </Link>
                  <Link
                    href="/harper/outreach"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Outreach Center
                  </Link>
                  <Link
                    href="/harper/calls"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Call Tracking
                  </Link>
                  <Link
                    href="/harper/billing"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Billing Dashboard
                  </Link>
                  <Link
                    href="/harper/inventory"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                  >
                    Ad Inventory
                  </Link>
                </div>
              )}
            </div>

            {/* Elliot Team */}
            <Link
              href="/elliot"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/elliot")
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>Elliot Team</span>
              </div>
            </Link>

            {/* Station & Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setStationOpen(!stationOpen)}
                onBlur={() => setTimeout(() => setStationOpen(false), 200)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                  isActive("/capacity") || isActive("/schedule") || isActive("/djs") || isActive("/station")
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Station</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {stationOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border py-1 z-50">
                  <Link
                    href="/capacity"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center space-x-2"
                  >
                    <PieChart className="w-4 h-4" />
                    <span>Capacity Calculator</span>
                  </Link>
                  <Link
                    href="/schedule"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center space-x-2"
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span>DJ Schedule</span>
                  </Link>
                  <Link
                    href="/djs"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center space-x-2"
                  >
                    <Music className="w-4 h-4" />
                    <span>DJ Profiles</span>
                  </Link>
                  <Link
                    href="/station"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center space-x-2"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Station Info</span>
                  </Link>
                  <Link
                    href="/network"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Network Overview</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
