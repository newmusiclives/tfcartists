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
          <strong>We&apos;re not generic announcers — we&apos;re storytellers.</strong>
        </p>
      </section>

      {/* Weekday DJs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gray-900">
          Weekday Lineup <span className="text-xl font-sans text-gray-500">(Mon–Fri)</span>
        </h2>

        <div className="space-y-8">
          <DJCard
            name="Hank Westwood"
            show="Sunrise & Steel"
            time="6:00am – 9:00am"
            tagline="Pour the coffee. Fire up the engine. Let's roll."
            icon={<Coffee className="w-12 h-12 text-amber-700" />}
            color="bg-gradient-to-br from-amber-600 to-orange-600"
            age="Late 40s"
            background="Construction foreman by day, grew up on 90s country radio, discovered modern Americana through his daughter's Spotify"
            vibe="Blue-collar heart with contemporary country soul, bridge between classic and modern"
            musicalFocus="Contemporary country blend: Chris Stapleton, Zach Bryan, Tyler Childers mixed with classic working-class anthems"
            traits={[
              "Grounded — Speaks to working folks starting their day, truck radio energy",
              "Genre bridge — Loves both George Strait and Zach Bryan equally",
              "Authenticity advocate — 'Real country, real stories, real people'",
              "Morning motivation — Sets the tone with songs that make you want to work hard"
            ]}
          />

          <DJCard
            name="Loretta Merrick"
            show="Desert Folk Dispatch"
            time="9:00am – 12:00pm"
            tagline="Somewhere between the M6 and the Mississippi."
            icon={<Compass className="w-12 h-12 text-orange-600" />}
            color="bg-gradient-to-br from-orange-500 to-red-500"
            age="35"
            background="British expat, discovered Kacey Musgraves at 16, moved to Nashville at 25. Now champions the new wave of country storytellers from abroad."
            vibe="Transatlantic country curator, connects UK and US modern Americana scenes"
            musicalFocus="Contemporary country storytellers: Kacey Musgraves, Margo Price, Sierra Ferrell, Molly Tuttle, Brandi Carlile alongside classic influences"
            traits={[
              "Global perspective — Sees country music as universal storytelling, not just American",
              "Soft English accent with Nashville twang — Musical code-switching",
              "New traditionalist — Respects roots while championing modern voices",
              "Discovery champion — Always breaking new artists from both sides of the Atlantic"
            ]}
          />

          <DJCard
            name="Marcus 'Doc' Holloway"
            show="The Deep Cuts Show"
            time="12:00pm – 3:00pm"
            tagline="The songs you forgot you loved."
            icon={<Disc className="w-12 h-12 text-purple-600" />}
            color="bg-gradient-to-br from-purple-600 to-indigo-600"
            age="Mid-50s"
            background="Former A&R scout, discovered indie country artists before they broke. Now curates deep cuts across generations."
            vibe="Genre historian who connects Merle Haggard to Zach Bryan, shows how country evolved"
            musicalFocus="Cross-generational country: Sturgill Simpson, The War and Treaty, Colter Wall, mixed with deep album tracks from legends"
            traits={[
              "Timeline builder — Shows how today's country grew from yesterday's rebels",
              "Story connector — 'Listen to how Zach Bryan channels Townes Van Zandt'",
              "Artist champion — Broke artists early, still roots for underdogs",
              "Album thinker — Plays full album sides, not just singles"
            ]}
          />

          <DJCard
            name="Cody Rampart"
            show="The Afternoon Ride"
            time="3:00pm – 6:00pm"
            tagline="The road's wide open. Let's ride."
            icon={<Globe className="w-12 h-12 text-rose-600" />}
            color="bg-gradient-to-br from-rose-600 to-pink-600"
            age="Early 40s"
            background="Touring musician for 15 years, seen every dive bar from Austin to Asheville. Now champions the new outlaws."
            vibe="Afternoon drive energy with modern outlaw country rebel spirit"
            musicalFocus="Modern outlaw country: Zach Bryan, Ian Munsick, Cody Jinks, Flatland Cavalry, mixed with classic road anthems"
            traits={[
              "New outlaw champion — Connects Waylon's spirit to today's rebels",
              "Lived experience — Knows the road life, the struggle, the 2am thoughts",
              "Intimate storyteller — Shares the stories behind the songs",
              "Genre rebel — Plays what feels real, not what charts say"
            ]}
          />
        </div>
      </section>

      {/* Automation Note */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gray-100 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Radio className="w-5 h-5 text-gray-500" />
            <span className="font-bold text-gray-700">Overnight Automation</span>
          </div>
          <p className="text-gray-600">6:00pm – 6:00am daily · Pure music, no DJ — curated playlists run through the night</p>
        </div>
      </section>

      {/* Saturday DJs */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gray-900">
            Saturday Lineup
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WeekendDJCard
              name="Jo McAllister"
              show="Rust Belt Revival"
              time="Saturday, 6:00am – 9:00am"
              focus="Contemporary working-class country: Tyler Childers, Zach Bryan, The War and Treaty — blue-collar stories, modern sound"
              icon={<Music className="w-8 h-8 text-gray-700" />}
            />
            <WeekendDJCard
              name="Paul Saunders"
              show="The Long Road Home"
              time="Saturday, 9:00am – 12:00pm"
              focus="FOUNDER - Creator of TrueFans CONNECT & TrueFans RADIO Network. Contemporary Americana storytellers, mission-driven music"
              icon={<Sun className="w-8 h-8 text-amber-600" />}
            />
            <WeekendDJCard
              name="Ezra Stone"
              show="Afterglow Americana"
              time="Saturday, 12:00pm – 3:00pm"
              focus="Modern melancholic country: Phoebe Bridgers, Noah Kahan, Kacey Musgraves' introspective side — twilight contemplation"
              icon={<Moon className="w-8 h-8 text-purple-600" />}
            />
            <WeekendDJCard
              name="Levi Bridges"
              show="The Melody Trail"
              time="Saturday, 3:00pm – 6:00pm"
              focus="Outdoor country anthems: Ian Munsick, Parker McCollum, Riley Green — weekend adventure soundtrack"
              icon={<Compass className="w-8 h-8 text-green-600" />}
            />
          </div>
        </div>
      </section>

      {/* Sunday DJs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gray-900">
            Sunday Lineup
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WeekendDJCard
              name="Sam Turnbull"
              show="Raw Tracks & Room Tones"
              time="Sunday, 6:00am – 9:00am"
              focus="Stripped-down modern country: acoustic sessions from Zach Bryan, Sierra Ferrell, Molly Tuttle — raw and authentic"
              icon={<Disc className="w-8 h-8 text-red-600" />}
            />
            <WeekendDJCard
              name="Ruby Finch"
              show="Mountain Daybreak"
              time="Sunday, 9:00am – 12:00pm"
              focus="New traditional country: Molly Tuttle, Billy Strings, Sierra Ferrell — modern bluegrass meets contemporary Americana"
              icon={<Sun className="w-8 h-8 text-orange-500" />}
            />
            <WeekendDJCard
              name="Mark Faulkner"
              show="Backroads & Barrooms"
              time="Sunday, 12:00pm – 3:00pm"
              focus="Modern Texas country: Cody Johnson, Parker McCollum, Flatland Cavalry — red dirt meets contemporary Nashville"
              icon={<Music className="w-8 h-8 text-amber-700" />}
            />
            <WeekendDJCard
              name="Iris Langley"
              show="Evening Hymns"
              time="Sunday, 3:00pm – 6:00pm"
              focus="Contemporary singer-songwriters: Maren Morris, Brandi Carlile, Jason Isbell — intimate storytelling for the modern era"
              icon={<Moon className="w-8 h-8 text-indigo-600" />}
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
          <p className="text-lg italic text-amber-400 mb-6">&quot;Where the music finds you.&quot;</p>
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
            <p className="italic text-lg">&quot;{tagline}&quot;</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h4 className="font-bold text-gray-900 mb-1">Character Profile</h4>
          <p className="text-sm text-gray-600">
            <strong>Age:</strong> {age} · <strong>Background:</strong> {background}
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
              <li key={i}>· {trait}</li>
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
          <p className="text-base font-medium text-gray-700">{show}</p>
        </div>
      </div>
      <p className="text-base text-gray-600 mb-3">{time}</p>
      <p className="text-base text-gray-700">{focus}</p>
    </div>
  );
}
