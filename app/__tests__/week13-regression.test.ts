/**
 * @jest-environment node
 *
 * Week 13 Deliverable D: Regression protection + test strengthening.
 *
 * Test 1 (regression — Bug #6 stale state):
 *   Session end idempotency — ending an already-ended session returns 200.
 *
 * Test 2 (regression — login validation weak spot):
 *   POST /api/auth/login rejects missing/invalid fields with 400.
 *
 * Test 3 (refactored code — frequency validation):
 *   POST /api/sessions/[id]/frequency rejects edge-case inputs
 *   (NaN, Infinity, negative values). Exercises validation refactored
 *   from hand-rolled checks to Zod schema in Deliverable B.
 *
 * Test 4 (reliability / error handling):
 *   POST /api/sessions/[id]/transcript-events returns structured 404
 *   for nonexistent sessions without crashing.
 */
import { createPolicyFromText } from "@/lib/services/policyService";
import { createSession, endSession } from "@/lib/services/sessionService";
import { agentAuthHeaders, AGENT_USER_ID } from "@/lib/test-helpers/auth";
import { ensureSeedUsers } from "@/lib/repositories/seedUsers";

let headers: Record<string, string>;

beforeAll(async () => {
  await ensureSeedUsers();
  headers = await agentAuthHeaders();
});

/* ── Test 1: Session end idempotency (Bug #6 regression) ── */

describe("session end idempotency (Bug #6)", () => {
  let sessionId: string;

  beforeAll(async () => {
    const policy = await createPolicyFromText("Idempotent End", "Step A");
    const result = await createSession(policy.id, AGENT_USER_ID);
    if (!result.success) throw new Error("session setup failed");
    sessionId = result.session.id;

    // End the session once
    await endSession(sessionId);
  });

  it("ending an already-ended session returns 200 (not an error)", async () => {
    const { POST } = await import("@/app/api/sessions/[sessionId]/end/route");

    const res = await POST(
      new Request("http://localhost/api/sessions/x/end", {
        method: "POST",
        headers,
      }),
      { params: Promise.resolve({ sessionId }) }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ended");
    expect(body.endedAt).toBeDefined();
  });

  it("ending an already-ended session does not change endedAt", async () => {
    const { POST } = await import("@/app/api/sessions/[sessionId]/end/route");

    // End it twice and capture timestamps
    const res1 = await POST(
      new Request("http://localhost/api/sessions/x/end", {
        method: "POST",
        headers,
      }),
      { params: Promise.resolve({ sessionId }) }
    );
    const body1 = await res1.json();

    const res2 = await POST(
      new Request("http://localhost/api/sessions/x/end", {
        method: "POST",
        headers,
      }),
      { params: Promise.resolve({ sessionId }) }
    );
    const body2 = await res2.json();

    expect(body1.endedAt).toBe(body2.endedAt);
  });
});

/* ── Test 2: Login route validation (weak spot regression) ── */

describe("POST /api/auth/login — input validation", () => {
  it("rejects missing email field with 400", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "secret" }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("email");
  });

  it("rejects missing password field with 400", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "agent@sentinel.local" }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("password");
  });

  it("rejects invalid JSON body with 400", async () => {
    const { POST } = await import("@/app/api/auth/login/route");

    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json{{{",
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid JSON");
  });
});

/* ── Test 3: Frequency validation edge cases (refactored code) ── */

describe("POST /api/sessions/[id]/frequency — validation edge cases", () => {
  let sessionId: string;

  beforeAll(async () => {
    const policy = await createPolicyFromText("Freq Edge", "Step A");
    const result = await createSession(policy.id, AGENT_USER_ID);
    if (!result.success) throw new Error("session setup failed");
    sessionId = result.session.id;
  });

  function makeFrequencyRequest(body: unknown): Request {
    return new Request("http://localhost/api/sessions/x/frequency", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }

  function makeParams() {
    return { params: Promise.resolve({ sessionId }) };
  }

  it("rejects NaN dominantFrequencyHz with 400", async () => {
    const { POST } =
      await import("@/app/api/sessions/[sessionId]/frequency/route");

    const res = await POST(
      makeFrequencyRequest({
        dominantFrequencyHz: NaN,
        frequencyBins: [],
        sampleRateHz: 16000,
        fftSize: 2048,
        binResolutionHz: 7.8125,
      }),
      makeParams()
    );

    expect(res.status).toBe(400);
  });

  it("rejects Infinity sampleRateHz with 400", async () => {
    const { POST } =
      await import("@/app/api/sessions/[sessionId]/frequency/route");

    const res = await POST(
      makeFrequencyRequest({
        dominantFrequencyHz: 440,
        frequencyBins: [-50],
        sampleRateHz: Infinity,
        fftSize: 2048,
        binResolutionHz: 7.8125,
      }),
      makeParams()
    );

    expect(res.status).toBe(400);
  });

  it("rejects negative dominantFrequencyHz with 400", async () => {
    const { POST } =
      await import("@/app/api/sessions/[sessionId]/frequency/route");

    const res = await POST(
      makeFrequencyRequest({
        dominantFrequencyHz: -100,
        frequencyBins: [],
        sampleRateHz: 16000,
        fftSize: 2048,
        binResolutionHz: 7.8125,
      }),
      makeParams()
    );

    expect(res.status).toBe(400);
  });
});

/* ── Test 4: Error handling — nonexistent session (reliability) ── */

describe("transcript-events error handling (reliability)", () => {
  it("returns structured 404 for nonexistent session", async () => {
    const { POST } =
      await import("@/app/api/sessions/[sessionId]/transcript-events/route");

    const res = await POST(
      new Request("http://localhost/api/sessions/x/transcript-events", {
        method: "POST",
        headers,
        body: JSON.stringify({
          events: [
            {
              text: "test",
              isFinal: true,
              occurredAt: new Date().toISOString(),
            },
          ],
        }),
      }),
      { params: Promise.resolve({ sessionId: "does-not-exist-abc" }) }
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Session not found");
  });

  it("returns structured 409 when session is ended", async () => {
    const policy = await createPolicyFromText("Ended Ingest", "Step A");
    const result = await createSession(policy.id, AGENT_USER_ID);
    if (!result.success) throw new Error("session setup failed");
    await endSession(result.session.id);

    const { POST } =
      await import("@/app/api/sessions/[sessionId]/transcript-events/route");

    const res = await POST(
      new Request("http://localhost/api/sessions/x/transcript-events", {
        method: "POST",
        headers,
        body: JSON.stringify({
          events: [
            {
              text: "late event",
              isFinal: true,
              occurredAt: new Date().toISOString(),
            },
          ],
        }),
      }),
      { params: Promise.resolve({ sessionId: result.session.id }) }
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Session is not active");
  });
});
