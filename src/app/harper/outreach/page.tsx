'use client';

import { useState } from 'react';
import { Search, Filter, Plus, Mail, Phone, Building2, TrendingUp, Users, Calendar, ChevronRight, Send, Target, Briefcase } from 'lucide-react';
import Link from 'next/link';

type LeadSource = 'instagram' | 'google' | 'referral' | 'event' | 'cold_call' | 'website';
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiating' | 'converted' | 'lost';
type Priority = 'high' | 'medium' | 'low';

interface Lead {
  id: number;
  businessName: string;
  businessType: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: Priority;
  potentialTier: string;
  potentialRevenue: number;
  notes: string;
  dateAdded: string;
  lastContact?: string;
  assignedTo: string;
}

interface Campaign {
  id: number;
  name: string;
  type: 'email' | 'phone' | 'event';
  status: 'active' | 'paused' | 'completed';
  leads: number;
  contacted: number;
  converted: number;
  startDate: string;
  endDate?: string;
}

const initialLeads: Lead[] = [
  {
    id: 1,
    businessName: "Riverside Wellness Center",
    businessType: "Health & Wellness",
    contactName: "Dr. Sarah Martinez",
    email: "sarah@riversidewellness.com",
    phone: "(555) 901-2345",
    website: "riversidewellness.com",
    source: "instagram",
    status: "new",
    priority: "high",
    potentialTier: "Silver - $200/mo",
    potentialRevenue: 200,
    notes: "Found on Instagram. Large following, active community engagement. Posted about looking for local advertising.",
    dateAdded: "2024-02-07",
    assignedTo: "Blake Morrison"
  },
  {
    id: 2,
    businessName: "Maple Street Brewery",
    businessType: "Craft Brewery",
    contactName: "James Wilson",
    email: "james@maplestreetbrew.com",
    phone: "(555) 012-3456",
    website: "maplestreetbrew.com",
    source: "event",
    status: "contacted",
    priority: "high",
    potentialTier: "Gold - $400/mo",
    potentialRevenue: 400,
    notes: "Met at Chamber of Commerce mixer. Very interested in reaching music-loving demographic. Follow up scheduled.",
    dateAdded: "2024-02-05",
    lastContact: "2024-02-06",
    assignedTo: "Blake Morrison"
  },
  {
    id: 3,
    businessName: "Urban Threads Boutique",
    businessType: "Fashion Retail",
    contactName: "Lisa Chen",
    email: "lisa@urbanthreads.com",
    phone: "(555) 123-4567",
    website: "urbanthreads.com",
    source: "google",
    status: "qualified",
    priority: "medium",
    potentialTier: "Bronze - $100/mo",
    potentialRevenue: 100,
    notes: "Responded positively to initial email. Interested in Bronze package. Requested listener demographics.",
    dateAdded: "2024-02-03",
    lastContact: "2024-02-05",
    assignedTo: "Blake Morrison"
  },
  {
    id: 4,
    businessName: "Peak Performance Gym",
    businessType: "Fitness Center",
    contactName: "Marcus Johnson",
    email: "marcus@peakperformance.com",
    phone: "(555) 234-5678",
    website: "peakperformance.com",
    source: "referral",
    status: "proposal_sent",
    priority: "high",
    potentialTier: "Silver - $200/mo",
    potentialRevenue: 200,
    notes: "Referred by Mountain Brew Coffee. Sent Silver package proposal. Waiting for decision.",
    dateAdded: "2024-02-01",
    lastContact: "2024-02-04",
    assignedTo: "Blake Morrison"
  },
  {
    id: 5,
    businessName: "Sunset Diner",
    businessType: "Restaurant",
    contactName: "Maria Rodriguez",
    email: "maria@sunsetdiner.com",
    phone: "(555) 345-6789",
    source: "cold_call",
    status: "contacted",
    priority: "medium",
    potentialTier: "Bronze - $100/mo",
    potentialRevenue: 100,
    notes: "Cold outreach. Owner interested but wants to think about it. Schedule follow-up next week.",
    dateAdded: "2024-01-30",
    lastContact: "2024-02-02",
    assignedTo: "Blake Morrison"
  },
  {
    id: 6,
    businessName: "Zen Garden Spa",
    businessType: "Spa & Beauty",
    contactName: "Jennifer Park",
    email: "jennifer@zengardenspa.com",
    phone: "(555) 456-7890",
    website: "zengardenspa.com",
    source: "instagram",
    status: "new",
    priority: "medium",
    potentialTier: "Silver - $200/mo",
    potentialRevenue: 200,
    notes: "Active on social media. Recently opened second location. Good fit for our audience.",
    dateAdded: "2024-02-06",
    assignedTo: "Blake Morrison"
  },
  {
    id: 7,
    businessName: "Tech Haven Electronics",
    businessType: "Electronics Retail",
    contactName: "David Kim",
    email: "david@techhaven.com",
    phone: "(555) 567-8901",
    website: "techhaven.com",
    source: "google",
    status: "lost",
    priority: "low",
    potentialTier: "Bronze - $100/mo",
    potentialRevenue: 0,
    notes: "Decided to go with another advertising platform. Keep on radar for future.",
    dateAdded: "2024-01-25",
    lastContact: "2024-01-28",
    assignedTo: "Blake Morrison"
  },
  {
    id: 8,
    businessName: "Wildflower Florist",
    businessType: "Florist",
    contactName: "Emma Thompson",
    email: "emma@wildflowerflorist.com",
    phone: "(555) 678-9012",
    website: "wildflowerflorist.com",
    source: "website",
    status: "negotiating",
    priority: "high",
    potentialTier: "Bronze - $100/mo",
    potentialRevenue: 100,
    notes: "Submitted inquiry through website. Very interested. Negotiating start date and ad creative.",
    dateAdded: "2024-01-28",
    lastContact: "2024-02-05",
    assignedTo: "Blake Morrison"
  },
  {
    id: 9,
    businessName: "Cornerstone Insurance",
    businessType: "Insurance Services",
    contactName: "Robert Taylor",
    email: "robert@cornerstoneins.com",
    phone: "(555) 789-0123",
    website: "cornerstoneins.com",
    source: "referral",
    status: "qualified",
    priority: "high",
    potentialTier: "Gold - $400/mo",
    potentialRevenue: 400,
    notes: "High-value prospect. Referred by existing client. Looking for long-term partnership.",
    dateAdded: "2024-02-04",
    lastContact: "2024-02-06",
    assignedTo: "Blake Morrison"
  },
  {
    id: 10,
    businessName: "Artisan Pizza Co",
    businessType: "Restaurant",
    contactName: "Tony Russo",
    email: "tony@artisanpizza.com",
    phone: "(555) 890-1234",
    website: "artisanpizza.com",
    source: "event",
    status: "new",
    priority: "medium",
    potentialTier: "Silver - $200/mo",
    potentialRevenue: 200,
    notes: "Met at food festival. Owner loves supporting local. Great brand alignment.",
    dateAdded: "2024-02-07",
    assignedTo: "Blake Morrison"
  },
  {
    id: 11,
    businessName: "Bright Smiles Dental",
    businessType: "Healthcare",
    contactName: "Dr. Amanda Foster",
    email: "amanda@brightsmiles.com",
    phone: "(555) 901-2346",
    website: "brightsmiles.com",
    source: "google",
    status: "contacted",
    priority: "high",
    potentialTier: "Silver - $200/mo",
    potentialRevenue: 200,
    notes: "Left voicemail and sent email. Receptionist mentioned they're looking for new marketing channels.",
    dateAdded: "2024-02-05",
    lastContact: "2024-02-06",
    assignedTo: "Blake Morrison"
  },
  {
    id: 12,
    businessName: "Adventure Outfitters",
    businessType: "Outdoor Retail",
    contactName: "Chris Anderson",
    email: "chris@adventureoutfitters.com",
    phone: "(555) 012-3457",
    website: "adventureoutfitters.com",
    source: "instagram",
    status: "proposal_sent",
    priority: "medium",
    potentialTier: "Bronze - $100/mo",
    potentialRevenue: 100,
    notes: "Sent Bronze package info. Owner is reviewing. Good social media presence.",
    dateAdded: "2024-02-02",
    lastContact: "2024-02-04",
    assignedTo: "Blake Morrison"
  }
];

