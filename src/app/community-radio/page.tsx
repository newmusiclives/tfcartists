import Link from "next/link";
import {
  Radio,
  ArrowLeft,
  ArrowRight,
  CloudSun,
  CalendarDays,
  Megaphone,
  Store,
  CheckCircle,
  Building2,
  GraduationCap,
  MapPin,
  Users,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Community Radio — TrueFans Radio",
  description:
    "AI-powered community radio that brings your town together. Local weather, events, business sponsors, and 24/7 programming.",
};

export default function CommunityRadioPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <Radio className="w-5 h-5 text-emerald-500" />
              <span className="font-bold text-white">TrueFans Radio</span>
            </Link>
            <Link
              href="/operate"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              For Operators
            </Link>
          </div>
        </div>
      </nav>

      {/* Section 1: Hero */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-6">
            <Radio className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Your Town Deserves Its Own{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Radio Station
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-zinc-400 max-w-2xl mx-auto mb-4">
            AI-powered community radio that brings your town together — with
            local weather, events, business sponsors, and 24/7 programming.
          </p>
          <p className="text-zinc-500 mb-10 max-w-xl mx-auto">
            No broadcast license. No expensive equipment. No technical skills.
            Launch in days and let AI handle the rest.
          </p>
          <Link
            href="/operator/signup?plan=growth"
            className="inline-flex items-center space-x-2 bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <span>Start Your Community Station</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Section 2: Features Grid */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything a Community Station Needs
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Built-in features that keep your town connected and informed, all
            managed by AI.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: CloudSun,
                title: "Local Weather Updates",
                desc: "Automatic weather reports voiced by your AI DJs. Current conditions, forecasts, and severe weather alerts — all localized to your area and delivered on-air throughout the day.",
                color: "sky",
              },
              {
                icon: CalendarDays,
                title: "Community Event Calendar",
                desc: "Promote local events on-air and online. Farmers markets, fundraisers, town halls, and festivals — your AI DJs announce upcoming events and keep the community in the loop.",
                color: "amber",
              },
              {
                icon: Megaphone,
                title: "Town Announcements",
                desc: "Emergency alerts, school closings, road work updates, and community news. Your station becomes the trusted voice of your town with timely, automated announcements.",
                color: "rose",
              },
              {
                icon: Store,
                title: "Local Business Sponsors",
                desc: "Affordable ad packages starting at just $30 per month. Local businesses support the station and reach their neighbors — no agency or big budget required.",
                color: "emerald",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                    item.color === "sky"
                      ? "bg-sky-500/10"
                      : item.color === "amber"
                        ? "bg-amber-500/10"
                        : item.color === "rose"
                          ? "bg-rose-500/10"
                          : "bg-emerald-500/10"
                  }`}
                >
                  <item.icon
                    className={`w-6 h-6 ${
                      item.color === "sky"
                        ? "text-sky-400"
                        : item.color === "amber"
                          ? "text-amber-400"
                          : item.color === "rose"
                            ? "text-rose-400"
                            : "text-emerald-400"
                    }`}
                  />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Three Steps to Go Live
          </h2>
          <p className="text-zinc-400 text-center mb-14 max-w-xl mx-auto">
            From signup to broadcast in days, not months.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Choose Your Community Template",
                desc: "Start with a pre-built community radio template featuring AI DJs like Mayor (your civic voice) and Sunset (your evening companion). Customize the vibe to match your town.",
              },
              {
                step: "2",
                title: "Add Local Music & Customize DJs",
                desc: "Upload music from local artists, configure weather and event feeds for your area, and fine-tune your AI DJ personalities to reflect your community's character.",
              },
              {
                step: "3",
                title: "Go Live — AI Handles 24/7",
                desc: "Hit publish and your station runs around the clock. AI DJs deliver weather, announce events, play sponsor ads, and keep the music flowing — all automatically.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 text-white rounded-full font-bold text-xl mb-5">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Sponsor Tiers */}
      <section className="py-20 px-4 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Local Business Sponsor Packages
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Simple, affordable advertising for local businesses. Every sponsor
            helps fund the station and reaches their neighbors on-air.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                tier: "Local Hero",
                price: "$30",
                spots: "30",
                highlight: false,
                benefits: [
                  "30 ad spots per month",
                  'Social media mentions',
                  '"Proudly supports" on-air tag',
                  "Listed on station website",
                ],
              },
              {
                tier: "Bronze",
                price: "$80",
                spots: "60",
                highlight: false,
                benefits: [
                  "60 ad spots per month",
                  "Event promotion on-air",
                  "Logo on station website",
                  "Monthly listener report",
                ],
              },
              {
                tier: "Silver",
                price: "$150",
                spots: "150",
                highlight: true,
                benefits: [
                  "150 ad spots per month",
                  "Featured sponsor segment",
                  "Newsletter inclusion",
                  "Priority event promotion",
                ],
              },
              {
                tier: "Gold",
                price: "$300",
                spots: "300",
                highlight: false,
                benefits: [
                  "300 ad spots per month",
                  "Sponsored hour block",
                  "Premium website placement",
                  "Exclusive event mentions",
                ],
              },
            ].map((item) => (
              <div
                key={item.tier}
                className={`rounded-xl p-6 border ${
                  item.highlight
                    ? "bg-emerald-600/10 border-emerald-500/30 ring-1 ring-emerald-500/20"
                    : "bg-zinc-900 border-zinc-800"
                }`}
              >
                {item.highlight && (
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold mb-1">{item.tier}</h3>
                <div className="mb-1">
                  <span className="text-3xl font-bold text-emerald-400">
                    {item.price}
                  </span>
                  <span className="text-zinc-500 text-sm">/month</span>
                </div>
                <p className="text-xs text-zinc-500 mb-5">
                  {item.spots} ad spots per month
                </p>
                <ul className="space-y-2.5">
                  {item.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start space-x-2 text-sm text-zinc-300"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-zinc-500 text-sm mt-8">
            All packages include professional AI-voiced ad production. Sponsors
            provide their message — we handle the rest.
          </p>
        </div>
      </section>

      {/* Section 5: Use Cases */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Built For Your Community
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto">
            Community radio works anywhere people want to stay connected.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: MapPin,
                title: "Small Towns",
                desc: "Give your town a voice. Local weather, high school sports updates, community events, and the music your neighbors love — all on one station.",
              },
              {
                icon: Building2,
                title: "Chambers of Commerce",
                desc: "A new member benefit and revenue source. Sponsor packages give local businesses affordable on-air advertising while funding the chamber's mission.",
              },
              {
                icon: GraduationCap,
                title: "School Districts",
                desc: "School closings, event announcements, student achievements, and game-day coverage. Keep parents and the community informed automatically.",
              },
              {
                icon: Sparkles,
                title: "Tourism Boards",
                desc: "Welcome visitors with local flavor. Restaurant guides, attraction highlights, event calendars, and the soundtrack of your destination — broadcast 24/7.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start space-x-4 bg-zinc-900 rounded-xl p-6 border border-zinc-800"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-lg shrink-0">
                  <item.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Bring Your Community Together?
          </h2>
          <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
            Launch your town's own AI-powered radio station. No license, no
            equipment, no technical skills. Just your community.
          </p>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 sm:p-12 shadow-xl shadow-emerald-600/10">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/operator/signup?plan=growth"
                className="inline-flex items-center space-x-2 bg-white text-emerald-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-zinc-100 transition-colors shadow-lg w-full sm:w-auto justify-center"
              >
                <Users className="w-5 h-5" />
                <span>Start Your Station</span>
              </Link>
              <Link
                href="/sponsor"
                className="inline-flex items-center space-x-2 bg-white/10 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-colors border border-white/20 w-full sm:w-auto justify-center"
              >
                <Store className="w-5 h-5" />
                <span>Become a Sponsor</span>
              </Link>
            </div>
            <p className="text-emerald-100 text-sm mt-6">
              Station operators start at $299/month. Sponsors start at $30/month.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-sm text-zinc-500">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <Radio className="w-4 h-4 text-emerald-500" />
            <span>TrueFans Radio</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/operate" className="hover:text-white transition-colors">
              For Operators
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
