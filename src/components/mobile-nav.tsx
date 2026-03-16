"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Radio, Music, Headphones, CalendarDays, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/player", icon: Radio, label: "Listen" },
  { href: "/schedule", icon: CalendarDays, label: "Schedule" },
  { href: "/station", icon: Headphones, label: "Station" },
  { href: "/onboard", icon: Music, label: "Artists" },
  { href: "/listen/register", icon: User, label: "Account" },
];

// Routes where the bottom nav should not appear
const HIDDEN_ROUTES = ["/embed", "/admin", "/parker", "/riley", "/cassidy", "/elliot", "/harper", "/operator", "/station-admin", "/dashboard"];

export function MobileNav() {
  const pathname = usePathname();

  // Don't show on hidden routes or the marketing home page
  if (pathname === "/" || HIDDEN_ROUTES.some((r) => pathname.startsWith(r))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 sm:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? "text-amber-600" : "text-gray-400"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
