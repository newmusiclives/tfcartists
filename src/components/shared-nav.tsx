"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
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
  Target,
  Award,
  Globe,
  Shield,
  Settings,
  Wand2,
  Clock,
  Mic,
  SlidersHorizontal,
  ArrowRightLeft,
  Sparkles,
  Paintbrush,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { StationSwitcher } from "@/components/station-switcher";

type MenuId = "teams" | "station" | "opportunities" | null;
type MobileSection = "teams" | "riley" | "harper" | "cassidy" | "elliot" | "parker" | "station" | "stationOps" | "opportunities" | null;

export function SharedNav() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MobileSection>(null);
  const navRef = useRef<HTMLElement>(null);

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  // Close desktop menus on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMobileSection(null);
    setOpenMenu(null);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const toggleMenu = useCallback((id: MenuId) => {
    setOpenMenu((prev) => (prev === id ? null : id));
  }, []);

  const toggleMobileSection = useCallback((id: MobileSection) => {
    setMobileSection((prev) => (prev === id ? null : id));
  }, []);

  const linkClass = (path: string, color = "purple") =>
    `block px-4 py-2 text-sm text-gray-700 hover:bg-${color}-50 transition-colors`;

  const activeLinkClass = (path: string, color = "purple") =>
    `${linkClass(path, color)} ${isActive(path) ? `bg-${color}-50 font-semibold text-${color}-700` : ""}`;

  return (
    <>
      <nav ref={navRef} role="navigation" aria-label="Main navigation" className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/admin" className="hover:opacity-80 transition-opacity flex-shrink-0">
              <StationSwitcher />
            </Link>

            {/* Desktop Navigation (lg+) */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* Teams Mega-Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu("teams")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/riley") || isActive("/harper") || isActive("/cassidy") || isActive("/elliot") || isActive("/parker")
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Teams</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${openMenu === "teams" ? "rotate-180" : ""}`} />
                </button>
                {openMenu === "teams" && (
                  <div className="absolute right-0 mt-1 w-[880px] bg-white rounded-xl shadow-xl border py-4 px-3 z-50">
                    <div className="grid grid-cols-5 gap-2">
                      {/* Riley */}
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>Riley Team</span>
                        </div>
                        <Link href="/riley" className={activeLinkClass("/riley")}>Dashboard</Link>
                        <Link href="/riley/pipeline" className={activeLinkClass("/riley/pipeline")}>Artist Pipeline</Link>
                        <Link href="/riley/artists" className={activeLinkClass("/riley/artists")}>Artist List</Link>
                        <Link href="/riley/outreach" className={activeLinkClass("/riley/outreach")}>Outreach Center</Link>
                        <Link href="/riley/submissions" className={activeLinkClass("/riley/submissions")}>Track Submissions</Link>
                        <Link href="/riley/pool-calculator" className={activeLinkClass("/riley/pool-calculator")}>Pool Calculator</Link>
                        <Link href="/riley/upgrade-opportunities" className={activeLinkClass("/riley/upgrade-opportunities")}>Upgrades</Link>
                        <Link href="/riley/team" className={activeLinkClass("/riley/team")}>Team Members</Link>
                      </div>

                      {/* Harper */}
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1">
                          <Building2 className="w-3 h-3" />
                          <span>Harper Team</span>
                        </div>
                        <Link href="/harper" className={activeLinkClass("/harper", "blue")}>Dashboard</Link>
                        <Link href="/harper/pipeline" className={activeLinkClass("/harper/pipeline", "blue")}>Sponsor Pipeline</Link>
                        <Link href="/harper/sponsors" className={activeLinkClass("/harper/sponsors", "blue")}>Sponsor List</Link>
                        <Link href="/harper/outreach" className={activeLinkClass("/harper/outreach", "blue")}>Outreach Center</Link>
                        <Link href="/harper/calls" className={activeLinkClass("/harper/calls", "blue")}>Call Tracking</Link>
                        <Link href="/harper/billing" className={activeLinkClass("/harper/billing", "blue")}>Billing</Link>
                        <Link href="/harper/inventory" className={activeLinkClass("/harper/inventory", "blue")}>Ad Inventory</Link>
                        <Link href="/harper/team" className={activeLinkClass("/harper/team", "blue")}>Team Members</Link>
                      </div>

                      {/* Cassidy */}
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center space-x-1">
                          <Award className="w-3 h-3" />
                          <span>Cassidy Team</span>
                        </div>
                        <Link href="/cassidy" className={activeLinkClass("/cassidy", "amber")}>Dashboard</Link>
                        <Link href="/cassidy/submissions" className={activeLinkClass("/cassidy/submissions", "amber")}>Review Queue</Link>
                        <Link href="/cassidy/tier-management" className={activeLinkClass("/cassidy/tier-management", "amber")}>Tier Mgmt</Link>
                        <Link href="/cassidy/rotation" className={activeLinkClass("/cassidy/rotation", "amber")}>Rotation Planner</Link>
                        <Link href="/cassidy/team" className={activeLinkClass("/cassidy/team", "amber")}>Team Members</Link>
                      </div>

                      {/* Elliot */}
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-green-600 uppercase tracking-wider flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Elliot Team</span>
                        </div>
                        <Link href="/elliot" className={activeLinkClass("/elliot", "green")}>Dashboard</Link>
                        <Link href="/elliot/analytics" className={activeLinkClass("/elliot/analytics", "green")}>Listener Analytics</Link>
                        <Link href="/elliot/campaigns" className={activeLinkClass("/elliot/campaigns", "green")}>Growth Campaigns</Link>
                        <Link href="/elliot/content" className={activeLinkClass("/elliot/content", "green")}>Viral Content</Link>
                        <Link href="/elliot/community" className={activeLinkClass("/elliot/community", "green")}>Community Hub</Link>
                        <Link href="/elliot/team" className={activeLinkClass("/elliot/team", "green")}>Team Members</Link>
                      </div>

                      {/* Parker */}
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center space-x-1">
                          <Radio className="w-3 h-3" />
                          <span>Parker Team</span>
                        </div>
                        <Link href="/parker" className={activeLinkClass("/parker", "rose")}>Dashboard</Link>
                        <Link href="/parker/programming" className={activeLinkClass("/parker/programming", "rose")}>Programming</Link>
                        <Link href="/parker/music" className={activeLinkClass("/parker/music", "rose")}>Music</Link>
                        <Link href="/parker/traffic" className={activeLinkClass("/parker/traffic", "rose")}>Traffic</Link>
                        <Link href="/parker/listeners" className={activeLinkClass("/parker/listeners", "rose")}>Listeners</Link>
                        <Link href="/parker/team" className={activeLinkClass("/parker/team", "rose")}>Team Members</Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Station Dropdown (merged Station Info + Station Ops) */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu("station")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/station") || isActive("/station-admin") || isActive("/schedule") || isActive("/djs") || isActive("/capacity") || isActive("/revenue")
                      ? "bg-amber-100 text-amber-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  <span>Station</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${openMenu === "station" ? "rotate-180" : ""}`} />
                </button>
                {openMenu === "station" && (
                  <div className="absolute left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border py-2 z-50">
                    {/* Station Info section */}
                    <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Station Info</div>
                    <Link href="/revenue/projections" className="block px-4 py-2 text-sm font-semibold bg-gradient-to-r from-green-50 to-blue-50 text-green-700 hover:from-green-100 hover:to-blue-100 flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Revenue Model</span>
                    </Link>
                    <Link href="/capacity" className={activeLinkClass("/capacity", "amber")}>
                      <span className="flex items-center space-x-2"><PieChart className="w-4 h-4" /><span>Capacity Calculator</span></span>
                    </Link>
                    <Link href="/schedule" className={activeLinkClass("/schedule", "amber")}>
                      <span className="flex items-center space-x-2"><CalendarDays className="w-4 h-4" /><span>DJ Schedule</span></span>
                    </Link>
                    <Link href="/djs" className={activeLinkClass("/djs", "amber")}>
                      <span className="flex items-center space-x-2"><Music className="w-4 h-4" /><span>DJ Profiles</span></span>
                    </Link>
                    <Link href="/station" className={activeLinkClass("/station", "amber")}>
                      <span className="flex items-center space-x-2"><Radio className="w-4 h-4" /><span>Station Info</span></span>
                    </Link>

                    {/* Divider */}
                    <div className="border-t my-2" />

                    {/* Station Ops section */}
                    <div className="px-3 py-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider">Station Ops</div>
                    <Link href="/station-admin" className={activeLinkClass("/station-admin", "amber")}>
                      <span className="flex items-center space-x-2"><Settings className="w-4 h-4 text-amber-600" /><span>Admin Hub</span></span>
                    </Link>
                    <Link href="/operate" className={activeLinkClass("/operate", "amber")}>
                      <span className="flex items-center space-x-2"><Wand2 className="w-4 h-4 text-amber-600" /><span>Create Station</span></span>
                    </Link>
                    <Link href="/station-admin/clocks" className={activeLinkClass("/station-admin/clocks", "amber")}>
                      <span className="flex items-center space-x-2"><Clock className="w-4 h-4 text-amber-600" /><span>Radio Clocks</span></span>
                    </Link>
                    <Link href="/station-admin/music" className={activeLinkClass("/station-admin/music", "amber")}>
                      <span className="flex items-center space-x-2"><Music className="w-4 h-4 text-amber-600" /><span>Music Library</span></span>
                    </Link>
                    <Link href="/station-admin/dj-editor" className={activeLinkClass("/station-admin/dj-editor", "amber")}>
                      <span className="flex items-center space-x-2"><Users className="w-4 h-4 text-amber-600" /><span>DJ Editor</span></span>
                    </Link>
                    <Link href="/station-admin/schedule-editor" className={activeLinkClass("/station-admin/schedule-editor", "amber")}>
                      <span className="flex items-center space-x-2"><CalendarDays className="w-4 h-4 text-amber-600" /><span>Schedule Editor</span></span>
                    </Link>
                    <Link href="/station-admin/imaging" className={activeLinkClass("/station-admin/imaging", "amber")}>
                      <span className="flex items-center space-x-2"><Mic className="w-4 h-4 text-amber-600" /><span>Station Imaging</span></span>
                    </Link>
                    <Link href="/station-admin/branding" className={activeLinkClass("/station-admin/branding", "amber")}>
                      <span className="flex items-center space-x-2"><Paintbrush className="w-4 h-4 text-amber-600" /><span>Station Branding</span></span>
                    </Link>
                    <Link href="/station-admin/features" className={activeLinkClass("/station-admin/features", "amber")}>
                      <span className="flex items-center space-x-2"><Sparkles className="w-4 h-4 text-amber-600" /><span>Show Features</span></span>
                    </Link>
                    <Link href="/station-admin/stream" className={activeLinkClass("/station-admin/stream", "amber")}>
                      <span className="flex items-center space-x-2"><SlidersHorizontal className="w-4 h-4 text-amber-600" /><span>Stream Engineering</span></span>
                    </Link>
                    <Link href="/station-admin/transitions" className={activeLinkClass("/station-admin/transitions", "amber")}>
                      <span className="flex items-center space-x-2"><ArrowRightLeft className="w-4 h-4 text-amber-600" /><span>Show Transitions</span></span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Opportunities Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleMenu("opportunities")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/opportunities")
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Opportunities</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${openMenu === "opportunities" ? "rotate-180" : ""}`} />
                </button>
                {openMenu === "opportunities" && (
                  <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border py-1 z-50">
                    <Link href="/opportunities/artists" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 flex items-center space-x-2">
                      <Users className="w-4 h-4 text-orange-600" />
                      <div>
                        <div className="font-semibold">For Artists</div>
                        <div className="text-xs text-gray-500">Artist Referrals - Earn $30-100/mo</div>
                      </div>
                    </Link>
                    <Link href="/opportunities/listeners" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center space-x-2">
                      <Radio className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-semibold">For Listeners</div>
                        <div className="text-xs text-gray-500">Listener Promotions - Earn $44+/mo</div>
                      </div>
                    </Link>
                    <Link href="/opportunities/sponsors" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-semibold">For Sponsors</div>
                        <div className="text-xs text-gray-500">Referral Bonuses - Earn $50-250</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Quick Links: icon-only with tooltips */}
              <div className="flex items-center space-x-0.5 ml-2 pl-2 border-l">
                <Link
                  href="/admin"
                  className={`p-2 rounded-lg transition-colors group relative ${
                    pathname === "/admin" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                  title="Admin"
                  aria-current={pathname === "/admin" ? "page" : undefined}
                >
                  <Home className="w-4 h-4" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Admin
                  </span>
                </Link>
                <Link
                  href="/management"
                  className={`p-2 rounded-lg transition-colors group relative ${
                    isActive("/management") ? "bg-amber-100 text-amber-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                  title="Management"
                  aria-current={isActive("/management") ? "page" : undefined}
                >
                  <Shield className="w-4 h-4" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Management
                  </span>
                </Link>
                <Link
                  href="/network"
                  className={`p-2 rounded-lg transition-colors group relative ${
                    isActive("/network") ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                  title="Network"
                  aria-current={isActive("/network") ? "page" : undefined}
                >
                  <Globe className="w-4 h-4" />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Network
                  </span>
                </Link>
              </div>
            </div>

            {/* Tablet (md only): Simplified nav */}
            <div className="hidden md:flex lg:hidden items-center space-x-1">
              <div className="relative">
                <button
                  onClick={() => toggleMenu("teams")}
                  className={`px-2.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActive("/riley") || isActive("/harper") || isActive("/cassidy") || isActive("/elliot") || isActive("/parker")
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Teams</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {openMenu === "teams" && (
                  <div className="absolute left-0 mt-1 w-[520px] bg-white rounded-xl shadow-xl border py-4 px-2 z-50">
                    <div className="grid grid-cols-2 gap-1">
                      {/* Riley */}
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-purple-600 uppercase tracking-wider">Riley Team</div>
                        <Link href="/riley" className={activeLinkClass("/riley")}>Dashboard</Link>
                        <Link href="/riley/pipeline" className={activeLinkClass("/riley/pipeline")}>Artist Pipeline</Link>
                        <Link href="/riley/artists" className={activeLinkClass("/riley/artists")}>Artist List</Link>
                        <Link href="/riley/outreach" className={activeLinkClass("/riley/outreach")}>Outreach</Link>
                        <Link href="/riley/submissions" className={activeLinkClass("/riley/submissions")}>Submissions</Link>
                        <Link href="/riley/team" className={activeLinkClass("/riley/team")}>Team Members</Link>
                      </div>
                      {/* Harper */}
                      <div>
                        <div className="px-3 py-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">Harper Team</div>
                        <Link href="/harper" className={activeLinkClass("/harper", "blue")}>Dashboard</Link>
                        <Link href="/harper/pipeline" className={activeLinkClass("/harper/pipeline", "blue")}>Sponsor Pipeline</Link>
                        <Link href="/harper/sponsors" className={activeLinkClass("/harper/sponsors", "blue")}>Sponsor List</Link>
                        <Link href="/harper/outreach" className={activeLinkClass("/harper/outreach", "blue")}>Outreach</Link>
                        <Link href="/harper/billing" className={activeLinkClass("/harper/billing", "blue")}>Billing</Link>
                        <Link href="/harper/team" className={activeLinkClass("/harper/team", "blue")}>Team Members</Link>
                      </div>
                      {/* Cassidy */}
                      <div className="mt-2">
                        <div className="px-3 py-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider">Cassidy Team</div>
                        <Link href="/cassidy" className={activeLinkClass("/cassidy", "amber")}>Dashboard</Link>
                        <Link href="/cassidy/submissions" className={activeLinkClass("/cassidy/submissions", "amber")}>Review Queue</Link>
                        <Link href="/cassidy/rotation" className={activeLinkClass("/cassidy/rotation", "amber")}>Rotation</Link>
                        <Link href="/cassidy/team" className={activeLinkClass("/cassidy/team", "amber")}>Team Members</Link>
                      </div>
                      {/* Elliot */}
                      <div className="mt-2">
                        <div className="px-3 py-1.5 text-xs font-bold text-green-600 uppercase tracking-wider">Elliot Team</div>
                        <Link href="/elliot" className={activeLinkClass("/elliot", "green")}>Dashboard</Link>
                        <Link href="/elliot/analytics" className={activeLinkClass("/elliot/analytics", "green")}>Analytics</Link>
                        <Link href="/elliot/campaigns" className={activeLinkClass("/elliot/campaigns", "green")}>Campaigns</Link>
                        <Link href="/elliot/team" className={activeLinkClass("/elliot/team", "green")}>Team Members</Link>
                      </div>
                      {/* Parker */}
                      <div className="mt-2">
                        <div className="px-3 py-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider">Parker Team</div>
                        <Link href="/parker" className={activeLinkClass("/parker", "rose")}>Dashboard</Link>
                        <Link href="/parker/programming" className={activeLinkClass("/parker/programming", "rose")}>Programming</Link>
                        <Link href="/parker/music" className={activeLinkClass("/parker/music", "rose")}>Music</Link>
                        <Link href="/parker/traffic" className={activeLinkClass("/parker/traffic", "rose")}>Traffic</Link>
                        <Link href="/parker/listeners" className={activeLinkClass("/parker/listeners", "rose")}>Listeners</Link>
                        <Link href="/parker/team" className={activeLinkClass("/parker/team", "rose")}>Team Members</Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/station" className={`p-2 rounded-lg text-sm font-medium transition-colors ${isActive("/station") || isActive("/station-admin") ? "bg-amber-100 text-amber-700" : "text-gray-500 hover:bg-gray-100"}`} title="Station" aria-current={isActive("/station") ? "page" : undefined}>
                <Radio className="w-4 h-4" />
              </Link>
              <Link href="/admin" className={`p-2 rounded-lg transition-colors ${pathname === "/admin" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"}`} title="Admin" aria-current={pathname === "/admin" ? "page" : undefined}>
                <Home className="w-4 h-4" />
              </Link>
              <Link href="/management" className={`p-2 rounded-lg transition-colors ${isActive("/management") ? "bg-amber-100 text-amber-700" : "text-gray-500 hover:bg-gray-100"}`} title="Management" aria-current={isActive("/management") ? "page" : undefined}>
                <Shield className="w-4 h-4" />
              </Link>
              <Link href="/network" className={`p-2 rounded-lg transition-colors ${isActive("/network") ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"}`} title="Network" aria-current={isActive("/network") ? "page" : undefined}>
                <Globe className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Hamburger (<md) */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay + Drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            onClick={() => setMobileOpen(false)}
          />

          {/* Slide-out drawer */}
          <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white z-[70] md:hidden shadow-2xl overflow-y-auto">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 h-16 border-b">
              <span className="font-bold text-amber-700 text-lg">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2">
              {/* Admin */}
              <Link href="/admin" className={`flex items-center space-x-3 px-4 py-3 ${pathname === "/admin" ? "bg-purple-50 text-purple-700" : "text-gray-700"}`} aria-current={pathname === "/admin" ? "page" : undefined}>
                <Home className="w-5 h-5" />
                <span className="font-medium">Admin Home</span>
              </Link>

              {/* Management */}
              <Link href="/management" className={`flex items-center space-x-3 px-4 py-3 ${isActive("/management") ? "bg-amber-50 text-amber-700" : "text-gray-700"}`} aria-current={isActive("/management") ? "page" : undefined}>
                <Shield className="w-5 h-5" />
                <span className="font-medium">Management</span>
              </Link>

              <div className="border-t my-1" />

              {/* Teams Accordion */}
              <button
                onClick={() => toggleMobileSection(mobileSection === "teams" ? null : "teams")}
                className="flex items-center justify-between w-full px-4 py-3 text-gray-700"
              >
                <span className="flex items-center space-x-3">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Teams</span>
                </span>
                <ChevronRight className={`w-4 h-4 transition-transform ${mobileSection === "teams" || mobileSection === "riley" || mobileSection === "harper" || mobileSection === "cassidy" || mobileSection === "elliot" || mobileSection === "parker" ? "rotate-90" : ""}`} />
              </button>

              {(mobileSection === "teams" || mobileSection === "riley" || mobileSection === "harper" || mobileSection === "cassidy" || mobileSection === "elliot" || mobileSection === "parker") && (
                <div className="pl-4">
                  {/* Riley */}
                  <button
                    onClick={() => toggleMobileSection("riley")}
                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-purple-700"
                  >
                    <span className="font-semibold">Riley Team</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${mobileSection === "riley" ? "rotate-90" : ""}`} />
                  </button>
                  {mobileSection === "riley" && (
                    <div className="pl-4 pb-2 space-y-0.5">
                      <Link href="/riley" className="block px-4 py-2 text-sm text-gray-600 hover:text-purple-700">Dashboard</Link>
                      <Link href="/riley/pipeline" className="block px-4 py-2 text-sm text-gray-600 hover:text-purple-700">Artist Pipeline</Link>
                      <Link href="/riley/artists" className="block px-4 py-2 text-sm text-gray-600 hover:text-purple-700">Artist List</Link>
                      <Link href="/riley/outreach" className="block px-4 py-2 text-sm text-gray-600 hover:text-purple-700">Outreach Center</Link>
                      <Link href="/riley/submissions" className="block px-4 py-2 text-sm text-gray-600 hover:text-purple-700">Track Submissions</Link>
                      <Link href="/riley/pool-calculator" className="block px-4 py-2 text-sm text-gray-600 hover:text-purple-700">Pool Calculator</Link>
                      <Link href="/riley/upgrade-opportunities" className="block px-4 py-2 text-sm text-gray-600 hover:text-purple-700">Upgrades</Link>
                      <Link href="/riley/team" className="block px-4 py-2 text-sm text-gray-600 hover:text-purple-700">Team Members</Link>
                    </div>
                  )}

                  {/* Harper */}
                  <button
                    onClick={() => toggleMobileSection("harper")}
                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-blue-700"
                  >
                    <span className="font-semibold">Harper Team</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${mobileSection === "harper" ? "rotate-90" : ""}`} />
                  </button>
                  {mobileSection === "harper" && (
                    <div className="pl-4 pb-2 space-y-0.5">
                      <Link href="/harper" className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-700">Dashboard</Link>
                      <Link href="/harper/pipeline" className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-700">Sponsor Pipeline</Link>
                      <Link href="/harper/sponsors" className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-700">Sponsor List</Link>
                      <Link href="/harper/outreach" className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-700">Outreach Center</Link>
                      <Link href="/harper/calls" className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-700">Call Tracking</Link>
                      <Link href="/harper/billing" className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-700">Billing</Link>
                      <Link href="/harper/inventory" className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-700">Ad Inventory</Link>
                      <Link href="/harper/team" className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-700">Team Members</Link>
                    </div>
                  )}

                  {/* Cassidy */}
                  <button
                    onClick={() => toggleMobileSection("cassidy")}
                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-amber-700"
                  >
                    <span className="font-semibold">Cassidy Team</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${mobileSection === "cassidy" ? "rotate-90" : ""}`} />
                  </button>
                  {mobileSection === "cassidy" && (
                    <div className="pl-4 pb-2 space-y-0.5">
                      <Link href="/cassidy" className="block px-4 py-2 text-sm text-gray-600 hover:text-amber-700">Dashboard</Link>
                      <Link href="/cassidy/submissions" className="block px-4 py-2 text-sm text-gray-600 hover:text-amber-700">Review Queue</Link>
                      <Link href="/cassidy/tier-management" className="block px-4 py-2 text-sm text-gray-600 hover:text-amber-700">Tier Management</Link>
                      <Link href="/cassidy/rotation" className="block px-4 py-2 text-sm text-gray-600 hover:text-amber-700">Rotation Planner</Link>
                      <Link href="/cassidy/team" className="block px-4 py-2 text-sm text-gray-600 hover:text-amber-700">Team Members</Link>
                    </div>
                  )}

                  {/* Elliot */}
                  <button
                    onClick={() => toggleMobileSection("elliot")}
                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-green-700"
                  >
                    <span className="font-semibold">Elliot Team</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${mobileSection === "elliot" ? "rotate-90" : ""}`} />
                  </button>
                  {mobileSection === "elliot" && (
                    <div className="pl-4 pb-2 space-y-0.5">
                      <Link href="/elliot" className="block px-4 py-2 text-sm text-gray-600 hover:text-green-700">Dashboard</Link>
                      <Link href="/elliot/analytics" className="block px-4 py-2 text-sm text-gray-600 hover:text-green-700">Listener Analytics</Link>
                      <Link href="/elliot/campaigns" className="block px-4 py-2 text-sm text-gray-600 hover:text-green-700">Growth Campaigns</Link>
                      <Link href="/elliot/content" className="block px-4 py-2 text-sm text-gray-600 hover:text-green-700">Viral Content</Link>
                      <Link href="/elliot/community" className="block px-4 py-2 text-sm text-gray-600 hover:text-green-700">Community Hub</Link>
                      <Link href="/elliot/team" className="block px-4 py-2 text-sm text-gray-600 hover:text-green-700">Team Members</Link>
                    </div>
                  )}

                  {/* Parker */}
                  <button
                    onClick={() => toggleMobileSection("parker")}
                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-rose-700"
                  >
                    <span className="font-semibold">Parker Team</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${mobileSection === "parker" ? "rotate-90" : ""}`} />
                  </button>
                  {mobileSection === "parker" && (
                    <div className="pl-4 pb-2 space-y-0.5">
                      <Link href="/parker" className="block px-4 py-2 text-sm text-gray-600 hover:text-rose-700">Dashboard</Link>
                      <Link href="/parker/programming" className="block px-4 py-2 text-sm text-gray-600 hover:text-rose-700">Programming</Link>
                      <Link href="/parker/music" className="block px-4 py-2 text-sm text-gray-600 hover:text-rose-700">Music</Link>
                      <Link href="/parker/traffic" className="block px-4 py-2 text-sm text-gray-600 hover:text-rose-700">Traffic</Link>
                      <Link href="/parker/listeners" className="block px-4 py-2 text-sm text-gray-600 hover:text-rose-700">Listeners</Link>
                      <Link href="/parker/team" className="block px-4 py-2 text-sm text-gray-600 hover:text-rose-700">Team Members</Link>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t my-1" />

              {/* Station Accordion */}
              <button
                onClick={() => toggleMobileSection(mobileSection === "station" || mobileSection === "stationOps" ? null : "station")}
                className="flex items-center justify-between w-full px-4 py-3 text-gray-700"
              >
                <span className="flex items-center space-x-3">
                  <Radio className="w-5 h-5" />
                  <span className="font-medium">Station</span>
                </span>
                <ChevronRight className={`w-4 h-4 transition-transform ${mobileSection === "station" || mobileSection === "stationOps" ? "rotate-90" : ""}`} />
              </button>

              {(mobileSection === "station" || mobileSection === "stationOps") && (
                <div className="pl-4 pb-2 space-y-0.5">
                  <Link href="/revenue/projections" className="block px-4 py-2 text-sm font-semibold text-green-700">Revenue Model</Link>
                  <Link href="/capacity" className="block px-4 py-2 text-sm text-gray-600">Capacity Calculator</Link>
                  <Link href="/schedule" className="block px-4 py-2 text-sm text-gray-600">DJ Schedule</Link>
                  <Link href="/djs" className="block px-4 py-2 text-sm text-gray-600">DJ Profiles</Link>
                  <Link href="/station" className="block px-4 py-2 text-sm text-gray-600">Station Info</Link>

                  <div className="border-t my-1 mx-4" />
                  <div className="px-4 py-1.5 text-xs font-bold text-amber-600 uppercase">Station Ops</div>
                  <Link href="/station-admin" className="block px-4 py-2 text-sm text-gray-600">Admin Hub</Link>
                  <Link href="/operate" className="block px-4 py-2 text-sm text-gray-600">Create Station</Link>
                  <Link href="/station-admin/clocks" className="block px-4 py-2 text-sm text-gray-600">Radio Clocks</Link>
                  <Link href="/station-admin/music" className="block px-4 py-2 text-sm text-gray-600">Music Library</Link>
                  <Link href="/station-admin/dj-editor" className="block px-4 py-2 text-sm text-gray-600">DJ Editor</Link>
                  <Link href="/station-admin/schedule-editor" className="block px-4 py-2 text-sm text-gray-600">Schedule Editor</Link>
                  <Link href="/station-admin/imaging" className="block px-4 py-2 text-sm text-gray-600">Station Imaging</Link>
                  <Link href="/station-admin/branding" className="block px-4 py-2 text-sm text-gray-600">Station Branding</Link>
                  <Link href="/station-admin/features" className="block px-4 py-2 text-sm text-gray-600">Show Features</Link>
                  <Link href="/station-admin/stream" className="block px-4 py-2 text-sm text-gray-600">Stream Engineering</Link>
                  <Link href="/station-admin/transitions" className="block px-4 py-2 text-sm text-gray-600">Show Transitions</Link>
                </div>
              )}

              <div className="border-t my-1" />

              {/* Opportunities Accordion */}
              <button
                onClick={() => toggleMobileSection(mobileSection === "opportunities" ? null : "opportunities")}
                className="flex items-center justify-between w-full px-4 py-3 text-gray-700"
              >
                <span className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-medium">Opportunities</span>
                </span>
                <ChevronRight className={`w-4 h-4 transition-transform ${mobileSection === "opportunities" ? "rotate-90" : ""}`} />
              </button>

              {mobileSection === "opportunities" && (
                <div className="pl-4 pb-2 space-y-0.5">
                  <Link href="/opportunities/artists" className="block px-4 py-2 text-sm text-gray-600">For Artists</Link>
                  <Link href="/opportunities/listeners" className="block px-4 py-2 text-sm text-gray-600">For Listeners</Link>
                  <Link href="/opportunities/sponsors" className="block px-4 py-2 text-sm text-gray-600">For Sponsors</Link>
                </div>
              )}

              <div className="border-t my-1" />

              {/* Quick Links */}
              <Link href="/network" className={`flex items-center space-x-3 px-4 py-3 ${isActive("/network") ? "bg-purple-50 text-purple-700" : "text-gray-700"}`} aria-current={isActive("/network") ? "page" : undefined}>
                <Globe className="w-5 h-5" />
                <span className="font-medium">Network</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
