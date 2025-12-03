'use client';

import { useState } from 'react';
import { DollarSign, CreditCard, FileText, TrendingUp, AlertCircle, CheckCircle, Clock, Download, Mail, ChevronRight, Building2, Users, Calendar, PieChart } from 'lucide-react';
import Link from 'next/link';

type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'scheduled';
type PaymentMethod = 'bank_transfer' | 'credit_card' | 'check';

interface Invoice {
  id: string;
  invoiceNumber: string;
  sponsorName: string;
  sponsorTier: string;
  amount: number;
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

interface RevenueDistribution {
  month: string;
  sponsorRevenue: number;
  artistPool: number;
  stationOperations: number;
}

const invoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001",
    sponsorName: "Cornerstone Insurance",
    sponsorTier: "Platinum",
    amount: 500,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    paidDate: "2024-02-03",
    status: "paid",
    paymentMethod: "bank_transfer",
    notes: "Paid early - excellent customer"
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-002",
    sponsorName: "Summit Outdoor Gear",
    sponsorTier: "Gold",
    amount: 400,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    paidDate: "2024-02-05",
    status: "paid",
    paymentMethod: "credit_card"
  },
  {
    id: "3",
    invoiceNumber: "INV-2024-003",
    sponsorName: "Maple Street Brewery",
    sponsorTier: "Gold",
    amount: 400,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    paidDate: "2024-02-06",
    status: "paid",
    paymentMethod: "bank_transfer"
  },
  {
    id: "4",
    invoiceNumber: "INV-2024-004",
    sponsorName: "Tech Solutions Pro",
    sponsorTier: "Gold",
    amount: 400,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    status: "pending",
    notes: "Payment expected this week"
  },
  {
    id: "5",
    invoiceNumber: "INV-2024-005",
    sponsorName: "Mountain Brew Coffee",
    sponsorTier: "Silver",
    amount: 200,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    paidDate: "2024-02-04",
    status: "paid",
    paymentMethod: "credit_card"
  },
  {
    id: "6",
    invoiceNumber: "INV-2024-006",
    sponsorName: "Heritage Bakery",
    sponsorTier: "Silver",
    amount: 200,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    paidDate: "2024-02-07",
    status: "paid",
    paymentMethod: "bank_transfer"
  },
  {
    id: "7",
    invoiceNumber: "INV-2024-007",
    sponsorName: "Downtown Auto Service",
    sponsorTier: "Silver",
    amount: 200,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    status: "pending"
  },
  {
    id: "8",
    invoiceNumber: "INV-2024-008",
    sponsorName: "Bright Smiles Dental",
    sponsorTier: "Silver",
    amount: 200,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    status: "pending"
  },
  {
    id: "9",
    invoiceNumber: "INV-2024-009",
    sponsorName: "Green Mountain Distillery",
    sponsorTier: "Bronze",
    amount: 100,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    paidDate: "2024-02-02",
    status: "paid",
    paymentMethod: "credit_card"
  },
  {
    id: "10",
    invoiceNumber: "INV-2024-010",
    sponsorName: "Riverside Yoga Studio",
    sponsorTier: "Bronze",
    amount: 100,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    status: "pending"
  },
  {
    id: "11",
    invoiceNumber: "INV-2024-011",
    sponsorName: "Wildflower Florist",
    sponsorTier: "Bronze",
    amount: 100,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    paidDate: "2024-02-05",
    status: "paid",
    paymentMethod: "check"
  },
  {
    id: "12",
    invoiceNumber: "INV-2024-012",
    sponsorName: "Artisan Pizza Co",
    sponsorTier: "Bronze",
    amount: 100,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    status: "pending"
  },
  {
    id: "13",
    invoiceNumber: "INV-2024-013",
    sponsorName: "Urban Threads Boutique",
    sponsorTier: "Bronze",
    amount: 100,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    status: "pending"
  },
  {
    id: "14",
    invoiceNumber: "INV-2024-014",
    sponsorName: "Peak Performance Gym",
    sponsorTier: "Silver",
    amount: 0,
    billingPeriod: "February 2024",
    issueDate: "2024-02-01",
    dueDate: "2024-02-15",
    status: "scheduled",
    notes: "Account paused - resumes March"
  }
];

const revenueHistory: RevenueDistribution[] = [
  {
    month: "January 2024",
    sponsorRevenue: 2800,
    artistPool: 2240,
    stationOperations: 560
  },
  {
    month: "December 2023",
    sponsorRevenue: 2600,
    artistPool: 2080,
    stationOperations: 520
  },
  {
    month: "November 2023",
    sponsorRevenue: 2400,
    artistPool: 1920,
    stationOperations: 480
  },
  {
    month: "October 2023",
    sponsorRevenue: 2200,
    artistPool: 1760,
    stationOperations: 440
  },
  {
    month: "September 2023",
    sponsorRevenue: 2000,
    artistPool: 1600,
    stationOperations: 400
  },
  {
    month: "August 2023",
    sponsorRevenue: 1800,
    artistPool: 1440,
    stationOperations: 360
  }
];

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: any }> = {
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Calendar }
};

