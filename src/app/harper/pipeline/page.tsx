'use client';

import { useState } from 'react';
import { TrendingUp, Filter, Search, ChevronRight, Mail, Phone, Globe, Building2, DollarSign, Calendar, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

type PipelineStage = 'discovered' | 'contacted' | 'interested' | 'negotiating' | 'agreement' | 'activated' | 'renewing';
type Priority = 'high' | 'medium' | 'low';

interface Sponsor {
  id: number;
  name: string;
  businessType: string;
  contact: string;
  email: string;
  phone: string;
  website: string;
  stage: PipelineStage;
  priority: Priority;
  potentialTier: string;
  potentialRevenue: number;
  daysInStage: number;
  assignedTo: string;
  notes: string;
  nextAction: string;
  nextActionDate: string;
}

const initialSponsors: Sponsor[] = [
  {
    id: 1,
    name: "Mountain Brew Coffee",
    businessType: "Local Coffee Roaster",
    contact: "Sarah Mitchell",
    email: "sarah@mountainbrew.com",
    phone: "(555) 123-4567",
    website: "mountainbrew.com",
    stage: "activated",
    priority: "high",
    potentialTier: "Silver - $200/mo",
    potentialRevenue: 200,
    daysInStage: 45,
    assignedTo: "Cameron Wells",
    notes: "Active sponsor since last month. Very happy with results. Interested in upgrading to Gold.",
    nextAction: "Schedule upgrade discussion",
    nextActionDate: "2024-02-15"
  },
  {
    id: 2,
    name: "Artisan Leather Co",
    businessType: "Handcrafted Leather Goods",
    contact: "Marcus Thompson",
    email: "marcus@artisanleather.com",
    phone: "(555) 234-5678",
    website: "artisanleather.com",
    stage: "agreement",
    priority: "high",
    potentialTier: "Bronze - $100/mo",
    potentialRevenue: 100,
    daysInStage: 3,
    assignedTo: "Dakota Chen",
    notes: "Signed agreement yesterday. Setting up first ad campaign. Local artisan with great story.",
    nextAction: "Finalize ad creative and schedule",
    nextActionDate: "2024-02-10"
  },
  {
    id: 3,
    name: "Green Mountain Distillery",
    businessType: "Craft Spirits Producer",
    contact: "Jessica Rivera",
    email: "jessica@greenmountaindistillery.com",
    phone: "(555) 345-6789",
    website: "greenmountaindistillery.com",
    stage: "negotiating",
    priority: "high",
    potentialTier: "Gold - $400/mo",
    potentialRevenue: 400,
    daysInStage: 7,
    assignedTo: "Blake Morrison",
    notes: "Very interested in Gold package. Discussing ad frequency and peak hours placement.",
    nextAction: "Send final proposal with peak hours breakdown",
    nextActionDate: "2024-02-12"
  },
  {
    id: 4,
    name: "Valley Tech Repair",
    businessType: "Computer & Phone Repair",
    contact: "David Chen",
    email: "david@valleytechrepair.com",
    phone: "(555) 456-7890",
    website: "valleytechrepair.com",
    stage: "interested",
    priority: "medium",
    potentialTier: "Bronze - $100/mo",
    potentialRevenue: 100,
    daysInStage: 5,
    assignedTo: "Blake Morrison",
    notes: "Responded positively to initial outreach. Requested more info on audience demographics.",
    nextAction: "Send listener demographic data and case studies",
    nextActionDate: "2024-02-11"
  },
  {
    id: 5,
    name: "Riverside Yoga Studio",
    businessType: "Wellness & Fitness",
    contact: "Amanda Park",
    email: "amanda@riversideyoga.com",
    phone: "(555) 567-8901",
    website: "riversideyoga.com",
    stage: "contacted",
    priority: "medium",
    potentialTier: "Bronze - $100/mo",
    potentialRevenue: 100,
    daysInStage: 2,
    assignedTo: "Blake Morrison",
    notes: "Initial email sent. Left voicemail. Mentioned they're looking for local advertising options.",
    nextAction: "Follow-up call",
    nextActionDate: "2024-02-09"
  },
  {
    id: 6,
    name: "Heritage Bakery",
    businessType: "Artisan Bakery",
    contact: "Robert Sullivan",
    email: "robert@heritagebakery.com",
    phone: "(555) 678-9012",
    website: "heritagebakery.com",
    stage: "discovered",
    priority: "high",
    potentialTier: "Silver - $200/mo",
    potentialRevenue: 200,
    daysInStage: 1,
    assignedTo: "Blake Morrison",
    notes: "Popular local bakery with 3 locations. Perfect fit for our audience. Owner attended recent community event.",
    nextAction: "Initial outreach email and call",
    nextActionDate: "2024-02-08"
  },
  {
    id: 7,
    name: "Summit Outdoor Gear",
    businessType: "Outdoor Equipment & Apparel",
    contact: "Emily Watson",
    email: "emily@summitoutdoor.com",
    phone: "(555) 789-0123",
    website: "summitoutdoor.com",
    stage: "renewing",
    priority: "high",
    potentialTier: "Gold - $400/mo",
    potentialRevenue: 400,
    daysInStage: 15,
    assignedTo: "Cameron Wells",
    notes: "Contract ending next month. Very satisfied with ROI. Likely to renew and possibly upgrade to Platinum.",
    nextAction: "Present renewal options with Platinum upgrade",
    nextActionDate: "2024-02-14"
  },
  {
    id: 8,
    name: "Downtown Auto Service",
    businessType: "Auto Repair & Maintenance",
    contact: "Michael Torres",
    email: "michael@downtownauto.com",
    phone: "(555) 890-1234",
    website: "downtownauto.com",
    stage: "interested",
    priority: "medium",
    potentialTier: "Silver - $200/mo",
    potentialRevenue: 200,
    daysInStage: 8,
    assignedTo: "Blake Morrison",
    notes: "Owner is interested but wants to wait until next quarter. Following up to maintain relationship.",
    nextAction: "Check in call - discuss Q2 start date",
    nextActionDate: "2024-02-20"
  }
];

const stageConfig: Record<PipelineStage, { label: string; color: string; description: string }> = {
  discovered: { label: 'Discovered', color: 'bg-gray-100 text-gray-700 border-gray-300', description: 'New potential sponsors identified' },
  contacted: { label: 'Contacted', color: 'bg-blue-100 text-blue-700 border-blue-300', description: 'Initial outreach made' },
  interested: { label: 'Interested', color: 'bg-purple-100 text-purple-700 border-purple-300', description: 'Expressed interest in sponsorship' },
  negotiating: { label: 'Negotiating', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', description: 'Discussing terms and packages' },
  agreement: { label: 'Agreement', color: 'bg-orange-100 text-orange-700 border-orange-300', description: 'Contract signed, setting up' },
  activated: { label: 'Activated', color: 'bg-green-100 text-green-700 border-green-300', description: 'Active sponsors running ads' },
  renewing: { label: 'Renewing', color: 'bg-teal-100 text-teal-700 border-teal-300', description: 'Contract renewal in progress' }
};

const getAssignedTo = (stage: PipelineStage): string => {
  if (stage === 'discovered' || stage === 'contacted' || stage === 'interested' || stage === 'negotiating') {
    return 'Blake Morrison';
  } else if (stage === 'agreement') {
    return 'Dakota Chen';
  } else {
    return 'Cameron Wells';
  }
};

export default function SponsorPipeline() {
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialSponsors);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const handleViewAllStages = () => {
    setSelectedStage('all');
    setSelectedPriority('all');
    setSearchTerm('');
  };

  const filteredSponsors = sponsors.filter(sponsor => {
    const matchesStage = selectedStage === 'all' || sponsor.stage === selectedStage;
    const matchesPriority = selectedPriority === 'all' || sponsor.priority === selectedPriority;
    const matchesSearch = sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sponsor.businessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sponsor.contact.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesPriority && matchesSearch;
  });

  const getSponsorsByStage = (stage: PipelineStage) => {
    return sponsors.filter(s => s.stage === stage);
  };

  const totalPotentialRevenue = sponsors.reduce((sum, s) => sum + s.potentialRevenue, 0);
  const activeSponsors = sponsors.filter(s => s.stage === 'activated').length;
  const avgDaysInStage = sponsors.reduce((sum, s) => sum + s.daysInStage, 0) / sponsors.length;

  const moveSponsorsToStage = (sponsorId: number, newStage: PipelineStage) => {
    setSponsors(sponsors.map(s =>
      s.id === sponsorId
        ? {
            ...s,
            stage: newStage,
            daysInStage: 0,
            assignedTo: getAssignedTo(newStage)
          }
        : s
    ));
    setShowActionModal(false);
    setSelectedSponsor(null);
  };

  const handleSponsorClick = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setShowActionModal(true);
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
    }
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
                <h1 className="text-2xl font-bold text-gray-900">Sponsor Pipeline</h1>
              </div>
              <p className="text-gray-600 mt-1">Complete journey from discovery to activation</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/harper/team"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Building2 className="w-4 h-4" />
                <span>View Team</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sponsors</p>
                <p className="text-2xl font-bold text-gray-900">{sponsors.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Sponsors</p>
                <p className="text-2xl font-bold text-green-600">{activeSponsors}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Potential Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${totalPotentialRevenue}/mo</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Days in Stage</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(avgDaysInStage)}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Pipeline Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(stageConfig).map(([stageKey, config], idx) => {
              const stageSponsors = getSponsorsByStage(stageKey as PipelineStage);
              return (
                <button
                  key={stageKey}
                  type="button"
                  onClick={() => setSelectedStage(stageKey as PipelineStage)}
                  className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedStage === stageKey
                      ? "border-green-500 bg-green-100 shadow-lg ring-2 ring-green-200"
                      : "border-gray-200 hover:border-green-300 hover:shadow-md hover:bg-green-50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stageSponsors.length}</div>
                    <div className="text-xs font-medium text-gray-600 mb-2">{config.label}</div>
                    <div className="text-xs text-gray-500">
                      {getAssignedTo(stageKey as PipelineStage).split(' ')[0]}
                    </div>
                  </div>
                  {idx < Object.keys(stageConfig).length - 1 && (
                    <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 text-gray-400 hidden lg:block" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <button
              type="button"
              onClick={handleViewAllStages}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer hover:scale-105 ${
                selectedStage === "all"
                  ? "bg-green-600 text-white shadow-lg ring-2 ring-green-300"
                  : "bg-green-100 text-green-700 hover:bg-green-200 hover:shadow-md"
              }`}
            >
              {selectedStage === "all" ? "✓ Viewing All Stages" : "View All Stages"} ({sponsors.length} sponsors)
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
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
              {selectedStage !== "all" && (
                <button
                  type="button"
                  onClick={handleViewAllStages}
                  className="text-sm text-green-600 hover:text-green-700 font-medium underline whitespace-nowrap"
                >
                  Clear filters
                </button>
              )}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as Priority | 'all')}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filtered Sponsors List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900 text-lg">
              {selectedStage === "all" ? "All Sponsors" : `${stageConfig[selectedStage].label} Stage`}
              {" "}({filteredSponsors.length})
            </h3>
          </div>

          {filteredSponsors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No sponsors found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSponsors.map((sponsor) => (
                        <div
                          key={sponsor.id}
                          onClick={() => handleSponsorClick(sponsor)}
                          className="border rounded-lg p-4 hover:border-green-500 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{sponsor.name}</h3>
                              <p className="text-sm text-gray-600">{sponsor.businessType}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(sponsor.priority)}`}>
                              {sponsor.priority}
                            </span>
                          </div>
                          <div className="space-y-1 mb-3">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Contact:</span> {sponsor.contact}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Tier:</span> {sponsor.potentialTier}
                            </p>
                            <p className="text-sm text-green-600 font-medium">
                              ${sponsor.potentialRevenue}/mo potential
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t">
                            <span className="text-xs text-gray-500">
                              {sponsor.daysInStage} days in stage
                            </span>
                            <span className="text-xs text-gray-500">
                              {sponsor.assignedTo.split(' ')[0]}
                            </span>
                          </div>
                        </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sponsor Detail Modal */}
      {showActionModal && selectedSponsor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedSponsor.name}</h2>
                  <p className="text-gray-600">{selectedSponsor.businessType}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${stageConfig[selectedSponsor.stage].color}`}>
                      {stageConfig[selectedSponsor.stage].label}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedSponsor.priority)}`}>
                      {selectedSponsor.priority} priority
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedSponsor(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium">{selectedSponsor.contact}</span>
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
                  <div className="flex items-center space-x-2 text-sm">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a href={`https://${selectedSponsor.website}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                      {selectedSponsor.website}
                    </a>
                  </div>
                </div>
              </div>

              {/* Sponsorship Details */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Sponsorship Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Potential Tier:</span>
                    <span className="text-sm font-medium">{selectedSponsor.potentialTier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Potential Revenue:</span>
                    <span className="text-sm font-medium text-green-600">${selectedSponsor.potentialRevenue}/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Days in Stage:</span>
                    <span className="text-sm font-medium">{selectedSponsor.daysInStage} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Assigned To:</span>
                    <span className="text-sm font-medium">{selectedSponsor.assignedTo}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedSponsor.notes}</p>
              </div>

              {/* Next Action */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Next Action</h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedSponsor.nextAction}</p>
                      <p className="text-sm text-gray-600 mt-1">Due: {selectedSponsor.nextActionDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`mailto:${selectedSponsor.email}?subject=TrueFans RADIO - Sponsorship Opportunity&body=Hi ${selectedSponsor.contact},%0D%0A%0D%0AI hope this email finds you well. I wanted to reach out about an exciting sponsorship opportunity with TrueFans RADIO Network.%0D%0A%0D%0AWe believe ${selectedSponsor.name} would be a perfect fit for our engaged audience of music lovers and local supporters.%0D%0A%0D%0ABest regards,%0D%0ABlake Morrison%0D%0ATrueFans RADIO`}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
                >
                  Contact Sponsor
                </a>
                <a
                  href={`tel:${selectedSponsor.phone}`}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                >
                  Call Sponsor
                </a>
              </div>

              {/* Move to Stage */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Move to Stage</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(stageConfig).map(([stageKey, config]) => (
                    <button
                      key={stageKey}
                      onClick={() => moveSponsorsToStage(selectedSponsor.id, stageKey as PipelineStage)}
                      disabled={selectedSponsor.stage === stageKey}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedSponsor.stage === stageKey
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : `border ${config.color} hover:opacity-75`
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
