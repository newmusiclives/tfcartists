"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Megaphone,
  DollarSign,
  Clock,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

interface SponsorAd {
  id: string;
  sponsorName: string;
  adTitle: string;
  isActive: boolean;
  rotationWeight: number;
  plays?: number;
  impressions?: number;
}

const DAYPART_FILL = [
  { name: "Morning Drive (6-10am)", fill: 92, spots: 12, avails: 1, type: "Prime" },
  { name: "Midday (10am-3pm)", fill: 85, spots: 10, avails: 2, type: "Standard" },
  { name: "Afternoon Drive (3-7pm)", fill: 90, spots: 11, avails: 1, type: "Prime" },
  { name: "Evening (7pm-12am)", fill: 70, spots: 8, avails: 3, type: "Sub-prime" },
  { name: "Overnight (12-6am)", fill: 45, spots: 5, avails: 6, type: "Sub-prime" },
];

export default function TrafficPage() {
  const [ads, setAds] = useState<SponsorAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/sponsor-ads");
        if (res.ok) {
          const data = await res.json();
          setAds(data.ads || data || []);
        }
      } catch (error) {
        console.error("Error fetching ad data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeAds = Array.isArray(ads) ? ads.filter((a) => a.isActive) : [];
  const inactiveAds = Array.isArray(ads) ? ads.filter((a) => !a.isActive) : [];
  const totalSpots = DAYPART_FILL.reduce((sum, dp) => sum + dp.spots, 0);
  const totalAvails = DAYPART_FILL.reduce((sum, dp) => sum + dp.avails, 0);
  const overallFill = totalSpots > 0 ? Math.round(((totalSpots - totalAvails) / totalSpots) * 100) : 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-gray-600">Loading traffic data...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
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
              href="/harper/inventory"
              className="inline-flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Megaphone className="w-4 h-4" />
              <span>Ad Inventory</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Megaphone className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Traffic Manager Dashboard</h1>
              <p className="text-gray-600">Managed by Nolan Torres</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Ad Inventory Overview */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Megaphone className="w-6 h-6 text-orange-600" />
              <div className="text-sm font-medium text-gray-600">Active Ads</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{activeAds.length}</div>
            <div className="text-xs text-orange-600">Currently running</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <BarChart3 className="w-6 h-6 text-green-600" />
              <div className="text-sm font-medium text-gray-600">Overall Fill Rate</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{overallFill}%</div>
            <div className="text-xs text-green-600">Across all dayparts</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Clock className="w-6 h-6 text-rose-600" />
              <div className="text-sm font-medium text-gray-600">Avails Remaining</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalAvails}</div>
            <div className="text-xs text-rose-600">Unsold spots</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div className="text-sm font-medium text-gray-600">Make-Goods Pending</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">3</div>
            <div className="text-xs text-amber-600">Needs resolution</div>
          </div>
        </section>

        {/* Fill Rate by Daypart */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Fill Rate by Daypart</h2>
          <div className="space-y-4">
            {DAYPART_FILL.map((dp, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">{dp.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      dp.type === "Prime" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {dp.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-500">{dp.spots} spots</span>
                    <span className="text-rose-600 font-medium">{dp.avails} avail{dp.avails !== 1 ? "s" : ""}</span>
                    <span className="font-bold text-gray-900">{dp.fill}%</span>
                  </div>
                </div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dp.fill >= 90 ? "bg-green-500" :
                      dp.fill >= 70 ? "bg-orange-500" :
                      "bg-rose-500"
                    }`}
                    style={{ width: `${dp.fill}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Sponsor Ads */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Active Sponsor Ads</h2>
            <span className="text-sm text-gray-500">{activeAds.length} active / {ads.length} total</span>
          </div>
          {activeAds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No active ads found</div>
          ) : (
            <div className="space-y-3">
              {activeAds.slice(0, 10).map((ad) => (
                <div key={ad.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <div className="font-semibold text-gray-900">{ad.adTitle || "Untitled Ad"}</div>
                      <div className="text-sm text-gray-600">{ad.sponsorName || "Unknown Sponsor"}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Weight: {ad.rotationWeight || 1}x</div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Avail Report */}
        <section className="bg-gradient-to-br from-orange-50 to-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Avail Report Summary</h2>
          <p className="text-gray-600 text-sm mb-6">Unsold commercial spots available for sale</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <div className="text-sm text-gray-600 mb-1">Prime Avails</div>
              <div className="text-2xl font-bold text-orange-600">2</div>
              <div className="text-xs text-gray-500">Morning & afternoon drive</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <div className="text-sm text-gray-600 mb-1">Sub-Prime Avails</div>
              <div className="text-2xl font-bold text-orange-600">{totalAvails - 2}</div>
              <div className="text-xs text-gray-500">Evening & overnight</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <div className="text-sm text-gray-600 mb-1">Est. Revenue Opportunity</div>
              <div className="text-2xl font-bold text-green-600">${(totalAvails * 85).toLocaleString()}</div>
              <div className="text-xs text-gray-500">If all avails sold</div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="flex flex-wrap gap-4">
          <Link href="/harper/inventory" className="inline-flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
            <Megaphone className="w-4 h-4" />
            <span>Full Ad Inventory</span>
          </Link>
          <Link href="/harper/sponsors" className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <DollarSign className="w-4 h-4" />
            <span>Sponsor List</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
