/**
 * @jest-environment node
 *
 * Week 10 Deliverable D: Validation failure + regression tests.
 *
 * - Validation: non-string policyId, events with missing occurredAt
 * - Regression: transcript windowing bounds transcript at the API route level
 *   (guards against PR #32 fix for Bug #3 regressing)
 */
import { createPolicyFromText } from "@/lib/services/policyService";
import { createSession } from "@/lib/services/sessionService";

/* ── helpers ─────────────────────────────────── */

function policyHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

/* ── Validation: POST /api/sessions ──────────── */

describe("POST /api/sessions — validation failures", () => {
  it("rejects a numeric policyId with 400", async () => {
    const { POST } = await import("@/app/api/sessions/route");

    const res = await POST(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers: policyHeaders(),
        body: JSON.stringify({ policyId: 12345 }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("policyId");
  });
});

/* ── Validation: POST /api/sessions/[id]/transcript-events ── */

describe("POST /api/sessions/[id]/transcript-events — validation failures", () => {
  let sessionId: string;

  beforeAll(() => {
    const policy = createPolicyFromText("ValTest", "Step one");
    const result = createSession(policy.id);
    if (!result.success) throw new Error("session setup failed");
    sessionId = result.session.id;
  });

  it("rejects events with missing occurredAt field", async () => {
    const { POST } =
      await import("@/app/api/sessions/[sessionId]/transcript-events/route");

    const res = await POST(
      new Request("http://localhost/api/sessions/x/transcript-events", {
        method: "POST",
        headers: policyHeaders(),
        body: JSON.stringify({
          events: [{ text: "hello", isFinal: true }],
        }),
      }),
      { params: Promise.resolve({ sessionId }) }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("occurredAt");
  });
});

/* ── Regression: transcript windowing at API route level ── */

describe("transcript windowing regression (Bug #3, PR #32)", () => {
  it("bounds transcript entry count after ingesting more text than the char limit", async () => {
    // Create a fresh policy + session for this test
    const policy = createPolicyFromText("WindowTest", "Check item");
    const result = createSession(policy.id);
    if (!result.success) throw new Error("session setup failed");
    const sessionId = result.session.id;

    const { POST } =
      await import("@/app/api/sessions/[sessionId]/transcript-events/route");

    // Each event has 500 chars of final text.
    // Post 120 events = 60,000 chars, exceeding the 50,000 char window limit.
    const batchSize = 20;
    const totalBatches = 6;
    const eventText = "x".repeat(500);

    for (let batch = 0; batch < totalBatches; batch++) {
      const events = Array.from({ length: batchSize }, () => ({
        text: eventText,
        isFinal: true,
        occurredAt: new Date().toISOString(),
      }));

      await POST(
        new Request("http://localhost/api/sessions/x/transcript-events", {
          method: "POST",
          headers: policyHeaders(),
          body: JSON.stringify({ events }),
        }),
        { params: Promise.resolve({ sessionId }) }
      );
    }

    // Now fetch the session state and verify transcript is bounded
    const { GET } = await import("@/app/api/sessions/[sessionId]/state/route");
    const stateRes = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ sessionId }),
    });

    expect(stateRes.status).toBe(200);
    const state = await stateRes.json();

    // The full transcript text should be within the window limit (50,000 chars).
    // We allow a small margin because the last kept entry may push slightly over.
    const transcriptLength = (state.transcript.fullText ?? "").length;
    expect(transcriptLength).toBeLessThanOrEqual(55_000);

    // And we should have fewer entries than we ingested (120 total)
    expect(state.transcript.entries.length).toBeLessThan(120);
  });
});
