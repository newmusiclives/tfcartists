import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit/limiter";
import { randomBytes } from "crypto";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, "auth");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const { email } = parsed.data;

    const user = await prisma.organizationUser.findFirst({
      where: { email, isActive: true },
    });

    if (user) {
      // Invalidate any existing tokens for this email
      await prisma.authToken.updateMany({
        where: { email, type: "password_reset", usedAt: null },
        data: { usedAt: new Date() },
      });

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.authToken.create({
        data: {
          email,
          token,
          type: "password_reset",
          expiresAt,
        },
      });

      // Send reset email via GHL
      const baseUrl = process.env.NEXTAUTH_URL;
      if (!baseUrl) {
        logger.error("NEXTAUTH_URL not set — cannot send reset email");
      } else {
        const resetUrl = `${baseUrl}/operator/reset-password?token=${token}`;
        try {
          const { messageDelivery } = await import("@/lib/messaging/delivery-service");
          await messageDelivery.send({
            to: email,
            channel: "email",
            subject: "Reset your password — TrueFans RADIO",
            content: `Hi ${user.name},\n\nYou requested a password reset. Visit this link to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.\n\n— TrueFans RADIO`,
            artistName: user.name,
          });
        } catch (err) {
          logger.error("Failed to send reset email", { error: err instanceof Error ? err.message : String(err) });
        }
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a reset link has been sent.",
    });
  } catch (error) {
    return handleApiError(error, "/api/operator/forgot-password");
  }
}
