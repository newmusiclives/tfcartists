import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { sanitizeHtml } from "@/lib/sanitize";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const edition = await prisma.newsletterEdition.findUnique({
    where: { id },
    select: { subject: true },
  });

  return {
    title: edition ? `${edition.subject} | Newsletter` : "Newsletter Edition",
  };
}

export const revalidate = 3600; // 1 hour

export default async function NewsletterEditionPage({ params }: Props) {
  const { id } = await params;

  const edition = await prisma.newsletterEdition.findUnique({
    where: { id },
    select: {
      id: true,
      subject: true,
      htmlContent: true,
      createdAt: true,
      recipientCount: true,
      sentAt: true,
    },
  });

  if (!edition) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/newsletter"
          className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Newsletter
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-100 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {edition.subject}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(edition.createdAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {edition.recipientCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Sent to {edition.recipientCount} subscribers
                </span>
              )}
            </div>
          </div>

          <div
            className="p-6 newsletter-content prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(edition.htmlContent) }}
          />
        </div>
      </div>
    </main>
  );
}
