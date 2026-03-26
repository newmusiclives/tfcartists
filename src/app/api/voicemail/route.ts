import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { uploadFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as File | null;
    const listenerName = (formData.get("listenerName") as string) || "Anonymous";
    const message = (formData.get("message") as string) || "";

    if (!audio) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 });
    }

    // Upload audio file
    const buffer = Buffer.from(await audio.arrayBuffer());
    const ext = audio.type.includes("webm") ? "webm" : audio.type.includes("wav") ? "wav" : "mp3";
    const filename = `voicemail-${Date.now()}.${ext}`;
    const audioUrl = await uploadFile(buffer, "voicemails", filename);

    // Generate a cuid-like id
    const id = `vm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const key = `voicemail:${id}`;

    const voicemailData = {
      id,
      listenerName,
      message,
      audioUrl,
      status: "new",
      createdAt: new Date().toISOString(),
      duration: null,
    };

    await prisma.systemConfig.create({
      data: {
        key,
        value: JSON.stringify(voicemailData),
        category: "voicemail",
        label: `Voicemail from ${listenerName}`,
        encrypted: false,
      },
    });

    logger.info("Voicemail received", { id, listenerName });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    logger.error("Failed to save voicemail", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to save voicemail" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { category: "voicemail" },
      orderBy: { createdAt: "desc" },
    });

    const voicemails = configs.map((c) => {
      try {
        return { key: c.key, ...JSON.parse(c.value) };
      } catch {
        return { key: c.key, id: c.key, status: "unknown" };
      }
    });

    return NextResponse.json({ voicemails });
  } catch (error) {
    logger.error("Failed to list voicemails", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to list voicemails" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }

    const key = id.startsWith("voicemail:") ? id : `voicemail:${id}`;
    const config = await prisma.systemConfig.findUnique({ where: { key } });

    if (!config) {
      return NextResponse.json({ error: "Voicemail not found" }, { status: 404 });
    }

    const data = JSON.parse(config.value);
    data.status = status;
    data.updatedAt = new Date().toISOString();

    await prisma.systemConfig.update({
      where: { key },
      data: { value: JSON.stringify(data) },
    });

    logger.info("Voicemail status updated", { id, status });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to update voicemail", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to update voicemail" }, { status: 500 });
  }
}
