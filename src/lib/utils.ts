import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DISCOVERED: "bg-gray-100 text-gray-800",
    CONTACTED: "bg-blue-100 text-blue-800",
    ENGAGED: "bg-purple-100 text-purple-800",
    QUALIFIED: "bg-green-100 text-green-800",
    ONBOARDING: "bg-yellow-100 text-yellow-800",
    ACTIVATED: "bg-emerald-100 text-emerald-800",
    ACTIVE: "bg-teal-100 text-teal-800",
    INNER_CIRCLE: "bg-pink-100 text-pink-800",
    DORMANT: "bg-gray-100 text-gray-600",
    UNRESPONSIVE: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getAirplayTierColor(tier: string): string {
  const colors: Record<string, string> = {
    FREE: "bg-gray-100 text-gray-700",
    TIER_5: "bg-orange-100 text-orange-700",
    TIER_20: "bg-gray-300 text-gray-800",
    TIER_50: "bg-yellow-100 text-yellow-700",
    TIER_120: "bg-purple-100 text-purple-700",
  };
  return colors[tier] || "bg-gray-100 text-gray-700";
}

export function getAirplayTierName(tier: string): string {
  const names: Record<string, string> = {
    FREE: "Free Airplay",
    TIER_5: "Bronze ($5)",
    TIER_20: "Silver ($20)",
    TIER_50: "Gold ($50)",
    TIER_120: "Platinum ($120)",
  };
  return names[tier] || tier;
}
