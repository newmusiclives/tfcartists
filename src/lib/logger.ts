/**
 * Application Logger
 *
 * Production-ready logging utility that:
 * - Only logs in development mode (prevents console pollution in production)
 * - Provides structured logging
 * - Can be easily integrated with external logging services (Sentry, Datadog, etc.)
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
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

    // In production, you would send to external logging service
    // For now, only log errors and warnings in production
    if (level === "error" || level === "warn") {
      const logData = {
        timestamp,
        level,
        message,
        ...context,
      };

      // TODO: Send to external logging service (Sentry, Datadog, CloudWatch, etc.)
      console[level](JSON.stringify(logData));
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
