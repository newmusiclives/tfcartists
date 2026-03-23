"use client";

import { useState, useEffect } from "react";
import { SharedNav } from "@/components/shared-nav";
import { FileText, Rocket, Map, BookOpen, Code2 } from "lucide-react";

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"demo" | "roadmap" | "localhost" | "api">("localhost");

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SharedNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TrueFans RADIO™ Documentation</h1>
          <p className="text-gray-600 text-lg">Complete guides for understanding and completing the system</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b">
            <div className="flex space-x-1 p-2">
              <button
                onClick={() => setActiveTab("localhost")}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "localhost"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span>Live Demo Guide</span>
              </button>
              <button
                onClick={() => setActiveTab("demo")}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "demo"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Complete System Demo</span>
              </button>
              <button
                onClick={() => setActiveTab("roadmap")}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "roadmap"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Map className="w-5 h-5" />
                <span>Implementation Roadmap</span>
              </button>
              <button
                onClick={() => setActiveTab("api")}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === "api"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Code2 className="w-5 h-5" />
                <span>API Reference</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === "localhost" && <LocalhostGuide />}
            {activeTab === "demo" && <CompleteDemo />}
            {activeTab === "roadmap" && <Roadmap />}
            {activeTab === "api" && <ApiReference />}
          </div>
        </div>
      </div>
    </main>
  );
}

