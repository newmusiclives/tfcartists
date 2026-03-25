import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireAuth } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { getApiKeys, saveApiKeys, type ApiKey } from "@/lib/api/api-key-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/developer/keys
 * Generate a new API key for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const { name, stationId } = body;

    if (!name || !stationId) {
      return NextResponse.json(
        { error: "Missing required fields: name and stationId" },
        { status: 400 }
      );
    }

    // Generate key: tfr_ prefix + 32 hex chars
    const rawKey = `tfr_${randomBytes(16).toString("hex")}`;

    const newKey: ApiKey = {
      id: randomBytes(8).toString("hex"),
      key: rawKey,
      name,
      stationId,
      createdAt: new Date().toISOString(),
      createdBy: session.user?.id || "unknown",
    };

    const keys = await getApiKeys();
    keys.push(newKey);
    await saveApiKeys(keys);

    // Return the full key only on creation (never shown again)
    return NextResponse.json({
      success: true,
      data: {
        id: newKey.id,
        key: rawKey,
        name: newKey.name,
        stationId: newKey.stationId,
        createdAt: newKey.createdAt,
      },
      message: "API key created. Copy it now — it will not be shown again.",
    });
  } catch (error) {
    return handleApiError(error, "/api/developer/keys");
  }
}

/**
 * GET /api/developer/keys
 * List all API keys for the authenticated user (masked).
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user?.id;

    const keys = await getApiKeys();
    const userKeys = keys.filter((k) => k.createdBy === userId);

    // Mask keys: show first 8 chars + "..."
    const masked = userKeys.map((k) => ({
      id: k.id,
      name: k.name,
      stationId: k.stationId,
      keyPreview: k.key.slice(0, 8) + "...",
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt || null,
    }));

    return NextResponse.json({ success: true, data: masked });
  } catch (error) {
    return handleApiError(error, "/api/developer/keys");
  }
}

/**
 * DELETE /api/developer/keys
 * Revoke an API key by ID.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user?.id;

    const body = await request.json();
    const { keyId } = body;

    if (!keyId) {
      return NextResponse.json(
        { error: "Missing required field: keyId" },
        { status: 400 }
      );
    }

    const keys = await getApiKeys();
    const keyIndex = keys.findIndex(
      (k) => k.id === keyId && k.createdBy === userId
    );

    if (keyIndex === -1) {
      return NextResponse.json(
        { error: "API key not found or not owned by you" },
        { status: 404 }
      );
    }

    keys.splice(keyIndex, 1);
    await saveApiKeys(keys);

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully.",
    });
  } catch (error) {
    return handleApiError(error, "/api/developer/keys");
  }
}
