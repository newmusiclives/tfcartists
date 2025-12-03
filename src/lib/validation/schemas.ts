import { z } from "zod";

/**
 * Input Validation Schemas
 *
 * Zod schemas for validating API request bodies
 * Ensures data integrity and provides type safety
 */

// ============================================================================
// RILEY (Artist Acquisition) SCHEMAS
// ============================================================================

export const sendMessageSchema = z.object({
  artistId: z.string().cuid("Invalid artist ID format"),
  content: z.string().min(1, "Message content is required").max(1000, "Message too long"),
  intent: z.enum([
    "initial_outreach",
    "qualify_live_shows",
    "educate_product",
    "book_show",
    "send_reminder",
    "motivate",
    "handle_objection",
    "celebrate_win",
    "request_referral",
  ]),
  channel: z.enum(["sms", "email", "instagram"]).default("sms"),
});

export const handleArtistMessageSchema = z.object({
  artistId: z.string().cuid("Invalid artist ID format"),
  message: z.string().min(1, "Message is required").max(5000, "Message too long"),
  channel: z.enum(["sms", "email", "instagram"]).default("sms"),
});

export const triggerOutreachSchema = z.object({
  artistId: z.string().cuid("Invalid artist ID format"),
});

export const createArtistSchema = z.object({
  name: z.string().min(1, "Artist name is required").max(200),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format (+1234567890)").optional(),
  instagramHandle: z.string().max(30).optional(),
  genre: z.string().max(100).optional(),
  spotifyUrl: z.string().url("Invalid Spotify URL").optional(),
  nextShowDate: z.string().datetime().optional(),
  nextShowVenue: z.string().max(200).optional(),
  discoverySource: z.string().max(100).optional(),
  status: z.enum(["NEW", "CONTACTED", "ENGAGED", "QUALIFIED", "ONBOARDING", "ACTIVATED", "CHURNED"]).default("NEW"),
  pipelineStage: z.string().default("discovery"),
  airplayTier: z.enum(["FREE", "TIER_1", "TIER_2", "TIER_3"]).default("FREE"),
});

export const updateArtistSchema = createArtistSchema.partial();

// ============================================================================
// HARPER (Sponsor Acquisition) SCHEMAS
// ============================================================================

export const createSponsorSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(200),
  contactName: z.string().min(1, "Contact name is required").max(200),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format").optional(),
  industry: z.string().max(100).optional(),
  website: z.string().url("Invalid website URL").optional(),
  location: z.string().max(200).optional(),
  status: z.enum(["NEW", "CONTACTED", "ENGAGED", "NEGOTIATING", "ACTIVE", "CHURNED"]).default("NEW"),
  pipelineStage: z.string().default("discovery"),
  sponsorshipTier: z.enum(["TIER_1", "TIER_2", "TIER_3", "CUSTOM"]).optional(),
  monthlyBudget: z.number().min(0).optional(),
});

export const updateSponsorSchema = createSponsorSchema.partial();

export const createSponsorshipContractSchema = z.object({
  sponsorId: z.string().cuid("Invalid sponsor ID format"),
  tier: z.enum(["TIER_1", "TIER_2", "TIER_3", "CUSTOM"]),
  monthlyRate: z.number().min(0, "Monthly rate must be positive"),
  adSpotsPerDay: z.number().int().min(0, "Ad spots must be a positive integer"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// AIRPLAY & REVENUE SCHEMAS
// ============================================================================

export const upgradeAirplaySchema = z.object({
  artistId: z.string().cuid("Invalid artist ID format"),
  newTier: z.enum(["TIER_1", "TIER_2", "TIER_3"]),
});

export const calculateEarningsSchema = z.object({
  artistId: z.string().cuid("Invalid artist ID format"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format").optional(),
});

// ============================================================================
// DISCOVERY ENGINE SCHEMAS
// ============================================================================

export const runDiscoverySchema = z.object({
  sources: z.array(z.enum(["instagram", "spotify", "tiktok", "local_venues"])).min(1, "At least one source is required"),
  limit: z.number().int().min(1).max(100).default(20),
  genres: z.array(z.string()).optional(),
  location: z.string().optional(),
});

// ============================================================================
// GENERAL API SCHEMAS
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const idParamSchema = z.object({
  id: z.string().cuid("Invalid ID format"),
});

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validate request body against a Zod schema
 * Returns parsed data or throws validation error
 */
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe validation that returns result object instead of throwing
 */
export function safeValidateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Format Zod validation errors for API responses
 */
export function formatValidationError(error: z.ZodError): {
  message: string;
  errors: Array<{ field: string; message: string }>;
} {
  return {
    message: "Validation failed",
    errors: error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    })),
  };
}

/**
 * Middleware helper for validating request bodies in API routes
 */
export async function withValidation<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | Response> {
  try {
    const body = await request.json();
    const data = validateBody(schema, body);
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(formatValidationError(error), { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return Response.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    throw error;
  }
}
