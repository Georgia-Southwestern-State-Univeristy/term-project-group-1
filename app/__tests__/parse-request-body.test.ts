/**
 * @jest-environment node
 *
 * Tests for parseRequestBody utility and frequencyEventSchema.
 * Protects the refactor that extracted duplicated JSON-parse + Zod-validate
 * boilerplate from 4 API route handlers into a shared helper.
 */
import { z } from "zod/v4";
import { parseRequestBody } from "@/lib/validation/parseRequestBody";
import { frequencyEventSchema } from "@/lib/validation/schemas";

/* ── helpers ─────────────────────────────────── */

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function invalidJsonRequest(): Request {
  return new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json!!!{",
  });
}

const simpleSchema = z.object({
  name: z.string().min(1, "name is required"),
  count: z.number(),
});

/* ── parseRequestBody ────────────────────────── */

describe("parseRequestBody", () => {
  it("returns parsed data for a valid request", async () => {
    const result = await parseRequestBody(
      jsonRequest({ name: "test", count: 5 }),
      simpleSchema,
      "TEST /route"
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "test", count: 5 });
    }
  });

  it("returns 400 response for malformed JSON", async () => {
    const result = await parseRequestBody(
      invalidJsonRequest(),
      simpleSchema,
      "TEST /route"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("Invalid JSON body");
    }
  });

  it("returns 400 response with field-level message for schema violations", async () => {
    const result = await parseRequestBody(
      jsonRequest({ name: "", count: "not-a-number" }),
      simpleSchema,
      "TEST /route"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toContain("name");
    }
  });

  it("returns 400 for completely wrong shape", async () => {
    const result = await parseRequestBody(
      jsonRequest("just a string"),
      simpleSchema,
      "TEST /route"
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });
});

/* ── frequencyEventSchema ────────────────────── */

describe("frequencyEventSchema", () => {
  const validEvent = {
    dominantFrequencyHz: 440,
    frequencyBins: [-50, -48, -55],
    sampleRateHz: 16000,
    fftSize: 2048,
    binResolutionHz: 7.8125,
  };

  it("accepts a valid frequency event", () => {
    const result = frequencyEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it("accepts zero for dominantFrequencyHz", () => {
    const result = frequencyEventSchema.safeParse({
      ...validEvent,
      dominantFrequencyHz: 0,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty frequencyBins array", () => {
    const result = frequencyEventSchema.safeParse({
      ...validEvent,
      frequencyBins: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative dominantFrequencyHz", () => {
    const result = frequencyEventSchema.safeParse({
      ...validEvent,
      dominantFrequencyHz: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects NaN dominantFrequencyHz", () => {
    const result = frequencyEventSchema.safeParse({
      ...validEvent,
      dominantFrequencyHz: NaN,
    });
    expect(result.success).toBe(false);
  });

  it("rejects Infinity sampleRateHz", () => {
    const result = frequencyEventSchema.safeParse({
      ...validEvent,
      sampleRateHz: Infinity,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero sampleRateHz (must be positive)", () => {
    const result = frequencyEventSchema.safeParse({
      ...validEvent,
      sampleRateHz: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer fftSize", () => {
    const result = frequencyEventSchema.safeParse({
      ...validEvent,
      fftSize: 2048.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero fftSize", () => {
    const result = frequencyEventSchema.safeParse({
      ...validEvent,
      fftSize: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-number in frequencyBins", () => {
    const result = frequencyEventSchema.safeParse({
      ...validEvent,
      frequencyBins: [-50, "oops", -55],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = frequencyEventSchema.safeParse({
      dominantFrequencyHz: 440,
    });
    expect(result.success).toBe(false);
  });

  it("rejects frequencyBins exceeding max length (4096)", () => {
    const result = frequencyEventSchema.safeParse({
      ...validEvent,
      frequencyBins: new Array(4097).fill(0),
    });
    expect(result.success).toBe(false);
  });
});
