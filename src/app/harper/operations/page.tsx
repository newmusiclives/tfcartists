'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Radio, Building2, Play, CheckCircle, AlertCircle, ChevronRight, Users, Filter, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import Link from 'next/link';

type AdStatus = 'active' | 'inactive';

interface SponsorAd {
  id: string;
  sponsorName: string;
  adTitle: string;
  tier: string;
  durationSeconds: number | null;
  isActive: boolean;
  playCount: number;
  lastPlayedAt: string | null;
  audioFilePath: string | null;
  scriptText: string | null;
}

export default function AdOperations() {
  const [ads, setAds] = useState<SponsorAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<AdStatus | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');

  useEffect(() => {
    fetch('/api/stations')
      .then((r) => r.json())
      .then((data) => {
        const stations = data.stations || [];
        if (stations.length > 0) {
          return fetch(`/api/sponsor-ads?stationId=${stations[0].id}`).then((r) => r.json());
        }
        return { sponsorAds: [] };
      })
      .then((data) => {
        setAds(data.sponsorAds || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredAds = ads.filter(ad => {
    const matchesStatus = selectedStatus === 'all' || (selectedStatus === 'active' ? ad.isActive : !ad.isActive);
    const matchesTier = selectedTier === 'all' || ad.tier === selectedTier;
    return matchesStatus && matchesTier;
  });

  const activeCount = ads.filter(a => a.isActive).length;
  const totalPlays = ads.reduce((sum, a) => sum + a.playCount, 0);
  const withAudio = ads.filter(a => a.audioFilePath).length;

  const tierColor: Record<string, string> = {
    bronze: 'bg-orange-100 text-orange-700',
    silver: 'bg-gray-100 text-gray-700',
    gold: 'bg-yellow-100 text-yellow-700',
    platinum: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Link href="/harper" className="text-gray-500 hover:text-gray-700">
                  <Building2 className="w-6 h-6" />
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <h1 className="text-2xl font-bold text-gray-900">Ad Operations</h1>
              </div>
              <p className="text-gray-600 mt-1">Dakota Chen - Scheduling & Quality Control</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/harper/team"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Users className="w-4 h-4" />
                <span>View Team</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Ads</p>
                    <p className="text-2xl font-bold text-blue-600">{ads.length}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active in Rotation</p>
                    <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                  </div>
                  <Play className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">With Audio</p>
                    <p className="text-2xl font-bold text-yellow-600">{withAudio}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Plays</p>
                    <p className="text-2xl font-bold text-purple-600">{totalPlays.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border mb-6">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <div className="flex gap-3 flex-1">
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Tiers</option>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as AdStatus | 'all')}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  {filteredAds.length} of {ads.length} ads
                </div>
              </div>
            </div>

            {/* Ad Spots List */}
            <div className="bg-white border rounded-lg">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Sponsor Ad Rotation
                </h3>
              </div>
              <div className="divide-y">
                {filteredAds.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">No ads match the selected filters</p>
                ) : (
                  filteredAds.map((ad) => (
                    <div key={ad.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {ad.isActive ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-gray-400" />
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-900">{ad.adTitle}</h4>
                              <p className="text-sm text-gray-600">{ad.sponsorName}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 ml-8">
                            <div>
                              <p className="text-xs text-gray-500">Duration</p>
                              <p className="text-sm font-medium">{ad.durationSeconds ? `${ad.durationSeconds}s` : '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Play Count</p>
                              <p className="text-sm font-medium text-blue-600">{ad.playCount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Last Played</p>
                              <p className="text-sm font-medium">
                                {ad.lastPlayedAt ? new Date(ad.lastPlayedAt).toLocaleString() : 'Never'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Audio</p>
                              <p className="text-sm font-medium">{ad.audioFilePath ? 'Ready' : 'Pending'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Weight</p>
                              <p className="text-sm font-medium">1x</p>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap capitalize ${tierColor[ad.tier] || 'bg-gray-100 text-gray-700'}`}>
                          {ad.tier}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Capacity Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
              <div className="flex items-start space-x-3">
                <Radio className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Ad Operations Capacity</h4>
                  <div className="text-blue-800 text-sm space-y-1">
                    <p><strong>Daily Capacity:</strong> 24 ad spots (12 prime, 12 subprime)</p>
                    <p><strong>Monthly Capacity:</strong> 720 ad spots (360 prime, 360 subprime)</p>
                    <p><strong>Rotation:</strong> Round-robin — least recently played ad serves next</p>
                    <p><strong>Prime Hours:</strong> 6:00 AM - 6:00 PM (higher rates, better reach)</p>
                    <p><strong>Subprime Hours:</strong> 6:00 PM - 6:00 AM (standard rates)</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
