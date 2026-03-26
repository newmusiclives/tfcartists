import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { uploadImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * PUT /api/portal/artist/profile
 * Update artist profile settings (bio, social links, profile image)
 */
export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let artistId: string;
    let bio: string | null = null;
    let genre: string | null = null;
    let socialLinks: Record<string, string> | null = null;
    let profileImageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      artistId = formData.get("artistId") as string;
      bio = formData.get("bio") as string | null;
      genre = formData.get("genre") as string | null;
      const socialLinksStr = formData.get("socialLinks") as string | null;
      if (socialLinksStr) {
        try {
          socialLinks = JSON.parse(socialLinksStr);
        } catch {
          return NextResponse.json({ error: "Invalid socialLinks JSON" }, { status: 400 });
        }
      }

      const profileImage = formData.get("profileImage") as File | null;
      if (profileImage && profileImage.size > 0) {
        // Max 5MB for images
        if (profileImage.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: "Image too large. Max 5MB." }, { status: 400 });
        }
        const buffer = Buffer.from(await profileImage.arrayBuffer());
        const ext = profileImage.name.split(".").pop() || "jpg";
        const filename = `artist-${artistId}-${Date.now()}.${ext}`;
        profileImageUrl = await uploadImage(buffer, "artist-profiles", filename);
      }
    } else {
      const body = await request.json();
      artistId = body.artistId;
      bio = body.bio ?? null;
      genre = body.genre ?? null;
      socialLinks = body.socialLinks ?? null;
    }

    if (!artistId) {
      return NextResponse.json({ error: "Missing artistId" }, { status: 400 });
    }

    // Verify artist exists
    const existing = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, metadata: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Build update data
    const existingMeta = (existing.metadata as Record<string, any>) || {};
    const updateData: Record<string, any> = {};

    if (bio !== null) updateData.bio = bio;
    if (genre !== null) updateData.genre = genre;

    // Store social links and profile image in metadata
    const metadataUpdate: Record<string, any> = { ...existingMeta };
    if (socialLinks !== null) metadataUpdate.socialLinks = socialLinks;
    if (profileImageUrl) metadataUpdate.profileImage = profileImageUrl;

    if (socialLinks !== null || profileImageUrl) {
      updateData.metadata = metadataUpdate;
    }

    const updated = await prisma.artist.update({
      where: { id: artistId },
      data: updateData,
      select: {
        id: true,
        name: true,
        bio: true,
        genre: true,
        email: true,
        metadata: true,
      },
    });

    logger.info("Artist profile updated via portal", { artistId });

    return NextResponse.json({
      artist: updated,
      message: "Profile updated successfully",
    });
  } catch (error) {
    logger.error("Error updating artist profile", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
