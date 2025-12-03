'use client';

import { useState } from 'react';
import { Building2, Search, DollarSign, TrendingUp, Calendar, Mail, Phone, BarChart3, ChevronRight, Users, AlertCircle, CheckCircle, Clock, Globe, X } from 'lucide-react';
import Link from 'next/link';

type SponsorTier = 'bronze' | 'silver' | 'gold' | 'platinum';
type SponsorStatus = 'active' | 'paused' | 'ending_soon' | 'cancelled';

interface Sponsor {
  id: number;
  businessName: string;
  businessType: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  tier: SponsorTier;
  monthlyRate: number;
  status: SponsorStatus;
  contractStart: string;
  contractEnd: string;
  adsSpotsPerMonth: number;
  adsPlayedThisMonth: number;
  lastContact: string;
  accountManager: string;
  notes: string;
  performance: {
    impressions: number;
    estimatedReach: number;
    satisfaction: number;
  };
}

const sponsors: Sponsor[] = [
  {
    id: 1,
    businessName: "Mountain Brew Coffee",
    businessType: "Coffee Roaster",
    contactName: "Sarah Mitchell",
    email: "sarah@mountainbrew.com",
    phone: "(555) 123-4567",
    website: "mountainbrew.com",
    tier: "silver",
    monthlyRate: 200,
    status: "active",
    contractStart: "2024-01-01",
    contractEnd: "2024-12-31",
    adsSpotsPerMonth: 60,
    adsPlayedThisMonth: 42,
    lastContact: "2024-02-05",
    accountManager: "Cameron Wells",
    notes: "Very satisfied customer. Interested in upgrading to Gold tier. Mention increased foot traffic.",
    performance: {
      impressions: 8640,
      estimatedReach: 2100,
      satisfaction: 95
    }
  },
  {
    id: 2,
    businessName: "Summit Outdoor Gear",
    businessType: "Outdoor Equipment",
    contactName: "Emily Watson",
    email: "emily@summitoutdoor.com",
    phone: "(555) 789-0123",
    website: "summitoutdoor.com",
    tier: "gold",
    monthlyRate: 400,
    status: "ending_soon",
    contractStart: "2023-06-01",
    contractEnd: "2024-03-01",
    adsSpotsPerMonth: 120,
    adsPlayedThisMonth: 78,
    lastContact: "2024-02-01",
    accountManager: "Cameron Wells",
    notes: "Contract ending next month. Very happy with results. Present renewal with Platinum upgrade option.",
    performance: {
      impressions: 17280,
      estimatedReach: 4200,
      satisfaction: 92
    }
  },
  {
    id: 3,
    businessName: "Green Mountain Distillery",
    businessType: "Craft Spirits",
    contactName: "Jessica Rivera",
    email: "jessica@greenmountaindistillery.com",
    phone: "(555) 345-6789",
    website: "greenmountaindistillery.com",
    tier: "bronze",
    monthlyRate: 100,
    status: "active",
    contractStart: "2023-12-01",
    contractEnd: "2024-11-30",
    adsSpotsPerMonth: 30,
    adsPlayedThisMonth: 30,
    lastContact: "2024-01-28",
    accountManager: "Cameron Wells",
    notes: "Started with Bronze. Show ROI metrics at 3-month mark to encourage upgrade.",
    performance: {
      impressions: 4320,
      estimatedReach: 1050,
      satisfaction: 88
    }
  },
  {
    id: 4,
    businessName: "Heritage Bakery",
    businessType: "Artisan Bakery",
    contactName: "Robert Sullivan",
    email: "robert@heritagebakery.com",
    phone: "(555) 678-9012",
    website: "heritagebakery.com",
    tier: "silver",
    monthlyRate: 200,
    status: "active",
    contractStart: "2024-01-15",
    contractEnd: "2025-01-14",
    adsSpotsPerMonth: 60,
    adsPlayedThisMonth: 38,
    lastContact: "2024-02-03",
    accountManager: "Cameron Wells",
    notes: "3 locations. Owner very engaged. Tracking sales impact closely.",
    performance: {
      impressions: 8640,
      estimatedReach: 2100,
      satisfaction: 90
    }
  },
  {
    id: 5,
    businessName: "Riverside Yoga Studio",
    businessType: "Wellness & Fitness",
    contactName: "Amanda Park",
    email: "amanda@riversideyoga.com",
    phone: "(555) 567-8901",
    website: "riversideyoga.com",
    tier: "bronze",
    monthlyRate: 100,
    status: "active",
    contractStart: "2024-02-01",
    contractEnd: "2024-07-31",
    adsSpotsPerMonth: 30,
    adsPlayedThisMonth: 15,
    lastContact: "2024-02-06",
    accountManager: "Cameron Wells",
    notes: "New sponsor. First month. Send welcome check-in email.",
    performance: {
      impressions: 4320,
      estimatedReach: 1050,
      satisfaction: 85
    }
  },
  {
    id: 6,
    businessName: "Downtown Auto Service",
    businessType: "Auto Repair",
    contactName: "Michael Torres",
    email: "michael@downtownauto.com",
    phone: "(555) 890-1234",
    website: "downtownauto.com",
    tier: "silver",
    monthlyRate: 200,
    status: "active",
    contractStart: "2023-09-01",
    contractEnd: "2024-08-31",
    adsSpotsPerMonth: 60,
    adsPlayedThisMonth: 45,
    lastContact: "2024-01-20",
    accountManager: "Cameron Wells",
    notes: "Consistent performer. Happy with steady customer flow. No issues.",
    performance: {
      impressions: 8640,
      estimatedReach: 2100,
      satisfaction: 87
    }
  },
  {
    id: 7,
    businessName: "Tech Solutions Pro",
    businessType: "IT Services",
    contactName: "David Chen",
    email: "david@techsolutionspro.com",
    phone: "(555) 456-7890",
    website: "techsolutionspro.com",
    tier: "gold",
    monthlyRate: 400,
    status: "active",
    contractStart: "2023-10-01",
    contractEnd: "2024-09-30",
    adsSpotsPerMonth: 120,
    adsPlayedThisMonth: 92,
    lastContact: "2024-01-15",
    accountManager: "Cameron Wells",
    notes: "B2B sponsor. Tracking lead quality. Request quarterly business review.",
    performance: {
      impressions: 17280,
      estimatedReach: 4200,
      satisfaction: 91
    }
  },
  {
    id: 8,
    businessName: "Wildflower Florist",
    businessType: "Florist",
    contactName: "Emma Thompson",
    email: "emma@wildflowerflorist.com",
    phone: "(555) 678-9012",
    website: "wildflowerflorist.com",
    tier: "bronze",
    monthlyRate: 100,
    status: "active",
    contractStart: "2024-01-20",
    contractEnd: "2024-07-19",
    adsSpotsPerMonth: 30,
    adsPlayedThisMonth: 22,
    lastContact: "2024-02-02",
    accountManager: "Cameron Wells",
    notes: "Wedding season coming. Suggest seasonal ad refresh.",
    performance: {
      impressions: 4320,
      estimatedReach: 1050,
      satisfaction: 89
    }
  },
  {
    id: 9,
    businessName: "Cornerstone Insurance",
    businessType: "Insurance Services",
    contactName: "Robert Taylor",
    email: "robert@cornerstoneins.com",
    phone: "(555) 789-0123",
    website: "cornerstoneins.com",
    tier: "platinum",
    monthlyRate: 500,
    status: "active",
    contractStart: "2023-07-01",
    contractEnd: "2025-06-30",
    adsSpotsPerMonth: 180,
    adsPlayedThisMonth: 120,
    lastContact: "2024-01-25",
    accountManager: "Cameron Wells",
    notes: "Top-tier sponsor. 2-year contract. Excellent relationship. Premium placement slots.",
    performance: {
      impressions: 25920,
      estimatedReach: 6300,
      satisfaction: 96
    }
  },
  {
    id: 10,
    businessName: "Maple Street Brewery",
    businessType: "Craft Brewery",
    contactName: "James Wilson",
    email: "james@maplestreetbrew.com",
    phone: "(555) 012-3456",
    website: "maplestreetbrew.com",
    tier: "gold",
    monthlyRate: 400,
    status: "active",
    contractStart: "2023-11-01",
    contractEnd: "2024-10-31",
    adsSpotsPerMonth: 120,
    adsPlayedThisMonth: 88,
    lastContact: "2024-01-30",
    accountManager: "Cameron Wells",
    notes: "Launched new seasonal beer. Update ad creative to feature new product.",
    performance: {
      impressions: 17280,
      estimatedReach: 4200,
      satisfaction: 93
    }
  },
  {
    id: 11,
    businessName: "Bright Smiles Dental",
    businessType: "Healthcare",
    contactName: "Dr. Amanda Foster",
    email: "amanda@brightsmiles.com",
    phone: "(555) 901-2346",
    website: "brightsmiles.com",
    tier: "silver",
    monthlyRate: 200,
    status: "active",
    contractStart: "2024-01-01",
    contractEnd: "2024-12-31",
    adsSpotsPerMonth: 60,
    adsPlayedThisMonth: 40,
    lastContact: "2024-02-04",
    accountManager: "Cameron Wells",
    notes: "Running special promotion. Updated ad content approved.",
    performance: {
      impressions: 8640,
      estimatedReach: 2100,
      satisfaction: 88
    }
  },
  {
    id: 12,
    businessName: "Artisan Pizza Co",
    businessType: "Restaurant",
    contactName: "Tony Russo",
    email: "tony@artisanpizza.com",
    phone: "(555) 890-1234",
    website: "artisanpizza.com",
    tier: "bronze",
    monthlyRate: 100,
    status: "active",
    contractStart: "2024-02-01",
    contractEnd: "2024-07-31",
    adsSpotsPerMonth: 30,
    adsPlayedThisMonth: 12,
    lastContact: "2024-02-07",
    accountManager: "Cameron Wells",
    notes: "Just activated. Monitor first month performance closely.",
    performance: {
      impressions: 4320,
      estimatedReach: 1050,
      satisfaction: 86
    }
  },
  {
    id: 13,
    businessName: "Peak Performance Gym",
    businessType: "Fitness Center",
    contactName: "Marcus Johnson",
    email: "marcus@peakperformance.com",
    phone: "(555) 234-5678",
    website: "peakperformance.com",
    tier: "silver",
    monthlyRate: 200,
    status: "paused",
    contractStart: "2023-08-01",
    contractEnd: "2024-07-31",
    adsSpotsPerMonth: 60,
    adsPlayedThisMonth: 0,
    lastContact: "2024-01-10",
    accountManager: "Cameron Wells",
    notes: "Requested pause for January-February (slow season). Resume March 1st.",
    performance: {
      impressions: 8640,
      estimatedReach: 2100,
      satisfaction: 84
    }
  },
  {
    id: 14,
    businessName: "Urban Threads Boutique",
    businessType: "Fashion Retail",
    contactName: "Lisa Chen",
    email: "lisa@urbanthreads.com",
    phone: "(555) 123-4567",
    website: "urbanthreads.com",
    tier: "bronze",
    monthlyRate: 100,
    status: "active",
    contractStart: "2024-01-15",
    contractEnd: "2024-07-14",
    adsSpotsPerMonth: 30,
    adsPlayedThisMonth: 25,
    lastContact: "2024-02-01",
    accountManager: "Cameron Wells",
    notes: "Fashion boutique. Spring collection launching. Schedule ad refresh meeting.",
    performance: {
      impressions: 4320,
      estimatedReach: 1050,
      satisfaction: 87
    }
  }
];

