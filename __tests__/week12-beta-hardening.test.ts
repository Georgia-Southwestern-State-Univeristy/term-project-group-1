/**
 * @jest-environment node
 *
 * Week 12 — Beta hardening tests.
 *
 * 1. Ended session state preservation (archive retrieval):
 *    create → transcript → checklist match → end → GET /state returns
 *    transcript, checklist, and threat score intact.
 *
 * 2. Ownership enforcement on POST /sessions/[id]/end:
 *    non-owner agent gets 403, supervisor can end any session.
 */
import { createPolicyFromText } from "@/lib/services/policyService";
import { createSession } from "@/lib/services/sessionService";
import {
  agentAuthHeaders,
  supervisorAuthHeaders,
  AGENT_USER_ID,
  SUPERVISOR_USER_ID,
} from "@/lib/test-helpers/auth";
import { ensureSeedUsers } from "@/lib/repositories/seedUsers";

beforeAll(async () => {
  await ensureSeedUsers();
});

/* ────────────────────────────────────────────── */
/* Test 1: Ended session state preservation       */
/* ────────────────────────────────────────────── */

describe("Ended session state preservation", () => {
  it("GET /state returns transcript, checklist, and threat score after session ends", async () => {
    const headers = await agentAuthHeaders();

    // 1. Create a policy with checklist items
    const policy = await createPolicyFromText(
      "Archive Test",
      "Verify caller identity\nConfirm date of birth\nRead privacy notice"
    );

    // 2. Create a session
    const result = await createSession(policy.id, AGENT_USER_ID);
    if (!result.success) throw new Error("session creation failed");
    const sessionId = result.session.id;

    // 3. Ingest transcript that matches some checklist items
    const { POST: postTranscript } =
      await import("@/app/api/sessions/[sessionId]/transcript-events/route");

    await postTranscript(
      new Request("http://localhost/api/sessions/x/transcript-events", {
        method: "POST",
        headers,
        body: JSON.stringify({
          events: [
            {
              text: "Let me verify caller identity for this call",
              isFinal: true,
              occurredAt: new Date().toISOString(),
            },
            {
              text: "Can you confirm date of birth please?",
              isFinal: true,
              occurredAt: new Date().toISOString(),
            },
          ],
        }),
      }),
      { params: Promise.resolve({ sessionId }) }
    );

    // 4. End the session
    const { POST: postEnd } =
      await import("@/app/api/sessions/[sessionId]/end/route");

    const endRes = await postEnd(
      new Request("http://localhost/api/sessions/x/end", {
        method: "POST",
        headers,
      }),
      { params: Promise.resolve({ sessionId }) }
    );
    expect(endRes.status).toBe(200);

    // 5. GET /state on the ended session — all data must be preserved
    const { GET } = await import("@/app/api/sessions/[sessionId]/state/route");

    const stateRes = await GET(
      new Request("http://localhost/api/sessions/x/state", { headers }),
      { params: Promise.resolve({ sessionId }) }
    );
    expect(stateRes.status).toBe(200);

    const state = await stateRes.json();

    // Session is ended
    expect(state.session.status).toBe("ended");
    expect(state.session.endedAt).toBeDefined();

    // Transcript entries are preserved
    expect(state.transcript.entries.length).toBeGreaterThanOrEqual(2);
    expect(state.transcript.fullText).toContain("verify caller identity");
    expect(state.transcript.fullText).toContain("confirm date of birth");

    // Checklist items auto-checked from transcript remain checked
    const verifyItem = state.checklistState.find(
      (item: { text: string }) => item.text === "Verify caller identity"
    );
    const dobItem = state.checklistState.find(
      (item: { text: string }) => item.text === "Confirm date of birth"
    );
    const privacyItem = state.checklistState.find(
      (item: { text: string }) => item.text === "Read privacy notice"
    );

    expect(verifyItem.checked).toBe(true);
    expect(dobItem.checked).toBe(true);
    expect(privacyItem.checked).toBe(false);

    // Threat score is present and well-formed
    expect(state.threatScore).toBeDefined();
    expect(typeof state.threatScore.overall).toBe("number");
    expect(["low", "medium", "high", "critical"]).toContain(
      state.threatScore.level
    );
    // complianceScore > 0 because one item is unchecked
    expect(state.threatScore.complianceScore).toBeGreaterThan(0);
  });
});

/* ────────────────────────────────────────────── */
/* Test 2: Ownership enforcement on session end   */
/* ────────────────────────────────────────────── */

describe("Ownership enforcement on POST /sessions/[id]/end", () => {
  let agentSessionId: string;

  beforeAll(async () => {
    // Agent creates a session
    const policy = await createPolicyFromText("End Auth Test", "Step A");
    const result = await createSession(policy.id, AGENT_USER_ID);
    if (!result.success) throw new Error("session creation failed");
    agentSessionId = result.session.id;
  });

  it("non-owner agent cannot end another user's session (403)", async () => {
    // Supervisor creates a session, then agent tries to end it
    const policy = await createPolicyFromText("Sup Session", "Step B");
    const result = await createSession(policy.id, SUPERVISOR_USER_ID);
    if (!result.success) throw new Error("session creation failed");
    const supSessionId = result.session.id;

    const agentHeaders = await agentAuthHeaders();
    const { POST } = await import("@/app/api/sessions/[sessionId]/end/route");

    const res = await POST(
      new Request("http://localhost/api/sessions/x/end", {
        method: "POST",
        headers: agentHeaders,
      }),
      { params: Promise.resolve({ sessionId: supSessionId }) }
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Forbidden");
  });

  it("supervisor can end any session regardless of ownership", async () => {
    const supHeaders = await supervisorAuthHeaders();
    const { POST } = await import("@/app/api/sessions/[sessionId]/end/route");

    // Supervisor ends the agent-owned session
    const res = await POST(
      new Request("http://localhost/api/sessions/x/end", {
        method: "POST",
        headers: supHeaders,
      }),
      { params: Promise.resolve({ sessionId: agentSessionId }) }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ended");
  });

  it("unauthenticated request returns 401", async () => {
    const policy = await createPolicyFromText("No Auth End", "Step C");
    const result = await createSession(policy.id, AGENT_USER_ID);
    if (!result.success) throw new Error("session creation failed");

    const { POST } = await import("@/app/api/sessions/[sessionId]/end/route");

    const res = await POST(
      new Request("http://localhost/api/sessions/x/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ sessionId: result.session.id }) }
    );

    expect(res.status).toBe(401);
  });
});
