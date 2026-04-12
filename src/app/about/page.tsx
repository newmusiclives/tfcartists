import type { Metadata } from "next";
import Link from "next/link";
import { Radio } from "lucide-react";
import { StationName } from "@/components/station-name";

export const metadata: Metadata = {
  title: "About Us | TrueFans RADIO",
  description:
    "Meet the team behind TrueFans RADIO and the North Country Radio network.",
};

interface TeamMember {
  name: string;
  title: string;
  bio: string;
  initials: string;
  photoUrl?: string;
}

const teamRow1: TeamMember[] = [
  {
    name: "Matthew Wood",
    title: "CMO & Co-Founder",
    bio: "His focus is to expand the reach of the platform to music artists on a global scale.",
    initials: "MW",
    photoUrl: "/images/team/matthew-wood.jpg",
  },
  {
    name: "Paul Saunders",
    title: "Founder",
    bio: "Music industry maverick who is passionate about supporting independent artists.",
    initials: "PS",
    photoUrl: "/images/team/paul-saunders.jpeg",
  },
  {
    name: "Alden Lemberg",
    title: "CTO",
    bio: "A student pursuing neuroscience education who builds esteemed products that empower education and drive positive change for the greater good.",
    initials: "AL",
    photoUrl: "/images/team/alden-lemberg.jpg",
  },
];

const teamRow2: TeamMember[] = [
  {
    name: "Lou Bledsoe",
    title: "CCO & Co-Founder",
    bio: "Designer, Photographer and Web Developer focused on enabling music artists to succeed.",
    initials: "LB",
    photoUrl: "/images/team/lou-bledsoe.png",
  },
  {
    name: "John Milton Fogg",
    title: "Author, Writer & Mentor-Coach",
    bio: "Million-selling author, writer, marketer and mentor-coach. Creator and editor of the TrueFans AMP\u2122 and a Champion of the Music Artists First Revolution.",
    initials: "JF",
    photoUrl: "/images/team/john-milton-fogg.jpg",
  },
  {
    name: "Darryl Saunders",
    title: "UK & European Markets",
    bio: "Has experience in hospitality and marketing and will be working closely with us to develop the UK & European markets.",
    initials: "DS",
    photoUrl: "/images/team/darryl-saunders.jpeg",
  },
];

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg overflow-hidden">
      <div className="p-8 text-center">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            className="w-28 h-28 rounded-full object-cover mx-auto mb-4 shadow-md"
          />
        ) : (
          <div className="w-28 h-28 bg-gradient-to-br from-amber-700 to-orange-700 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-md">
            {member.initials}
          </div>
        )}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{member.name}</h3>
        <p className="text-amber-700 font-medium text-sm mt-1">{member.title}</p>
        <p className="text-gray-600 dark:text-zinc-400 text-sm mt-3 leading-relaxed">{member.bio}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-zinc-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Radio className="w-6 h-6 text-amber-700" />
              <StationName className="font-bold text-xl text-gray-900" />
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/station" className="text-amber-700 hover:text-amber-800 font-medium transition-colors">
                Station
              </Link>
              <Link href="/schedule" className="text-amber-700 hover:text-amber-800 font-medium transition-colors">
                Schedule
              </Link>
              <Link href="/network" className="text-gray-600 hover:text-gray-900 transition-colors">
                Network
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-6xl font-serif font-bold text-gray-900 dark:text-white mb-4">About Us</h1>
        <p className="text-xl text-gray-700 dark:text-zinc-300 max-w-3xl mx-auto">
          Meet the people behind the TrueFans RADIO Network and North Country Radio.
        </p>
      </section>

      {/* Team Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-4xl font-serif font-bold text-center mb-12 text-gray-900 dark:text-white">
          The Team
        </h2>

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {teamRow1.map((member) => (
            <TeamCard key={member.name} member={member} />
          ))}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamRow2.map((member) => (
            <TeamCard key={member.name} member={member} />
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="bg-gradient-to-br from-amber-700 to-orange-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-serif font-bold mb-6">Our Mission</h2>
          <p className="text-xl text-amber-100 leading-relaxed">
            TrueFans exists to help independent artists make a living from their music.
            We connect artists with fans through live donations, give them free airplay on
            our radio network, and share 80% of sponsor revenue directly with the artists
            you hear on air.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4">
            <StationName className="text-2xl font-serif font-bold text-white" />
          </div>
          <p className="text-lg italic text-amber-400 mb-6">&quot;Where the music finds you.&quot;</p>
          <p className="text-sm">
            Part of the{" "}
            <Link href="/network" className="text-amber-400 hover:text-amber-300">
              TrueFans RADIO™ Network
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
