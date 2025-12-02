"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  User,
  Mail,
  Phone,
  Music,
  Calendar,
  MessageCircle,
  DollarSign,
  Send,
} from "lucide-react";
import { getStatusColor, formatDateTime, formatCurrency } from "@/lib/utils";

interface Artist {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  genre?: string;
  status: string;
  pipelineStage: string;
  createdAt: string;
  nextShowDate?: string;
  nextShowVenue?: string;
  nextShowCity?: string;
  conversations: Array<{
    id: string;
    channel: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      createdAt: string;
      intent?: string;
    }>;
  }>;
  shows: Array<{
    id: string;
    date: string;
    venue: string;
    city: string;
    status: string;
    donationCount: number;
    totalRaised: number;
  }>;
  donations: Array<{
    id: string;
    amount: number;
    fanName?: string;
    createdAt: string;
    isFirstWin: boolean;
  }>;
}

export default function ArtistDetailPage() {
  const params = useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchArtist() {
      try {
        const res = await fetch(`/api/artists/${params.id}`);
        const data = await res.json();
        setArtist(data.artist);
      } catch (error) {
        console.error("Error fetching artist:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchArtist();
  }, [params.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !artist) return;

    setSending(true);
    try {
      await fetch("/api/riley/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: artist.id,
          message: messageInput,
          channel: "sms",
        }),
      });

      setMessageInput("");
      // Refresh artist data
      const res = await fetch(`/api/artists/${params.id}`);
      const data = await res.json();
      setArtist(data.artist);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleTriggerOutreach = async () => {
    if (!artist) return;

    try {
      await fetch("/api/riley/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: artist.id }),
      });

      // Refresh artist data
      const res = await fetch(`/api/artists/${params.id}`);
      const data = await res.json();
      setArtist(data.artist);
    } catch (error) {
      console.error("Error triggering outreach:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading artist...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Artist not found</div>
      </div>
    );
  }

  const mainConversation = artist.conversations[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/artists"
                className="text-gray-600 hover:text-gray-900 inline-flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Artists</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">Artist Details</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Artist Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{artist.name}</h1>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      artist.status
                    )}`}
                  >
                    {artist.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {artist.email && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{artist.email}</span>
                  </div>
                )}
                {artist.phone && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{artist.phone}</span>
                  </div>
                )}
                {artist.genre && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Music className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{artist.genre}</span>
                  </div>
                )}
              </div>

              {artist.nextShowDate && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-900">Next Show</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>{formatDateTime(artist.nextShowDate)}</div>
                    <div>{artist.nextShowVenue}</div>
                    <div>{artist.nextShowCity}</div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={handleTriggerOutreach}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-semibold"
                >
                  Trigger Riley Outreach
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shows</span>
                  <span className="font-semibold text-gray-900">{artist.shows.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Donations</span>
                  <span className="font-semibold text-gray-900">
                    {artist.donations.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Raised</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(
                      artist.donations.reduce((sum, d) => sum + d.amount, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Conversation & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conversation */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold">Conversation with Riley</h2>
                </div>
              </div>

              {/* Messages */}
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {mainConversation?.messages.length > 0 ? (
                  mainConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "riley" ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-lg ${
                          message.role === "riley"
                            ? "bg-purple-100 text-purple-900"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="text-xs font-semibold mb-1">
                          {message.role === "riley" ? "Riley" : artist.name}
                        </div>
                        <div className="text-sm">{message.content}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDateTime(message.createdAt)}
                        </div>
                        {message.intent && (
                          <div className="text-xs text-purple-600 mt-1">
                            Intent: {message.intent}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No conversation yet. Trigger Riley outreach to start!
                  </div>
                )}
              </div>

              {/* Test Message Input */}
              <div className="p-6 border-t">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Simulate artist message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 inline-flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sending ? "Sending..." : "Send"}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Shows */}
            {artist.shows.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>Shows</span>
                </h3>
                <div className="space-y-3">
                  {artist.shows.map((show) => (
                    <div key={show.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">{show.venue}</div>
                          <div className="text-sm text-gray-600">{show.city}</div>
                          <div className="text-xs text-gray-500">
                            {formatDateTime(show.date)}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(show.status)}`}>
                          {show.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">
                          {show.donationCount} donations
                        </span>
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(show.totalRaised)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Donations */}
            {artist.donations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span>Donations</span>
                </h3>
                <div className="space-y-2">
                  {artist.donations.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex justify-between items-center py-2 border-b last:border-0"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {donation.fanName || "Anonymous"}
                          {donation.isFirstWin && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                              First Win!
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(donation.createdAt)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(donation.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
