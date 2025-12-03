"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Calendar, MapPin } from "lucide-react";

export default function OnboardPage() {
  const router = useRouter();
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
              <span className="font-semibold">TrueFans RADIO</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
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
                  Let's Get You Started
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
                  When's Your Next Show?
                </h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="text-sm text-blue-900">
                    We'll help you try the 9-word line at your next show and get your first
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
                    Don't have a show scheduled? No problem! You can skip this and add it
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
