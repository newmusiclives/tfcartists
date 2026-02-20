import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { requireRole } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/elliot/listeners
 * List listeners with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("elliot");
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);

    // Filtering
    const status = searchParams.get("status");
    const tier = searchParams.get("tier");
    const search = searchParams.get("search");
    const communityOnly = searchParams.get("community") === "true";

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (tier) {
      where.tier = tier;
    }
    if (communityOnly) {
      where.communityMember = true;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build orderBy
    const allowedSortFields = [
      "createdAt",
      "engagementScore",
      "totalSessions",
      "totalListeningHours",
      "listeningStreak",
      "lastListenedAt",
    ];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderBy = { [orderByField]: sortOrder };

    const [listeners, total] = await Promise.all([
      prisma.listener.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          tier: true,
          engagementScore: true,
          totalSessions: true,
          totalListeningHours: true,
          averageSessionLength: true,
          listeningStreak: true,
          lastListenedAt: true,
          communityMember: true,
          discoverySource: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.listener.count({ where }),
    ]);

    return NextResponse.json({
      listeners,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error, "/api/elliot/listeners");
  }
}

/**
 * POST /api/elliot/listeners
 * Create a new listener record
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("elliot");
    if (!session) return unauthorized();

    const body = await request.json();
    const { name, email, phone, discoverySource, referringArtistId } = body;

    if (!discoverySource) {
      return NextResponse.json(
        { error: "Missing required field: discoverySource" },
        { status: 400 }
      );
    }

    const listener = await prisma.listener.create({
      data: {
        name,
        email,
        phone,
        discoverySource,
        referringArtistId,
      },
    });

    return NextResponse.json({ success: true, listener }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/elliot/listeners");
  }
}