const initialCampaigns: Campaign[] = [
  {
    id: 1,
    name: "Local Business Discovery - Instagram",
    type: "email",
    status: "active",
    leads: 23,
    contacted: 15,
    converted: 3,
    startDate: "2024-01-15"
  },
  {
    id: 2,
    name: "Chamber of Commerce Follow-ups",
    type: "phone",
    status: "active",
    leads: 12,
    contacted: 12,
    converted: 4,
    startDate: "2024-01-20"
  },
  {
    id: 3,
    name: "Health & Wellness Sector Outreach",
    type: "email",
    status: "active",
    leads: 18,
    contacted: 10,
    converted: 2,
    startDate: "2024-02-01"
  },
  {
    id: 4,
    name: "Holiday Season Push",
    type: "email",
    status: "completed",
    leads: 45,
    contacted: 45,
    converted: 8,
    startDate: "2023-11-01",
    endDate: "2023-12-31"
  }
];

const sourceLabels: Record<LeadSource, string> = {
  instagram: 'Instagram',
  google: 'Google',
  referral: 'Referral',
  event: 'Event',
  cold_call: 'Cold Call',
  website: 'Website'
};

const statusLabels: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Contacted', color: 'bg-purple-100 text-purple-700' },
  qualified: { label: 'Qualified', color: 'bg-indigo-100 text-indigo-700' },
  proposal_sent: { label: 'Proposal Sent', color: 'bg-yellow-100 text-yellow-700' },
  negotiating: { label: 'Negotiating', color: 'bg-orange-100 text-orange-700' },
  converted: { label: 'Converted', color: 'bg-green-100 text-green-700' },
  lost: { label: 'Lost', color: 'bg-gray-100 text-gray-700' }
};