function LocalhostGuide() {
  return (
    <div className="prose prose-lg max-w-none">
      <h2 className="text-3xl font-bold mb-6">Live Demo Guide - What Works RIGHT NOW</h2>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
        <p className="font-semibold text-blue-900 mb-2">Welcome to TrueFans RADIO</p>
        <p className="text-blue-800">This guide shows you exactly what you can click through and explore on the live site.</p>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">Team Dashboards</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
          <h4 className="font-bold text-purple-900 mb-2">Riley (Artist Team)</h4>
          <p className="text-sm text-gray-700 mb-2">Artist acquisition and pipeline management</p>
          <a href="/riley" className="text-purple-600 hover:text-purple-700 text-sm font-medium">→ Go to Riley Dashboard</a>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <h4 className="font-bold text-green-900 mb-2">Harper (Sponsor Team)</h4>
          <p className="text-sm text-gray-700 mb-2">Sponsor outreach and deal management</p>
          <a href="/harper" className="text-green-600 hover:text-green-700 text-sm font-medium">→ Go to Harper Dashboard</a>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
          <h4 className="font-bold text-orange-900 mb-2">Admin Dashboard</h4>
          <p className="text-sm text-gray-700 mb-2">System-wide overview and settings</p>
          <a href="/admin" className="text-orange-600 hover:text-orange-700 text-sm font-medium">→ Go to Admin Dashboard</a>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">Riley's Team Demo (Artist Acquisition)</h3>

      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-xl font-bold mb-3">1. Riley Dashboard</h4>
          <p className="text-gray-600 mb-3"><strong>URL:</strong> <a href="/riley" className="text-purple-600 hover:underline">/riley</a></p>
          <div className="bg-gray-50 rounded p-4 mb-3">
            <p className="font-semibold mb-2">What You'll See:</p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Total artists count</li>
              <li>Artists by stage (discovered, contacted, engaged, etc.)</li>
              <li>Recent activity feed</li>
              <li>Performance metrics</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 italic">"This is Riley's command center for managing hundreds of artists."</p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-xl font-bold mb-3">2. Artist Pipeline</h4>
          <p className="text-gray-600 mb-3"><strong>URL:</strong> <a href="/riley/pipeline" className="text-purple-600 hover:underline">/riley/pipeline</a></p>
          <div className="bg-gray-50 rounded p-4 mb-3">
            <p className="font-semibold mb-2">7-Stage Kanban Board:</p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>DISCOVERED → CONTACTED → ENGAGED → QUALIFIED</li>
              <li>ONBOARDING → ACTIVATED → ACTIVE</li>
              <li>Drag and drop between stages</li>
              <li>Filter by genre, priority</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 italic">"Riley can see at a glance who needs follow-up and who's crushing it."</p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-xl font-bold mb-3">3. Pool Calculator</h4>
          <p className="text-gray-600 mb-3"><strong>URL:</strong> <a href="/riley/pool-calculator" className="text-purple-600 hover:underline">/riley/pool-calculator</a></p>
          <div className="bg-gray-50 rounded p-4 mb-3">
            <p className="font-semibold mb-2">The Magic Formula:</p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Sponsors pay for ads → 80% to artist pool</li>
              <li>$22,250 sponsor revenue = $17,800 to artists</li>
              <li>Artists get shares based on tier</li>
              <li>TIER_20 artist: 25 shares × $2.50 = $62.50/month</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 italic">"See exactly how sponsor money flows to artists."</p>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">Harper's Team Demo (Sponsor Acquisition)</h3>

      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-xl font-bold mb-3">1. Harper Dashboard</h4>
          <p className="text-gray-600 mb-3"><strong>URL:</strong> <a href="/harper" className="text-purple-600 hover:underline">/harper</a></p>
          <div className="bg-gray-50 rounded p-4 mb-3">
            <p className="font-semibold mb-2">Key Metrics:</p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Monthly Recurring Revenue (MRR): $22,250</li>
              <li>125 active sponsors</li>
              <li>Revenue by tier breakdown</li>
              <li>Pipeline conversion stats</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 italic">"Harper funds the artist pool through local business sponsorships."</p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-xl font-bold mb-3">2. Sponsor List</h4>
          <p className="text-gray-600 mb-3"><strong>URL:</strong> <a href="/harper/sponsors" className="text-purple-600 hover:underline">/harper/sponsors</a></p>
          <div className="bg-gray-50 rounded p-4 mb-3">
            <p className="font-semibold mb-2">Sponsorship Tiers:</p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Bronze: $100/mo - 10 ad spots</li>
              <li>Silver: $250/mo - 20 ad spots + social features</li>
              <li>Gold: $400/mo - 40 ad spots + show segments</li>
              <li>Platinum: $500/mo - 60 ad spots + VIP access</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 italic">"Track 1,000+ local businesses and their contracts."</p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-xl font-bold mb-3">3. Billing Dashboard</h4>
          <p className="text-gray-600 mb-3"><strong>URL:</strong> <a href="/harper/billing" className="text-purple-600 hover:underline">/harper/billing</a></p>
          <div className="bg-gray-50 rounded p-4 mb-3">
            <p className="font-semibold mb-2">Revenue Tracking:</p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>MRR trend charts</li>
              <li>Churn rate: 10%</li>
              <li>Expansion revenue (upgrades): $3,400/mo</li>
              <li>Revenue forecasting</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 italic">"This is a subscription business, track every dollar."</p>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">Station & Network Pages</h3>

      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-xl font-bold mb-3">Capacity Calculator</h4>
          <p className="text-gray-600 mb-3"><strong>URL:</strong> <a href="/capacity" className="text-purple-600 hover:underline">/capacity</a></p>
          <div className="bg-gray-50 rounded p-4 mb-3">
            <p className="font-semibold mb-2">Physical Constraints:</p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>12 tracks per hour × 24 hours = 288 tracks/day</li>
              <li>8,640 tracks per month capacity</li>
              <li>Can support 864 FREE artists OR 861 paid mix</li>
              <li>Revenue scenarios: $200,000/mo potential</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600 italic">"The math behind why we can only support ~850 artists."</p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-xl font-bold mb-3">DJ Schedule</h4>
          <p className="text-gray-600 mb-3"><strong>URL:</strong> <a href="/schedule" className="text-purple-600 hover:underline">/schedule</a></p>
          <p className="text-sm text-gray-600">Weekly programming with AI DJ personalities: Hank Westwood (morning), Loretta Merrick (midday), Doc Holloway (afternoon), Cody Rampart (drive time).</p>
        </div>
      </div>

      <div className="bg-green-50 border-l-4 border-green-500 p-6 mt-8">
        <h4 className="font-bold text-green-900 mb-2">Quick 5-Minute Tour</h4>
        <ol className="list-decimal ml-6 space-y-2 text-green-800">
          <li>Log in with your team credentials</li>
          <li>Check the pipeline at <a href="/riley/pipeline" className="text-green-700 underline">/riley/pipeline</a></li>
          <li>View pool calculator at <a href="/riley/pool-calculator" className="text-green-700 underline">/riley/pool-calculator</a></li>
          <li>Browse sponsors at <a href="/harper/sponsors" className="text-green-700 underline">/harper/sponsors</a></li>
          <li>Check capacity at <a href="/capacity" className="text-green-700 underline">/capacity</a></li>
          <li>View the DJ schedule at <a href="/schedule" className="text-green-700 underline">/schedule</a></li>
        </ol>
      </div>
    </div>
  );
}

