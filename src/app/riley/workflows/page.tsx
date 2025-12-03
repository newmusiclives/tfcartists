"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  Send,
  Clock,
  CheckCircle,
  Mail,
  MessageCircle,
  Calendar,
  TrendingUp,
  Settings,
  Plus,
  Zap,
  Users,
} from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "draft";
  trigger: string;
  steps: WorkflowStep[];
  stats: {
    enrolled: number;
    completed: number;
    conversionRate: number;
  };
}

interface WorkflowStep {
  id: string;
  type: "email" | "wait" | "condition" | "action";
  title: string;
  description: string;
  delay?: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: "1",
      name: "Artist Discovery Sequence",
      description: "Automated outreach for newly discovered artists",
      status: "active",
      trigger: "Artist added to 'Discovered' stage",
      steps: [
        {
          id: "1",
          type: "email",
          title: "Initial Outreach Email",
          description: "Introduction to TrueFans RADIO and FREE airplay opportunity",
        },
        {
          id: "2",
          type: "wait",
          title: "Wait 3 Days",
          description: "Give artist time to respond",
          delay: "3 days",
        },
        {
          id: "3",
          type: "condition",
          title: "Check Response",
          description: "Did artist respond to initial email?",
        },
        {
          id: "4",
          type: "email",
          title: "Follow-up Email",
          description: "Friendly reminder about the opportunity",
        },
        {
          id: "5",
          type: "wait",
          title: "Wait 5 Days",
          description: "Final wait period",
          delay: "5 days",
        },
        {
          id: "6",
          type: "email",
          title: "Last Chance Email",
          description: "Final outreach with urgency",
        },
      ],
      stats: {
        enrolled: 23,
        completed: 12,
        conversionRate: 52,
      },
    },
    {
      id: "2",
      name: "Track Submission Invitation",
      description: "Send track submission invite to interested artists",
      status: "active",
      trigger: "Artist status changes to 'Responded'",
      steps: [
        {
          id: "1",
          type: "email",
          title: "Track Submission Invite",
          description: "Instructions and link to submit first track",
        },
        {
          id: "2",
          type: "wait",
          title: "Wait 7 Days",
          description: "Give artist time to submit",
          delay: "7 days",
        },
        {
          id: "3",
          type: "condition",
          title: "Check Submission",
          description: "Did artist submit a track?",
        },
        {
          id: "4",
          type: "email",
          title: "Submission Reminder",
          description: "Gentle reminder to submit track",
        },
      ],
      stats: {
        enrolled: 12,
        completed: 8,
        conversionRate: 67,
      },
    },
    {
      id: "3",
      name: "Tier Upgrade Nurture",
      description: "Encourage FREE tier artists to upgrade",
      status: "active",
      trigger: "Artist on FREE tier for 30 days with good performance",
      steps: [
        {
          id: "1",
          type: "email",
          title: "Performance Update",
          description: "Show artist their play stats and engagement",
        },
        {
          id: "2",
          type: "wait",
          title: "Wait 3 Days",
          description: "Let them review their stats",
          delay: "3 days",
        },
        {
          id: "3",
          type: "email",
          title: "Upgrade Benefits",
          description: "Explain BRONZE tier benefits and ROI",
        },
        {
          id: "4",
          type: "wait",
          title: "Wait 5 Days",
          description: "Decision time",
          delay: "5 days",
        },
        {
          id: "5",
          type: "email",
          title: "Limited Time Offer",
          description: "Special promotion or incentive",
        },
      ],
      stats: {
        enrolled: 15,
        completed: 5,
        conversionRate: 33,
      },
    },
    {
      id: "4",
      name: "Welcome & Onboarding",
      description: "Welcome new activated artists to the station",
      status: "active",
      trigger: "Artist track approved and account activated",
      steps: [
        {
          id: "1",
          type: "email",
          title: "Welcome Email",
          description: "Congratulations! You're on the radio",
        },
        {
          id: "2",
          type: "wait",
          title: "Wait 1 Day",
          description: "Let first plays happen",
          delay: "1 day",
        },
        {
          id: "3",
          type: "email",
          title: "First Play Update",
          description: "Share their first play stats",
        },
        {
          id: "4",
          type: "wait",
          title: "Wait 7 Days",
          description: "First week on air",
          delay: "7 days",
        },
        {
          id: "5",
          type: "email",
          title: "Week 1 Performance",
          description: "Weekly performance report",
        },
      ],
      stats: {
        enrolled: 8,
        completed: 4,
        conversionRate: 100,
      },
    },
    {
      id: "5",
      name: "Re-engagement Campaign",
      description: "Win back artists who didn't respond",
      status: "paused",
      trigger: "Artist in 'Contacted' stage for 14+ days with no response",
      steps: [
        {
          id: "1",
          type: "email",
          title: "Re-engagement Email",
          description: "Different angle or new benefit",
        },
        {
          id: "2",
          type: "wait",
          title: "Wait 3 Days",
          description: "Give time to respond",
          delay: "3 days",
        },
        {
          id: "3",
          type: "condition",
          title: "Check Response",
          description: "Did artist respond?",
        },
        {
          id: "4",
          type: "action",
          title: "Mark as Not Interested",
          description: "Move to archive if no response",
        },
      ],
      stats: {
        enrolled: 8,
        completed: 2,
        conversionRate: 25,
      },
    },
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const totalStats = {
    activeWorkflows: workflows.filter(w => w.status === "active").length,
    totalEnrolled: workflows.reduce((sum, w) => sum + w.stats.enrolled, 0),
    totalCompleted: workflows.reduce((sum, w) => sum + w.stats.completed, 0),
    avgConversion: Math.round(
      workflows.reduce((sum, w) => sum + w.stats.conversionRate, 0) / workflows.length
    ),
  };

  const toggleWorkflowStatus = (id: string) => {
    setWorkflows(workflows.map(w => {
      if (w.id === id) {
        return {
          ...w,
          status: w.status === "active" ? "paused" : "active"
        };
      }
      return w;
    }));
  };

  const getStepIcon = (type: WorkflowStep["type"]) => {
    const icons = {
      email: <Mail className="w-5 h-5" />,
      wait: <Clock className="w-5 h-5" />,
      condition: <MessageCircle className="w-5 h-5" />,
      action: <Zap className="w-5 h-5" />,
    };
    return icons[type];
  };

  const getStepColor = (type: WorkflowStep["type"]) => {
    const colors = {
      email: "bg-blue-100 text-blue-600",
      wait: "bg-gray-100 text-gray-600",
      condition: "bg-yellow-100 text-yellow-600",
      action: "bg-purple-100 text-purple-600",
    };
    return colors[type];
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/riley/outreach" className="text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Automated Workflows</h1>
                <p className="text-sm text-gray-600">Grace Holland's outreach automation</p>
              </div>
            </div>
            <button className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Create Workflow</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Zap className="w-6 h-6 text-purple-600" />}
            label="Active Workflows"
            value={totalStats.activeWorkflows}
            color="purple"
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-blue-600" />}
            label="Artists Enrolled"
            value={totalStats.totalEnrolled}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            label="Completed"
            value={totalStats.totalCompleted}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
            label="Avg Conversion"
            value={`${totalStats.avgConversion}%`}
            color="orange"
          />
        </div>

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white rounded-xl shadow-lg border-2 border-transparent hover:border-purple-300 transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{workflow.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          workflow.status === "active"
                            ? "bg-green-100 text-green-700"
                            : workflow.status === "paused"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {workflow.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
                      <Zap className="w-3 h-3" />
                      <span>Trigger: {workflow.trigger}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWorkflowStatus(workflow.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      workflow.status === "active"
                        ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                        : "bg-green-100 text-green-600 hover:bg-green-200"
                    }`}
                  >
                    {workflow.status === "active" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{workflow.stats.enrolled}</div>
                    <div className="text-xs text-gray-600">Enrolled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{workflow.stats.completed}</div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{workflow.stats.conversionRate}%</div>
                    <div className="text-xs text-gray-600">Conversion</div>
                  </div>
                </div>

                {/* Steps Preview */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">{workflow.steps.length} Steps</div>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                    {workflow.steps.map((step, idx) => (
                      <div key={step.id} className="flex items-center">
                        <div className={`flex-shrink-0 p-2 rounded-lg ${getStepColor(step.type)}`}>
                          {getStepIcon(step.type)}
                        </div>
                        {idx < workflow.steps.length - 1 && (
                          <div className="w-4 h-0.5 bg-gray-300 mx-1"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedWorkflow(workflow)}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">How Automated Workflows Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full mb-3">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Trigger</h4>
              <p className="text-sm text-gray-600">Workflow starts automatically when condition is met</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Send Emails</h4>
              <p className="text-sm text-gray-600">Personalized emails sent at perfect timing</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Wait & Check</h4>
              <p className="text-sm text-gray-600">Smart delays and condition checks</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Convert</h4>
              <p className="text-sm text-gray-600">Artist moves to next pipeline stage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Detail Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedWorkflow(null)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-6 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedWorkflow.name}</h2>
                  <p className="text-gray-600">{selectedWorkflow.description}</p>
                </div>
                <button onClick={() => setSelectedWorkflow(null)} className="text-gray-400 hover:text-gray-600">
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Trigger */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Workflow Trigger</h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-900">{selectedWorkflow.trigger}</span>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Workflow Steps</h3>
                <div className="space-y-4">
                  {selectedWorkflow.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full ${getStepColor(step.type)} flex items-center justify-center`}>
                          {getStepIcon(step.type)}
                        </div>
                        {idx < selectedWorkflow.steps.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-300 ml-5 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="font-semibold text-gray-900">{step.title}</div>
                        <div className="text-sm text-gray-600">{step.description}</div>
                        {step.delay && (
                          <div className="inline-flex items-center space-x-1 text-xs text-gray-500 mt-1 bg-gray-100 px-2 py-1 rounded">
                            <Clock className="w-3 h-3" />
                            <span>Delay: {step.delay}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: "bg-purple-50",
    blue: "bg-blue-50",
    green: "bg-green-50",
    orange: "bg-orange-50",
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-6`}>
      <div className="flex items-center space-x-3 mb-2">
        {icon}
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