export default function HarperOutreach() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [campaigns] = useState<Campaign[]>(initialCampaigns);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<LeadSource | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'leads' | 'campaigns'>('leads');

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
    const matchesSource = selectedSource === 'all' || lead.source === selectedSource;
    const matchesPriority = selectedPriority === 'all' || lead.priority === selectedPriority;
    const matchesSearch = lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.businessType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSource && matchesPriority && matchesSearch;
  });

  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  const contactedLeads = leads.filter(l => ['contacted', 'qualified', 'proposal_sent', 'negotiating'].includes(l.status)).length;
  const conversionRate = leads.filter(l => l.status === 'converted').length / totalLeads * 100;

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
                <h1 className="text-2xl font-bold text-gray-900">Sponsor Outreach</h1>
              </div>
              <p className="text-gray-600 mt-1">Blake Morrison - Business Development</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/harper/workflows"
                className="inline-flex items-center space-x-2 border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Automated Workflows</span>
              </Link>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Leads</p>
                <p className="text-2xl font-bold text-blue-600">{newLeads}</p>
              </div>
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{contactedLeads}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-green-600">{conversionRate.toFixed(1)}%</p>
              </div>
              <Briefcase className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border rounded-lg mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('leads')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'leads'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Leads ({totalLeads})
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'campaigns'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Campaigns ({campaigns.length})
              </button>
            </div>
          </div>

          {activeTab === 'leads' && (
            <>
              {/* Filters */}
              <div className="p-4 border-b">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as LeadStatus | 'all')}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Status</option>
                      {Object.entries(statusLabels).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                    <select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value as LeadSource | 'all')}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Sources</option>
                      {Object.entries(sourceLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value as Priority | 'all')}
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Leads List */}
              <div className="p-4">
                <div className="space-y-3">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="border rounded-lg p-4 hover:border-green-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{lead.businessName}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusLabels[lead.status].color}`}>
                              {statusLabels[lead.status].label}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                              {lead.priority}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Contact</p>
                              <p className="text-sm font-medium">{lead.contactName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Business Type</p>
                              <p className="text-sm font-medium">{lead.businessType}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Source</p>
                              <p className="text-sm font-medium">{sourceLabels[lead.source]}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Potential</p>
                              <p className="text-sm font-medium text-green-600">${lead.potentialRevenue}/mo</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{lead.notes}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Added: {lead.dateAdded}</span>
                            {lead.lastContact && <span>Last Contact: {lead.lastContact}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <a
                            href={`mailto:${lead.email}?subject=TrueFans RADIO - Sponsorship Opportunity&body=Hi ${lead.contactName},%0D%0A%0D%0AI hope this email finds you well. I wanted to reach out about an exciting sponsorship opportunity with TrueFans RADIO Network.%0D%0A%0D%0AWe believe ${lead.businessName} would be a perfect fit for our engaged audience.%0D%0A%0D%0ABest regards,%0D%0ABlake Morrison`}
                            className="inline-flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Mail className="w-4 h-4" />
                            <span>Email</span>
                          </a>
                          <a
                            href={`tel:${lead.phone}`}
                            className="inline-flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Call</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'campaigns' && (
            <div className="p-4">
              <div className="space-y-3">
                {campaigns.map((campaign) => {
                  const convRate = campaign.contacted > 0 ? (campaign.converted / campaign.contacted * 100).toFixed(1) : '0.0';
                  return (
                    <div
                      key={campaign.id}
                      className="border rounded-lg p-4 hover:border-green-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{campaign.name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                              campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {campaign.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {campaign.type === 'email' ? <Mail className="w-3 h-3 inline mr-1" /> :
                               campaign.type === 'phone' ? <Phone className="w-3 h-3 inline mr-1" /> :
                               <Calendar className="w-3 h-3 inline mr-1" />}
                              {campaign.type}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Started: {campaign.startDate}</p>
                          {campaign.endDate && <p className="text-sm text-gray-600">Ended: {campaign.endDate}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Leads</p>
                          <p className="text-2xl font-bold text-gray-900">{campaign.leads}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Contacted</p>
                          <p className="text-2xl font-bold text-blue-600">{campaign.contacted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Converted</p>
                          <p className="text-2xl font-bold text-green-600">{campaign.converted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Conv. Rate</p>
                          <p className="text-2xl font-bold text-purple-600">{convRate}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