function CompleteDemo() {
  return (
    <div className="prose prose-lg max-w-none">
      <h2 className="text-3xl font-bold mb-6">Complete System Demo</h2>

      <p className="text-xl text-gray-600 mb-8">
        Deep dive into how Riley's team and Harper's team work, with examples, workflows, and technical details.
      </p>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
        <p className="font-semibold text-blue-900">Status: Production-Ready Foundation</p>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">What's Built ✅</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <h4 className="font-bold text-green-900 mb-3">Complete</h4>
          <ul className="space-y-2 text-sm text-green-800">
            <li>✅ Database schema (30 models)</li>
            <li>✅ Riley team pages & APIs</li>
            <li>✅ Harper team pages (UI only)</li>
            <li>✅ AI personalities defined</li>
            <li>✅ Revenue distribution logic</li>
            <li>✅ 38 working dashboard pages</li>
          </ul>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
          <h4 className="font-bold text-orange-900 mb-3">Missing</h4>
          <ul className="space-y-2 text-sm text-orange-800">
            <li>⚠️ Harper backend APIs</li>
            <li>⚠️ External API integrations</li>
            <li>⚠️ Payment processing (Manifest Financial)</li>
            <li>⚠️ Discovery engines</li>
            <li>⚠️ Automated workflows</li>
          </ul>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">Riley's Team - Artist Acquisition</h3>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h4 className="text-xl font-bold mb-3">Mission</h4>
        <p className="text-gray-700 mb-4">
          Build a network of 800+ performing artists who use the TrueFans 9-word line at live shows
          to drive listener donations.
        </p>

        <h5 className="font-bold text-lg mb-3">The 7-Stage Artist Journey</h5>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-sm font-mono overflow-x-auto">
            <span className="bg-gray-100 px-3 py-1 rounded">DISCOVERY</span>
            <span>→</span>
            <span className="bg-blue-100 px-3 py-1 rounded">CONTACTED</span>
            <span>→</span>
            <span className="bg-indigo-100 px-3 py-1 rounded">ENGAGED</span>
            <span>→</span>
            <span className="bg-purple-100 px-3 py-1 rounded">QUALIFIED</span>
            <span>→</span>
            <span className="bg-yellow-100 px-3 py-1 rounded">ONBOARDING</span>
            <span>→</span>
            <span className="bg-green-100 px-3 py-1 rounded">ACTIVATED</span>
            <span>→</span>
            <span className="bg-emerald-100 px-3 py-1 rounded">ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h4 className="text-xl font-bold mb-3">Example: Riley's AI Conversation</h4>
        <div className="space-y-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-semibold mb-1">RILEY (Initial Outreach)</p>
            <p className="text-gray-800">"Hey Sarah! 👋 Saw your set at The Echo last week — loved your vibe. Quick q: do you play live shows regularly?"</p>
          </div>

          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-semibold mb-1">ARTIST</p>
            <p className="text-gray-800">"Yeah I play 2-3 shows a month!"</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-semibold mb-1">RILEY (Educate Product)</p>
            <p className="text-gray-800">"Perfect! Quick intro: TrueFans gets you played on our radio station AND helps you make money at shows. Your fans text to donate during your set. Would a 5-min call make sense?"</p>
          </div>

          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-semibold mb-1">ARTIST</p>
            <p className="text-gray-800">"Sure, how does the donation thing work?"</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-semibold mb-1">RILEY (Book Show)</p>
            <p className="text-gray-800">"You say 9 words on stage: 'Go To True Fans CONNECT dot com Right Now!' Boom — fans donate $5-$100, you get 80% same night. Want to try it at your next show?"</p>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">Harper's Team - Sponsor Acquisition</h3>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h4 className="text-xl font-bold mb-3">Mission</h4>
        <p className="text-gray-700 mb-4">
          Build a network of 1,000+ local business sponsors funding the artist revenue pool through radio advertising.
        </p>

        <h5 className="font-bold text-lg mb-3">Sponsorship Packages</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
            <h6 className="font-bold text-orange-900 mb-2">Bronze - $100/month</h6>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>✅ 10 radio ad spots (15-sec)</li>
              <li>✅ Station website listing</li>
              <li>✅ Artist Pool announcements</li>
              <li>✅ Monthly performance report</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
            <h6 className="font-bold text-gray-900 mb-2">Silver - $250/month</h6>
            <ul className="text-sm text-gray-800 space-y-1">
              <li>✅ Everything in Bronze</li>
              <li>✅ 20 ad spots (2x)</li>
              <li>✅ Instagram features (2/month)</li>
              <li>✅ Event promotion</li>
            </ul>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300">
            <h6 className="font-bold text-yellow-900 mb-2">Gold - $400/month</h6>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>✅ Everything in Silver</li>
              <li>✅ 40 ad spots (4x)</li>
              <li>✅ Weekly Instagram features</li>
              <li>✅ Dedicated show segment</li>
            </ul>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-300">
            <h6 className="font-bold text-purple-900 mb-2">Platinum - $500/month</h6>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>✅ Everything in Gold</li>
              <li>✅ 60 ad spots (6x)</li>
              <li>✅ Daily social presence</li>
              <li>✅ Show title sponsorship</li>
            </ul>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">The Revenue Flywheel</h3>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
        <div className="text-center space-y-3">
          <div className="font-mono text-sm">
            <span className="bg-green-100 px-3 py-1 rounded">Harper's Sponsors</span>
            <span className="mx-2">→</span>
            <span className="bg-blue-100 px-3 py-1 rounded">Pay for Ads</span>
            <span className="mx-2">→</span>
            <span className="bg-purple-100 px-3 py-1 rounded">80% to Artist Pool</span>
          </div>
          <div className="font-mono text-sm">
            <span className="bg-purple-100 px-3 py-1 rounded">Riley's Artists</span>
            <span className="mx-2">→</span>
            <span className="bg-yellow-100 px-3 py-1 rounded">Perform with 9-Word Line</span>
            <span className="mx-2">→</span>
            <span className="bg-orange-100 px-3 py-1 rounded">Elliot's Listeners</span>
          </div>
          <div className="font-mono text-sm">
            <span className="bg-orange-100 px-3 py-1 rounded">Donate to Artists</span>
            <span className="mx-2">→</span>
            <span className="bg-green-100 px-3 py-1 rounded">More Artists Join</span>
            <span className="mx-2">→</span>
            <span className="bg-blue-100 px-3 py-1 rounded">More Sponsor Value</span>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">Monthly Revenue at Scale</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-3xl font-bold text-green-600 mb-2">$186,000</div>
          <div className="text-sm text-gray-600">Sponsor Revenue</div>
          <div className="text-xs text-gray-500 mt-1">1,093 sponsors</div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="text-3xl font-bold text-purple-600 mb-2">$148,800</div>
          <div className="text-sm text-gray-600">To Artist Pool (80%)</div>
          <div className="text-xs text-gray-500 mt-1">861 artists</div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600 mb-2">$37,200</div>
          <div className="text-sm text-gray-600">Station Operations (20%)</div>
          <div className="text-xs text-gray-500 mt-1">Profit margin</div>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
        <h4 className="font-bold text-yellow-900 mb-2">Bottom Line</h4>
        <p className="text-yellow-800">
          You have a production-ready foundation. The core business logic is built. About 4 weeks of focused work
          to connect external services (Twilio, Manifest Financial, APIs) and you're fully operational at $200K/month potential.
        </p>
      </div>
    </div>
  );
}

