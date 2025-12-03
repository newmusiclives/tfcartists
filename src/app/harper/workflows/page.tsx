'use client';

import { useState } from 'react';
import { Send, Mail, Phone, Clock, GitBranch, Play, Pause, Plus, ChevronRight, Building2, Users, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type WorkflowStatus = 'active' | 'paused' | 'draft';
type StepType = 'email' | 'wait' | 'condition' | 'phone' | 'task';

interface WorkflowStep {
  type: StepType;
  title: string;
  description?: string;
  delay?: string;
  template?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: string;
  steps: WorkflowStep[];
  stats: {
    enrolled: number;
    active: number;
    completed: number;
    converted: number;
    conversionRate: number;
  };
}

const workflows: Workflow[] = [
  {
    id: "1",
    name: "Sponsor Discovery Sequence",
    description: "Automated outreach for newly discovered potential sponsors",
    status: "active",
    trigger: "When lead status changes to 'Discovered'",
    steps: [
      {
        type: "email",
        title: "Initial Introduction Email",
        description: "Personalized introduction to TrueFans RADIO",
        template: "Hi [Contact Name], I came across [Business Name] and was impressed by [specific detail]. I'd love to discuss how TrueFans RADIO can help you reach our engaged audience of music lovers and local supporters..."
      },
      {
        type: "wait",
        title: "Wait 3 Days",
        delay: "3 days"
      },
      {
        type: "condition",
        title: "Check Response",
        description: "Has the sponsor responded to the email?"
      },
      {
        type: "email",
        title: "Follow-up Email",
        description: "Gentle follow-up with additional value proposition",
        template: "Hi [Contact Name], I wanted to follow up on my previous email about advertising opportunities with TrueFans RADIO. I've attached some listener demographics that I think you'll find interesting..."
      },
      {
        type: "wait",
        title: "Wait 4 Days",
        delay: "4 days"
      },
      {
        type: "phone",
        title: "Phone Call Attempt",
        description: "Personal phone call to connect"
      },
      {
        type: "task",
        title: "Schedule Blake Review",
        description: "Blake manually reviews non-responsive leads"
      }
    ],
    stats: {
      enrolled: 45,
      active: 12,
      completed: 33,
      converted: 15,
      conversionRate: 45.5
    }
  },
  {
    id: "2",
    name: "Qualified Lead Nurture",
    description: "Build relationship with interested prospects",
    status: "active",
    trigger: "When lead status changes to 'Qualified'",
    steps: [
      {
        type: "email",
        title: "Send Package Information",
        description: "Detailed sponsorship package breakdown",
        template: "Hi [Contact Name], Thank you for your interest in TrueFans RADIO! I'm excited to share our sponsorship packages with you. We have three tiers designed to fit different business needs and budgets..."
      },
      {
        type: "wait",
        title: "Wait 2 Days",
        delay: "2 days"
      },
      {
        type: "email",
        title: "Share Success Stories",
        description: "Case studies from current sponsors",
        template: "I wanted to share some success stories from our current sponsors. Mountain Brew Coffee has seen a 35% increase in foot traffic since partnering with us..."
      },
      {
        type: "wait",
        title: "Wait 3 Days",
        delay: "3 days"
      },
      {
        type: "phone",
        title: "Discovery Call",
        description: "Scheduled call to discuss needs and answer questions"
      },
      {
        type: "task",
        title: "Prepare Custom Proposal",
        description: "Blake creates tailored sponsorship proposal"
      }
    ],
    stats: {
      enrolled: 28,
      active: 8,
      completed: 20,
      converted: 12,
      conversionRate: 60.0
    }
  },
  {
    id: "3",
    name: "Negotiation Support",
    description: "Guide prospects through decision-making process",
    status: "active",
    trigger: "When lead status changes to 'Negotiating'",
    steps: [
      {
        type: "email",
        title: "Send Formal Proposal",
        description: "Detailed proposal with pricing and terms",
        template: "Hi [Contact Name], Based on our conversation, I've prepared a customized proposal for [Business Name]. This includes [specific package details]..."
      },
      {
        type: "wait",
        title: "Wait 2 Days",
        delay: "2 days"
      },
      {
        type: "phone",
        title: "Check-in Call",
        description: "Answer questions and address concerns"
      },
      {
        type: "wait",
        title: "Wait 3 Days",
        delay: "3 days"
      },
      {
        type: "condition",
        title: "Check Decision Status",
        description: "Has sponsor made a decision?"
      },
      {
        type: "email",
        title: "Final Follow-up",
        description: "Last touchpoint before closing",
        template: "Hi [Contact Name], I wanted to check if you have any final questions about the proposal. We're excited about the possibility of partnering with [Business Name]..."
      },
      {
        type: "task",
        title: "Blake Personal Outreach",
        description: "Personal touch from Blake to close the deal"
      }
    ],
    stats: {
      enrolled: 15,
      active: 5,
      completed: 10,
      converted: 7,
      conversionRate: 70.0
    }
  },
  {
    id: "4",
    name: "Sponsor Onboarding",
    description: "Welcome new sponsors and set up their campaigns",
    status: "active",
    trigger: "When contract is signed",
    steps: [
      {
        type: "email",
        title: "Welcome Email",
        description: "Welcome new sponsor and next steps",
        template: "Welcome to TrueFans RADIO! We're thrilled to have [Business Name] as a sponsor. Here's what happens next..."
      },
      {
        type: "task",
        title: "Schedule Onboarding Call",
        description: "Cameron schedules kickoff call"
      },
      {
        type: "email",
        title: "Creative Brief Request",
        description: "Dakota requests ad creative details",
        template: "Hi [Contact Name], To create effective ads for [Business Name], we need some information about your messaging, brand voice, and any special offers..."
      },
      {
        type: "wait",
        title: "Wait 1 Day",
        delay: "1 day"
      },
      {
        type: "task",
        title: "Ad Creative Production",
        description: "Dakota produces ad content"
      },
      {
        type: "email",
        title: "Ad Approval Request",
        description: "Send ad for sponsor approval",
        template: "We've created your ad content! Please review and approve so we can begin your campaign..."
      },
      {
        type: "task",
        title: "Schedule First Ads",
        description: "Dakota schedules first ad placements"
      },
      {
        type: "email",
        title: "Campaign Launch Confirmation",
        description: "Confirm campaign is live",
        template: "Great news! Your ads are now live on TrueFans RADIO. You can expect to hear them during [time slots]..."
      }
    ],
    stats: {
      enrolled: 12,
      active: 3,
      completed: 9,
      converted: 9,
      conversionRate: 100.0
    }
  },
  {
    id: "5",
    name: "Sponsor Renewal Campaign",
    description: "Proactive renewal outreach for existing sponsors",
    status: "active",
    trigger: "60 days before contract end date",
    steps: [
      {
        type: "email",
        title: "Renewal Notice",
        description: "Initial heads-up about upcoming renewal",
        template: "Hi [Contact Name], I wanted to reach out as your sponsorship with TrueFans RADIO is coming up for renewal in 60 days. We've loved working with [Business Name]!"
      },
      {
        type: "wait",
        title: "Wait 14 Days",
        delay: "14 days"
      },
      {
        type: "email",
        title: "Performance Report",
        description: "Cameron sends detailed performance metrics",
        template: "Here's a summary of your sponsorship performance over the past year. Your ads have generated [metrics]..."
      },
      {
        type: "wait",
        title: "Wait 7 Days",
        delay: "7 days"
      },
      {
        type: "phone",
        title: "Renewal Discussion Call",
        description: "Cameron discusses renewal and potential upgrades"
      },
      {
        type: "email",
        title: "Renewal Proposal",
        description: "Send renewal terms and upgrade options",
        template: "Based on our conversation, I've prepared your renewal proposal. We've also included some upgrade options that might interest you..."
      },
      {
        type: "wait",
        title: "Wait 7 Days",
        delay: "7 days"
      },
      {
        type: "task",
        title: "Final Renewal Push",
        description: "Cameron makes final push to close renewal"
      }
    ],
    stats: {
      enrolled: 8,
      active: 4,
      completed: 4,
      converted: 3,
      conversionRate: 75.0
    }
  }
];

export default function HarperWorkflows() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const totalEnrolled = workflows.reduce((sum, w) => sum + w.stats.enrolled, 0);
  const totalActive = workflows.reduce((sum, w) => sum + w.stats.active, 0);
  const totalConverted = workflows.reduce((sum, w) => sum + w.stats.converted, 0);
  const avgConversionRate = workflows.reduce((sum, w) => sum + w.stats.conversionRate, 0) / workflows.length;

  const getStepIcon = (type: StepType) => {
    switch (type) {
      case 'email': return <Mail className="w-5 h-5 text-blue-600" />;
      case 'phone': return <Phone className="w-5 h-5 text-green-600" />;
      case 'wait': return <Clock className="w-5 h-5 text-gray-600" />;
      case 'condition': return <GitBranch className="w-5 h-5 text-purple-600" />;
      case 'task': return <CheckCircle className="w-5 h-5 text-orange-600" />;
    }
  };

  const getStatusColor = (status: WorkflowStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
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
                <h1 className="text-2xl font-bold text-gray-900">Automated Workflows</h1>
              </div>
              <p className="text-gray-600 mt-1">Blake Morrison - Sponsor Acquisition Automation</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/harper/outreach"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Send className="w-4 h-4" />
                <span>Back to Outreach</span>
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
                <p className="text-sm text-gray-600">Total Enrolled</p>
                <p className="text-2xl font-bold text-gray-900">{totalEnrolled}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Currently Active</p>
                <p className="text-2xl font-bold text-green-600">{totalActive}</p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Converted</p>
                <p className="text-2xl font-bold text-purple-600">{totalConverted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Conversion</p>
                <p className="text-2xl font-bold text-green-600">{avgConversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Workflows List */}
        <div className="space-y-6">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white border rounded-lg overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{workflow.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workflow.status)}`}>
                        {workflow.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{workflow.description}</p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Trigger:</span> {workflow.trigger}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedWorkflow(selectedWorkflow?.id === workflow.id ? null : workflow)}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    {selectedWorkflow?.id === workflow.id ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-5 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Enrolled</p>
                    <p className="text-lg font-bold text-gray-900">{workflow.stats.enrolled}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Active</p>
                    <p className="text-lg font-bold text-green-600">{workflow.stats.active}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Completed</p>
                    <p className="text-lg font-bold text-blue-600">{workflow.stats.completed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Converted</p>
                    <p className="text-lg font-bold text-purple-600">{workflow.stats.converted}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Conv. Rate</p>
                    <p className="text-lg font-bold text-green-600">{workflow.stats.conversionRate}%</p>
                  </div>
                </div>
              </div>

              {/* Workflow Steps (Expandable) */}
              {selectedWorkflow?.id === workflow.id && (
                <div className="p-6 bg-gray-50">
                  <h4 className="font-semibold text-gray-900 mb-4">Workflow Steps</h4>
                  <div className="space-y-4">
                    {workflow.steps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                            {getStepIcon(step.type)}
                          </div>
                          {index < workflow.steps.length - 1 && (
                            <div className="w-0.5 h-12 bg-gray-300 ml-5 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 bg-white p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-semibold text-gray-900">{step.title}</h5>
                            {step.delay && (
                              <span className="text-sm text-gray-500">{step.delay}</span>
                            )}
                          </div>
                          {step.description && (
                            <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                          )}
                          {step.template && (
                            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mt-2">
                              <p className="font-medium text-xs text-gray-500 mb-1">Email Template:</p>
                              <p className="italic">{step.template}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">How Automated Workflows Work</h4>
              <p className="text-blue-800 text-sm mb-2">
                These workflows automatically nurture sponsor leads through the entire acquisition journey. When a trigger condition is met (like a status change), the workflow enrolls the sponsor and executes each step in sequence.
              </p>
              <ul className="text-blue-800 text-sm space-y-1 ml-4 list-disc">
                <li><strong>Email steps</strong> send automated personalized emails</li>
                <li><strong>Wait steps</strong> add delays between actions</li>
                <li><strong>Phone steps</strong> create tasks for Blake to make calls</li>
                <li><strong>Condition steps</strong> branch based on sponsor behavior</li>
                <li><strong>Task steps</strong> assign manual work to team members</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
