import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Radio, Mail, Rss, Calendar, Music, Users } from "lucide-react";
import { NewsletterSignupForm } from "./signup-form";
import { sanitizeHtml } from "@/lib/sanitize";

export const metadata: Metadata = {
  title: "Newsletter | TrueFans RADIO",
  description:
    "Subscribe to our weekly digest. Get top played songs, new artists, and station highlights delivered to your inbox.",
};

export const revalidate = 300; // 5 minutes

async function getLatestDigest() {
  return prisma.newsletterEdition.findFirst({
    where: { type: "weekly_digest" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      subject: true,
      htmlContent: true,
      createdAt: true,
    },
  });
}

async function getDigestArchive() {
  return prisma.newsletterEdition.findMany({
    where: { type: "weekly_digest" },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      subject: true,
      createdAt: true,
      recipientCount: true,
    },
  });
}

async function getSubscriberCount() {
  return prisma.newsletterSubscriber.count({
    where: { isActive: true, confirmedAt: { not: null } },
  });
}

export default async function NewsletterPage() {
  const [latestDigest, archive, subscriberCount] = await Promise.all([
    getLatestDigest(),
    getDigestArchive(),
    getSubscriberCount(),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-700 via-amber-800 to-orange-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Station Newsletter</h1>
          <p className="text-lg text-amber-100 max-w-2xl mx-auto">
            Get the weekly digest with top played songs, new artists, and
            station highlights delivered straight to your inbox.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-amber-200">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Weekly on Mondays
            </span>
            <span className="flex items-center gap-1.5">
              <Music className="w-4 h-4" />
              Top charts & new music
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {subscriberCount} subscribers
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Signup Form */}
        <section className="bg-white rounded-xl shadow-lg p-8 -mt-8 relative z-10">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Subscribe to the Newsletter
          </h2>
          <p className="text-gray-500 mb-6">
            Join {subscriberCount > 0 ? `${subscriberCount}+` : "our"}{" "}
            subscribers and never miss a beat.
          </p>
          <NewsletterSignupForm />
        </section>

        {/* RSS Feeds */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <Rss className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">RSS Feeds</h2>
          </div>
          <p className="text-gray-500 mb-4">
            Follow what&apos;s playing via RSS. Works with any feed reader or
            WordPress widget.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="/api/feed/rss"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Recently Played</p>
                <p className="text-sm text-gray-500">
                  Last 50 tracks with timestamps
                </p>
              </div>
            </a>
            <a
              href="/api/feed/now-playing.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Radio className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Now Playing</p>
                <p className="text-sm text-gray-500">
                  Live single-item feed, updates every request
                </p>
              </div>
            </a>
          </div>
        </section>

        {/* Latest Digest */}
        {latestDigest && (
          <section className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Latest Digest
              </h2>
              <span className="text-sm text-gray-500">
                {new Date(latestDigest.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <h3 className="text-lg font-medium text-amber-800 mb-4">
              {latestDigest.subject}
            </h3>
            <div
              className="newsletter-content prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(latestDigest.htmlContent) }}
            />
          </section>
        )}

        {/* Archive */}
        {archive.length > 1 && (
          <section className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Past Editions
            </h2>
            <div className="divide-y divide-gray-100">
              {archive.map((edition) => (
                <a
                  key={edition.id}
                  href={`/newsletter/${edition.id}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {edition.subject}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(edition.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {edition.recipientCount > 0 && (
                    <span className="text-xs text-gray-400">
                      Sent to {edition.recipientCount}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
