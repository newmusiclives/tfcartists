import Link from "next/link";
import { ArrowRight, Sparkles, Users, TrendingUp, MessageCircle, DollarSign, Radio } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <span className="font-bold text-xl">TrueFans CONNECT</span>
            </div>
            <div className="flex items-center space-x-4">
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
                href="/capacity"
                className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center space-x-1"
              >
                <Radio className="w-4 h-4" />
                <span>Capacity</span>
              </Link>
              <Link
                href="/onboard"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>TrueFans Internal System</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Riley + Harper
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Artist & Sponsor Acquisition
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Riley's team finds and onboards artists — giving them TrueFans CONNECT accounts + FREE radio airplay.
            Harper's team secures sponsors from music-related businesses, craft makers, and local shops to fund the stations.
          </p>

          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/admin"
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <span>Admin Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/airplay"
              className="inline-flex items-center space-x-2 border-2 border-purple-300 text-purple-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-purple-400 transition-colors"
            >
              <span>Airplay Tiers</span>
            </Link>
          </div>
        </div>

        {/* Team Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-10 h-10 text-purple-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Riley's Team</h3>
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
                <span>Signs up for TrueFans CONNECT</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-purple-600">✓</span>
                <span>Activates FREE radio airplay</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-purple-600">✓</span>
                <span>Teaches the 9-word line</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-purple-600">✓</span>
                <span>Tracks first wins & engagement</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-10 h-10 text-green-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Harper's Team</h3>
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
                <span>Local craft makers</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Community shops & venues</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Station sponsorship packages</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>80% revenue to Artist Pool</span>
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
            description="TrueFans CONNECT account + FREE radio airplay"
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
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12 text-center">
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl font-bold mb-2">3</div>
              <div className="text-purple-100">Active Artists</div>
              <div className="text-sm text-purple-200 mt-2">Riley's Pipeline</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl font-bold mb-2">$127.50</div>
              <div className="text-purple-100">Total Raised</div>
              <div className="text-sm text-purple-200 mt-2">Via TrueFans CONNECT</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl font-bold mb-2">31</div>
              <div className="text-purple-100">Total Shares</div>
              <div className="text-sm text-purple-200 mt-2">In Artist Pool</div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/admin"
              className="inline-flex items-center space-x-2 bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-xl"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="text-white font-semibold mb-2">Riley's Team</h3>
              <p className="text-sm">Artist Acquisition & Onboarding</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Harper's Team</h3>
              <p className="text-sm">Sponsor Acquisition & Revenue</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Quick Links</h3>
              <div className="space-x-4 text-sm">
                <Link href="/admin" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link href="/capacity" className="hover:text-white transition-colors">
                  Capacity
                </Link>
                <Link href="/airplay" className="hover:text-white transition-colors">
                  Airplay
                </Link>
                <Link href="/onboard" className="hover:text-white transition-colors">
                  Onboard
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>&copy; 2024 TrueFans Internal System. Riley + Harper AI Teams.</p>
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
      <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 text-white rounded-full text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
