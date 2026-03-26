"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  BarChart3,
  CreditCard,
  FileText,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/portal/sponsor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/portal/sponsor/campaigns", label: "Campaigns", icon: Megaphone, exact: false },
  { href: "/portal/sponsor/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { href: "/portal/sponsor/billing", label: "Billing", icon: CreditCard, exact: false },
  { href: "/portal/sponsor/roi", label: "ROI Reports", icon: FileText, exact: false },
];

export function SponsorPortalNav({ sponsorId }: { sponsorId: string }) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-1 -mb-px">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={`${item.href}?sponsorId=${sponsorId}`}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
