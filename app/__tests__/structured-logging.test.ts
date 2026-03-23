/**
 * @jest-environment node
 */
import { logger, LogEntry } from "@/lib/logger";
import { agentAuthHeaders } from "@/lib/test-helpers/auth";

/* ── spy helpers ─────────────────────────────── */

let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;

beforeEach(() => {
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
  warnSpy.mockRestore();
});

function lastLog(spy: jest.SpyInstance): LogEntry {
  const call = spy.mock.calls[spy.mock.calls.length - 1];
  return JSON.parse(call[0]);
}

/* ── logger unit tests ───────────────────────── */

describe("logger", () => {
  it("outputs valid JSON with timestamp, level, and event", () => {
    logger.info("test.event");

    expect(logSpy).toHaveBeenCalledTimes(1);
    const entry = lastLog(logSpy);
    expect(entry.level).toBe("info");
    expect(entry.event).toBe("test.event");
    expect(entry.timestamp).toBeDefined();
    expect(() => new Date(entry.timestamp)).not.toThrow();
  });

  it("includes sessionId when provided", () => {
    logger.info("test.event", { sessionId: "sess-123" });

    const entry = lastLog(logSpy);
    expect(entry.sessionId).toBe("sess-123");
  });

  it("includes data when provided", () => {
    logger.info("test.event", { data: { key: "value" } });

    const entry = lastLog(logSpy);
    expect(entry.data).toEqual({ key: "value" });
  });

  it("routes error level to console.error", () => {
    logger.error("api.error", { data: { status: 500 } });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
    const entry = lastLog(errorSpy);
    expect(entry.level).toBe("error");
  });

  it("routes warn level to console.warn", () => {
    logger.warn("test.warn");

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const entry = lastLog(warnSpy);
    expect(entry.level).toBe("warn");
  });
});

/* ── API route integration: session start ────── */

describe("POST /api/sessions logging", () => {
  it("logs session.start with sessionId and policyId on success", async () => {
    const headers = await agentAuthHeaders();

    // Create a policy first
    const { POST: createPolicy } = await import("@/app/api/policies/route");
    const policyRes = await createPolicy(
      new Request("http://localhost/api/policies", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "Test Policy", text: "Verify identity" }),
      })
    );
    const policy = await policyRes.json();

    // Now create session
    const { POST: createSession } = await import("@/app/api/sessions/route");
    const res = await createSession(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers,
        body: JSON.stringify({ policyId: policy.id }),
      })
    );

    expect(res.status).toBe(201);

    const entry = lastLog(logSpy);
    expect(entry.event).toBe("session.start");
    expect(entry.sessionId).toBeDefined();
    expect(entry.data?.policyId).toBe(policy.id);
  });
});

/* ── API route integration: policy upload ────── */

describe("POST /api/policies logging", () => {
  it("logs policy.upload with name and checklist count", async () => {
    const headers = await agentAuthHeaders();
    const { POST } = await import("@/app/api/policies/route");
    const res = await POST(
      new Request("http://localhost/api/policies", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "HIPAA Policy",
          text: "Verify identity\nConfirm DOB\nRead disclaimer",
        }),
      })
    );

    expect(res.status).toBe(201);

    const entry = lastLog(logSpy);
    expect(entry.event).toBe("policy.upload");
    expect(entry.data?.name).toBe("HIPAA Policy");
    expect(entry.data?.checklistItemCount).toBe(3);
  });
});

/* ── API route integration: error logging ────── */

describe("error logging with context", () => {
  it("logs api.error with route and status on policy not found", async () => {
    const headers = await agentAuthHeaders();
    const { POST } = await import("@/app/api/sessions/route");
    const res = await POST(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers,
        body: JSON.stringify({ policyId: "nonexistent-id" }),
      })
    );

    expect(res.status).toBe(404);

    const entry = lastLog(errorSpy);
    expect(entry.event).toBe("api.error");
    expect(entry.data?.route).toBe("POST /api/sessions");
    expect(entry.data?.status).toBe(404);
    expect(entry.data?.policyId).toBe("nonexistent-id");
  });
});

/* ── Validation: transcript events ───────────── */

describe("transcript event validation", () => {
  let sessionId: string;
  let headers: Record<string, string>;

  beforeAll(async () => {
    headers = await agentAuthHeaders();

    const { POST: createPolicy } = await import("@/app/api/policies/route");
    const policyRes = await createPolicy(
      new Request("http://localhost/api/policies", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "Val Policy", text: "Check item" }),
      })
    );
    const policy = await policyRes.json();

    const { POST: createSession } = await import("@/app/api/sessions/route");
    const sessionRes = await createSession(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers,
        body: JSON.stringify({ policyId: policy.id }),
      })
    );
    const session = await sessionRes.json();
    sessionId = session.id;
  });

  it("rejects events with missing text field", async () => {
    const { POST } =
      await import("@/app/api/sessions/[sessionId]/transcript-events/route");
    const res = await POST(
      new Request("http://localhost/api/sessions/x/transcript-events", {
        method: "POST",
        headers,
        body: JSON.stringify({
          events: [{ isFinal: true, occurredAt: new Date().toISOString() }],
        }),
      }),
      { params: Promise.resolve({ sessionId }) }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("events[0]");
    expect(body.error).toContain("text");
  });

  it("rejects events with non-boolean isFinal", async () => {
    const { POST } =
      await import("@/app/api/sessions/[sessionId]/transcript-events/route");
    const res = await POST(
      new Request("http://localhost/api/sessions/x/transcript-events", {
        method: "POST",
        headers,
        body: JSON.stringify({
          events: [
            {
              text: "hello",
              isFinal: "yes",
              occurredAt: new Date().toISOString(),
            },
          ],
        }),
      }),
      { params: Promise.resolve({ sessionId }) }
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("events[0]");
    expect(body.error).toContain("isFinal");
  });
});

/* ── Validation: policy fields ───────────────── */

describe("policy field validation", () => {
  it("rejects missing policy name with clear error message", async () => {
    const headers = await agentAuthHeaders();
    const { POST } = await import("@/app/api/policies/route");
    const res = await POST(
      new Request("http://localhost/api/policies", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "", text: "Check item" }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("name");

    const entry = lastLog(errorSpy);
    expect(entry.event).toBe("api.error");
    expect(entry.data?.field).toBe("name");
  });

  it("rejects empty policy text with clear error message", async () => {
    const headers = await agentAuthHeaders();
    const { POST } = await import("@/app/api/policies/route");
    const res = await POST(
      new Request("http://localhost/api/policies", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "Test", text: "   " }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("text");

    const entry = lastLog(errorSpy);
    expect(entry.event).toBe("api.error");
    expect(entry.data?.field).toBe("text");
  });
});
