import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api/errors";
import { withRateLimit } from "@/lib/rate-limit/limiter";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, "auth");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Find valid, unused token
    const authToken = await prisma.authToken.findUnique({
      where: { token },
    });

    if (!authToken) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    if (authToken.type !== "password_reset") {
      return NextResponse.json({ error: "Invalid token type" }, { status: 400 });
    }

    if (authToken.usedAt) {
      return NextResponse.json({ error: "This reset link has already been used" }, { status: 400 });
    }

    if (new Date() > authToken.expiresAt) {
      return NextResponse.json({ error: "This reset link has expired" }, { status: 400 });
    }

    // Find user
    const user = await prisma.organizationUser.findFirst({
      where: { email: authToken.email, isActive: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 400 });
    }

    // Update password and mark token as used
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.organizationUser.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password has been reset. You can now log in.",
    });
  } catch (error) {
    return handleApiError(error, "/api/operator/reset-password");
  }
}
