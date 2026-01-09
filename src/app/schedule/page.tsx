import Link from "next/link";
import { Radio, Clock, Calendar } from "lucide-react";

export default function SchedulePage() {
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
                href="/djs"
                className="text-amber-700 hover:text-amber-800 font-medium transition-colors"
              >
                DJs
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
        <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Calendar className="w-4 h-4" />
          <span>24/7 Programming Schedule</span>
        </div>
        <h1 className="text-6xl font-serif font-bold text-gray-900 mb-4">
          Programming Schedule
        </h1>
        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
          Every hour, every day — curated with care.
          <br />
          <strong>Find your favorite show and make it part of your routine.</strong>
        </p>
      </section>

      {/* Weekday Schedule */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-4xl font-serif font-bold text-center mb-8 text-gray-900">
          Weekday Schedule
          <span className="block text-lg font-normal text-gray-600 mt-2">
            Monday – Friday
          </span>
        </h2>

        <div className="space-y-4">
          <TimeSlot
            time="6:00am – 10:00am"
            show="Sunrise & Steel"
            dj="Hank Westwood"
            mood="Morning ritual, working-class pride"
            color="bg-gradient-to-r from-amber-600 to-orange-600"
          />
          <TimeSlot
            time="10:00am – 2:00pm"
            show="Desert Folk Dispatch"
            dj="Loretta Merrick"
            mood="M6 to Mississippi — British heart, American soul"
            color="bg-gradient-to-r from-orange-500 to-red-500"
          />
          <TimeSlot
            time="2:00pm – 6:00pm"
            show="The Deep Cuts Show"
            dj="Marcus 'Doc' Holloway"
            mood="Vinyl deep dives, album-side gems"
            color="bg-gradient-to-r from-purple-600 to-indigo-600"
          />
          <TimeSlot
            time="6:00pm – 10:00pm"
            show="Borderlands"
            dj="Carmen Vasquez"
            mood="Cross-cultural, bilingual storytelling"
            color="bg-gradient-to-r from-rose-600 to-pink-600"
          />
          <TimeSlot
            time="10:00pm – 2:00am"
            show="Midnight Rodeo"
            dj="Cody Rampart"
            mood="Honky-tonk nights, outlaw country"
            color="bg-gradient-to-r from-indigo-700 to-slate-700"
          />
          <TimeSlot
            time="2:00am – 6:00am"
            show="Overnight Automation"
            dj="RoboDJ"
            mood="Minimal talk, pure flow"
            color="bg-gradient-to-r from-gray-600 to-slate-600"
          />
        </div>
      </section>

      {/* Weekend Schedule */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center mb-8 text-gray-900">
            Weekend Schedule
            <span className="block text-lg font-normal text-gray-600 mt-2">
              Saturday & Sunday
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Saturday */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-amber-700" />
                Saturday
              </h3>
              <div className="space-y-3">
                <WeekendSlot
                  time="6:00am – 10:00am"
                  show="Rust Belt Revival"
                  dj="Jo McAllister"
                  focus="Working-class anthems, Heartland rock"
                />
                <WeekendSlot
                  time="10:00am – 2:00pm"
                  show="The Long Road Home"
                  dj="Paul Saunders"
                  focus="Sunday morning reflection"
                />
                <WeekendSlot
                  time="2:00pm – 6:00pm"
                  show="Afterglow Americana"
                  dj="Ezra Stone"
                  focus="Twilight vibes, introspective"
                />
                <WeekendSlot
                  time="6:00pm – 10:00pm"
                  show="The Melody Trail"
                  dj="Levi Bridges"
                  focus="Weekend kickoff, hiking vibes"
                />
              </div>
            </div>

            {/* Sunday */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-amber-700" />
                Sunday
              </h3>
              <div className="space-y-3">
                <WeekendSlot
                  time="6:00am – 10:00am"
                  show="Raw Tracks & Room Tones"
                  dj="Sam Turnbull"
                  focus="Studio sessions, live recordings"
                />
                <WeekendSlot
                  time="10:00am – 2:00pm"
                  show="Mountain Daybreak"
                  dj="Ruby Finch"
                  focus="Appalachian roots, Sunday comfort"
                />
                <WeekendSlot
                  time="2:00pm – 6:00pm"
                  show="Backroads & Barrooms"
                  dj="Mark Faulkner"
                  focus="Texas country, jukebox wisdom"
                />
                <WeekendSlot
                  time="6:00pm – 10:00pm"
                  show="Evening Hymns"
                  dj="Iris Langley"
                  focus="Singer-songwriter, literary folk"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Programming */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-serif font-bold text-center mb-8 text-gray-900">
          Special Programming
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SpecialBlock
            title="First Friday"
            description="New Artist Showcase — Debut tracks from emerging artists"
          />
          <SpecialBlock
            title="Second Sunday"
            description="Songwriter Session — Acoustic, storytelling-focused programming"
          />
          <SpecialBlock
            title="Third Thursday"
            description="Deep Cuts Vinyl Night — Doc Holloway's extended album deep dives"
          />
          <SpecialBlock
            title="Last Saturday"
            description="Listener Request Hour — Community picks the playlist"
          />
        </div>
      </section>

      {/* Programming Principles */}
      <section className="bg-gradient-to-br from-amber-700 to-orange-700 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif font-bold text-center mb-8">
            How We Program
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <Clock className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Time of Day Matters</h3>
              <p className="text-amber-100">
                Morning: upbeat, energizing. Evening: warm, storytelling. Late night: intimate, slower.
              </p>
            </div>
            <div>
              <Radio className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Create Flow</h3>
              <p className="text-amber-100">
                Songs transition naturally by tempo, mood, and key. Build arcs within each hour.
              </p>
            </div>
            <div>
              <Calendar className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Mix Old & New</h3>
              <p className="text-amber-100">
                Classic Americana (70s–90s) alongside modern indie country. Honor the past, celebrate the present.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Listening Tips */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-serif font-bold text-center mb-8 text-gray-900">
          Listening Tips
        </h2>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <ul className="space-y-4 text-gray-700 text-lg">
            <li className="flex items-start">
              <span className="text-amber-700 font-bold mr-3">☀️</span>
              <span><strong>Morning listeners:</strong> Start your day with Hank (6-10am) — Coffee, optimism, working-class anthems.</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-700 font-bold mr-3">🌄</span>
              <span><strong>Midday explorers:</strong> Tune into Loretta (10am-2pm) — British outsider's love letter to americana, smart but unpretentious.</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-700 font-bold mr-3">🎸</span>
              <span><strong>Afternoon deep-divers:</strong> Join Doc (2-6pm) — Vinyl gems, album cuts, music history.</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-700 font-bold mr-3">🌆</span>
              <span><strong>Evening storytellers:</strong> Listen to Carmen (6-10pm) — Cross-cultural, bilingual, border ballads.</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-700 font-bold mr-3">🌙</span>
              <span><strong>Night owls:</strong> Keep Cody company (10pm-2am) — Honky-tonk, outlaw country, late-night vibes.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-100 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-serif font-bold mb-6 text-gray-900">
            Make NCR Part of Your Day
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Set your alarm. Bookmark your favorite show. Build a listening habit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              href="/djs"
              className="inline-flex items-center space-x-2 bg-amber-700 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-800 transition-colors shadow-lg"
            >
              <span>Meet the DJs</span>
            </Link>
            <Link
              href="/station"
              className="inline-flex items-center space-x-2 border-2 border-amber-700 text-amber-800 px-8 py-4 rounded-lg text-lg font-bold hover:bg-amber-50 transition-colors"
            >
              <span>Back to Station</span>
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
        </div>
      </footer>
    </main>
  );
}

function TimeSlot({
  time,
  show,
  dj,
  mood,
  color
}: {
  time: string;
  show: string;
  dj: string;
  mood: string;
  color: string;
}) {
  return (
    <div className={`${color} text-white rounded-xl p-6 shadow-lg`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-semibold">{time}</span>
          </div>
          <h3 className="text-2xl font-serif font-bold mb-1">{show}</h3>
          <p className="text-sm opacity-90 mb-2">with {dj}</p>
          <p className="text-sm italic opacity-80">{mood}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            href="/djs"
            className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View DJ Profile →
          </Link>
        </div>
      </div>
    </div>
  );
}

function WeekendSlot({
  time,
  show,
  dj,
  focus
}: {
  time: string;
  show: string;
  dj: string;
  focus: string;
}) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 shadow-md">
      <div className="flex items-start space-x-3 mb-2">
        <Clock className="w-5 h-5 text-amber-700 mt-1" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 mb-1">{time}</p>
          <h4 className="text-xl font-bold text-gray-900 mb-1">{show}</h4>
          <p className="text-sm text-gray-700 mb-2">with {dj}</p>
          <p className="text-sm text-gray-600">{focus}</p>
        </div>
      </div>
    </div>
  );
}

function SpecialBlock({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6 shadow-md">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </div>
  );
}
