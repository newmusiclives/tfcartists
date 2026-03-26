/**
 * POST /api/auth/register
 *
 * Create a new OrganizationUser with hashed password.
 * Requires the caller to be an admin or the owner of the target organization.
 *
 * Body: { email, password, name, organizationId, role? }
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api/auth";
import { handleApiError, forbidden, validationError, conflict } from "@/lib/api/errors";
import { validatePassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  name: z.string().min(1, "Name is required"),
  organizationId: z.string().min(1, "Organization ID is required"),
  role: z.enum(["owner", "admin", "member", "viewer"]).default("member"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Parse and validate body
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(
        "Invalid registration data",
        parsed.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }))
      );
    }

    const { email, password, name, organizationId, role } = parsed.data;

    // Authorization: caller must be admin (super-admin) or owner/admin of target org
    const callerRole = session.user.role;
    const callerOrgId = session.user.organizationId;

    const isSuperAdmin = callerRole === "admin" && !callerOrgId;
    const isOrgOwnerOrAdmin =
      callerOrgId === organizationId &&
      (callerRole === "admin" || callerRole === "owner");

    if (!isSuperAdmin && !isOrgOwnerOrAdmin) {
      // If they have an org, also check if they are owner/admin in OrganizationUser table
      let hasPermission = false;
      if (session.user.id && callerOrgId === organizationId) {
        const callerUser = await prisma.organizationUser.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });
        hasPermission =
          callerUser?.role === "owner" || callerUser?.role === "admin";
      }
      if (!hasPermission) {
        return forbidden("Only admins or organization owners can register new users");
      }
    }

    // Validate password strength
    const pwValidation = validatePassword(password);
    if (!pwValidation.valid) {
      return validationError("Password does not meet requirements",
        pwValidation.errors.map((msg) => ({ field: "password", message: msg }))
      );
    }

    // Check if organization exists
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!org) {
      return validationError("Organization not found");
    }

    // Check for existing user with same email in this org
    const existing = await prisma.organizationUser.findUnique({
      where: { organizationId_email: { organizationId, email: email.toLowerCase() } },
    });
    if (existing) {
      return conflict("A user with this email already exists in this organization");
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.organizationUser.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role,
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "/api/auth/register");
  }
}
