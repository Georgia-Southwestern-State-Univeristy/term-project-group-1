/**
 * @jest-environment node
 */
import { saveSession } from "@/lib/repositories/sessionRepo";
import { POST, GET } from "../api/sessions/[sessionId]/frequency/route";
import { agentAuthHeaders, AGENT_USER_ID } from "@/lib/test-helpers/auth";

const SESSION_ID = `freq-test-${Date.now()}`;

let headers: Record<string, string>;

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/sessions/x/frequency", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function makeParams(sessionId: string) {
  return { params: Promise.resolve({ sessionId }) };
}

beforeAll(async () => {
  headers = await agentAuthHeaders();
  saveSession({
    id: SESSION_ID,
    policyId: "p1",
    ownerId: AGENT_USER_ID,
    status: "active",
    createdAt: new Date().toISOString(),
  });
});

describe("POST /api/sessions/[sessionId]/frequency", () => {
  it("stores a frequency snapshot and returns ok", async () => {
    const res = await POST(
      makeRequest({
        dominantFrequencyHz: 440,
        frequencyBins: Array(32).fill(-50),
        sampleRateHz: 16000,
        fftSize: 2048,
        binResolutionHz: 7.8125,
      }),
      makeParams(SESSION_ID)
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.snapshotId).toBeDefined();
  });

  it("returns 404 for unknown session", async () => {
    const res = await POST(
      makeRequest({ dominantFrequencyHz: 440, frequencyBins: [] }),
      makeParams("nonexistent")
    );
    expect(res.status).toBe(404);
  });

  it("returns 409 for ended session", async () => {
    const endedId = `ended-${Date.now()}`;
    saveSession({
      id: endedId,
      policyId: "p1",
      ownerId: AGENT_USER_ID,
      status: "ended",
      createdAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
    });

    const res = await POST(
      makeRequest({ dominantFrequencyHz: 440, frequencyBins: [] }),
      makeParams(endedId)
    );
    expect(res.status).toBe(409);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await POST(makeRequest({ foo: "bar" }), makeParams(SESSION_ID));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/sessions/[sessionId]/frequency", () => {
  it("returns snapshots for the session", async () => {
    const res = await GET(
      new Request("http://localhost", { headers }),
      makeParams(SESSION_ID)
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessionId).toBe(SESSION_ID);
    expect(Array.isArray(body.snapshots)).toBe(true);
    expect(body.snapshots.length).toBeGreaterThanOrEqual(1);
  });

  it("returns 404 for unknown session", async () => {
    const res = await GET(
      new Request("http://localhost", { headers }),
      makeParams("nonexistent")
    );
    expect(res.status).toBe(404);
  });
});
