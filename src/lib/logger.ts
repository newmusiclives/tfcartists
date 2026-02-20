/**
 * Application Logger
 *
 * Production-ready logging utility that:
 * - Only logs in development mode (prevents console pollution in production)
 * - Provides structured logging
 * - Reports errors to Sentry via lightweight HTTP API in production
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const SENTRY_DSN = process.env.SENTRY_DSN;

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

/**
 * Lightweight Sentry error reporter using the HTTP API.
 * Avoids the heavy @sentry/node SDK to stay within Netlify's function size limits.
 */
async function reportToSentry(message: string, level: "error" | "warning", context?: LogContext) {
  if (!SENTRY_DSN) return;

  try {
    // Parse DSN: https://{key}@{host}/{project_id}
    const dsnUrl = new URL(SENTRY_DSN);
    const key = dsnUrl.username;
    const projectId = dsnUrl.pathname.slice(1);
    const host = dsnUrl.hostname;

    const envelope = JSON.stringify({
      event_id: crypto.randomUUID().replace(/-/g, ""),
      sent_at: new Date().toISOString(),
      dsn: SENTRY_DSN,
    }) + "\n" +
    JSON.stringify({ type: "event" }) + "\n" +
    JSON.stringify({
      event_id: crypto.randomUUID().replace(/-/g, ""),
      timestamp: Date.now() / 1000,
      platform: "node",
      level,
      message: { formatted: message },
      extra: context,
      environment: process.env.NODE_ENV || "production",
      server_name: "truefans-radio",
    });

    await fetch(`https://${host}/api/${projectId}/envelope/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=truefans/1.0, sentry_key=${key}`,
      },
      body: envelope,
    }).catch(() => {}); // Fire and forget
  } catch {
    // Silently fail - don't let error reporting cause errors
  }
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    // Don't log in test environment unless explicitly needed
    if (isTest) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    // In development, use console methods
    if (isDevelopment) {
      const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;

      if (context) {
        logFn(prefix, message, context);
      } else {
        logFn(prefix, message);
      }
      return;
    }

    // In production, log errors and warnings + report to Sentry
    if (level === "error") {
      const logData = { timestamp, level, message, ...context };
      console.error(JSON.stringify(logData));
      reportToSentry(message, "error", context);
    } else if (level === "warn") {
      const logData = { timestamp, level, message, ...context };
      console.warn(JSON.stringify(logData));
    }
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }

  // Convenience method for API logging
  api(method: string, path: string, status: number, duration?: number) {
    this.info(`API ${method} ${path}`, {
      method,
      path,
      status,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  // Convenience method for AI provider logging
  ai(provider: string, model: string, operation: string, context?: LogContext) {
    this.debug(`AI ${provider} ${model} - ${operation}`, {
      provider,
      model,
      operation,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper for measuring operation duration
export function measureDuration<T>(fn: () => T): { result: T; duration: number } {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;
  return { result, duration };
}

// Async version
export async function measureDurationAsync<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}
