import Link from "next/link";
import { Radio, Music, Users, DollarSign, Heart, TrendingUp, Clock, MapPin } from "lucide-react";

export default function StationPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Radio className="w-6 h-6 text-amber-700" />
              <span className="font-bold text-xl text-gray-900">North Country Radio</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/djs"
                className="text-amber-700 hover:text-amber-800 font-medium transition-colors"
              >
                DJs
              </Link>
              <Link
                href="/schedule"
                className="text-amber-700 hover:text-amber-800 font-medium transition-colors"
              >
                Schedule
              </Link>
              <Link
                href="/network"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Network
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium">
            <Radio className="w-4 h-4" />
            <span>Flagship Station of TrueFans RADIO™ Network</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-serif font-bold text-gray-900 leading-tight">
            North Country Radio™
          </h1>

          <p className="text-3xl text-amber-700 font-serif italic">
            "Where the music finds you."
          </p>

          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Small community. Big heart. Real stories from real artists.
          </p>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A 24/7 Americana / Country / Singer-Songwriter station curated for warmth,
            storytelling, and authenticity.
          </p>
        </div>
      </section>

      {/* What Makes NACR Special */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gray-900">
            What Makes Us Different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <Heart className="w-8 h-8 text-amber-700" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Artist-First Economics</h3>
              <p className="text-gray-600">
                80% of sponsor revenue goes directly to the Artist Pool.
                Every artist gets paid fairly for their rotation.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <Users className="w-8 h-8 text-amber-700" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Human-Curated</h3>
              <p className="text-gray-600">
                Real DJs with distinct personalities, not algorithms.
                Every song is introduced with care and context.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                <Music className="w-8 h-8 text-amber-700" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Community-Driven</h3>
              <p className="text-gray-600">
                Small but passionate. 1,250 daily listeners who truly care
                about the music and the artists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Station Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gray-900">
          Station Capacity & Goals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Users className="w-10 h-10 text-amber-700" />}
            value="340"
            label="Artist Capacity"
            description="Across 5 airplay tiers"
          />
          <StatCard
            icon={<DollarSign className="w-10 h-10 text-amber-700" />}
            value="125"
            label="Sponsor Capacity"
            description="Local & regional businesses"
          />
          <StatCard
            icon={<Radio className="w-10 h-10 text-amber-700" />}
            value="1,250"
            label="Daily Active Users"
            description="Target listener community"
          />
          <StatCard
            icon={<TrendingUp className="w-10 h-10 text-amber-700" />}
            value="52%"
            label="Retention Rate"
            description="Listeners return regularly"
          />
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Station Capacity</h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex justify-between items-center">
                <span>Tracks per month</span>
                <span className="font-semibold">8,640</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Ad spots per month</span>
                <span className="font-semibold">17,280</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Prime hours (6am-6pm)</span>
                <span className="font-semibold">360 hrs/month</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Subprime hours (6pm-6am)</span>
                <span className="font-semibold">360 hrs/month</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-orange-600 text-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-4">Monthly Revenue</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Artist Subscriptions</span>
                <span className="font-semibold">$3,900</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Sponsor Revenue (gross)</span>
                <span className="font-semibold">$22,250</span>
              </div>
              <div className="flex justify-between items-center text-amber-100">
                <span>→ To Artist Pool (80%)</span>
                <span className="font-semibold">$17,800</span>
              </div>
              <div className="flex justify-between items-center text-amber-100">
                <span>→ Station Operations (20%)</span>
                <span className="font-semibold">$4,450</span>
              </div>
              <div className="pt-3 border-t border-white/30 flex justify-between items-center text-lg font-bold">
                <span>Net Station Revenue</span>
                <span>$8,350/mo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programming Philosophy */}
      <section className="bg-gradient-to-br from-amber-700 to-orange-700 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center mb-8">
            Our Programming Philosophy
          </h2>
          <div className="space-y-6 text-lg text-center max-w-3xl mx-auto">
            <p>
              <strong>NACR isn't a physical place — it's a feeling:</strong>
              <br />
              The open road, the long horizon, the quiet truth of a great song.
            </p>
            <p>
              We blend human curation with AI-powered operations to create
              24/7 Americana programming that feels warm, authentic, and deeply personal.
            </p>
            <p>
              Every DJ is a character. Every show has a soul. Every song has a story.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">24/7 Streaming</h3>
              <p className="text-sm text-amber-100">
                Always on, always curated with care
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <Music className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Genre Focus</h3>
              <p className="text-sm text-amber-100">
                Americana, Country, Singer-Songwriter, Indie Folk
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <MapPin className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Mythic Identity</h3>
              <p className="text-sm text-amber-100">
                A place in your heart, not on a map
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/djs"
              className="inline-flex items-center space-x-2 bg-white text-amber-700 px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-50 transition-colors shadow-xl"
            >
              <span>Meet Our DJs</span>
              <Radio className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Identity */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-serif font-bold text-center mb-8 text-gray-900">
          Brand Identity
        </h2>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Tone & Voice</h3>
            <p className="text-gray-700 text-lg mb-6">
              <strong>Warm Americana Storyteller × Modern Indie Minimalism</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-amber-700 mb-2">Visual Style</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Rustic textures × Desert sunsets</li>
                  <li>• Open roads & wide horizons</li>
                  <li>• Acoustic instruments</li>
                  <li>• Golden hour lighting</li>
                  <li>• Campfire & twilight vibes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-amber-700 mb-2">Voice Pillars</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Authentic (no corporate-speak)</li>
                  <li>• Warm (trusted friend vibe)</li>
                  <li>• Story-driven (context matters)</li>
                  <li>• Community-first (you belong here)</li>
                  <li>• Mythic (timeless, not trendy)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Typography</h3>
            <div className="space-y-4">
              <div>
                <div className="text-3xl font-serif mb-2 text-gray-900">Cormorant Garamond</div>
                <p className="text-gray-600">Headings • Poetic tone • Story-driven</p>
              </div>
              <div>
                <div className="text-2xl font-sans mb-2 text-gray-900">Inter / Lato</div>
                <p className="text-gray-600">Body text • Clean • Modern • Readable</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-100 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-serif font-bold mb-6 text-gray-900">
            Ready to Experience NACR?
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Explore our DJ lineup, view the programming schedule,
            and discover the TrueFans RADIO™ Network.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/djs"
              className="inline-flex items-center space-x-2 bg-amber-700 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-800 transition-colors shadow-lg"
            >
              <Users className="w-5 h-5" />
              <span>Meet the DJs</span>
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center space-x-2 border-2 border-amber-700 text-amber-800 px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-50 transition-colors"
            >
              <Clock className="w-5 h-5" />
              <span>View Schedule</span>
            </Link>
            <Link
              href="/network"
              className="inline-flex items-center space-x-2 border-2 border-gray-400 text-gray-700 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-50 transition-colors"
            >
              <Radio className="w-5 h-5" />
              <span>Network Overview</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4">
            <span className="text-2xl font-serif font-bold text-white">North Country Radio™</span>
          </div>
          <p className="text-lg italic text-amber-400 mb-6">"Where the music finds you."</p>
          <p className="text-sm">
            Part of the <Link href="/network" className="text-amber-400 hover:text-amber-300">TrueFans RADIO™ Network</Link>
          </p>
          <p className="text-xs mt-4">&copy; 2024 TrueFans RADIO. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function StatCard({
  icon,
  value,
  label,
  description
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="text-lg font-semibold text-gray-700 mb-1">{label}</div>
      <div className="text-sm text-gray-500">{description}</div>
    </div>
  );
}
