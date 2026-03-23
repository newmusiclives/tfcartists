import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit/limiter";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const signupSchema = z.object({
  organizationName: z.string().min(2).max(200),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  plan: z.enum(["launch", "growth", "scale", "network"]).optional(),
});

/** Map frontend plan names to database plan values */
const PLAN_MAP: Record<string, string> = {
  launch: "starter",
  growth: "pro",
  scale: "enterprise",
  network: "network",
};

const MAX_STATIONS_MAP: Record<string, number> = {
  launch: 1,
  growth: 1,
  scale: 3,
  network: 10,
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit signup attempts
    const rateLimitResponse = await withRateLimit(request, "auth");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { organizationName, name, email, password, plan } = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.organizationUser.findFirst({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate slug from org name
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check slug uniqueness
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });
    if (existingOrg) {
      return NextResponse.json(
        { error: "An organization with a similar name already exists" },
        { status: 409 }
      );
    }

    // Create organization + owner user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          ownerName: name,
          ownerEmail: email,
          plan: plan ? PLAN_MAP[plan] : "starter",
          maxStations: plan ? MAX_STATIONS_MAP[plan] : 1,
        },
      });

      const user = await tx.organizationUser.create({
        data: {
          organizationId: org.id,
          email,
          name,
          passwordHash: await hashPassword(password),
          role: "owner",
          isActive: false, // Inactive until email is verified
        },
      });

      // Create email verification token
      const verifyToken = randomBytes(32).toString("hex");
      await tx.authToken.create({
        data: {
          email,
          token: verifyToken,
          type: "email_verification",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      return { org, user, verifyToken };
    });

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl) {
      logger.error("NEXTAUTH_URL not set — cannot send verification email");
    } else {
      const verifyUrl = `${baseUrl}/api/operator/verify-email?token=${result.verifyToken}`;
      try {
        const { messageDelivery } = await import("@/lib/messaging/delivery-service");
        await messageDelivery.send({
          to: email,
          channel: "email",
          subject: "Verify your email — TrueFans RADIO",
          content: `Welcome to TrueFans RADIO!\n\nHi ${name},\n\nPlease verify your email by visiting this link:\n\n${verifyUrl}\n\nThis link expires in 24 hours.\n\n— TrueFans RADIO`,
          artistName: name,
        });
      } catch (err) {
        logger.error("Failed to send verification email", { error: err instanceof Error ? err.message : String(err) });
      }
    }

    // Fire-and-forget welcome email
    try {
      const { sendOperatorWelcomeEmail } = await import("@/lib/messaging/transactional-emails");
      await sendOperatorWelcomeEmail(email, name, plan || "launch");
    } catch (err) {
      logger.warn("Failed to send operator welcome email", { error: err instanceof Error ? err.message : String(err) });
    }

    return NextResponse.json(
      {
        success: true,
        organizationId: result.org.id,
        userId: result.user.id,
        message: "Account created. Please check your email to verify your account.",
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "/api/operator/signup");
  }
}
