import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import type { CreateSubmissionRequest, SubmissionListItem } from "@/types/cassidy";

/**
 * GET /api/cassidy/submissions
 *
 * Returns list of submissions with optional filtering
 * Query params:
 * - status: filter by status (PENDING, IN_REVIEW, JUDGED, PLACED, NOT_PLACED)
 * - limit: number of results (default: 50)
 * - offset: pagination offset (default: 0)
 *
 * Requires authentication: cassidy or admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role authorization
    const userRole = session.user.role;
    if (userRole !== "cassidy" && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Fetch submissions with reviews count
    const submissions = await prisma.submission.findMany({
      where,
      include: {
        reviews: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Get total judge count
    const totalJudges = await prisma.judge.count({
      where: {
        isActive: true,
      },
    });

    // Transform to list items
    const submissionList: SubmissionListItem[] = submissions.map((sub) => {
      // Calculate time since submission
      const submittedAt = new Date(sub.createdAt);
      const now = new Date();
      const hoursSince = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60));

      let submittedAtText: string;
      if (hoursSince < 1) {
        submittedAtText = "Just now";
      } else if (hoursSince < 24) {
        submittedAtText = `${hoursSince} hour${hoursSince > 1 ? "s" : ""} ago`;
      } else {
        const days = Math.floor(hoursSince / 24);
        submittedAtText = `${days} day${days > 1 ? "s" : ""} ago`;
      }

      return {
        id: sub.id,
        artistName: sub.artistName,
        trackTitle: sub.trackTitle,
        status: sub.status as any,
        tierAwarded: sub.tierAwarded as any,
        submittedAt: submittedAtText,
        judgesCompleted: sub.reviews.length,
        totalJudges: totalJudges || 6,
      };
    });

    // Get total count for pagination
    const total = await prisma.submission.count({ where });

    return NextResponse.json({
      submissions: submissionList,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cassidy/submissions
 *
 * Creates a new submission for review
 * Typically called by Riley's team when inviting an artist
 *
 * Requires authentication: riley, cassidy, or admin role
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role authorization (Riley can submit, Cassidy can manage)
    const userRole = session.user.role;
    if (!["riley", "cassidy", "admin"].includes(userRole || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body: CreateSubmissionRequest = await request.json();

    // Validate required fields
    if (!body.artistName || !body.trackTitle || !body.trackFileUrl) {
      return NextResponse.json(
        { error: "Missing required fields: artistName, trackTitle, trackFileUrl" },
        { status: 400 }
      );
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        artistId: body.artistId || `artist-${Date.now()}`,
        artistName: body.artistName,
        artistEmail: body.artistEmail,
        artistPhone: body.artistPhone,
        trackTitle: body.trackTitle,
        trackFileUrl: body.trackFileUrl,
        trackDuration: body.trackDuration,
        genre: body.genre,
        genreTags: body.genreTags ? JSON.stringify(body.genreTags) : undefined,
        discoverySource: body.discoverySource,
        discoveredBy: body.discoveredBy,
        rileyContext: body.rileyContext,
        submissionType: body.submissionType || "initial",
        premiumFastTrack: body.premiumFastTrack || false,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        artistName: submission.artistName,
        trackTitle: submission.trackTitle,
        status: submission.status,
        createdAt: submission.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}
