import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

const SEED_REWARDS = [
  {
    name: "TrueFans Sticker Pack",
    description: "Set of 5 vinyl stickers featuring TrueFans RADIO branding and DJ characters",
    category: "merch",
    xpCost: 200,
    icon: "sticker",
    minLevel: 1,
    fulfillmentType: "manual",
  },
  {
    name: "On-Air Shoutout",
    description: "Get a personalized shoutout from one of our AI DJs during their next show",
    category: "shoutout",
    xpCost: 500,
    icon: "shoutout",
    minLevel: 2,
    fulfillmentType: "automatic",
  },
  {
    name: "Song Dedication",
    description: "Dedicate a song to someone special — our DJ will introduce it with your message",
    category: "shoutout",
    xpCost: 750,
    icon: "dedication",
    minLevel: 3,
    fulfillmentType: "automatic",
  },
  {
    name: "TrueFans Coffee Mug",
    description: "Ceramic mug with the TrueFans RADIO logo — perfect for morning drive listening",
    category: "merch",
    xpCost: 1000,
    icon: "mug",
    minLevel: 3,
    fulfillmentType: "manual",
  },
  {
    name: "Exclusive Playlist Access",
    description: "Unlock a curated playlist of unreleased tracks from TrueFans artists",
    category: "exclusive",
    xpCost: 300,
    icon: "playlist",
    minLevel: 2,
    fulfillmentType: "digital",
  },
  {
    name: "TrueFans T-Shirt",
    description: "Premium soft cotton tee with the TrueFans RADIO design. Available in S-XXL",
    category: "merch",
    xpCost: 2000,
    icon: "tshirt",
    minLevel: 5,
    fulfillmentType: "manual",
  },
  {
    name: "Early Access: New Artists",
    description: "Get early access to new artists before they enter regular rotation",
    category: "exclusive",
    xpCost: 150,
    icon: "early_access",
    minLevel: 1,
    fulfillmentType: "digital",
  },
  {
    name: "Virtual Meet & Greet",
    description: "Join a virtual hangout with a featured TrueFans artist (monthly event)",
    category: "experience",
    xpCost: 3000,
    icon: "interview",
    totalSupply: 10,
    remaining: 10,
    minLevel: 5,
    fulfillmentType: "manual",
  },
  {
    name: "TrueFans Hat",
    description: "Embroidered trucker cap with the TrueFans RADIO logo",
    category: "merch",
    xpCost: 1500,
    icon: "hat",
    minLevel: 4,
    fulfillmentType: "manual",
  },
  {
    name: "Custom DJ Intro",
    description: "Get a custom intro message recorded by your favorite DJ persona",
    category: "shoutout",
    xpCost: 1200,
    icon: "shoutout",
    minLevel: 4,
    fulfillmentType: "automatic",
  },
];

/**
 * POST /api/rewards/seed
 *
 * Seeds the reward catalog. Admin only.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    // Check if already seeded
    const existing = await prisma.rewardOption.count();
    if (existing > 0) {
      return NextResponse.json({
        message: `Already seeded with ${existing} rewards. Delete existing rewards first to re-seed.`,
      });
    }

    const created = await prisma.rewardOption.createMany({
      data: SEED_REWARDS.map((r) => ({
        name: r.name,
        description: r.description,
        category: r.category,
        xpCost: r.xpCost,
        icon: r.icon,
        minLevel: r.minLevel,
        fulfillmentType: r.fulfillmentType,
        totalSupply: r.totalSupply ?? null,
        remaining: r.remaining ?? null,
        isActive: true,
      })),
    });

    return NextResponse.json({
      success: true,
      count: created.count,
      message: `Seeded ${created.count} reward options`,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
