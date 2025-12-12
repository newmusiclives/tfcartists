"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

export default function AdInventoryPage() {
  // Station capacity: 24 ad spots/hour × 24 hours × 30 days = 17,280 spots/month
  const totalMonthlySpots = 17280;

  // Current sponsor allocation (from Harper dashboard)
  const currentAllocation = {
    tier1: 28 * 60, // 28 sponsors × 60 spots = 1,680 spots
    tier2: 35 * 150, // 35 sponsors × 150 spots = 5,250 spots
    tier3: 17 * 300, // 17 sponsors × 300 spots = 5,100 spots
    localHero: 45 * 30, // 45 sponsors × 30 spots = 1,350 spots
  };

  const totalAllocated =
    currentAllocation.tier1 +
    currentAllocation.tier2 +
    currentAllocation.tier3 +
    currentAllocation.localHero;

  const available = totalMonthlySpots - totalAllocated;
  const utilizationRate = (totalAllocated / totalMonthlySpots) * 100;

  const stats = {
    totalSpots: totalMonthlySpots.toLocaleString(),
    allocated: totalAllocated.toLocaleString(),
    available: available.toLocaleString(),
    utilization: utilizationRate.toFixed(1),
  };

  const tierBreakdown = [
    {
      tier: "Local Hero",
      sponsors: 45,
      spotsPerSponsor: 30,
      totalSpots: currentAllocation.localHero,
      price: 50,
      color: "teal",
    },
    {
      tier: "Tier 1",
      sponsors: 28,
      spotsPerSponsor: 60,
      totalSpots: currentAllocation.tier1,
      price: 100,
      color: "blue",
    },
    {
      tier: "Tier 2",
      sponsors: 35,
      spotsPerSponsor: 150,
      totalSpots: currentAllocation.tier2,
      price: 200,
      color: "green",
    },
    {
      tier: "Tier 3",
      sponsors: 17,
      spotsPerSponsor: 300,
      totalSpots: currentAllocation.tier3,
      price: 400,
      color: "purple",
    },
  ];

  const timeSlotDistribution = [
    { slot: "Prime Morning (6am-10am)", allocated: 3200, capacity: 4320, percentage: 74 },
    { slot: "Midday (10am-2pm)", allocated: 2800, capacity: 4320, percentage: 65 },
    { slot: "Prime Evening (2pm-6pm)", allocated: 3100, capacity: 4320, percentage: 72 },
    { slot: "Subprime (6pm-6am)", allocated: 4280, capacity: 4320, percentage: 99 },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/harper"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Harper Dashboard</span>
          </Link>
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ad Inventory Management</h1>
              <p className="text-gray-600">
                Monitor and manage monthly ad spot allocation
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            icon={<Calendar className="w-6 h-6 text-blue-600" />}
            label="Total Monthly Spots"
            value={stats.totalSpots}
            subtitle="24 spots/hour × 720 hours"
          />
          <MetricCard
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            label="Allocated"
            value={stats.allocated}
            subtitle={`${stats.utilization}% utilized`}
          />
          <MetricCard
            icon={<AlertCircle className="w-6 h-6 text-orange-600" />}
            label="Available"
            value={stats.available}
            subtitle="spots remaining"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            label="Utilization Rate"
            value={`${stats.utilization}%`}
            subtitle="optimal range: 70-85%"
          />
        </section>

        {/* Utilization Bar */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Overall Inventory Status</h2>
          <div className="relative">
            <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-600 h-full flex items-center justify-center text-white font-bold text-sm transition-all"
                style={{ width: `${utilizationRate}%` }}
              >
                {utilizationRate.toFixed(1)}% Utilized
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0 spots</span>
              <span>{totalMonthlySpots.toLocaleString()} spots</span>
            </div>
          </div>

          {utilizationRate >= 85 && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-orange-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">High Utilization Warning</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Ad inventory is nearing capacity. Consider premium pricing or waitlist for new sponsors.
              </p>
            </div>
          )}
        </section>

        {/* Allocation by Tier */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Allocation by Sponsor Tier</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tierBreakdown.map((tier) => (
              <TierAllocationCard key={tier.tier} {...tier} totalSpots={totalMonthlySpots} />
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-3">Revenue Per Spot</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {tierBreakdown.map((tier) => {
                const revenuePerSpot = tier.price / tier.spotsPerSponsor;
                return (
                  <div key={tier.tier} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600">{tier.tier}</div>
                    <div className="text-lg font-bold text-green-600">
                      ${revenuePerSpot.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">per spot</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Time Slot Distribution */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Distribution by Time Slot</h2>
          <p className="text-sm text-gray-600 mb-6">
            Ad spots allocated across different dayparts (4-hour blocks)
          </p>

          <div className="space-y-4">
            {timeSlotDistribution.map((slot) => (
              <TimeSlotRow key={slot.slot} {...slot} />
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Note:</strong> Subprime hours (6pm-6am) show high utilization.
                This is optimal as these slots command lower rates. Prime time still has capacity for premium sponsors.
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionCard
            title="View Sponsor Pipeline"
            description="See upcoming sponsors and projected inventory needs"
            buttonText="View Pipeline"
            buttonColor="green"
            href="/harper/pipeline"
          />
          <ActionCard
            title="Manage Sponsors"
            description="Adjust ad spot allocations for existing sponsors"
            buttonText="Manage Sponsors"
            buttonColor="blue"
            href="/harper/sponsors"
          />
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-3 mb-3">
        {icon}
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function TierAllocationCard({
  tier,
  sponsors,
  spotsPerSponsor,
  totalSpots,
  price,
  color,
  totalSpots: maxSpots,
}: any) {
  const percentage = (totalSpots / maxSpots) * 100;
  const colorClasses = {
    teal: "bg-teal-100 text-teal-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
  }[color];

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`text-sm font-bold px-3 py-1 rounded ${colorClasses}`}>
          {tier}
        </div>
        <div className="text-sm font-semibold text-gray-700">${price}/mo</div>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Sponsors:</span>
          <span className="font-semibold">{sponsors}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Spots/sponsor:</span>
          <span className="font-semibold">{spotsPerSponsor}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total spots:</span>
          <span className="font-semibold">{totalSpots.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${color === 'teal' ? 'bg-teal-600' : color === 'blue' ? 'bg-blue-600' : color === 'green' ? 'bg-green-600' : 'bg-purple-600'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1 text-center">
        {percentage.toFixed(1)}% of total inventory
      </div>
    </div>
  );
}

function TimeSlotRow({
  slot,
  allocated,
  capacity,
  percentage,
}: {
  slot: string;
  allocated: number;
  capacity: number;
  percentage: number;
}) {
  const getStatusColor = (pct: number) => {
    if (pct >= 90) return { bg: "bg-red-500", text: "text-red-700", label: "bg-red-50" };
    if (pct >= 75) return { bg: "bg-yellow-500", text: "text-yellow-700", label: "bg-yellow-50" };
    return { bg: "bg-green-500", text: "text-green-700", label: "bg-green-50" };
  };

  const status = getStatusColor(percentage);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-gray-900">{slot}</div>
        <div className={`${status.label} ${status.text} px-3 py-1 rounded-full text-xs font-medium`}>
          {percentage}% Full
        </div>
      </div>

      <div className="flex items-center space-x-3 mb-2">
        <div className="text-sm text-gray-600">
          {allocated.toLocaleString()} / {capacity.toLocaleString()} spots
        </div>
      </div>

      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${status.bg} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  buttonText,
  buttonColor,
  href,
}: {
  title: string;
  description: string;
  buttonText: string;
  buttonColor: string;
  href: string;
}) {
  const colorClass = buttonColor === "green" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link
        href={href}
        className={`inline-block ${colorClass} text-white px-6 py-2 rounded-lg transition-colors font-medium`}
      >
        {buttonText}
      </Link>
    </div>
  );
}