function Roadmap() {
  return (
    <div className="prose prose-lg max-w-none">
      <h2 className="text-3xl font-bold mb-6">Implementation Roadmap</h2>

      <p className="text-xl text-gray-600 mb-8">
        Remaining work to reach full production readiness.
      </p>

      <div className="bg-purple-50 border-l-4 border-purple-500 p-6 mb-8">
        <h4 className="font-bold text-purple-900 mb-2">Current Status</h4>
        <ul className="mt-2 space-y-1 text-sm text-purple-800">
          <li>✅ Database schema (30+ models)</li>
          <li>✅ Riley &amp; Harper team pages &amp; APIs</li>
          <li>✅ 24/7 radio streaming (Railway backend)</li>
          <li>✅ AI DJ personalities &amp; voice tracks</li>
          <li>✅ Clock templates &amp; schedule system</li>
          <li>⚠️ Remaining: External API integrations</li>
          <li>⚠️ Remaining: Payment processing</li>
        </ul>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">Phase 1: Make It Work (4 Weeks)</h3>

      <div className="space-y-4 mb-8">
        <div className="bg-white border-l-4 border-red-500 rounded-lg p-6">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-xl font-bold text-gray-900">Week 1: Infrastructure</h4>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">CRITICAL</span>
          </div>
          <p className="text-gray-600 mb-3"><strong>Time:</strong> 8-10 hours</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>□ Configure PostgreSQL database (Neon free tier)</li>
            <li>□ Deploy to Netlify</li>
            <li>□ Generate NEXTAUTH_SECRET: <code className="bg-gray-100 px-2 py-1 rounded">openssl rand -base64 32</code></li>
            <li>□ Run database migration</li>
          </ul>
          <div className="mt-3 text-sm font-semibold text-green-600">Success: Site live at https://yourdomain.com ✅</div>
        </div>

        <div className="bg-white border-l-4 border-red-500 rounded-lg p-6">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-xl font-bold text-gray-900">Week 2: Harper Backend APIs</h4>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">CRITICAL</span>
          </div>
          <p className="text-gray-600 mb-3"><strong>Time:</strong> 12-15 hours</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>□ Create /api/harper/outreach (copy Riley's structure)</li>
            <li>□ Create /api/harper/message</li>
            <li>□ Create HarperAgent class (mirror RileyAgent)</li>
            <li>□ Build /api/harper/close-deal endpoint</li>
          </ul>
          <div className="mt-3 text-sm font-semibold text-green-600">Success: Can send Harper outreach via API ✅</div>
        </div>

        <div className="bg-white border-l-4 border-red-500 rounded-lg p-6">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-xl font-bold text-gray-900">Week 3: Message Delivery (SMS + Email)</h4>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">CRITICAL</span>
          </div>
          <p className="text-gray-600 mb-3"><strong>Time:</strong> 10-12 hours</p>
          <div className="bg-blue-50 rounded p-4 mb-3">
            <p className="font-semibold text-blue-900 mb-2">External Services Needed:</p>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Twilio ($1/mo phone number) - SMS</li>
              <li>• GoHighLevel - Email notifications</li>
            </ul>
          </div>
          <div className="mt-3 text-sm font-semibold text-green-600">Success: Riley can send SMS + Email ✅</div>
        </div>

        <div className="bg-white border-l-4 border-red-500 rounded-lg p-6">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-xl font-bold text-gray-900">Week 4: AI Message Generation</h4>
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">CRITICAL</span>
          </div>
          <p className="text-gray-600 mb-3"><strong>Time:</strong> 6-8 hours | <strong>Cost:</strong> ~$0.01 per conversation</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>□ Get Anthropic API key (console.anthropic.com)</li>
            <li>□ Enable actual Claude API calls in riley-agent.ts</li>
            <li>□ Test end-to-end flow</li>
          </ul>
          <div className="mt-3 text-sm font-semibold text-green-600">Success: Riley & Harper generate real AI responses ✅</div>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">Phase 2: Discovery Automation (4 Weeks)</h3>

      <div className="space-y-4 mb-8">
        <div className="bg-white border-l-4 border-orange-500 rounded-lg p-6">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-xl font-bold text-gray-900">Week 5: Instagram Artist Discovery</h4>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">HIGH</span>
          </div>
          <p className="text-gray-600 mb-3"><strong>Time:</strong> 10-12 hours</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>□ Get Instagram Graph API access</li>
            <li>□ Implement discoverFromInstagram()</li>
            <li>□ Create cron job (run daily at 9am)</li>
          </ul>
          <div className="mt-3 text-sm font-semibold text-green-600">Success: 10+ new artists discovered daily ✅</div>
        </div>

        <div className="bg-white border-l-4 border-orange-500 rounded-lg p-6">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-xl font-bold text-gray-900">Week 6: Google Maps Sponsor Discovery</h4>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">HIGH</span>
          </div>
          <p className="text-gray-600 mb-3"><strong>Time:</strong> 10-12 hours</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>□ Get Google Places API key</li>
            <li>□ Create sponsor-discovery.ts</li>
            <li>□ Search: coffee shops, fitness studios, boutiques</li>
          </ul>
          <div className="mt-3 text-sm font-semibold text-green-600">Success: 15+ new sponsors discovered daily ✅</div>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">Phase 3: Revenue & Payments (3 Weeks)</h3>

      <div className="space-y-4 mb-8">
        <div className="bg-white border-l-4 border-orange-500 rounded-lg p-6">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-xl font-bold text-gray-900">Week 9: Manifest Financial Integration</h4>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">HIGH</span>
          </div>
          <p className="text-gray-600 mb-3"><strong>Time:</strong> 12-15 hours</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>□ Create Manifest Financial account</li>
            <li>□ Set up Manifest API client</li>
            <li>□ Create artist subscription products (FREE, TIER_5, TIER_20, etc.)</li>
            <li>□ Create sponsor products (Bronze, Silver, Gold, Platinum)</li>
            <li>□ Build payment endpoints with instant payout support</li>
          </ul>
          <div className="mt-3 text-sm font-semibold text-green-600">Success: Artist can upgrade tier with instant payouts ✅</div>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">Cost Breakdown</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-bold mb-4">Development Phase (Months 1-3)</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Neon PostgreSQL</span>
              <span className="font-semibold">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Netlify hosting</span>
              <span className="font-semibold">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Twilio SMS</span>
              <span className="font-semibold">~$20</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GoHighLevel Email</span>
              <span className="font-semibold">$0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Anthropic API</span>
              <span className="font-semibold">~$50</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-bold">Total</span>
              <span className="font-bold text-green-600">~$80/month</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-bold mb-4">Production (At Scale)</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">All infrastructure</span>
              <span className="font-semibold">~$1,240</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly revenue</span>
              <span className="font-semibold text-green-600">~$200,000</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-bold">Cost as % of revenue</span>
              <span className="font-bold text-green-600">0.6%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 italic">Excellent profit margins!</p>
        </div>
      </div>

      <h3 className="text-2xl font-bold mt-8 mb-4">Success Milestones</h3>

      <div className="space-y-3 mb-8">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border-l-4 border-purple-500">
          <div className="font-bold text-purple-900 mb-1">Month 1: Foundation</div>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>✅ Site deployed to production</li>
            <li>✅ Riley & Harper fully functional</li>
            <li>✅ Real SMS/Email sending</li>
            <li>✅ Real AI conversations</li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border-l-4 border-blue-500">
          <div className="font-bold text-blue-900 mb-1">Month 3: Revenue</div>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Manifest Financial payments live</li>
            <li>✅ First $5,000 MRR</li>
            <li>✅ First revenue distribution</li>
            <li>✅ Automated workflows</li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500">
          <div className="font-bold text-green-900 mb-1">Month 12: Dominance</div>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✅ 1,000+ active artists</li>
            <li>✅ 1,000+ active sponsors</li>
            <li>✅ $200,000 MRR</li>
            <li>✅ Profitable & sustainable</li>
          </ul>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Your Path Forward</h3>
        <div className="space-y-2 text-lg">
          <p>Week 1-4: Make it work (Riley + Harper fully functional)</p>
          <p>Week 5-8: Make it automatic (Discovery engines)</p>
          <p>Week 9-11: Make it profitable (Payments)</p>
          <p className="text-2xl font-bold mt-6">Total: 18 weeks to launch</p>
          <p className="text-xl">Investment: ~$1,000 in tools/services</p>
          <p className="text-2xl font-bold mt-2">Potential: $200,000/month revenue</p>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mt-8">
        <h4 className="font-bold text-yellow-900 mb-2">Pick One Task and Start NOW! 🚀</h4>
        <p className="text-yellow-800">
          You have everything you need. The foundation is rock-solid. Now it's execution time.
        </p>
      </div>
    </div>
  );
}

interface ApiDocsData {
  name: string;
  version: string;
  baseUrl: string;
  authentication: string;
  endpoints: Record<string, Record<string, string>>;
  webhookEvents: string[];
  rateLimits: Record<string, string>;
}

function ApiReference() {
  const [docs, setDocs] = useState<ApiDocsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/docs")
      .then((r) => r.json())
      .then((data) => {
        setDocs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!docs) {
    return <p className="text-red-600">Failed to load API documentation.</p>;
  }

  function methodBadge(method: string) {
    const colors: Record<string, string> = {
      GET: "bg-green-100 text-green-800 border-green-300",
      POST: "bg-blue-100 text-blue-800 border-blue-300",
      PATCH: "bg-yellow-100 text-yellow-800 border-yellow-300",
      PUT: "bg-orange-100 text-orange-800 border-orange-300",
      DELETE: "bg-red-100 text-red-800 border-red-300",
    };
    return (
      <span
        className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${colors[method] || "bg-gray-100 text-gray-800 border-gray-300"}`}
      >
        {method}
      </span>
    );
  }

  return (
    <div className="prose prose-lg max-w-none">
      <h2 className="text-3xl font-bold mb-2">{docs.name}</h2>
      <p className="text-gray-500 mb-6">Version {docs.version} &middot; Base URL: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{docs.baseUrl}</code></p>

      {/* Authentication */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
        <h3 className="text-xl font-bold text-blue-900 mb-2">Authentication</h3>
        <p className="text-blue-800 mb-3">
          Include your API key as a Bearer token in the <code className="bg-blue-100 px-1 rounded">Authorization</code> header:
        </p>
        <div className="bg-white rounded-lg p-4 border border-blue-200 font-mono text-sm">
          Authorization: Bearer YOUR_API_KEY
        </div>
        <p className="text-blue-700 text-sm mt-3">
          API keys are managed in your operator dashboard at{" "}
          <a href="/operator/dashboard" className="text-blue-600 underline font-semibold">/operator/dashboard</a>
        </p>
      </div>

      {/* Endpoints */}
      <h3 className="text-2xl font-bold mb-4">Endpoints</h3>
      <div className="space-y-6 mb-8">
        {Object.entries(docs.endpoints).map(([category, routes]) => (
          <div key={category} className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h4 className="text-lg font-bold text-gray-900 m-0">{category}</h4>
            </div>
            <div className="divide-y">
              {Object.entries(routes).map(([key, description]) => {
                const parts = key.split(" ");
                const method = parts[0];
                const path = parts.slice(1).join(" ");
                return (
                  <div key={key} className="px-6 py-3 flex items-start gap-3">
                    <div className="pt-0.5">{methodBadge(method)}</div>
                    <div>
                      <code className="text-sm font-semibold text-gray-900">{path}</code>
                      <p className="text-sm text-gray-600 m-0 mt-0.5">{description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Rate Limits */}
      <h3 className="text-2xl font-bold mb-4">Rate Limits</h3>
      <div className="bg-white border rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(docs.rateLimits).map(([category, limit]) => (
            <div key={category} className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500 capitalize mb-1">{category}</div>
              <div className="text-lg font-bold text-gray-900">{limit}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Events */}
      <h3 className="text-2xl font-bold mb-4">Webhook Events</h3>
      <div className="bg-white border rounded-lg p-6 mb-8">
        <p className="text-gray-600 mb-4">
          Register a webhook URL in your organization settings to receive real-time notifications for these events:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {docs.webhookEvents.map((event) => (
            <div key={event} className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <code className="text-sm font-semibold">{event}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="bg-purple-50 border-l-4 border-purple-500 p-6">
        <h4 className="font-bold text-purple-900 mb-2">Need an API Key?</h4>
        <p className="text-purple-800">
          API keys are managed in your operator dashboard. Visit{" "}
          <a href="/operator/dashboard" className="text-purple-600 underline font-semibold">/operator/dashboard</a>{" "}
          to create and manage your keys.
        </p>
      </div>
    </div>
  );
}
