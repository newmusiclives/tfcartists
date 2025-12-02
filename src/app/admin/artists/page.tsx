"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Plus, Search, Filter } from "lucide-react";
import { getStatusColor } from "@/lib/utils";

interface Artist {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  genre?: string;
  status: string;
  pipelineStage: string;
  createdAt: string;
  lastContactedAt?: string;
  conversationCount: number;
  discoverySource: string;
  _count: {
    conversations: number;
    shows: number;
    donations: number;
  };
}

export default function ArtistsListPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    async function fetchArtists() {
      try {
        const url = new URL("/api/artists", window.location.origin);
        if (statusFilter) url.searchParams.set("status", statusFilter);
        url.searchParams.set("limit", "100");

        const res = await fetch(url.toString());
        const data = await res.json();
        setArtists(data.artists);
      } catch (error) {
        console.error("Error fetching artists:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchArtists();
  }, [statusFilter]);

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 inline-flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold">All Artists</h1>
              </div>
            </div>
            <Link
              href="/admin/artists/new"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Artist</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Statuses</option>
                <option value="DISCOVERED">Discovered</option>
                <option value="CONTACTED">Contacted</option>
                <option value="ENGAGED">Engaged</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="ACTIVATED">Activated</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>
          </div>
        </div>

        {/* Artists Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading artists...</div>
          ) : filteredArtists.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No artists found. Try adjusting your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Artist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredArtists.map((artist) => (
                    <tr key={artist.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {artist.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {artist.genre || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{artist.email || "—"}</div>
                        <div className="text-sm text-gray-500">{artist.phone || "—"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            artist.status
                          )}`}
                        >
                          {artist.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {artist.discoverySource}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">
                          {artist._count.conversations} conversations
                        </div>
                        <div className="text-xs text-gray-600">
                          {artist._count.shows} shows
                        </div>
                        <div className="text-xs text-gray-600">
                          {artist._count.donations} donations
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/artists/${artist.id}`}
                          className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
