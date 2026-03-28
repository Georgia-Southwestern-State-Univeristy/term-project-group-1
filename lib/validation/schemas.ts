import { z } from "zod/v4";

/* ── Helpers ─────────────────────────────────── */

/**
 * Format the first Zod validation issue into a user-facing error string.
 * Includes the dot/bracket field path so callers know *which* field failed.
 *
 * Example: `events[0].text: 'text' must be a non-empty string`
 */
export function formatZodError(
  issues: { path: PropertyKey[]; message: string }[]
): string {
  const issue = issues[0];
  if (!issue) return "Invalid request body";
  const path = issue.path
    .map((seg, i) =>
      typeof seg === "number"
        ? `[${seg}]`
        : i > 0
          ? `.${String(seg)}`
          : String(seg)
    )
    .join("");
  return path ? `${path}: ${issue.message}` : issue.message;
}

/* ── Transcript events ────────────────────────── */

const MAX_EVENTS_PER_REQUEST = 50;
const MAX_EVENT_TEXT_LENGTH = 10_000;

const transcriptEventSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "'text' must be a non-empty string")
    .max(
      MAX_EVENT_TEXT_LENGTH,
      `'text' exceeds ${MAX_EVENT_TEXT_LENGTH} character limit`
    ),
  isFinal: z.boolean({ error: "'isFinal' must be a boolean" }),
  occurredAt: z
    .string()
    .trim()
    .min(1, "'occurredAt' must be a non-empty string"),
});

export const transcriptEventsBodySchema = z.object({
  events: z
    .array(transcriptEventSchema)
    .min(1, "events must be a non-empty array")
    .max(
      MAX_EVENTS_PER_REQUEST,
      `Too many events: maximum is ${MAX_EVENTS_PER_REQUEST}`
    ),
});

/* ── Session creation ─────────────────────────── */

export const createSessionBodySchema = z.object({
  policyId: z.string().trim().min(1, "Missing or invalid 'policyId' field"),
});

/* ── Policy creation ──────────────────────────── */

const POLICY_NAME_MAX_LENGTH = 200;
const POLICY_TEXT_MAX_LENGTH = 50_000;

export const createPolicyBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Missing or invalid 'name' field")
    .max(
      POLICY_NAME_MAX_LENGTH,
      `'name' must be at most ${POLICY_NAME_MAX_LENGTH} characters`
    ),
  text: z
    .string()
    .trim()
    .min(1, "Missing or invalid 'text' field")
    .max(
      POLICY_TEXT_MAX_LENGTH,
      `'text' must be at most ${POLICY_TEXT_MAX_LENGTH} characters`
    ),
});
