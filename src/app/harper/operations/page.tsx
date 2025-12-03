'use client';

import { useState } from 'react';
import { Calendar, Clock, Radio, Building2, Play, CheckCircle, AlertCircle, ChevronRight, Users, Filter, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';

type TimeSlot = 'prime' | 'subprime';
type AdStatus = 'scheduled' | 'played' | 'pending' | 'issue';

interface AdSpot {
  id: number;
  sponsorName: string;
  sponsorTier: string;
  adTitle: string;
  duration: number; // seconds
  timeSlot: TimeSlot;
  scheduledTime: string;
  scheduledDate: string;
  status: AdStatus;
  playedAt?: string;
  impressions?: number;
  notes?: string;
}

interface DaySchedule {
  date: string;
  totalSlots: number;
  filledSlots: number;
  primeSlots: number;
  subprimeSlots: number;
}

const adSpots: AdSpot[] = [
  {
    id: 1,
    sponsorName: "Mountain Brew Coffee",
    sponsorTier: "Silver",
    adTitle: "Morning Coffee Special",
    duration: 15,
    timeSlot: "prime",
    scheduledTime: "07:30 AM",
    scheduledDate: "2024-02-08",
    status: "scheduled",
    notes: "Peak morning drive time"
  },
  {
    id: 2,
    sponsorName: "Cornerstone Insurance",
    sponsorTier: "Platinum",
    adTitle: "Auto Insurance Savings",
    duration: 30,
    timeSlot: "prime",
    scheduledTime: "08:15 AM",
    scheduledDate: "2024-02-08",
    status: "scheduled",
    notes: "Premium placement"
  },
  {
    id: 3,
    sponsorName: "Heritage Bakery",
    sponsorTier: "Silver",
    adTitle: "Fresh Daily Pastries",
    duration: 15,
    timeSlot: "prime",
    scheduledTime: "09:00 AM",
    scheduledDate: "2024-02-08",
    status: "scheduled"
  },
  {
    id: 4,
    sponsorName: "Summit Outdoor Gear",
    sponsorTier: "Gold",
    adTitle: "Spring Hiking Sale",
    duration: 20,
    timeSlot: "prime",
    scheduledTime: "12:30 PM",
    scheduledDate: "2024-02-08",
    status: "scheduled",
    notes: "Lunch hour placement"
  },
  {
    id: 5,
    sponsorName: "Maple Street Brewery",
    sponsorTier: "Gold",
    adTitle: "New Seasonal IPA",
    duration: 20,
    timeSlot: "prime",
    scheduledTime: "05:15 PM",
    scheduledDate: "2024-02-08",
    status: "scheduled",
    notes: "Evening drive time"
  },
  {
    id: 6,
    sponsorName: "Green Mountain Distillery",
    sponsorTier: "Bronze",
    adTitle: "Craft Spirits Tasting",
    duration: 15,
    timeSlot: "subprime",
    scheduledTime: "07:00 PM",
    scheduledDate: "2024-02-08",
    status: "scheduled"
  },
  {
    id: 7,
    sponsorName: "Tech Solutions Pro",
    sponsorTier: "Gold",
    adTitle: "IT Support Services",
    duration: 20,
    timeSlot: "subprime",
    scheduledTime: "08:30 PM",
    scheduledDate: "2024-02-08",
    status: "scheduled"
  },
  {
    id: 8,
    sponsorName: "Wildflower Florist",
    sponsorTier: "Bronze",
    adTitle: "Valentine's Day Special",
    duration: 15,
    timeSlot: "subprime",
    scheduledTime: "10:00 PM",
    scheduledDate: "2024-02-08",
    status: "scheduled"
  },
  // Previous day - played ads
  {
    id: 9,
    sponsorName: "Mountain Brew Coffee",
    sponsorTier: "Silver",
    adTitle: "Morning Coffee Special",
    duration: 15,
    timeSlot: "prime",
    scheduledTime: "07:30 AM",
    scheduledDate: "2024-02-07",
    status: "played",
    playedAt: "07:30:05 AM",
    impressions: 450,
    notes: "On time"
  },
  {
    id: 10,
    sponsorName: "Bright Smiles Dental",
    sponsorTier: "Silver",
    adTitle: "New Patient Special",
    duration: 15,
    timeSlot: "prime",
    scheduledTime: "08:00 AM",
    scheduledDate: "2024-02-07",
    status: "played",
    playedAt: "08:00:12 AM",
    impressions: 520
  },
  {
    id: 11,
    sponsorName: "Downtown Auto Service",
    sponsorTier: "Silver",
    adTitle: "Oil Change Special",
    duration: 15,
    timeSlot: "prime",
    scheduledTime: "08:30 AM",
    scheduledDate: "2024-02-07",
    status: "played",
    playedAt: "08:30:08 AM",
    impressions: 480
  },
  {
    id: 12,
    sponsorName: "Summit Outdoor Gear",
    sponsorTier: "Gold",
    adTitle: "Winter Clearance Sale",
    duration: 20,
    timeSlot: "prime",
    scheduledTime: "12:00 PM",
    scheduledDate: "2024-02-07",
    status: "played",
    playedAt: "12:00:15 PM",
    impressions: 600
  },
  {
    id: 13,
    sponsorName: "Heritage Bakery",
    sponsorTier: "Silver",
    adTitle: "Fresh Daily Pastries",
    duration: 15,
    timeSlot: "prime",
    scheduledTime: "05:30 PM",
    scheduledDate: "2024-02-07",
    status: "played",
    playedAt: "05:30:03 PM",
    impressions: 580
  },
  {
    id: 14,
    sponsorName: "Riverside Yoga Studio",
    sponsorTier: "Bronze",
    adTitle: "New Member Discount",
    duration: 15,
    timeSlot: "subprime",
    scheduledTime: "07:30 PM",
    scheduledDate: "2024-02-07",
    status: "played",
    playedAt: "07:30:18 PM",
    impressions: 280
  },
  {
    id: 15,
    sponsorName: "Artisan Pizza Co",
    sponsorTier: "Bronze",
    adTitle: "Family Dinner Deal",
    duration: 15,
    timeSlot: "subprime",
    scheduledTime: "09:00 PM",
    scheduledDate: "2024-02-07",
    status: "played",
    playedAt: "09:00:22 PM",
    impressions: 220
  },
  // Pending ads
  {
    id: 16,
    sponsorName: "Urban Threads Boutique",
    sponsorTier: "Bronze",
    adTitle: "Spring Collection Launch",
    duration: 15,
    timeSlot: "prime",
    scheduledTime: "TBD",
    scheduledDate: "2024-02-09",
    status: "pending",
    notes: "Awaiting creative approval"
  },
  {
    id: 17,
    sponsorName: "Peak Performance Gym",
    sponsorTier: "Silver",
    adTitle: "New Year Fitness",
    duration: 15,
    timeSlot: "prime",
    scheduledTime: "TBD",
    scheduledDate: "2024-03-01",
    status: "pending",
    notes: "Paused - resumes March 1st"
  }
];

const weekSchedule: DaySchedule[] = [
  { date: "2024-02-08", totalSlots: 24, filledSlots: 20, primeSlots: 12, subprimeSlots: 12 },
  { date: "2024-02-09", totalSlots: 24, filledSlots: 18, primeSlots: 12, subprimeSlots: 12 },
  { date: "2024-02-10", totalSlots: 24, filledSlots: 22, primeSlots: 12, subprimeSlots: 12 },
  { date: "2024-02-11", totalSlots: 24, filledSlots: 19, primeSlots: 12, subprimeSlots: 12 },
  { date: "2024-02-12", totalSlots: 24, filledSlots: 21, primeSlots: 12, subprimeSlots: 12 },
  { date: "2024-02-13", totalSlots: 24, filledSlots: 17, primeSlots: 12, subprimeSlots: 12 },
  { date: "2024-02-14", totalSlots: 24, filledSlots: 24, primeSlots: 12, subprimeSlots: 12 } // Valentine's Day - fully booked
];

const statusConfig: Record<AdStatus, { label: string; color: string; icon: any }> = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  played: { label: 'Played', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  issue: { label: 'Issue', color: 'bg-red-100 text-red-700', icon: AlertCircle }
};

export default function AdOperations() {
  const [selectedDate, setSelectedDate] = useState('2024-02-08');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<AdStatus | 'all'>('all');

  const filteredAds = adSpots.filter(ad => {
    const matchesDate = ad.scheduledDate === selectedDate;
    const matchesTimeSlot = selectedTimeSlot === 'all' || ad.timeSlot === selectedTimeSlot;
    const matchesStatus = selectedStatus === 'all' || ad.status === selectedStatus;
    return matchesDate && matchesTimeSlot && matchesStatus;
  });

  const todayScheduled = adSpots.filter(a => a.scheduledDate === '2024-02-08' && a.status === 'scheduled').length;
  const todayPlayed = adSpots.filter(a => a.scheduledDate === '2024-02-07' && a.status === 'played').length;
  const pendingApproval = adSpots.filter(a => a.status === 'pending').length;
  const totalImpressions = adSpots.filter(a => a.impressions).reduce((sum, a) => sum + (a.impressions || 0), 0);

  const selectedDaySchedule = weekSchedule.find(d => d.date === selectedDate);
  const fillRate = selectedDaySchedule ? (selectedDaySchedule.filledSlots / selectedDaySchedule.totalSlots * 100).toFixed(0) : 0;

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{todayScheduled}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yesterday Played</p>
                <p className="text-2xl font-bold text-green-600">{todayPlayed}</p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingApproval}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Impressions</p>
                <p className="text-2xl font-bold text-purple-600">{totalImpressions.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Week Overview */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Weekly Schedule Overview
          </h3>
          <div className="grid grid-cols-7 gap-3">
            {weekSchedule.map((day) => {
              const fillPercent = (day.filledSlots / day.totalSlots * 100);
              const isSelected = day.date === selectedDate;
              const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = new Date(day.date).getDate();

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{dayName}</p>
                  <p className="text-xs text-gray-600 mb-2">{dayNum}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Fill:</span>
                      <span className="font-semibold">{fillPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${fillPercent === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {day.filledSlots}/{day.totalSlots} slots
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <div className="flex gap-3 flex-1">
              <select
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value as TimeSlot | 'all')}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Time Slots</option>
                <option value="prime">Prime (6am-6pm)</option>
                <option value="subprime">Subprime (6pm-6am)</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as AdStatus | 'all')}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {selectedDaySchedule && (
                <span>
                  {selectedDaySchedule.filledSlots}/{selectedDaySchedule.totalSlots} spots filled ({fillRate}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ad Spots List */}
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">
              Schedule for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
          </div>
          <div className="divide-y">
            {filteredAds.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No ads scheduled for selected filters</p>
            ) : (
              filteredAds.map((ad) => {
                const StatusIcon = statusConfig[ad.status].icon;
                return (
                  <div key={ad.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <StatusIcon className={`w-5 h-5 ${
                            ad.status === 'played' ? 'text-green-600' :
                            ad.status === 'scheduled' ? 'text-blue-600' :
                            ad.status === 'pending' ? 'text-yellow-600' :
                            'text-red-600'
                          }`} />
                          <div>
                            <h4 className="font-semibold text-gray-900">{ad.adTitle}</h4>
                            <p className="text-sm text-gray-600">{ad.sponsorName} • {ad.sponsorTier} Tier</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 ml-8">
                          <div>
                            <p className="text-xs text-gray-500">Time Slot</p>
                            <p className="text-sm font-medium capitalize">{ad.timeSlot}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Scheduled Time</p>
                            <p className="text-sm font-medium">{ad.scheduledTime}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="text-sm font-medium">{ad.duration}s</p>
                          </div>
                          {ad.playedAt && (
                            <div>
                              <p className="text-xs text-gray-500">Played At</p>
                              <p className="text-sm font-medium text-green-600">{ad.playedAt}</p>
                            </div>
                          )}
                          {ad.impressions && (
                            <div>
                              <p className="text-xs text-gray-500">Impressions</p>
                              <p className="text-sm font-medium text-purple-600">{ad.impressions.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                        {ad.notes && (
                          <p className="text-xs text-gray-600 ml-8 mt-2 italic">{ad.notes}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${statusConfig[ad.status].color}`}>
                        {statusConfig[ad.status].label}
                      </span>
                    </div>
                  </div>
                );
              })
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
                <p><strong>Ad Duration:</strong> 15-second standard (Gold tier: 20s, Platinum: 30s)</p>
                <p><strong>Prime Hours:</strong> 6:00 AM - 6:00 PM (higher rates, better reach)</p>
                <p><strong>Subprime Hours:</strong> 6:00 PM - 6:00 AM (standard rates)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
