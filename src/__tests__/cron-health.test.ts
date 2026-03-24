import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cronLog: {
      findMany: vi.fn(),
    },
    config: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { GET } from "@/app/api/admin/cron-health/route";

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.cronLog.findMany);

describe("GET /api/admin/cron-health", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma.config.findMany).mockResolvedValue([]);
  });

  it("returns 403 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns 403 for non-admin users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", name: "Riley", role: "riley" },
    } as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("returns healthy: false when jobs have never run", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", name: "Admin", role: "admin" },
    } as any);

    mockFindMany.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.healthy).toBe(false);
    // All jobs should be marked as never_run and overdue
    for (const job of body.jobs) {
      expect(job.status).toBe("never_run");
      expect(job.lastRun).toBeNull();
      expect(job.overdue).toBe(true);
    }
  });

  it("returns healthy: true when all jobs ran recently with success status", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", name: "Admin", role: "admin" },
    } as any);

    const recentDate = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    // Create a log entry for every expected job
    const expectedJobs = [
      "voice-tracks-hour",
      "voice-tracks-daily",
      "voice-tracks-catchup",
      "riley-daily",
      "harper-daily",
      "cassidy-daily",
      "elliot-daily",
      "parker-daily",
      "features-daily",
      "newsletter-weekly",
      "revenue-monthly",
      "promoter-payouts",
    ];

    const logs = expectedJobs.map((jobName) => ({
      id: `log-${jobName}`,
      jobName,
      status: "success",
      createdAt: recentDate,
      duration: 1500,
      error: null,
    }));

    mockFindMany.mockResolvedValue(logs as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.healthy).toBe(true);
    expect(body.checkedAt).toBeDefined();
    for (const job of body.jobs) {
      expect(job.overdue).toBe(false);
      expect(job.status).toBe("success");
    }
  });

  it("marks individual jobs as overdue when they exceed their max gap", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", name: "Admin", role: "admin" },
    } as any);

    const recentDate = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
    // voice-tracks-hour has a 2-hour max gap; 3 hours ago exceeds it
    const overdueDate = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const expectedJobs = [
      "voice-tracks-hour",
      "voice-tracks-daily",
      "voice-tracks-catchup",
      "riley-daily",
      "harper-daily",
      "cassidy-daily",
      "elliot-daily",
      "parker-daily",
      "features-daily",
      "newsletter-weekly",
      "revenue-monthly",
      "promoter-payouts",
    ];

    const logs = expectedJobs.map((jobName) => ({
      id: `log-${jobName}`,
      jobName,
      status: "success",
      createdAt: jobName === "voice-tracks-hour" ? overdueDate : recentDate,
      duration: 1000,
      error: null,
    }));

    mockFindMany.mockResolvedValue(logs as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.healthy).toBe(false); // one job is overdue

    const hourlyJob = body.jobs.find(
      (j: any) => j.name === "voice-tracks-hour"
    );
    expect(hourlyJob.overdue).toBe(true);

    // Other jobs should not be overdue
    const dailyJob = body.jobs.find(
      (j: any) => j.name === "voice-tracks-daily"
    );
    expect(dailyJob.overdue).toBe(false);
  });

  it("includes error field when a job has an error", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", name: "Admin", role: "admin" },
    } as any);

    const recentDate = new Date(Date.now() - 30 * 60 * 1000);

    const expectedJobs = [
      "voice-tracks-hour",
      "voice-tracks-daily",
      "voice-tracks-catchup",
      "riley-daily",
      "harper-daily",
      "cassidy-daily",
      "elliot-daily",
      "parker-daily",
      "features-daily",
      "newsletter-weekly",
      "revenue-monthly",
      "promoter-payouts",
    ];

    const logs = expectedJobs.map((jobName) => ({
      id: `log-${jobName}`,
      jobName,
      status: jobName === "riley-daily" ? "error" : "success",
      createdAt: recentDate,
      duration: 1000,
      error:
        jobName === "riley-daily" ? "TTS API returned 500" : null,
    }));

    mockFindMany.mockResolvedValue(logs as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    // healthy is false because riley-daily has error status (not "success")
    expect(body.healthy).toBe(false);

    const rileyJob = body.jobs.find((j: any) => j.name === "riley-daily");
    expect(rileyJob.status).toBe("error");
    expect(rileyJob.error).toBe("TTS API returned 500");

    // Jobs without errors should not have the error field
    const harperJob = body.jobs.find((j: any) => j.name === "harper-daily");
    expect(harperJob.error).toBeUndefined();
  });
});
