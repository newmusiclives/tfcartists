import { NextRequest, NextResponse } from "next/server";
import { HarperAgent } from "@/lib/ai/harper-agent";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * POST /api/harper/outreach
 * Send initial outreach message to a sponsor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sponsorId, channel = "email", template = "initial_contact" } = body;

    if (!sponsorId) {
      return NextResponse.json({ error: "sponsorId is required" }, { status: 400 });
    }

    // Get sponsor details
    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
    });

    if (!sponsor) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    // Generate outreach message based on template
    const harperAgent = new HarperAgent();

    // Build initial outreach content
    let content = "";
    const businessType = sponsor.businessType || "business";
    const contactName = sponsor.contactName || "there";

    if (template === "initial_contact") {
      content = `Hi ${contactName},

I'm Harper with TrueFans RADIO™ — a new station doing something different: 80% of our ad revenue goes directly to local performing artists.

We have 15,000 listeners in ${sponsor.city || "the area"} who love discovering local businesses. I think ${sponsor.businessName} would be a perfect fit.

Quick question: Would you be open to a 5-minute call to explore a partnership?

Our Bronze package starts at $100/month:
→ 10 radio ads
→ Mentioned to 850+ artists
→ Listed on our community page

Let me know!

Best,
Harper
TrueFans RADIO™
partners@truefansradio.com`;
    }

    // Send the message
    await harperAgent.sendMessage(sponsorId, content, "initial_outreach", channel);

    // Update sponsor stage
    await prisma.sponsor.update({
      where: { id: sponsorId },
      data: {
        pipelineStage: "contacted",
        lastContactedAt: new Date(),
        nextFollowUpAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      },
    });

    logger.info("Harper outreach sent", { sponsorId, channel, template });

    return NextResponse.json({
      success: true,
      message: "Outreach sent successfully",
      sponsorId,
      channel,
    });
  } catch (error: any) {
    logger.error("Harper outreach failed", { error: error.message });
    return NextResponse.json(
      { error: "Failed to send outreach", details: error.message },
      { status: 500 }
    );
  }
}
