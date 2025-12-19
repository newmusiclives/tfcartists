/**
 * Comprehensive API Error Response Schema
 *
 * Standardizes error responses across all API endpoints
 * for consistency, debugging, and client error handling.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

/**
 * Standard error codes
 */
export enum ErrorCode {
  // Authentication & Authorization (401-403)
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Validation Errors (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",

  // Resource Errors (404)
  NOT_FOUND = "NOT_FOUND",
  ARTIST_NOT_FOUND = "ARTIST_NOT_FOUND",
  SPONSOR_NOT_FOUND = "SPONSOR_NOT_FOUND",
  LISTENER_NOT_FOUND = "LISTENER_NOT_FOUND",
  SCOUT_NOT_FOUND = "SCOUT_NOT_FOUND",

  // Conflict Errors (409)
  ALREADY_EXISTS = "ALREADY_EXISTS",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
  STATE_CONFLICT = "STATE_CONFLICT",

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Business Logic Errors (422)
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
  INVALID_STATE_TRANSITION = "INVALID_STATE_TRANSITION",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",

  // External Service Errors (502-504)
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
  PAYMENT_SERVICE_ERROR = "PAYMENT_SERVICE_ERROR",
  SMS_SERVICE_ERROR = "SMS_SERVICE_ERROR",

  // Server Errors (500)
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
}

/**
 * Standard error response structure
 */
export interface ApiErrorResponse {
  error: {
    code: ErrorCode | string;
    message: string;
    details?: Record<string, any>;
    fields?: FieldError[];
    timestamp: string;
    requestId?: string;
    path?: string;
  };
}

/**
 * Field-level validation error
 */
export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Error creation options
 */
interface CreateErrorOptions {
  code: ErrorCode | string;
  message: string;
  details?: Record<string, any>;
  fields?: FieldError[];
  statusCode?: number;
  cause?: Error;
  path?: string;
  requestId?: string;
}

/**
 * Create a standardized API error response
 */
export function createApiError(options: CreateErrorOptions): NextResponse {
  const {
    code,
    message,
    details,
    fields,
    statusCode = 500,
    cause,
    path,
    requestId,
  } = options;

  // Log the error for debugging
  logger.error("API Error", {
    code,
    message,
    details,
    fields,
    statusCode,
    cause: cause ? cause.message : undefined,
    path,
    requestId,
  });

  const errorResponse: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details && { details }),
      ...(fields && fields.length > 0 && { fields }),
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
      ...(path && { path }),
    },
  };

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Quick error response helpers
 */

export function unauthorized(message = "Authentication required"): NextResponse {
  return createApiError({
    code: ErrorCode.UNAUTHORIZED,
    message,
    statusCode: 401,
  });
}

export function forbidden(message = "Access forbidden"): NextResponse {
  return createApiError({
    code: ErrorCode.FORBIDDEN,
    message,
    statusCode: 403,
  });
}

export function notFound(
  resource = "Resource",
  details?: Record<string, any>
): NextResponse {
  return createApiError({
    code: ErrorCode.NOT_FOUND,
    message: `${resource} not found`,
    details,
    statusCode: 404,
  });
}

export function validationError(
  message: string,
  fields?: FieldError[]
): NextResponse {
  return createApiError({
    code: ErrorCode.VALIDATION_ERROR,
    message,
    fields,
    statusCode: 400,
  });
}

export function conflict(
  message: string,
  details?: Record<string, any>
): NextResponse {
  return createApiError({
    code: ErrorCode.ALREADY_EXISTS,
    message,
    details,
    statusCode: 409,
  });
}

export function businessRuleViolation(
  message: string,
  details?: Record<string, any>
): NextResponse {
  return createApiError({
    code: ErrorCode.BUSINESS_RULE_VIOLATION,
    message,
    details,
    statusCode: 422,
  });
}

export function internalServerError(
  message = "Internal server error",
  cause?: Error
): NextResponse {
  return createApiError({
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message,
    statusCode: 500,
    cause,
  });
}

export function externalServiceError(
  service: string,
  message?: string,
  cause?: Error
): NextResponse {
  return createApiError({
    code: ErrorCode.EXTERNAL_SERVICE_ERROR,
    message: message || `${service} service error`,
    details: { service },
    statusCode: 502,
    cause,
  });
}

export function rateLimitExceeded(
  limit?: number,
  remaining?: number,
  reset?: number
): NextResponse {
  return createApiError({
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    message: "Too many requests. Please try again later.",
    details: {
      ...(limit && { limit }),
      ...(remaining !== undefined && { remaining }),
      ...(reset && { reset }),
    },
    statusCode: 429,
  });
}

/**
 * Convert Zod validation errors to standardized field errors
 */
export function formatZodError(error: ZodError): FieldError[] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): NextResponse {
  const fields = formatZodError(error);

  return validationError(
    "Validation failed. Please check the provided data.",
    fields
  );
}

/**
 * Handle Prisma errors
 */
export function handlePrismaError(error: any): NextResponse {
  // Prisma unique constraint violation
  if (error.code === "P2002") {
    const field = error.meta?.target?.[0] || "field";
    return conflict(`A record with this ${field} already exists`, {
      field,
      prismaCode: error.code,
    });
  }

  // Prisma record not found
  if (error.code === "P2025") {
    return notFound("Record", {
      prismaCode: error.code,
    });
  }

  // Prisma foreign key constraint violation
  if (error.code === "P2003") {
    return validationError("Invalid reference. Related record does not exist.");
  }

  // Generic database error
  return createApiError({
    code: ErrorCode.DATABASE_ERROR,
    message: "Database operation failed",
    details: {
      prismaCode: error.code,
    },
    statusCode: 500,
    cause: error,
  });
}

/**
 * Safe error handler for try-catch blocks
 * Automatically detects error type and returns appropriate response
 */
export function handleApiError(error: unknown, path?: string): NextResponse {
  // Zod validation error
  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  // Prisma error
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as any;
    if (prismaError.code?.startsWith("P")) {
      return handlePrismaError(prismaError);
    }
  }

  // Standard Error
  if (error instanceof Error) {
    return internalServerError(error.message, error);
  }

  // Unknown error
  return internalServerError("An unexpected error occurred");
}

/**
 * Wrap async API handler with automatic error handling
 */
export function withErrorHandler<T>(
  handler: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T | NextResponse> {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
