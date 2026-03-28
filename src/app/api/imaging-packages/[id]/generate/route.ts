import { NextRequest, NextResponse } from "next/server";
import { generatePackageScripts, generatePackageAudio } from "@/lib/radio/imaging-package-generator";

export const dynamic = "force-dynamic";

/**
 * POST /api/imaging-packages/[id]/generate
 * Trigger script and/or audio generation for a package.
 *
 * Query: ?step=scripts | ?step=audio | (no step = both)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const step = req.nextUrl.searchParams.get("step");

  try {
    const results: { scripts?: { generated: number; errors: string[] }; audio?: { generated: number; errors: string[] } } = {};

    if (!step || step === "scripts") {
      results.scripts = await generatePackageScripts(id);
    }

    if (!step || step === "audio") {
      results.audio = await generatePackageAudio(id);
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    return NextResponse.json(
      { error: "Generation failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
