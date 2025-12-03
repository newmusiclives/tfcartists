"use client";

import Link from "next/link";
import { ArrowLeft, Radio, Users, DollarSign, TrendingUp } from "lucide-react";
import {
  calculateDailyAirtime,
  calculateMonthlyAirtime,
  calculateMaxArtistCapacity,
  calculateMaxSponsorCapacity,
  calculatePremiumSponsorRevenue,
  calculateStationRevenue,
  STATION_CONSTRAINTS,
  AIRPLAY_TIER_SHARES,
  SPONSOR_AD_SPOTS,
  SPONSOR_PRICING,
} from "@/lib/calculations/station-capacity";

export default function StationCapacityPage() {
  const daily = calculateDailyAirtime();
  const monthly = calculateMonthlyAirtime();
  const artistCapacity = calculateMaxArtistCapacity();
  const sponsorCapacity = calculateMaxSponsorCapacity();
  const premiumRevenue = calculatePremiumSponsorRevenue();

  // Calculate revenue for Optimal 75% scenario
  const masterStationRevenue = calculateStationRevenue(
    artistCapacity.scenarios.masterOverview,
    sponsorCapacity.optimal,
    true
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin</span>
          </Link>
          <div className="flex items-center space-x-3">
            <Radio className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Station Capacity Calculator</h1>
              <p className="text-gray-600">
                Revenue projections based on airtime constraints and tier distributions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Airtime Constraints */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <Radio className="w-6 h-6 text-blue-600" />
            <span>Airtime Constraints</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ConstraintCard
              label="Tracks per Hour"
              value={STATION_CONSTRAINTS.TRACKS_PER_HOUR}
            />
            <ConstraintCard
              label="Prime Hours"
              value={`${STATION_CONSTRAINTS.PRIME_HOURS.start}am - ${STATION_CONSTRAINTS.PRIME_HOURS.end - 12}pm`}
            />
            <ConstraintCard
              label="Ad Minutes/Hour"
              value={STATION_CONSTRAINTS.MAX_AD_MINUTES_PER_HOUR}
            />
            <ConstraintCard
              label="Ad Spots/Hour"
              value={STATION_CONSTRAINTS.MAX_AD_SPOTS_PER_HOUR}
              subtitle="15 sec ads"
            />
          </div>
        </section>

        {/* Daily & Monthly Capacity */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Daily & Monthly Capacity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Daily Tracks"
              value={daily.totalDailyTracks}
              subtitle={`${daily.primeTracks} prime + ${daily.subprimeTracks} subprime`}
              color="blue"
            />
            <StatCard
              label="Monthly Tracks"
              value={monthly.totalMonthlyTracks.toLocaleString()}
              subtitle="30 days"
              color="blue"
            />
            <StatCard
              label="Daily Ad Spots"
              value={daily.totalDailyAdSpots}
              subtitle={`${daily.primeAdSpots} prime + ${daily.subprimeAdSpots} subprime`}
              color="green"
            />
            <StatCard
              label="Monthly Ad Spots"
              value={monthly.totalMonthlyAdSpots.toLocaleString()}
              subtitle="30 days"
              color="green"
            />
          </div>
        </section>

        {/* Riley's Team - Artist Capacity */}
        <section className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Riley's Team - Artist Capacity</span>
          </h2>

          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Master Overview Capacity</h3>
              <p className="text-gray-600 text-sm mb-3">
                340 total artists across 5 tiers (as per Master Overview)
              </p>
              <div className="text-3xl font-bold text-purple-600">
                340 artists
              </div>
              <p className="text-sm text-gray-500 mt-1">Target capacity per station</p>
            </div>

            {/* Artist Distribution - Master Overview */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Master Overview Distribution</h3>
              <p className="text-gray-600 text-sm mb-4">
                Fixed artist distribution per station
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-sm">
                  <span className="text-gray-600">FREE:</span>
                  <span className="font-semibold ml-1">{artistCapacity.scenarios.masterOverview.FREE}</span>
                  <span className="text-xs text-gray-500 ml-1">(1 share)</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Bronze ($5):</span>
                  <span className="font-semibold ml-1">{artistCapacity.scenarios.masterOverview.BRONZE}</span>
                  <span className="text-xs text-gray-500 ml-1">(5 shares)</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Silver ($20):</span>
                  <span className="font-semibold ml-1">{artistCapacity.scenarios.masterOverview.SILVER}</span>
                  <span className="text-xs text-gray-500 ml-1">(25 shares)</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Gold ($50):</span>
                  <span className="font-semibold ml-1">{artistCapacity.scenarios.masterOverview.GOLD}</span>
                  <span className="text-xs text-gray-500 ml-1">(75 shares)</span>
                </div>
                <div className="text-sm col-span-2">
                  <span className="text-gray-600">Platinum ($120):</span>
                  <span className="font-semibold ml-1">{artistCapacity.scenarios.masterOverview.PLATINUM}</span>
                  <span className="text-xs text-gray-500 ml-1">(200 shares)</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Artists</span>
                  <span className="font-bold">{artistCapacity.scenarios.masterOverview.artists}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Shares</span>
                  <span className="font-bold text-purple-600">{artistCapacity.scenarios.masterOverview.totalShares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Revenue (Team Riley)</span>
                  <span className="font-bold text-purple-600">${artistCapacity.scenarios.masterOverview.revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Harper's Team - Sponsor Capacity */}
        <section className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span>Harper's Team - Sponsor Capacity</span>
          </h2>

          <div className="space-y-4">
            {/* Single Tier Maximums */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <TierMaxCard
                tier="Local Hero"
                price="$50/mo"
                sponsors={sponsorCapacity.allLocalHero.sponsors}
                revenue={sponsorCapacity.allLocalHero.revenue}
                spots={SPONSOR_AD_SPOTS.LOCAL_HERO}
              />
              <TierMaxCard
                tier="Tier 1"
                price="$100/mo"
                sponsors={sponsorCapacity.allTier1.sponsors}
                revenue={sponsorCapacity.allTier1.revenue}
                spots={SPONSOR_AD_SPOTS.TIER_1}
              />
              <TierMaxCard
                tier="Tier 2"
                price="$200/mo"
                sponsors={sponsorCapacity.allTier2.sponsors}
                revenue={sponsorCapacity.allTier2.revenue}
                spots={SPONSOR_AD_SPOTS.TIER_2}
              />
              <TierMaxCard
                tier="Tier 3"
                price="$400/mo"
                sponsors={sponsorCapacity.allTier3.sponsors}
                revenue={sponsorCapacity.allTier3.revenue}
                spots={SPONSOR_AD_SPOTS.TIER_3}
              />
            </div>

            {/* Optimal 77% Capacity Sponsor Mix with Local Hero */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Optimal 77% Capacity Model with Local Hero</h3>
              <p className="text-gray-600 text-sm mb-4">
                125 total sponsors generating $22,250/month (base + premium) with $50 entry tier
              </p>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Local Hero ($50)</div>
                  <div className="text-2xl font-bold text-teal-600">
                    {sponsorCapacity.optimal.LOCAL_HERO}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">1 spot/day</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Tier 1 ($100)</div>
                  <div className="text-2xl font-bold text-green-600">
                    {sponsorCapacity.optimal.TIER_1}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">2 spots/day</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Tier 2 ($200)</div>
                  <div className="text-2xl font-bold text-green-600">
                    {sponsorCapacity.optimal.TIER_2}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">5 spots/day</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Tier 3 ($400)</div>
                  <div className="text-2xl font-bold text-green-600">
                    {sponsorCapacity.optimal.TIER_3}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">10 spots/day</div>
                </div>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600">Base Package Sponsors</div>
                    <div className="text-2xl font-bold">{sponsorCapacity.optimal.sponsors}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Base Revenue</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${sponsorCapacity.optimal.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-sm text-gray-600">+ Premium Add-ons</div>
                  <div className="text-sm font-semibold text-green-600">
                    +${premiumRevenue.totalPremiumRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="font-semibold">Total Harper Revenue</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${(sponsorCapacity.optimal.revenue + premiumRevenue.totalPremiumRevenue).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Premium Sponsor Opportunities */}
        <section className="bg-gradient-to-br from-yellow-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-yellow-600" />
            <span>Premium Sponsor Opportunities</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PremiumCard
              title="News & Weather"
              slots={premiumRevenue.newsWeather.slots}
              price={premiumRevenue.newsWeather.pricePerSlot}
              revenue={premiumRevenue.newsWeather.monthlyRevenue}
              description="Daily mention sponsors"
            />
            <PremiumCard
              title="Sponsored Hours"
              slots={premiumRevenue.sponsoredHours.slotsPerMonth}
              price={premiumRevenue.sponsoredHours.pricePerHour}
              revenue={premiumRevenue.sponsoredHours.monthlyRevenue}
              description="2 hours/week max"
            />
            <PremiumCard
              title="Week Takeover"
              slots={premiumRevenue.weekTakeover.slotsPerMonth}
              price={premiumRevenue.weekTakeover.pricePerWeek}
              revenue={premiumRevenue.weekTakeover.monthlyRevenue}
              description="1 per month max"
            />
          </div>

          <div className="mt-4 bg-white rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Premium Revenue</span>
              <span className="text-2xl font-bold text-yellow-600">
                ${premiumRevenue.totalPremiumRevenue.toLocaleString()}/month
              </span>
            </div>
          </div>
        </section>

        {/* Total Station Revenue */}
        <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6">Optimal 77% Capacity - Total Station Revenue</h2>
          <p className="text-purple-100 mb-6">Per station monthly revenue with Local Hero entry tier ($50/mo)</p>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="space-y-3">
                <RevenueRow
                  label="Team Riley (Artist Submissions)"
                  amount={masterStationRevenue.artistTierRevenue}
                />
                <div className="text-sm text-purple-200 pl-4 -mt-2">
                  100% retained by station
                </div>
                <RevenueRow
                  label="Team Harper (Base Sponsor Packages)"
                  amount={masterStationRevenue.sponsorRevenue}
                />
                <RevenueRow
                  label="Team Harper (Premium Add-ons)"
                  amount={masterStationRevenue.premiumSponsorRevenue}
                />
                <div className="pt-3 border-t border-white/20">
                  <RevenueRow
                    label="Total Monthly Revenue"
                    amount={masterStationRevenue.totalRevenue}
                    bold
                  />
                </div>
                <div className="pt-3 mt-3 border-t border-white/20 space-y-2">
                  <RevenueRow
                    label="Artist Pool (80% of Harper revenue)"
                    amount={masterStationRevenue.artistPool}
                    small
                  />
                  <RevenueRow
                    label="Station Net Revenue"
                    amount={masterStationRevenue.stationOperations}
                    small
                  />
                </div>
                <div className="pt-3 mt-3 border-t border-white/20">
                  <div className="text-center space-y-1">
                    <div className="text-sm text-purple-200">Annual Net per Station</div>
                    <div className="text-3xl font-bold">
                      ${(masterStationRevenue.stationOperations * 12).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ConstraintCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  color: "blue" | "green";
}) {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function ScenarioCard({
  title,
  description,
  artists,
  revenue,
  breakdown,
  color,
}: {
  title: string;
  description: string;
  artists: number;
  revenue: number;
  breakdown: Record<string, number>;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {Object.entries(breakdown).map(([tier, count]) => (
          <div key={tier} className="text-sm">
            <span className="text-gray-600">{tier}:</span>
            <span className="font-semibold ml-1">{count}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Artists</span>
          <span className="font-bold">{artists}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Monthly Revenue</span>
          <span className="font-bold text-purple-600">${revenue.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

function TierMaxCard({
  tier,
  price,
  sponsors,
  revenue,
  spots,
}: {
  tier: string;
  price: string;
  sponsors: number;
  revenue: number;
  spots: number;
}) {
  return (
    <div className="bg-white rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">Max {tier} ({price})</div>
      <div className="text-2xl font-bold text-green-600 mb-1">
        {sponsors.toLocaleString()}
      </div>
      <div className="text-xs text-gray-500 mb-2">{spots} spots/month</div>
      <div className="text-sm font-semibold">${(revenue / 1000).toFixed(0)}k/mo</div>
    </div>
  );
}

function PremiumCard({
  title,
  slots,
  price,
  revenue,
  description,
}: {
  title: string;
  slots: number;
  price: number;
  revenue: number;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Slots Available</span>
          <span className="font-semibold">{slots}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Price per Slot</span>
          <span className="font-semibold">${price}</span>
        </div>
        <div className="pt-2 border-t">
          <div className="flex justify-between">
            <span className="text-gray-600">Monthly Revenue</span>
            <span className="font-bold text-yellow-600">${revenue.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RevenueRow({
  label,
  amount,
  bold,
  small,
}: {
  label: string;
  amount: number;
  bold?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={small ? "text-sm text-purple-100" : bold ? "font-semibold text-lg" : ""}>
        {label}
      </span>
      <span className={small ? "text-sm" : bold ? "text-2xl font-bold" : "text-lg font-semibold"}>
        ${amount.toLocaleString()}
      </span>
    </div>
  );
}
