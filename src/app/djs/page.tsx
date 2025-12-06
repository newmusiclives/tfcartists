import Link from "next/link";
import { Radio, Coffee, Compass, Disc, Globe, Moon, Sun, Music } from "lucide-react";

export default function DJsPage() {
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
                href="/station"
                className="text-amber-700 hover:text-amber-800 font-medium transition-colors"
              >
                Station
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

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-6xl font-serif font-bold text-gray-900 mb-4">
          Meet Our DJs
        </h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          Each DJ is a character with a distinct personality, musical focus, and time of day.
          <br />
          <strong>We're not generic announcers — we're storytellers.</strong>
        </p>
      </section>

      {/* Weekday DJs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gray-900">
          Weekday Lineup
        </h2>

        <div className="space-y-8">
          {/* Hank Westwood */}
          <DJCard
            name="Hank Westwood"
            show="Sunrise & Steel"
            time="6:00am – 10:00am"
            tagline="Pour the coffee. Fire up the engine. Let's roll."
            icon={<Coffee className="w-12 h-12 text-amber-700" />}
            color="bg-gradient-to-br from-amber-600 to-orange-600"
            age="Late 40s"
            background="Former steel mill worker turned radio DJ"
            vibe="Blue-collar optimism, calloused hands, warm coffee voice"
            musicalFocus="Morning energy, acoustic-driven, working-class anthems"
            traits={[
              "Grounded — Speaks to the working folks starting their day",
              "Optimistic without being cheesy",
              "Respectful of labor — Celebrates tradespeople, builders, makers",
              "Brief and warm — Doesn't waste time, but always has heart"
            ]}
          />

          {/* Dakota Raine */}
          <DJCard
            name="Dakota Raine"
            show="Desert Folk Dispatch"
            time="10:00am – 2:00pm"
            tagline="Stories from the long road."
            icon={<Compass className="w-12 h-12 text-orange-600" />}
            color="bg-gradient-to-br from-orange-500 to-red-500"
            age="Early 30s"
            background="Wanderer, poet, desert dweller"
            vibe="Open spaces, lonesome highways, sun-baked wisdom"
            musicalFocus="Sparse arrangements, desert vibes, storytelling songs"
            traits={[
              "Poetic — Speaks in images, not just facts",
              "Spacious — Comfortable with silence, lets songs breathe",
              "Curious — 'Where was this written? What inspired it?'",
              "Contemplative — Music as a companion for the journey"
            ]}
          />

          {/* Doc Holloway */}
          <DJCard
            name="Marcus 'Doc' Holloway"
            show="The Deep Cuts Show"
            time="2:00pm – 6:00pm"
            tagline="The songs you forgot you loved."
            icon={<Disc className="w-12 h-12 text-purple-600" />}
            color="bg-gradient-to-br from-purple-600 to-indigo-600"
            age="Mid-50s"
            background="Record store owner, music historian, vinyl collector"
            vibe="Professor meets bartender, deep knowledge without pretension"
            musicalFocus="Deep album cuts, vinyl-era thinking, cross-genre exploration"
            traits={[
              "Knowledgeable — Knows the B-sides, the covers, the deep cuts",
              "Unpretentious — Shares knowledge generously, not condescendingly",
              "Album-oriented — 'This song makes sense in context...'",
              "Mentor energy — Helps listeners discover new (old) favorites"
            ]}
          />

          {/* Carmen Vasquez */}
          <DJCard
            name="Carmen Vasquez"
            show="Borderlands"
            time="6:00pm – 10:00pm"
            tagline="Where the music crosses over."
            icon={<Globe className="w-12 h-12 text-rose-600" />}
            color="bg-gradient-to-br from-rose-600 to-pink-600"
            age="Late 30s"
            background="Bilingual, border town roots, cultural bridge-builder"
            vibe="Tex-Mex soul, cross-cultural warmth, storytelling in two languages"
            musicalFocus="Cross-border sounds, bilingual artists, cultural fusion"
            traits={[
              "Bilingual flow — Switches between English and Spanish naturally",
              "Cultural pride — Celebrates border culture as its own identity",
              "Warm and inclusive — 'There's room for everyone here'",
              "Story-focused — Every song has cultural context"
            ]}
          />

          {/* Cody Rampart */}
          <DJCard
            name="Cody Rampart"
            show="Midnight Rodeo"
            time="10:00pm – 2:00am"
            tagline="The night belongs to the restless."
            icon={<Moon className="w-12 h-12 text-indigo-600" />}
            color="bg-gradient-to-br from-indigo-700 to-slate-700"
            age="Early 40s"
            background="Honky-tonk drifter, outlaw poet, late-night storyteller"
            vibe="Whiskey-soaked wisdom, dive bar philosopher, neon-lit highways"
            musicalFocus="Honky-tonk and outlaw country, late-night tempo, heartbreak songs"
            traits={[
              "Outlaw spirit — Celebrates the renegades, the misfits, the wanderers",
              "Late-night intimacy — Quieter energy, like talking to a friend at 1am",
              "Storytelling focus — Songs about trouble, heartbreak, redemption",
              "Poetic without being precious — 'This next one's for everyone still awake'"
            ]}
          />

          {/* RoboDJ */}
          <DJCard
            name="RoboDJ"
            show="Overnight Automation"
            time="2:00am – 6:00am"
            tagline="Let the music play."
            icon={<Radio className="w-12 h-12 text-gray-600" />}
            color="bg-gradient-to-br from-gray-600 to-slate-600"
            age="—"
            background="Automated overnight programming"
            vibe="Minimal personality, pure music flow"
            musicalFocus="Overnight mix, sleep-friendly, deep catalog exploration"
            traits={[
              "Automated — No DJ intros, just station IDs",
              "Pure music — Songs flow seamlessly",
              "Overnight vibe — Slightly slower, contemplative",
              "Good for discovery — Features lesser-known artists"
            ]}
          />
        </div>
      </section>

      {/* Weekend DJs */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gray-900">
            Weekend Lineup
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <WeekendDJCard
              name="Paul Saunders"
              show="The Long Road Home"
              time="Sunday, 8am–12pm"
              focus="Sunday morning reflection, coffee on the porch, spiritual but not preachy"
              icon={<Sun className="w-8 h-8 text-amber-600" />}
            />
            <WeekendDJCard
              name="Jo McAllister"
              show="Rust Belt Revival"
              time="Saturday, 10am–2pm"
              focus="Heartland rock, Springsteen energy, blue-collar pride"
              icon={<Music className="w-8 h-8 text-gray-700" />}
            />
            <WeekendDJCard
              name="Ezra Stone"
              show="Afterglow Americana"
              time="Saturday, 6pm–10pm"
              focus="Twilight introspection, evening stillness, melancholic beauty"
              icon={<Moon className="w-8 h-8 text-purple-600" />}
            />
            <WeekendDJCard
              name="Sam Turnbull"
              show="Raw Tracks & Room Tones"
              time="Sunday, 2pm–6pm"
              focus="Live sessions, demos, lo-fi, the sound of making music"
              icon={<Disc className="w-8 h-8 text-red-600" />}
            />
            <WeekendDJCard
              name="Levi Bridges"
              show="The Melody Trail"
              time="Friday, 6pm–10pm"
              focus="Outdoor enthusiast, hiking soundtrack, weekend kickoff energy"
              icon={<Compass className="w-8 h-8 text-green-600" />}
            />
          </div>
        </div>
      </section>

      {/* Programming Principles */}
      <section className="bg-gradient-to-br from-amber-700 to-orange-700 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center mb-8">
            Our DJ Philosophy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="text-xl font-bold mb-3">Respect the Artist</h3>
              <p className="text-amber-100">
                Always introduce with care: name, song title, context.
                Share backstory when relevant.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Create Flow</h3>
              <p className="text-amber-100">
                Songs transition naturally. Build arcs within each hour.
                Use silence strategically.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">Be Story-Driven</h3>
              <p className="text-amber-100">
                Every song has a story. Context makes music more meaningful.
                Listeners remember stories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-serif font-bold mb-6 text-gray-900">
          Ready to Tune In?
        </h2>
        <p className="text-xl text-gray-700 mb-8">
          Check out the full programming schedule to see when your favorite DJs are on air.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            href="/schedule"
            className="inline-flex items-center space-x-2 bg-amber-700 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-800 transition-colors shadow-lg"
          >
            <Radio className="w-5 h-5" />
            <span>View Schedule</span>
          </Link>
          <Link
            href="/station"
            className="inline-flex items-center space-x-2 border-2 border-amber-700 text-amber-800 px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-50 transition-colors"
          >
            <span>Back to Station</span>
          </Link>
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
        </div>
      </footer>
    </main>
  );
}

