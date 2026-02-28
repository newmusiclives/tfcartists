import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/rewards
 *
 * Returns available reward options.
 * Query params:
 * - category: filter by category (merch, shoutout, exclusive, experience)
 * - listenerId: optional, to include redemption history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const listenerId = searchParams.get("listenerId");

    const where: Record<string, unknown> = { isActive: true };
    if (category) {
      where.category = category;
    }

    const rewards = await prisma.rewardOption.findMany({
      where,
      orderBy: { xpCost: "asc" },
    });

    // If listenerId provided, fetch their redemption history
    let redemptions: { rewardId: string; status: string; createdAt: Date }[] = [];
    if (listenerId) {
      redemptions = await prisma.redemption.findMany({
        where: { listenerId },
        select: { rewardId: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      rewards: rewards.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        category: r.category,
        xpCost: r.xpCost,
        icon: r.icon,
        remaining: r.remaining,
        totalSupply: r.totalSupply,
        minLevel: r.minLevel,
        fulfillmentType: r.fulfillmentType,
      })),
      redemptions: redemptions.map((r) => ({
        rewardId: r.rewardId,
        status: r.status,
        redeemedAt: r.createdAt,
      })),
    });
  } catch (error) {
    logger.error("Error fetching rewards", { error });
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}

/**
 * POST /api/rewards
 *
 * Redeem a reward. Deducts XP from listener.
 * Body: { listenerId, rewardId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listenerId, rewardId } = body;

    if (!listenerId || !rewardId) {
      return NextResponse.json(
        { error: "Missing required fields: listenerId, rewardId" },
        { status: 400 }
      );
    }

    // Fetch listener and reward
    const [listener, reward] = await Promise.all([
      prisma.listener.findUnique({ where: { id: listenerId } }),
      prisma.rewardOption.findUnique({ where: { id: rewardId } }),
    ]);

    if (!listener) {
      return NextResponse.json({ error: "Listener not found" }, { status: 404 });
    }
    if (!reward || !reward.isActive) {
      return NextResponse.json({ error: "Reward not available" }, { status: 404 });
    }

    // Check level requirement
    if (listener.xpLevel < reward.minLevel) {
      return NextResponse.json(
        { error: `You need to be Level ${reward.minLevel} to redeem this reward` },
        { status: 400 }
      );
    }

    // Check XP balance
    if (listener.xpTotal < reward.xpCost) {
      return NextResponse.json(
        { error: `Not enough XP. You need ${reward.xpCost} XP but have ${listener.xpTotal}` },
        { status: 400 }
      );
    }

    // Check supply
    if (reward.remaining !== null && reward.remaining <= 0) {
      return NextResponse.json({ error: "This reward is sold out" }, { status: 400 });
    }

    // Create redemption and deduct XP in a transaction
    const [redemption] = await prisma.$transaction([
      prisma.redemption.create({
        data: {
          listenerId,
          rewardId,
          xpSpent: reward.xpCost,
          status: "pending",
        },
      }),
      prisma.listener.update({
        where: { id: listenerId },
        data: { xpTotal: { decrement: reward.xpCost } },
      }),
      // Log the XP spend
      prisma.xPTransaction.create({
        data: {
          userId: listenerId,
          userType: "listener",
          action: "reward_redemption",
          xpAmount: -reward.xpCost,
          metadata: JSON.stringify({ rewardId, rewardName: reward.name }),
        },
      }),
      // Decrement supply if limited
      ...(reward.remaining !== null
        ? [
            prisma.rewardOption.update({
              where: { id: rewardId },
              data: { remaining: { decrement: 1 } },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({
      success: true,
      redemption: {
        id: redemption.id,
        rewardName: reward.name,
        xpSpent: reward.xpCost,
        status: "pending",
      },
      newXpTotal: listener.xpTotal - reward.xpCost,
    }, { status: 201 });
  } catch (error) {
    logger.error("Error redeeming reward", { error });
    return NextResponse.json({ error: "Failed to redeem reward" }, { status: 500 });
  }
}
