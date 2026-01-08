/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are present
 * and provides type-safe access to them.
 */

import { z } from "zod";

const envSchema = z.object({
  // Database (optional during build, required at runtime)
  DATABASE_URL: z.string().optional(),

  // AI Providers
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  DEFAULT_AI_PROVIDER: z.enum(["openai", "claude"]).default("claude"),

  // Communication (optional for now, required for production)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  INSTAGRAM_ACCESS_TOKEN: z.string().optional(),

  // Manifest Financial (payment processing)
  MANIFEST_API_KEY: z.string().optional(),
  MANIFEST_WEBHOOK_SECRET: z.string().optional(),

  // Social Media Discovery
  TIKTOK_API_KEY: z.string().optional(),
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),

  // Voice AI (Harper's calls)
  VAPI_API_KEY: z.string().optional(),
  VAPI_PHONE_NUMBER: z.string().optional(),

  // NextAuth (optional for now, required for production)
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),

  // Team passwords (optional - defaults provided in auth config)
  ADMIN_PASSWORD: z.string().optional(),
  RILEY_PASSWORD: z.string().optional(),
  HARPER_PASSWORD: z.string().optional(),
  ELLIOT_PASSWORD: z.string().optional(),
  CASSIDY_PASSWORD: z.string().optional(),

  // Automation & Cron
  CRON_SECRET: z.string().optional(),
  RILEY_ACTIVE: z.string().optional(),
  RILEY_MAX_OUTREACH_PER_DAY: z.string().optional(),

  // Rate Limiting (optional - uses in-memory in development)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Error Monitoring
  SENTRY_DSN: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Validate at least one AI provider is configured
const validateEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  const env = parsed.data;

  // Only validate AI providers at runtime, not during build
  // During build (when next build runs), we don't need AI keys
  const isBuildTime = process.env.npm_lifecycle_event === 'build' || process.env.NETLIFY === 'true';

  if (!isBuildTime && !env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
    console.warn("⚠️  No AI provider API key configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)");
    console.warn("⚠️  AI features will not work until you configure at least one provider.");
  }

  // Strict production requirements (skip during build time)
  if (env.NODE_ENV === "production" && !isBuildTime) {
    const missingCriticalVars: string[] = [];
    const missingOptionalVars: string[] = [];

    // Critical variables - MUST be set in production
    if (!env.DATABASE_URL) missingCriticalVars.push("DATABASE_URL");
    if (!env.NEXTAUTH_SECRET) missingCriticalVars.push("NEXTAUTH_SECRET");
    if (!env.NEXTAUTH_URL) missingCriticalVars.push("NEXTAUTH_URL");

    // Validate NEXTAUTH_SECRET strength in production
    if (env.NEXTAUTH_SECRET && env.NEXTAUTH_SECRET.length < 32) {
      console.error("❌ NEXTAUTH_SECRET must be at least 32 characters in production");
      throw new Error("NEXTAUTH_SECRET too weak for production");
    }

    // Validate at least one AI provider is configured
    if (!env.OPENAI_API_KEY && !env.ANTHROPIC_API_KEY) {
      missingCriticalVars.push("OPENAI_API_KEY or ANTHROPIC_API_KEY");
    }

    // Optional but recommended variables
    if (!env.UPSTASH_REDIS_REST_URL) missingOptionalVars.push("UPSTASH_REDIS_REST_URL");
    if (!env.UPSTASH_REDIS_REST_TOKEN) missingOptionalVars.push("UPSTASH_REDIS_REST_TOKEN");
    if (!env.TWILIO_ACCOUNT_SID) missingOptionalVars.push("TWILIO_ACCOUNT_SID");
    if (!env.SENDGRID_API_KEY) missingOptionalVars.push("SENDGRID_API_KEY");

    // Fail hard on missing critical variables
    if (missingCriticalVars.length > 0) {
      console.error("❌ CRITICAL: Missing required production variables:", missingCriticalVars.join(", "));
      throw new Error(`Production deployment failed: Missing critical environment variables: ${missingCriticalVars.join(", ")}`);
    }

    // Warn about missing optional variables
    if (missingOptionalVars.length > 0) {
      console.warn("⚠️  Production deployment missing optional variables:", missingOptionalVars.join(", "));
      console.warn("⚠️  Some features may not work without these variables.");
    }

    console.log("✅ Production environment validation passed");
  }

  return env;
};

export const env = validateEnv();

// Type-safe environment variable access
export type Env = z.infer<typeof envSchema>;
