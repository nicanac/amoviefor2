// =============================================================================
// Zod Validation Schemas — Contracts between UI ↔ Server Actions ↔ DB
// Prevents invalid data from reaching Supabase / TMDB.
// =============================================================================

import { z } from "zod";

// --- Primitives ---

export const uuidSchema = z.string().uuid("Invalid UUID format");

export const partnerCodeSchema = z
  .string()
  .min(6, "Partner code must be 6 characters")
  .max(6, "Partner code must be 6 characters")
  .regex(/^[A-Z0-9]+$/, "Partner code must be uppercase alphanumeric")
  .transform((val) => val.toUpperCase());

// --- Auth ---

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username must be alphanumeric (underscores allowed)",
    ),
  full_name: z.string().max(100, "Full name too long").optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// --- Couple ---

export const joinCoupleSchema = z.object({
  partnerCode: partnerCodeSchema,
});

// --- Session & Answers ---

export const createSessionSchema = z.object({
  coupleId: uuidSchema,
});

export const submitAnswerSchema = z.object({
  sessionId: uuidSchema,
  questionId: z
    .number()
    .int()
    .positive("Question ID must be a positive integer"),
  answer: z
    .union([
      z.string(),
      z.number(),
      z.array(z.string()),
      z.array(z.number()),
      z.boolean(),
    ])
    .describe("Answer must be a string, number, array, or boolean"),
});

// --- Swipe ---

export const swipeDirectionSchema = z.enum(["right", "left"]);

export const recordSwipeSchema = z.object({
  sessionId: uuidSchema,
  sessionMovieId: uuidSchema,
  direction: swipeDirectionSchema,
});

// --- Movies ---

export const markAsSeenSchema = z.object({
  tmdbId: z.number().int().positive("TMDB ID must be a positive integer"),
  source: z.enum(["auto", "manual"]).default("manual"),
});

export const removeFromSeenSchema = z.object({
  tmdbId: z.number().int().positive("TMDB ID must be a positive integer"),
});

// --- Utility: Safe parse helper ---

/**
 * Validate inputs using a Zod schema. Returns `{ data }` on success or `{ error }` with
 * a human-readable message on failure. Use in Server Actions before any DB call.
 *
 * @example
 * ```ts
 * const validated = validate(submitAnswerSchema, { sessionId, questionId, answer });
 * if ('error' in validated) return validated;
 * const { sessionId, questionId, answer } = validated.data;
 * ```
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { data: T } | { error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return {
      error: firstIssue
        ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
        : "Validation failed",
    };
  }
  return { data: result.data };
}
