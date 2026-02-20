import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

interface ActivityItem {
  id: string;
  team: string;
  action: string;
  details: string;
  timestamp: string;
  successful: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Query recent activity from all teams in parallel
    const [rileyActivity, harperActivity, cassidyActivity, elliotActivity] =
      await Promise.all([
        prisma.rileyActivity.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
        prisma.harperActivity.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
        prisma.cassidyActivity.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
        prisma.elliotActivity.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
      ]);

    // Transform into unified feed
    const feed: ActivityItem[] = [];

    for (const a of rileyActivity) {
      const details = a.details as Record<string, string> | null;
      feed.push({
        id: a.id,
        team: "Riley",
        action: formatAction(a.action),
        details: details?.artistName
          ? `${formatAction(a.action)} - ${details.artistName}`
          : formatAction(a.action),
        timestamp: a.createdAt.toISOString(),
        successful: a.successful,
      });
    }

    for (const a of harperActivity) {
      const details = a.details as Record<string, string> | null;
      feed.push({
        id: a.id,
        team: "Harper",
        action: formatAction(a.action),
        details: details?.sponsorName
          ? `${formatAction(a.action)} - ${details.sponsorName}`
          : formatAction(a.action),
        timestamp: a.createdAt.toISOString(),
        successful: a.successful,
      });
    }

    for (const a of cassidyActivity) {
      const details = a.details as Record<string, string> | null;
      feed.push({
        id: a.id,
        team: "Cassidy",
        action: formatAction(a.action),
        details: details?.artistName
          ? `${formatAction(a.action)} - ${details.artistName}`
          : formatAction(a.action),
        timestamp: a.createdAt.toISOString(),
        successful: a.successful,
      });
    }

    for (const a of elliotActivity) {
      const details = a.details as Record<string, string> | null;
      feed.push({
        id: a.id,
        team: "Elliot",
        action: formatAction(a.action),
        details: details?.description || formatAction(a.action),
        timestamp: a.createdAt.toISOString(),
        successful: a.successful,
      });
    }

    // Sort by timestamp descending and limit
    feed.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ activity: feed.slice(0, limit) });
  } catch (error) {
    return handleApiError(error, "/api/management/activity");
  }
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
