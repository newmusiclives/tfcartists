import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, getOrgScope } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import {
  generateCsv,
  formatDateForExport,
  formatDateShort,
  formatCurrencyForExport,
  type CsvColumn,
} from "@/lib/exports/csv-generator";
import { generatePdfHtml, type PdfReportOptions } from "@/lib/exports/pdf-report";

export const dynamic = "force-dynamic";

type ExportType = "artists" | "sponsors" | "listeners" | "earnings" | "playback" | "financials";
type ExportFormat = "csv" | "pdf";

// ---------------------------------------------------------------------------
// GET /api/exports?type=artists&format=csv&from=2026-01-01&to=2026-03-31
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const orgScope = getOrgScope(session);

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") as ExportType | null;
    const format = (searchParams.get("format") || "csv") as ExportFormat;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!type || !["artists", "sponsors", "listeners", "earnings", "playback", "financials"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be one of: artists, sponsors, listeners, earnings, playback, financials" },
        { status: 400 }
      );
    }

    if (!["csv", "pdf"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be csv or pdf" },
        { status: 400 }
      );
    }

    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to + "T23:59:59.999Z") : undefined;
    const dateFilter = buildDateFilter(fromDate, toDate);
    const dateRangeLabel = {
      from: from || "Start",
      to: to || "Present",
    };

    // Fetch station name for PDF branding
    const station = await prisma.station.findFirst({ select: { name: true } });
    const stationName = station?.name || "TrueFans Radio";

    let csvContent = "";
    let pdfOptions: PdfReportOptions | null = null;

    switch (type) {
      case "artists":
        ({ csvContent, pdfOptions } = await exportArtists(orgScope, dateFilter, dateRangeLabel, stationName));
        break;
      case "sponsors":
        ({ csvContent, pdfOptions } = await exportSponsors(orgScope, dateFilter, dateRangeLabel, stationName));
        break;
      case "listeners":
        ({ csvContent, pdfOptions } = await exportListeners(orgScope, dateFilter, dateRangeLabel, stationName));
        break;
      case "earnings":
        ({ csvContent, pdfOptions } = await exportEarnings(dateFilter, dateRangeLabel, stationName));
        break;
      case "playback":
        ({ csvContent, pdfOptions } = await exportPlayback(dateFilter, dateRangeLabel, stationName));
        break;
      case "financials":
        ({ csvContent, pdfOptions } = await exportFinancials(orgScope, dateRangeLabel, stationName));
        break;
    }

    if (format === "pdf" && pdfOptions) {
      const html = generatePdfHtml(pdfOptions);
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // CSV response
    const filename = `${type}-export-${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error, "/api/exports");
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDateFilter(from?: Date, to?: Date): { gte?: Date; lt?: Date } | undefined {
  if (!from && !to) return undefined;
  const filter: { gte?: Date; lt?: Date } = {};
  if (from) filter.gte = from;
  if (to) filter.lt = to;
  return filter;
}

interface ExportResult {
  csvContent: string;
  pdfOptions: PdfReportOptions;
}

// ---------------------------------------------------------------------------
// Artists Export
// ---------------------------------------------------------------------------

async function exportArtists(
  orgScope: { organizationId?: string },
  dateFilter: { gte?: Date; lt?: Date } | undefined,
  dateRange: { from: string; to: string },
  stationName: string
): Promise<ExportResult> {
  const artists = await prisma.artist.findMany({
    where: {
      ...orgScope,
      deletedAt: null,
      ...(dateFilter ? { createdAt: dateFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      email: true,
      genre: true,
      status: true,
      airplayTier: true,
      airplayShares: true,
      followerCount: true,
      createdAt: true,
      pipelineStage: true,
    },
  });

  type ArtistRow = (typeof artists)[number];

  const columns: CsvColumn<ArtistRow>[] = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: (r) => r.email || "" },
    { header: "Genre", accessor: (r) => r.genre || "" },
    { header: "Status", accessor: "status" },
    { header: "Airplay Tier", accessor: "airplayTier" },
    { header: "Shares", accessor: "airplayShares" },
    { header: "Followers", accessor: (r) => r.followerCount || 0 },
    { header: "Pipeline Stage", accessor: "pipelineStage" },
    { header: "Joined Date", accessor: (r) => formatDateShort(r.createdAt) },
  ];

  const csvContent = generateCsv(artists as unknown as Record<string, unknown>[], columns as CsvColumn<Record<string, unknown>>[]);

  const pdfOptions: PdfReportOptions = {
    title: "Artist Report",
    subtitle: `${artists.length} artists exported`,
    stationName,
    dateRange,
    columns: [
      { header: "Name" },
      { header: "Email" },
      { header: "Tier" },
      { header: "Shares", align: "right" },
      { header: "Status" },
      { header: "Stage" },
      { header: "Joined" },
    ],
    rows: artists.map((a) => [
      a.name,
      a.email || "",
      a.airplayTier,
      a.airplayShares,
      a.status,
      a.pipelineStage,
      formatDateShort(a.createdAt),
    ]),
    summaryRows: [
      { label: "Total Artists", value: String(artists.length) },
      { label: "FREE Tier", value: String(artists.filter((a) => a.airplayTier === "FREE").length) },
      { label: "Paid Tiers", value: String(artists.filter((a) => a.airplayTier !== "FREE").length) },
      {
        label: "Total Shares",
        value: String(artists.reduce((s, a) => s + a.airplayShares, 0)),
      },
    ],
  };

  return { csvContent, pdfOptions };
}

// ---------------------------------------------------------------------------
// Sponsors Export
// ---------------------------------------------------------------------------

async function exportSponsors(
  orgScope: { organizationId?: string },
  dateFilter: { gte?: Date; lt?: Date } | undefined,
  dateRange: { from: string; to: string },
  stationName: string
): Promise<ExportResult> {
  const sponsors = await prisma.sponsor.findMany({
    where: {
      ...orgScope,
      deletedAt: null,
      ...(dateFilter ? { createdAt: dateFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      sponsorships: {
        where: { status: "active" },
        select: { tier: true, monthlyAmount: true, adSpotsPerMonth: true },
      },
    },
  });

  type SponsorRow = (typeof sponsors)[number];

  const columns: CsvColumn<SponsorRow>[] = [
    { header: "Business Name", accessor: "businessName" },
    { header: "Contact", accessor: (r) => r.contactName || "" },
    { header: "Email", accessor: (r) => r.email || "" },
    { header: "Business Type", accessor: "businessType" },
    { header: "City", accessor: (r) => r.city || "" },
    { header: "State", accessor: (r) => r.state || "" },
    { header: "Status", accessor: "status" },
    { header: "Pipeline Stage", accessor: "pipelineStage" },
    { header: "Tier", accessor: (r) => r.sponsorships[0]?.tier || r.sponsorshipTier || "" },
    { header: "Monthly Amount", accessor: (r) => formatCurrencyForExport(r.sponsorships[0]?.monthlyAmount ?? r.monthlyAmount ?? 0) },
    { header: "Ad Spots/Mo", accessor: (r) => r.sponsorships[0]?.adSpotsPerMonth || 0 },
    { header: "Calls", accessor: "callsCompleted" },
    { header: "Joined Date", accessor: (r) => formatDateShort(r.createdAt) },
  ];

  const csvContent = generateCsv(sponsors as unknown as Record<string, unknown>[], columns as CsvColumn<Record<string, unknown>>[]);

  const totalRevenue = sponsors.reduce(
    (s, sp) => s + (sp.sponsorships[0]?.monthlyAmount ?? sp.monthlyAmount ?? 0),
    0
  );

  const pdfOptions: PdfReportOptions = {
    title: "Sponsor Report",
    subtitle: `${sponsors.length} sponsors exported`,
    stationName,
    dateRange,
    columns: [
      { header: "Business" },
      { header: "Contact" },
      { header: "Type" },
      { header: "Status" },
      { header: "Tier" },
      { header: "Monthly $", align: "right" },
      { header: "Joined" },
    ],
    rows: sponsors.map((sp) => [
      sp.businessName,
      sp.contactName || "",
      sp.businessType,
      sp.status,
      sp.sponsorships[0]?.tier || sp.sponsorshipTier || "",
      formatCurrencyForExport(sp.sponsorships[0]?.monthlyAmount ?? sp.monthlyAmount ?? 0),
      formatDateShort(sp.createdAt),
    ]),
    summaryRows: [
      { label: "Total Sponsors", value: String(sponsors.length) },
      { label: "Active Sponsorships", value: String(sponsors.filter((s) => s.sponsorships.length > 0).length) },
      { label: "Total Monthly Revenue", value: formatCurrencyForExport(totalRevenue) },
    ],
  };

  return { csvContent, pdfOptions };
}

// ---------------------------------------------------------------------------
// Listeners Export
// ---------------------------------------------------------------------------

async function exportListeners(
  orgScope: { organizationId?: string },
  dateFilter: { gte?: Date; lt?: Date } | undefined,
  dateRange: { from: string; to: string },
  stationName: string
): Promise<ExportResult> {
  const listeners = await prisma.listener.findMany({
    where: {
      ...orgScope,
      ...(dateFilter ? { createdAt: dateFilter } : {}),
    },
    orderBy: { totalListeningHours: "desc" },
    take: 2000,
    select: {
      name: true,
      email: true,
      status: true,
      totalSessions: true,
      totalListeningHours: true,
      averageSessionLength: true,
      discoverySource: true,
      lastListenedAt: true,
      createdAt: true,
    },
  });

  type ListenerRow = (typeof listeners)[number];

  const columns: CsvColumn<ListenerRow>[] = [
    { header: "Name", accessor: (r) => r.name || "Anonymous" },
    { header: "Email", accessor: (r) => r.email || "" },
    { header: "Status", accessor: "status" },
    { header: "Sessions", accessor: "totalSessions" },
    { header: "Listening Hours", accessor: (r) => r.totalListeningHours.toFixed(1) },
    { header: "Avg Session (min)", accessor: (r) => r.averageSessionLength.toFixed(1) },
    { header: "Source", accessor: "discoverySource" },
    { header: "Last Listened", accessor: (r) => formatDateForExport(r.lastListenedAt) },
    { header: "Registered", accessor: (r) => formatDateShort(r.createdAt) },
  ];

  const csvContent = generateCsv(listeners as unknown as Record<string, unknown>[], columns as CsvColumn<Record<string, unknown>>[]);

  const totalHours = listeners.reduce((s, l) => s + l.totalListeningHours, 0);

  const pdfOptions: PdfReportOptions = {
    title: "Listener Report",
    subtitle: `Top ${listeners.length} listeners by listening hours`,
    stationName,
    dateRange,
    columns: [
      { header: "Name" },
      { header: "Status" },
      { header: "Sessions", align: "right" },
      { header: "Hours", align: "right" },
      { header: "Avg Min", align: "right" },
      { header: "Source" },
      { header: "Registered" },
    ],
    rows: listeners.map((l) => [
      l.name || "Anonymous",
      l.status,
      l.totalSessions,
      l.totalListeningHours.toFixed(1),
      l.averageSessionLength.toFixed(1),
      l.discoverySource,
      formatDateShort(l.createdAt),
    ]),
    summaryRows: [
      { label: "Total Listeners", value: String(listeners.length) },
      { label: "Total Listening Hours", value: totalHours.toFixed(1) },
      {
        label: "Active Listeners",
        value: String(listeners.filter((l) => l.status === "ACTIVE").length),
      },
    ],
  };

  return { csvContent, pdfOptions };
}

// ---------------------------------------------------------------------------
// Earnings Export
// ---------------------------------------------------------------------------

async function exportEarnings(
  dateFilter: { gte?: Date; lt?: Date } | undefined,
  dateRange: { from: string; to: string },
  stationName: string
): Promise<ExportResult> {
  const earnings = await prisma.radioEarnings.findMany({
    where: dateFilter ? { createdAt: dateFilter } : {},
    orderBy: { createdAt: "desc" },
    take: 5000,
    select: {
      artistId: true,
      period: true,
      tier: true,
      shares: true,
      earnings: true,
      paid: true,
      paidAt: true,
      createdAt: true,
    },
  });

  // Fetch artist names
  const artistIds = [...new Set(earnings.map((e) => e.artistId))];
  const artists = artistIds.length > 0
    ? await prisma.artist.findMany({
        where: { id: { in: artistIds } },
        select: { id: true, name: true },
      })
    : [];
  const artistMap = new Map(artists.map((a) => [a.id, a.name]));

  type EarningRow = (typeof earnings)[number] & { artistName: string };
  const rows: EarningRow[] = earnings.map((e) => ({
    ...e,
    artistName: artistMap.get(e.artistId) || e.artistId,
  }));

  const columns: CsvColumn<EarningRow>[] = [
    { header: "Artist", accessor: "artistName" },
    { header: "Period", accessor: "period" },
    { header: "Tier", accessor: "tier" },
    { header: "Shares", accessor: "shares" },
    { header: "Earnings", accessor: (r) => formatCurrencyForExport(r.earnings) },
    { header: "Paid", accessor: (r) => (r.paid ? "Yes" : "No") },
    { header: "Paid Date", accessor: (r) => formatDateShort(r.paidAt) },
    { header: "Payment Method", accessor: () => "Manifest Financial" },
  ];

  const csvContent = generateCsv(rows as unknown as Record<string, unknown>[], columns as CsvColumn<Record<string, unknown>>[]);

  const totalEarnings = earnings.reduce((s, e) => s + e.earnings, 0);
  const totalPaid = earnings.filter((e) => e.paid).reduce((s, e) => s + e.earnings, 0);

  const pdfOptions: PdfReportOptions = {
    title: "Earnings Report",
    subtitle: `${earnings.length} earnings records via Manifest Financial`,
    stationName,
    dateRange,
    columns: [
      { header: "Artist" },
      { header: "Period" },
      { header: "Tier" },
      { header: "Shares", align: "right" },
      { header: "Earnings", align: "right" },
      { header: "Paid" },
      { header: "Method" },
    ],
    rows: rows.map((r) => [
      r.artistName,
      r.period,
      r.tier,
      r.shares,
      formatCurrencyForExport(r.earnings),
      r.paid ? "Yes" : "No",
      "Manifest Financial",
    ]),
    summaryRows: [
      { label: "Total Records", value: String(earnings.length) },
      { label: "Total Earnings", value: formatCurrencyForExport(totalEarnings) },
      { label: "Total Paid Out", value: formatCurrencyForExport(totalPaid) },
      { label: "Pending", value: formatCurrencyForExport(totalEarnings - totalPaid) },
      { label: "Payment Provider", value: "Manifest Financial" },
    ],
  };

  return { csvContent, pdfOptions };
}

// ---------------------------------------------------------------------------
// Playback Export
// ---------------------------------------------------------------------------

async function exportPlayback(
  dateFilter: { gte?: Date; lt?: Date } | undefined,
  dateRange: { from: string; to: string },
  stationName: string
): Promise<ExportResult> {
  const playbacks = await prisma.trackPlayback.findMany({
    where: dateFilter ? { playedAt: dateFilter } : {},
    orderBy: { playedAt: "desc" },
    take: 5000,
    select: {
      trackTitle: true,
      artistName: true,
      duration: true,
      playedAt: true,
      timeSlot: true,
      listenerCount: true,
      likeCount: true,
      skipCount: true,
      dj: { select: { name: true } },
    },
  });

  type PlaybackRow = (typeof playbacks)[number];

  const columns: CsvColumn<PlaybackRow>[] = [
    { header: "Track", accessor: "trackTitle" },
    { header: "Artist", accessor: "artistName" },
    { header: "DJ", accessor: (r) => r.dj?.name || "AutoDJ" },
    { header: "Duration (sec)", accessor: (r) => r.duration || 0 },
    { header: "Time Slot", accessor: "timeSlot" },
    { header: "Listeners", accessor: (r) => r.listenerCount || 0 },
    { header: "Likes", accessor: "likeCount" },
    { header: "Skips", accessor: "skipCount" },
    { header: "Played At", accessor: (r) => formatDateForExport(r.playedAt) },
  ];

  const csvContent = generateCsv(playbacks as unknown as Record<string, unknown>[], columns as CsvColumn<Record<string, unknown>>[]);

  const totalListenerMinutes = playbacks.reduce(
    (s, p) => s + ((p.listenerCount || 0) * (p.duration || 0)) / 60,
    0
  );

  const pdfOptions: PdfReportOptions = {
    title: "Playback Report",
    subtitle: `${playbacks.length} tracks played`,
    stationName,
    dateRange,
    columns: [
      { header: "Track" },
      { header: "Artist" },
      { header: "DJ" },
      { header: "Dur.", align: "right" },
      { header: "Slot" },
      { header: "Listeners", align: "right" },
      { header: "Played At" },
    ],
    rows: playbacks.map((p) => [
      p.trackTitle,
      p.artistName,
      p.dj?.name || "AutoDJ",
      p.duration ? `${Math.floor(p.duration / 60)}:${String(p.duration % 60).padStart(2, "0")}` : "0:00",
      p.timeSlot,
      p.listenerCount || 0,
      formatDateForExport(p.playedAt),
    ]),
    summaryRows: [
      { label: "Total Plays", value: String(playbacks.length) },
      { label: "Total Listener-Minutes", value: Math.round(totalListenerMinutes).toLocaleString() },
      { label: "Unique Artists", value: String(new Set(playbacks.map((p) => p.artistName)).size) },
    ],
  };

  return { csvContent, pdfOptions };
}

// ---------------------------------------------------------------------------
// Financials Export
// ---------------------------------------------------------------------------

async function exportFinancials(
  orgScope: { organizationId?: string },
  dateRange: { from: string; to: string },
  stationName: string
): Promise<ExportResult> {
  // Gather the same data the financials dashboard uses
  const [freeArtists, tier5, tier20, tier50, tier120] = await Promise.all([
    prisma.artist.count({ where: { airplayTier: "FREE", deletedAt: null, ...orgScope } }),
    prisma.artist.count({ where: { airplayTier: "TIER_5", deletedAt: null, ...orgScope } }),
    prisma.artist.count({ where: { airplayTier: "TIER_20", deletedAt: null, ...orgScope } }),
    prisma.artist.count({ where: { airplayTier: "TIER_50", deletedAt: null, ...orgScope } }),
    prisma.artist.count({ where: { airplayTier: "TIER_120", deletedAt: null, ...orgScope } }),
  ]);

  const artistSubscriptionRevenue = tier5 * 5 + tier20 * 20 + tier50 * 50 + tier120 * 120;

  const activeSponsorships = await prisma.sponsorship.findMany({
    where: { status: "active" },
    select: { tier: true, monthlyAmount: true },
  });
  const sponsorRevenue = activeSponsorships.reduce((s, sp) => s + sp.monthlyAmount, 0);

  const [totalListeners, activeListeners] = await Promise.all([
    prisma.listener.count({ where: orgScope }),
    prisma.listener.count({ where: { status: "ACTIVE", ...orgScope } }),
  ]);

  const totalGross = artistSubscriptionRevenue + sponsorRevenue;
  const artistPool = sponsorRevenue * 0.8;
  const stationRetained = totalGross - artistPool;

  // Build rows for financial line items
  type FinRow = {
    category: string;
    item: string;
    count: number;
    amount: number;
    note: string;
  };

  const finRows: FinRow[] = [
    { category: "Revenue", item: "Artist Subscriptions - FREE", count: freeArtists, amount: 0, note: "Free tier" },
    { category: "Revenue", item: "Artist Subscriptions - TIER_5", count: tier5, amount: tier5 * 5, note: "$5/mo each" },
    { category: "Revenue", item: "Artist Subscriptions - TIER_20", count: tier20, amount: tier20 * 20, note: "$20/mo each" },
    { category: "Revenue", item: "Artist Subscriptions - TIER_50", count: tier50, amount: tier50 * 50, note: "$50/mo each" },
    { category: "Revenue", item: "Artist Subscriptions - TIER_120", count: tier120, amount: tier120 * 120, note: "$120/mo each" },
    { category: "Revenue", item: "Sponsor Revenue", count: activeSponsorships.length, amount: sponsorRevenue, note: "Active sponsorships" },
    { category: "Distribution", item: "Artist Pool (80% of sponsor)", count: 0, amount: artistPool, note: "Distributed by shares" },
    { category: "Distribution", item: "Station Retained", count: 0, amount: stationRetained, note: "20% sponsor + subs" },
    { category: "Summary", item: "Total Gross Revenue", count: 0, amount: totalGross, note: "Monthly" },
    { category: "Summary", item: "Annual Projection", count: 0, amount: totalGross * 12, note: "x12 months" },
  ];

  const columns: CsvColumn<FinRow>[] = [
    { header: "Category", accessor: "category" },
    { header: "Line Item", accessor: "item" },
    { header: "Count", accessor: "count" },
    { header: "Amount", accessor: (r) => formatCurrencyForExport(r.amount) },
    { header: "Note", accessor: "note" },
  ];

  const csvContent = generateCsv(finRows as unknown as Record<string, unknown>[], columns as CsvColumn<Record<string, unknown>>[]);

  const pdfOptions: PdfReportOptions = {
    title: "Financial Summary",
    subtitle: "Revenue, expenses, and distribution breakdown",
    stationName,
    dateRange,
    columns: [
      { header: "Category" },
      { header: "Line Item" },
      { header: "Count", align: "right" },
      { header: "Amount", align: "right" },
      { header: "Note" },
    ],
    rows: finRows.map((r) => [
      r.category,
      r.item,
      r.count || "",
      formatCurrencyForExport(r.amount),
      r.note,
    ]),
    summaryRows: [
      { label: "Total Gross Revenue", value: formatCurrencyForExport(totalGross) },
      { label: "Artist Pool", value: formatCurrencyForExport(artistPool) },
      { label: "Station Retained", value: formatCurrencyForExport(stationRetained) },
      { label: "Annual Projection", value: formatCurrencyForExport(totalGross * 12) },
      { label: "Active Listeners", value: String(activeListeners) },
      { label: "Total Listeners", value: String(totalListeners) },
    ],
  };

  return { csvContent, pdfOptions };
}
