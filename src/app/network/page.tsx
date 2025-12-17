import Link from "next/link";
import { Radio, TrendingUp, Users, DollarSign, Heart, Globe, Sparkles, Target } from "lucide-react";

export default function NetworkPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <span className="font-bold text-xl text-gray-900">TrueFans RADIO™ Network</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/station"
                className="text-amber-700 hover:text-amber-800 font-medium transition-colors"
              >
                NACR
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
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Globe className="w-4 h-4" />
          <span>A New Kind of Radio Network</span>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6">
          TrueFans RADIO™
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600">
            Network
          </span>
        </h1>

        <p className="text-2xl text-gray-700 max-w-4xl mx-auto mb-4">
          AI-powered, human-curated, artist-first radio.
        </p>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A network of small-but-passionate genre stations, each operated by
          <strong> 1 human manager + 3 AI teams</strong>,
          built to scale as a profitable lifestyle business.
        </p>
      </section>

      {/* The Model */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            The TrueFans RADIO™ Model
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <ModelPillar
              icon={<Users className="w-10 h-10 text-purple-600" />}
              title="1 Human Manager"
              description="Station curator, community leader, local expert"
            />
            <ModelPillar
              icon={<Radio className="w-10 h-10 text-pink-600" />}
              title="3 AI Teams"
              description="Riley (Artists), Harper (Sponsors), Elliot (Listeners)"
            />
            <ModelPillar
              icon={<Heart className="w-10 h-10 text-rose-600" />}
              title="Artist-First"
              description="80% of sponsor revenue → Artist Pool"
            />
            <ModelPillar
              icon={<TrendingUp className="w-10 h-10 text-orange-600" />}
              title="High Margin"
              description="~$91k net profit per station/year"
            />
          </div>

          <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl p-10">
            <h3 className="text-3xl font-bold mb-6 text-center">Each Station Operates With:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">340</div>
                <div className="text-purple-100">Artists</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">125</div>
                <div className="text-purple-100">Sponsors</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">1,250</div>
                <div className="text-purple-100">Daily Active Users</div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/30 text-center">
              <div className="text-2xl font-bold mb-1">$8,350/month</div>
              <div className="text-purple-100">Net Station Revenue (after Artist Pool payouts)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Station */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-bold text-center mb-8 text-gray-900">
          Flagship Station: North Country Radio™
        </h2>
        <p className="text-xl text-gray-700 text-center mb-12 max-w-3xl mx-auto">
          NACR proves the model with Americana / Country / Singer-Songwriter programming.
          Once successful, we replicate to other genres.
        </p>

        <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="flex items-center space-x-4 mb-6">
              <Radio className="w-12 h-12 text-amber-700" />
              <div>
                <h3 className="text-3xl font-serif font-bold text-gray-900">North Country Radio™</h3>
                <p className="text-xl italic text-amber-700">"Where the music finds you."</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-1">Genre</div>
                <div className="text-gray-700">Americana, Country, Singer-Songwriter</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-1">Brand</div>
                <div className="text-gray-700">Warm storyteller × Modern minimalism</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-1">Programming</div>
                <div className="text-gray-700">24/7 with distinct DJ personalities</div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/station"
                className="inline-flex items-center space-x-2 bg-amber-700 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-800 transition-colors shadow-lg"
              >
                <span>Explore NACR</span>
                <Radio className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Scaling Vision */}
      <section className="bg-gradient-to-br from-purple-700 to-pink-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">
            Network Scaling Vision
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <ScaleCard
              phase="Phase 1"
              stations="1 Station"
              timeline="Months 1-6"
              revenue="~$91k/year"
              description="Launch NACR, prove the model, document playbook"
            />
            <ScaleCard
              phase="Phase 2"
              stations="5 Stations"
              timeline="Months 7-18"
              revenue="~$450k-$550k/year"
              description="Blues, Indie Folk, Bluegrass, Alt-Country stations"
            />
            <ScaleCard
              phase="Phase 3"
              stations="10 Stations"
              timeline="Months 19-36"
              revenue="~$900k-$1.2M/year"
              description="Heartland Rock, Christian, Indie Rock, Singer-Songwriter, Texas Country"
            />
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold mb-4">
              Each New Station = Same Model, Different Genre
            </p>
            <p className="text-purple-100 max-w-2xl mx-auto">
              No additional infrastructure needed. Same AI teams. Same playbook.
              Just a new passionate manager and a new community.
            </p>
          </div>
        </div>
      </section>

      {/* Future Stations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
          Future Stations (Planned)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FutureStation
            name="Blues Radio™"
            genre="Chicago blues, Delta blues, contemporary"
            phase="Phase 2"
          />
          <FutureStation
            name="Indie Folk Radio™"
            genre="Acoustic indie folk, introspective singer-songwriter"
            phase="Phase 2"
          />
          <FutureStation
            name="Bluegrass Radio™"
            genre="Traditional + progressive bluegrass"
            phase="Phase 2"
          />
          <FutureStation
            name="Alt-Country Radio™"
            genre="Outlaw country, Americana with edge"
            phase="Phase 2"
          />
          <FutureStation
            name="Heartland Rock Radio™"
            genre="Springsteen-style American rock, working-class anthems"
            phase="Phase 3"
          />
          <FutureStation
            name="Christian Radio™"
            genre="Contemporary Christian, worship, gospel"
            phase="Phase 3"
          />
          <FutureStation
            name="Indie Rock Radio™"
            genre="Garage rock, lo-fi, DIY indie"
            phase="Phase 3"
          />
          <FutureStation
            name="Singer Songwriter Radio™"
            genre="Acoustic storytellers, intimate performances, lyric-focused"
            phase="Phase 3"
          />
          <FutureStation
            name="Texas Country Radio™"
            genre="Texas-style country, Red Dirt, honky-tonk"
            phase="Phase 3"
          />
        </div>
      </section>

      {/* Why This Works */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Why This Model Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <WhyCard
              icon={<Heart className="w-10 h-10 text-rose-600" />}
              title="Artists Get Paid"
              description="80/20 sponsor revenue share — unheard of in traditional radio. Artist Pool payouts are transparent and share-based."
            />
            <WhyCard
              icon={<Sparkles className="w-10 h-10 text-purple-600" />}
              title="AI Handles Heavy Lifting"
              description="Automation replaces sales teams, programming assistants, and marketing staff. Human managers focus on curation and community."
            />
            <WhyCard
              icon={<Users className="w-10 h-10 text-blue-600" />}
              title="Stations Stay Small"
              description="Passionate micro-communities outperform passive, inflated audiences. 1,250 engaged daily listeners > 10,000 casual listeners."
            />
            <WhyCard
              icon={<Radio className="w-10 h-10 text-amber-700" />}
              title="Mythic & Differentiated"
              description="Each station feels like a place listeners want to belong to, not just another streaming service."
            />
            <WhyCard
              icon={<Target className="w-10 h-10 text-green-600" />}
              title="Infinitely Replicable"
              description="One human manager → one genre → one station → reliable profit. Same playbook, different execution."
            />
            <WhyCard
              icon={<TrendingUp className="w-10 h-10 text-orange-600" />}
              title="Lifestyle Business at Scale"
              description="Profitable, sustainable, no VC pressure. Grows station by station, not listener by listener."
            />
          </div>
        </div>
      </section>

      {/* Network Economics */}
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Network Economics
          </h2>

          <div className="space-y-6">
            <EconomicsCard
              stations={1}
              revenue="$91,200"
              description="North Country Radio proves the model"
            />
            <EconomicsCard
              stations={5}
              revenue="$450,000 – $550,000"
              description="Blues, Indie Folk, Bluegrass, Alt-Country + NACR"
            />
            <EconomicsCard
              stations={10}
              revenue="$900,000 – $1.2M"
              description="Full genre-specific network"
            />
            <EconomicsCard
              stations={20}
              revenue="$1.8M – $2.4M"
              description="International expansion, white-label licensing"
            />
          </div>

          <p className="text-center text-gray-600 mt-8 text-lg">
            <strong>No additional staff needed until ~8-10 stations.</strong>
            <br />
            Shared infrastructure creates economies of scale.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            The Future of Independent Radio
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            TrueFans RADIO™ is building the first radio network for the modern independent music era.
            <br />
            Artist-first. Community-driven. Built to scale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/station"
              className="inline-flex items-center space-x-2 bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-purple-50 transition-colors shadow-xl"
            >
              <Radio className="w-5 h-5" />
              <span>Explore NACR</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-white/10 transition-colors"
            >
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4">
            <span className="text-2xl font-bold text-white">TrueFans RADIO™ Network</span>
          </div>
          <p className="text-lg italic text-purple-400 mb-6">
            Real music. Real communities. Real support.
          </p>
          <p className="text-sm">
            Powered by <strong>Riley</strong> (Artists), <strong>Harper</strong> (Sponsors), and <strong>Elliot</strong> (Listeners)
          </p>
          <p className="text-xs mt-4">&copy; 2024 TrueFans RADIO. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function ModelPillar({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center shadow-md">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function ScaleCard({
  phase,
  stations,
  timeline,
  revenue,
  description
}: {
  phase: string;
  stations: string;
  timeline: string;
  revenue: string;
  description: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
      <div className="text-sm font-semibold text-purple-200 mb-2">{phase}</div>
      <div className="text-3xl font-bold mb-2">{stations}</div>
      <div className="text-sm text-purple-200 mb-4">{timeline}</div>
      <div className="text-2xl font-bold mb-4">{revenue}</div>
      <p className="text-purple-100">{description}</p>
    </div>
  );
}

function FutureStation({
  name,
  genre,
  phase
}: {
  name: string;
  genre: string;
  phase: string;
}) {
  return (
    <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 shadow-md">
      <div className="inline-block bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
        {phase}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
      <p className="text-gray-700">{genre}</p>
    </div>
  );
}

function WhyCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-md">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">{icon}</div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-700">{description}</p>
        </div>
      </div>
    </div>
  );
}

function EconomicsCard({
  stations,
  revenue,
  description
}: {
  stations: number;
  revenue: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-purple-600">{stations}</div>
          <div className="text-sm text-gray-600">
            {stations === 1 ? "Station" : "Stations"}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{revenue}</div>
          <div className="text-gray-600">{description}</div>
        </div>
      </div>
      <TrendingUp className="w-8 h-8 text-green-600" />
    </div>
  );
}