function DJCard({
  name,
  show,
  time,
  tagline,
  icon,
  color,
  age,
  background,
  vibe,
  musicalFocus,
  traits
}: {
  name: string;
  show: string;
  time: string;
  tagline: string;
  icon: React.ReactNode;
  color: string;
  age: string;
  background: string;
  vibe: string;
  musicalFocus: string;
  traits: string[];
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className={`${color} text-white p-6`}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">{icon}</div>
          <div className="flex-1">
            <h3 className="text-3xl font-serif font-bold mb-1">{name}</h3>
            <p className="text-xl font-medium mb-2">{show}</p>
            <p className="text-sm opacity-90 mb-3">{time}</p>
            <p className="italic text-lg">"{tagline}"</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h4 className="font-bold text-gray-900 mb-1">Character Profile</h4>
          <p className="text-sm text-gray-600">
            <strong>Age:</strong> {age} • <strong>Background:</strong> {background}
          </p>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 mb-1">Vibe</h4>
          <p className="text-gray-700">{vibe}</p>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 mb-1">Musical Focus</h4>
          <p className="text-gray-700">{musicalFocus}</p>
        </div>

        <div>
          <h4 className="font-bold text-gray-900 mb-2">Personality Traits</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            {traits.map((trait, i) => (
              <li key={i}>• {trait}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function WeekendDJCard({
  name,
  show,
  time,
  focus,
  icon
}: {
  name: string;
  show: string;
  time: string;
  focus: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-md">
      <div className="flex items-center space-x-3 mb-3">
        {icon}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{name}</h3>
          <p className="text-sm font-medium text-gray-700">{show}</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{time}</p>
      <p className="text-sm text-gray-700">{focus}</p>
    </div>
  );
}