const tierConfig: Record<SponsorTier, { label: string; color: string; monthlyRate: number; spots: number }> = {
  bronze: { label: 'Bronze', color: 'bg-orange-100 text-orange-700 border-orange-300', monthlyRate: 100, spots: 30 },
  silver: { label: 'Silver', color: 'bg-gray-100 text-gray-700 border-gray-400', monthlyRate: 200, spots: 60 },
  gold: { label: 'Gold', color: 'bg-yellow-100 text-yellow-700 border-yellow-400', monthlyRate: 400, spots: 120 },
  platinum: { label: 'Platinum', color: 'bg-purple-100 text-purple-700 border-purple-400', monthlyRate: 500, spots: 180 }
};

const statusConfig: Record<SponsorStatus, { label: string; color: string; icon: any }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  paused: { label: 'Paused', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  ending_soon: { label: 'Ending Soon', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: X }
};

export default function SponsorManagement() {
  const [selectedTier, setSelectedTier] = useState<SponsorTier | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<SponsorStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

  const filteredSponsors = sponsors.filter(sponsor => {
    const matchesTier = selectedTier === 'all' || sponsor.tier === selectedTier;
    const matchesStatus = selectedStatus === 'all' || sponsor.status === selectedStatus;
    const matchesSearch = sponsor.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sponsor.businessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sponsor.contactName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTier && matchesStatus && matchesSearch;
  });

  const totalSponsors = sponsors.length;
  const activeSponsors = sponsors.filter(s => s.status === 'active').length;
  const totalMRR = sponsors.filter(s => s.status === 'active').reduce((sum, s) => sum + s.monthlyRate, 0);
  const avgSatisfaction = sponsors.reduce((sum, s) => sum + s.performance.satisfaction, 0) / sponsors.length;
  const endingSoon = sponsors.filter(s => s.status === 'ending_soon').length;

  const getDaysUntilEnd = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
                <h1 className="text-2xl font-bold text-gray-900">Sponsor Management</h1>
              </div>
              <p className="text-gray-600 mt-1">Cameron Wells - Account Management & Analytics</p>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sponsors</p>
                <p className="text-2xl font-bold text-gray-900">{totalSponsors}</p>
              </div>
              <Building2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeSponsors}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">${totalMRR.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Satisfaction</p>
                <p className="text-2xl font-bold text-blue-600">{avgSatisfaction.toFixed(0)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ending Soon</p>
                <p className="text-2xl font-bold text-orange-600">{endingSoon}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search sponsors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as SponsorTier | 'all')}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Tiers</option>
                {Object.entries(tierConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as SponsorStatus | 'all')}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sponsors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSponsors.map((sponsor) => {
            const StatusIcon = statusConfig[sponsor.status].icon;
            const daysUntilEnd = getDaysUntilEnd(sponsor.contractEnd);
            const adProgress = (sponsor.adsPlayedThisMonth / sponsor.adsSpotsPerMonth) * 100;

            return (
              <div
                key={sponsor.id}
                onClick={() => setSelectedSponsor(sponsor)}
                className="bg-white border rounded-lg p-6 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{sponsor.businessName}</h3>
                    <p className="text-sm text-gray-600">{sponsor.businessType}</p>
                  </div>
                  <StatusIcon className={`w-5 h-5 ${sponsor.status === 'active' ? 'text-green-600' : sponsor.status === 'ending_soon' ? 'text-orange-600' : 'text-yellow-600'}`} />
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${tierConfig[sponsor.tier].color}`}>
                    {tierConfig[sponsor.tier].label}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[sponsor.status].color}`}>
                    {statusConfig[sponsor.status].label}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly Rate:</span>
                    <span className="font-semibold text-green-600">${sponsor.monthlyRate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Satisfaction:</span>
                    <span className="font-semibold">{sponsor.performance.satisfaction}%</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Ads This Month:</span>
                      <span className="font-semibold">{sponsor.adsPlayedThisMonth}/{sponsor.adsSpotsPerMonth}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(adProgress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t text-xs text-gray-500">
                  {sponsor.status === 'ending_soon' && (
                    <p className="text-orange-600 font-medium mb-1">
                      Contract ends in {daysUntilEnd} days
                    </p>
                  )}
                  <p>Last contact: {sponsor.lastContact}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sponsor Detail Modal */}
      {selectedSponsor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedSponsor.businessName}</h2>
                  <p className="text-gray-600">{selectedSponsor.businessType}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${tierConfig[selectedSponsor.tier].color}`}>
                      {tierConfig[selectedSponsor.tier].label} - ${selectedSponsor.monthlyRate}/mo
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[selectedSponsor.status].color}`}>
                      {statusConfig[selectedSponsor.status].label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSponsor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{selectedSponsor.contactName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${selectedSponsor.email}`} className="text-green-600 hover:underline">
                      {selectedSponsor.email}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${selectedSponsor.phone}`} className="text-green-600 hover:underline">
                      {selectedSponsor.phone}
                    </a>
                  </div>
                  {selectedSponsor.website && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <a href={`https://${selectedSponsor.website}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                        {selectedSponsor.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Contract Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Contract Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">{selectedSponsor.contractStart}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium">{selectedSponsor.contractEnd}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Days Until End:</span>
                    <span className="font-medium">{getDaysUntilEnd(selectedSponsor.contractEnd)} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly Rate:</span>
                    <span className="font-medium text-green-600">${selectedSponsor.monthlyRate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ad Spots/Month:</span>
                    <span className="font-medium">{selectedSponsor.adsSpotsPerMonth}</span>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">Impressions</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedSponsor.performance.impressions.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">Est. Reach</p>
                    <p className="text-2xl font-bold text-green-600">{selectedSponsor.performance.estimatedReach.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">Satisfaction</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedSponsor.performance.satisfaction}%</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Notes</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedSponsor.notes}</p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`mailto:${selectedSponsor.email}?subject=TrueFans RADIO - Account Update&body=Hi ${selectedSponsor.contactName},%0D%0A%0D%0AI wanted to check in regarding ${selectedSponsor.businessName}'s sponsorship with TrueFans RADIO.%0D%0A%0D%0ABest regards,%0D%0ACameron Wells`}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
                >
                  Send Email
                </a>
                <a
                  href={`tel:${selectedSponsor.phone}`}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  Call Sponsor
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
