import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// All configurable settings with their metadata
const CONFIG_DEFINITIONS: Record<string, { category: string; label: string; encrypted: boolean }> = {
  // Manifest Financial (Payments)
  MANIFEST_API_KEY: { category: "payments", label: "Manifest API Key", encrypted: true },
  MANIFEST_WEBHOOK_SECRET: { category: "payments", label: "Manifest Webhook Secret", encrypted: true },
  MANIFEST_BASE_URL: { category: "payments", label: "Manifest API Base URL", encrypted: false },

  // Email (SendGrid)
  SENDGRID_API_KEY: { category: "email", label: "SendGrid API Key", encrypted: true },
  SENDGRID_FROM_EMAIL: { category: "email", label: "From Email Address", encrypted: false },
  SENDGRID_FROM_NAME: { category: "email", label: "From Name", encrypted: false },

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: { category: "sms", label: "Twilio Account SID", encrypted: true },
  TWILIO_AUTH_TOKEN: { category: "sms", label: "Twilio Auth Token", encrypted: true },
  TWILIO_PHONE_NUMBER: { category: "sms", label: "Twilio Phone Number", encrypted: false },

  // AI Providers
  OPENAI_API_KEY: { category: "ai", label: "OpenAI API Key", encrypted: true },
  ANTHROPIC_API_KEY: { category: "ai", label: "Anthropic API Key", encrypted: true },
  DEFAULT_AI_PROVIDER: { category: "ai", label: "Default AI Provider (openai or claude)", encrypted: false },

  // Authentication
  NEXTAUTH_SECRET: { category: "auth", label: "NextAuth Secret (32+ chars)", encrypted: true },
  NEXTAUTH_URL: { category: "auth", label: "Production URL", encrypted: false },
  ADMIN_PASSWORD: { category: "auth", label: "Admin Password", encrypted: true },
  RILEY_PASSWORD: { category: "auth", label: "Riley Team Password", encrypted: true },
  HARPER_PASSWORD: { category: "auth", label: "Harper Team Password", encrypted: true },
  ELLIOT_PASSWORD: { category: "auth", label: "Elliot Team Password", encrypted: true },
  CASSIDY_PASSWORD: { category: "auth", label: "Cassidy Team Password", encrypted: true },

  // Discovery APIs
  INSTAGRAM_ACCESS_TOKEN: { category: "discovery", label: "Instagram Access Token", encrypted: true },
  TIKTOK_API_KEY: { category: "discovery", label: "TikTok API Key", encrypted: true },
  SPOTIFY_CLIENT_ID: { category: "discovery", label: "Spotify Client ID", encrypted: true },
  SPOTIFY_CLIENT_SECRET: { category: "discovery", label: "Spotify Client Secret", encrypted: true },

  // Voice AI
  VAPI_API_KEY: { category: "discovery", label: "Vapi AI API Key", encrypted: true },
  VAPI_PHONE_NUMBER: { category: "discovery", label: "Vapi Phone Number", encrypted: false },

  // Automation
  CRON_SECRET: { category: "automation", label: "Cron Job Secret", encrypted: true },
  RILEY_ACTIVE: { category: "automation", label: "Riley Active (true/false)", encrypted: false },
  RILEY_MAX_OUTREACH_PER_DAY: { category: "automation", label: "Riley Max Outreach/Day", encrypted: false },

  // Database
  DATABASE_URL: { category: "database", label: "PostgreSQL Connection String", encrypted: true },

  // Monitoring
  SENTRY_DSN: { category: "monitoring", label: "Sentry DSN", encrypted: true },
  UPSTASH_REDIS_REST_URL: { category: "monitoring", label: "Upstash Redis URL", encrypted: true },
  UPSTASH_REDIS_REST_TOKEN: { category: "monitoring", label: "Upstash Redis Token", encrypted: true },
};

function maskValue(value: string): string {
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••" + value.slice(-4);
}

// GET — read all settings with masked values
export async function GET() {
  try {
    const dbConfigs = await prisma.systemConfig.findMany();
    const dbMap = new Map(dbConfigs.map((c) => [c.key, c]));

    const settings = Object.entries(CONFIG_DEFINITIONS).map(([key, def]) => {
      const dbVal = dbMap.get(key);
      // Check env var as fallback
      const envVal = process.env[key];
      const hasValue = !!(dbVal?.value || (envVal && envVal !== "" && !envVal.includes("placeholder")));
      const source = dbVal?.value ? "database" : envVal ? "env" : "not_set";

      return {
        key,
        category: def.category,
        label: def.label,
        encrypted: def.encrypted,
        hasValue,
        source,
        maskedValue: hasValue
          ? def.encrypted
            ? maskValue(dbVal?.value || envVal || "")
            : (dbVal?.value || envVal || "")
          : "",
        updatedAt: dbVal?.updatedAt?.toISOString() || null,
      };
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

// POST — save a setting
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const def = CONFIG_DEFINITIONS[key];
    if (!def) {
      return NextResponse.json({ error: `Unknown setting: ${key}` }, { status: 400 });
    }

    if (value === "" || value === null || value === undefined) {
      // Delete the setting
      await prisma.systemConfig.deleteMany({ where: { key } });
      return NextResponse.json({ success: true, action: "deleted" });
    }

    await prisma.systemConfig.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: {
        key,
        value,
        category: def.category,
        label: def.label,
        encrypted: def.encrypted,
      },
    });

    return NextResponse.json({ success: true, action: "saved" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }
}