export default function BillingDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'invoices' | 'revenue'>('invoices');

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
    return matchesStatus;
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const totalPending = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

  const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced * 100).toFixed(1) : '0.0';

  // Calculate this month's distribution
  const thisMonthRevenue = totalPaid;
  const artistPoolAmount = thisMonthRevenue * 0.80;
  const stationOpsAmount = thisMonthRevenue * 0.20;

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
                <h1 className="text-2xl font-bold text-gray-900">Billing & Revenue</h1>
              </div>
              <p className="text-gray-600 mt-1">Riley Nguyen - Billing & Revenue Operations</p>
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
                <p className="text-sm text-gray-600">Total Invoiced</p>
                <p className="text-2xl font-bold text-gray-900">${totalInvoiced.toLocaleString()}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">${totalPending.toLocaleString()}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold text-purple-600">{collectionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border rounded-lg mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'invoices'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Invoices ({invoices.length})
              </button>
              <button
                onClick={() => setActiveTab('revenue')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'revenue'
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Revenue Distribution
              </button>
            </div>
          </div>

          {activeTab === 'invoices' && (
            <>
              {/* Filters */}
              <div className="p-4 border-b">
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as InvoiceStatus | 'all')}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Status</option>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Invoices List */}
              <div className="divide-y">
                {filteredInvoices.map((invoice) => {
                  const StatusIcon = statusConfig[invoice.status].icon;
                  return (
                    <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <StatusIcon className={`w-5 h-5 ${
                              invoice.status === 'paid' ? 'text-green-600' :
                              invoice.status === 'pending' ? 'text-yellow-600' :
                              invoice.status === 'overdue' ? 'text-red-600' :
                              'text-blue-600'
                            }`} />
                            <div>
                              <h4 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h4>
                              <p className="text-sm text-gray-600">{invoice.sponsorName} • {invoice.sponsorTier} Tier</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 ml-8">
                            <div>
                              <p className="text-xs text-gray-500">Amount</p>
                              <p className="text-sm font-semibold text-green-600">${invoice.amount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Billing Period</p>
                              <p className="text-sm font-medium">{invoice.billingPeriod}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Due Date</p>
                              <p className="text-sm font-medium">{invoice.dueDate}</p>
                            </div>
                            {invoice.paidDate && (
                              <div>
                                <p className="text-xs text-gray-500">Paid Date</p>
                                <p className="text-sm font-medium text-green-600">{invoice.paidDate}</p>
                              </div>
                            )}
                            {invoice.paymentMethod && (
                              <div>
                                <p className="text-xs text-gray-500">Payment Method</p>
                                <p className="text-sm font-medium capitalize">{invoice.paymentMethod.replace('_', ' ')}</p>
                              </div>
                            )}
                          </div>
                          {invoice.notes && (
                            <p className="text-xs text-gray-600 ml-8 mt-2 italic">{invoice.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2 ml-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${statusConfig[invoice.status].color}`}>
                            {statusConfig[invoice.status].label}
                          </span>
                          <div className="flex space-x-2">
                            <button className="p-2 text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50">
                              <Mail className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'revenue' && (
            <div className="p-6">
              {/* Current Month Distribution */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  February 2024 Revenue Distribution
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-green-900">Total Sponsor Revenue</h4>
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">${thisMonthRevenue.toLocaleString()}</p>
                    <p className="text-sm text-green-700 mt-2">From paid invoices</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-900">Artist Pool (80%)</h4>
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-purple-600">${artistPoolAmount.toLocaleString()}</p>
                    <p className="text-sm text-purple-700 mt-2">Distributed to artists</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">Station Operations (20%)</h4>
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-600">${stationOpsAmount.toLocaleString()}</p>
                    <p className="text-sm text-blue-700 mt-2">Operations & overhead</p>
                  </div>
                </div>
              </div>

              {/* Historical Revenue */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Revenue History</h3>
                <div className="space-y-3">
                  {revenueHistory.map((record, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:border-green-500 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{record.month}</h4>
                        <span className="text-lg font-bold text-green-600">${record.sponsorRevenue.toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Artist Pool (80%)</p>
                          <p className="text-sm font-semibold text-purple-600">${record.artistPool.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Station Operations (20%)</p>
                          <p className="text-sm font-semibold text-blue-600">${record.stationOperations.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div className="flex h-full">
                            <div className="bg-purple-600 h-full" style={{ width: '80%' }}></div>
                            <div className="bg-blue-600 h-full" style={{ width: '20%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <CreditCard className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 mb-2">Revenue Distribution Model</h4>
              <div className="text-green-800 text-sm space-y-1">
                <p><strong>80% to Artist Pool:</strong> Distributed monthly based on airplay shares</p>
                <p><strong>20% to Station Operations:</strong> Covers hosting, bandwidth, team operations, and overhead</p>
                <p><strong>Payment Processing:</strong> Managed through Manifest Financial</p>
                <p><strong>Billing Cycle:</strong> Monthly invoices issued on 1st, due on 15th</p>
                <p><strong>Accepted Methods:</strong> Bank transfer (ACH), Credit card, Check</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
