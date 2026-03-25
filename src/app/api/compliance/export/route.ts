import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/compliance/export?date=2026-03-25&format=csv
 *
 * Fetches the compliance log for the given date and returns it as CSV.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const format = searchParams.get("format") ?? "csv";

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json(
        { error: "date query parameter required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    if (format !== "csv") {
      return NextResponse.json(
        { error: 'Only "csv" format is currently supported' },
        { status: 400 }
      );
    }

    // Fetch log data from internal API
    const origin = req.nextUrl.origin;
    const logRes = await fetch(`${origin}/api/compliance/log?date=${dateStr}`, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
    });

    if (!logRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch log data" },
        { status: 500 }
      );
    }

    const logData = await logRes.json();
    const entries: Array<{
      time: string;
      type: string;
      title: string;
      artist: string;
      duration: number | null;
      djOnDuty: string;
    }> = logData.entries ?? [];

    // Build CSV
    const headers = ["DateTime", "Type", "Title", "Artist", "Duration", "DJ", "Notes"];
    const rows = entries.map((e) => [
      csvEscape(e.time),
      csvEscape(e.type),
      csvEscape(e.title),
      csvEscape(e.artist),
      e.duration !== null ? formatDuration(e.duration) : "",
      csvEscape(e.djOnDuty),
      "", // Notes column - blank for now
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="compliance-log-${dateStr}.csv"`,
      },
    });
  } catch (err) {
    logger.error("Compliance export API error", { error: err });
    return NextResponse.json(
      { error: "Failed to generate export" },
      { status: 500 }
    );
  }
}

function csvEscape(value: string): string {
  if (!value) return '""';
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
