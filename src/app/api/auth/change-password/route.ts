/**
 * POST /api/auth/change-password
 *
 * Change the authenticated user's password.
 * Requires the current password for verification.
 *
 * Body: { currentPassword, newPassword }
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth";
import { handleApiError, validationError, forbidden } from "@/lib/api/errors";
import { validatePassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(1, "New password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Parse body
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        "Invalid request data",
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }))
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Only OrganizationUser accounts can change passwords (not team users)
    const userId = session.user.id;
    if (!userId || userId.endsWith("-1")) {
      // Team users have IDs like "admin-1", "riley-1", etc.
      return forbidden(
        "Password change is only available for organization user accounts, not team accounts"
      );
    }

    // Look up the user
    const orgUser = await prisma.organizationUser.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!orgUser || !orgUser.passwordHash) {
      return forbidden("Cannot change password for this account");
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, orgUser.passwordHash);
    if (!isValid) {
      return validationError("Current password is incorrect", [
        { field: "currentPassword", message: "Current password is incorrect" },
      ]);
    }

    // Validate new password strength
    const pwValidation = validatePassword(newPassword);
    if (!pwValidation.valid) {
      return validationError(
        "New password does not meet requirements",
        pwValidation.errors.map((msg) => ({ field: "newPassword", message: msg }))
      );
    }

    // Prevent reusing the same password
    const isSamePassword = await bcrypt.compare(newPassword, orgUser.passwordHash);
    if (isSamePassword) {
      return validationError("New password must be different from current password", [
        { field: "newPassword", message: "New password must be different from current password" },
      ]);
    }

    // Hash and update
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.organizationUser.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return handleApiError(error, "/api/auth/change-password");
  }
}
