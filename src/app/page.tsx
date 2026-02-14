import Link from "next/link";
import { ArrowRight, Users, TrendingUp, MessageCircle, DollarSign, Radio, Target, Award, Music, Settings } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Radio className="w-6 h-6 text-amber-700" />
              <span className="font-bold text-xl text-amber-700">North Country Radio</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/station"
                className="text-amber-700 hover:text-amber-800 font-medium transition-colors inline-flex items-center space-x-1"
              >
                <Radio className="w-4 h-4" />
                <span>NCR</span>
              </Link>
              <Link
                href="/network"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Network
              </Link>
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Admin
              </Link>
              <Link
                href="/riley"
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Riley
              </Link>
              <Link
                href="/harper"
                className="text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                Harper
              </Link>
              <Link
                href="/elliot"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Elliot
              </Link>
              <Link
                href="/cassidy"
                className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                Cassidy
              </Link>
              <Link
                href="/onboard"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1"
              >
                <Music className="w-4 h-4" />
                <span>Artists</span>
              </Link>
              <Link
                href="/station-admin/wizard"
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center space-x-1"
              >
                <Settings className="w-4 h-4" />
                <span>Operators</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium">
            <Radio className="w-4 h-4" />
            <span>TrueFans RADIO Network — Station #1</span>
          </div>

          <h1 className="mt-6 text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight">
            North Country Radio
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600">
              Where the music finds you.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Riley&apos;s team finds and onboards artists. Cassidy&apos;s team reviews submissions and assigns rotation tiers. Harper&apos;s team secures sponsors to fund the station.
            Elliot&apos;s team builds a passionate listener community that grows itself through viral content, artist fan activation, and habit formation.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/onboard"
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Music className="w-5 h-5" />
              <span>Artists: Submit Your Music</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/station-admin/wizard"
              className="inline-flex items-center space-x-2 bg-amber-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Settings className="w-5 h-5" />
              <span>Operators: Launch a Station</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Team Stats */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-10 h-10 text-purple-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Riley's Team</h3>
                <p className="text-sm text-gray-600">Artist Acquisition</p>
              </div>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center space-x-2">
                <span className="text-purple-600">✓</span>
                <span>Discovers emerging artists</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-purple-600">✓</span>
                <span>Automated outreach campaigns</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-purple-600">✓</span>
                <span>Activates FREE radio airplay</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-purple-600">✓</span>
                <span>Manages upgrade opportunities</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-purple-600">✓</span>
                <span>300 artists, $4,350/month</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-10 h-10 text-green-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Harper's Team</h3>
                <p className="text-sm text-gray-600">Sponsor Acquisition</p>
              </div>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Music-related businesses</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Local craft makers & venues</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Community sponsor outreach</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>4-tier sponsorship packages</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>72 sponsors, $18,150/month</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <Award className="w-10 h-10 text-teal-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Cassidy's Team</h3>
                <p className="text-sm text-gray-600">Submission Review</p>
              </div>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center space-x-2">
                <span className="text-teal-600">✓</span>
                <span>Expert 6-person review panel</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-teal-600">✓</span>
                <span>5-7 day review process</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-teal-600">✓</span>
                <span>4-tier placement system</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-teal-600">✓</span>
                <span>95% placement success rate</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-teal-600">✓</span>
                <span>200 artists, 80/20 rotation</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <Target className="w-10 h-10 text-blue-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Elliot's Team</h3>
                <p className="text-sm text-gray-600">Listener Growth</p>
              </div>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center space-x-2">
                <span className="text-blue-600">✓</span>
                <span>Viral content creation</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-blue-600">✓</span>
                <span>Artist fan activation</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-blue-600">✓</span>
                <span>Community building campaigns</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-blue-600">✓</span>
                <span>Habit formation & retention</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-blue-600">✓</span>
                <span>6,000 listeners, growing daily</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How The System Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Complete Artist Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Step
            number="1"
            title="Discovery"
            description="Riley finds artists on social platforms with live shows"
          />
          <Step
            number="2"
            title="Outreach"
            description="Automated, friendly messages to start conversation"
          />
          <Step
            number="3"
            title="Dual Signup"
            description="North Country Radio account + FREE radio airplay"
          />
          <Step
            number="4"
            title="Activation"
            description="Teaches 9-word line, books first show"
          />
          <Step
            number="5"
            title="Revenue"
            description="Show earnings + monthly Artist Pool payouts"
          />
        </div>
      </section>

      {/* System Status */}
      <section className="bg-gradient-to-r from-amber-700 to-orange-600 text-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl font-bold mb-2">3</div>
              <div className="text-amber-100">Active Artists</div>
              <div className="text-sm text-amber-200 mt-2">Riley's Pipeline</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl font-bold mb-2">$127.50</div>
              <div className="text-amber-100">Total Raised</div>
              <div className="text-sm text-amber-200 mt-2">Via North Country Radio</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl font-bold mb-2">31</div>
              <div className="text-amber-100">Total Shares</div>
              <div className="text-sm text-amber-200 mt-2">In Artist Pool</div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/admin"
              className="inline-flex items-center space-x-2 bg-white text-amber-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-xl"
            >
              <span>View Full Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
            <div>
              <h3 className="text-white font-semibold mb-2">Riley's Team</h3>
              <p className="text-sm">Artist Acquisition & Onboarding</p>
              <Link href="/riley" className="text-xs hover:text-white transition-colors block mt-2">
                View Dashboard →
              </Link>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Cassidy's Team</h3>
              <p className="text-sm">Submission Review & Curation</p>
              <Link href="/cassidy" className="text-xs hover:text-white transition-colors block mt-2">
                View Dashboard →
              </Link>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Harper's Team</h3>
              <p className="text-sm">Sponsor Acquisition & Revenue</p>
              <Link href="/harper" className="text-xs hover:text-white transition-colors block mt-2">
                View Dashboard →
              </Link>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Elliot's Team</h3>
              <p className="text-sm">Listener Growth & Retention</p>
              <Link href="/elliot" className="text-xs hover:text-white transition-colors block mt-2">
                View Dashboard →
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>&copy; 2025 North Country Radio — A TrueFans RADIO Network Station. Riley + Cassidy + Harper + Elliot AI Teams.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="text-gray-600">{label}</div>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-700 text-white rounded-full text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
