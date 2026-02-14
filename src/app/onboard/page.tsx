"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Calendar, MapPin, Radio, Music, Mic, BarChart3, DollarSign, Heart } from "lucide-react";
import { useStation } from "@/contexts/StationContext";

export default function OnboardPage() {
  const router = useRouter();
  const { currentStation } = useStation();
  const formRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    genre: "",
    discoverySource: "manual",
    sourceHandle: "",
    nextShowDate: "",
    nextShowVenue: "",
    nextShowCity: "",
  });

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);

    try {
      // Create artist
      const artistRes = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          genre: formData.genre,
          discoverySource: formData.discoverySource,
          sourceHandle: formData.sourceHandle,
        }),
      });

      const { artist } = await artistRes.json();

      // If they have a show, book it
      if (formData.nextShowDate && formData.nextShowVenue) {
        await fetch(`/api/artists/${artist.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nextShowDate: new Date(formData.nextShowDate),
            nextShowVenue: formData.nextShowVenue,
            nextShowCity: formData.nextShowCity,
            pipelineStage: "onboarding",
            status: "ONBOARDING",
          }),
        });
      }

      // Trigger Riley to reach out
      await fetch("/api/riley/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: artist.id }),
      });

      // Success! Show confirmation
      router.push(`/onboard/success?name=${encodeURIComponent(formData.name)}`);
    } catch (error) {
      console.error("Error during onboarding:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">{currentStation.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
            <Radio className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Get Your Music on Real Radio
          </h1>
          <p className="text-xl sm:text-2xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Join {currentStation.name} and reach thousands of real listeners every day.
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            We connect independent artists with passionate fans through live radio, curated playlists, and a community that actually supports your music career.
          </p>
          <button
            onClick={scrollToForm}
            className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg"
          >
            Apply Now
          </button>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 px-4 bg-white/60">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Why Artists Choose {currentStation.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: Radio,
                title: "Radio Airplay",
                desc: "Your tracks played on a real station with live DJs, not just an algorithm.",
              },
              {
                icon: BarChart3,
                title: "Fan Analytics",
                desc: "See who's listening, where they are, and how your audience is growing.",
              },
              {
                icon: DollarSign,
                title: "Revenue Sharing",
                desc: "Earn from listener engagement and sponsor partnerships as your fanbase grows.",
              },
              {
                icon: Heart,
                title: "Artist Community",
                desc: "Connect with fellow musicians, collaborate, and share stages together.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-purple-100 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mb-4">
                  <item.icon className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Submit", desc: "Fill out a quick application with your info and music." },
              { step: "2", title: "Get Reviewed", desc: "Our team listens to your tracks and gets in touch." },
              { step: "3", title: "Get Airplay", desc: "Your music goes into rotation on the station." },
              { step: "4", title: "Grow", desc: "Build your fanbase with analytics, events, and community." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-full font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transition */}
      <section className="py-10 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Get Started?</h2>
        <p className="text-gray-600">It takes about 2 minutes.</p>
      </section>

      {/* Form */}
      <main ref={formRef} className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <StepIndicator number={1} active={step === 1} completed={step > 1} />
            <div className="w-16 h-1 bg-gray-300 rounded" />
            <StepIndicator number={2} active={step === 2} completed={step > 2} />
            <div className="w-16 h-1 bg-gray-300 rounded" />
            <StepIndicator number={3} active={step === 3} completed={false} />
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">
              Step {step} of 3:{" "}
              {step === 1 ? "About You" : step === 2 ? "Your Music" : "Your Next Show"}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Let&apos;s Get You Started
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="jane@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Tell Us About Your Music
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre *
                  </label>
                  <select
                    required
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a genre</option>
                    <option value="Rock">Rock</option>
                    <option value="Pop">Pop</option>
                    <option value="Hip Hop">Hip Hop</option>
                    <option value="R&B">R&B</option>
                    <option value="Country">Country</option>
                    <option value="Electronic">Electronic</option>
                    <option value="Jazz">Jazz</option>
                    <option value="Folk">Folk</option>
                    <option value="Indie">Indie</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram Handle (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                      @
                    </span>
                    <input
                      type="text"
                      value={formData.sourceHandle}
                      onChange={(e) =>
                        setFormData({ ...formData, sourceHandle: e.target.value })
                      }
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="yourusername"
                    />
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm text-purple-900">
                    <strong>Pro tip:</strong> Adding your social handle helps us personalize
                    your experience and connect with your existing fanbase.
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  When&apos;s Your Next Show?
                </h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="text-sm text-blue-900">
                    We&apos;ll help you try the 9-word line at your next show and get your first
                    win!
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Show Date
                  </label>
                  <input
                    type="date"
                    value={formData.nextShowDate}
                    onChange={(e) =>
                      setFormData({ ...formData, nextShowDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={formData.nextShowVenue}
                    onChange={(e) =>
                      setFormData({ ...formData, nextShowVenue: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="The Blue Note"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.nextShowCity}
                    onChange={(e) =>
                      setFormData({ ...formData, nextShowCity: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="New York, NY"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">
                    Don&apos;t have a show scheduled? No problem! You can skip this and add it
                    later.
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Back
                </button>
              )}
              <div className="flex-1" />
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : step === 3 ? "Complete Setup" : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function StepIndicator({
  number,
  active,
  completed,
}: {
  number: number;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
        active
          ? "bg-purple-600 text-white"
          : completed
          ? "bg-green-500 text-white"
          : "bg-gray-300 text-gray-600"
      }`}
    >
      {completed ? "✓" : number}
    </div>
  );
}
