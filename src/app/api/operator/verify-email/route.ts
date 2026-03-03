import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/operator/verify-email?token=xxx
 * Verifies the email and activates the operator account.
 * Redirects to login page on success.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  try {
    const authToken = await prisma.authToken.findUnique({
      where: { token },
    });

    if (!authToken || authToken.type !== "email_verification") {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }

    if (authToken.usedAt) {
      return NextResponse.redirect(new URL("/login?error=already_verified", request.url));
    }

    if (new Date() > authToken.expiresAt) {
      return NextResponse.redirect(new URL("/login?error=token_expired", request.url));
    }

    // Activate the user account
    const user = await prisma.organizationUser.findFirst({
      where: { email: authToken.email },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=account_not_found", request.url));
    }

    await prisma.$transaction([
      prisma.organizationUser.update({
        where: { id: user.id },
        data: { isActive: true },
      }),
      prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.redirect(new URL("/login?verified=true", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
  }
}
