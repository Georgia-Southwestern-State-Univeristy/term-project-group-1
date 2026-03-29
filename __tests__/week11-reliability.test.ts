/**
 * @jest-environment node
 *
 * Week 11 Deliverable D — Reliability & workflow tests.
 *
 * 1. Full lifecycle: create → ingest → end → list via history
 * 2. Session isolation: no state leakage between sessions
 * 3. Integration: transcript ingestion auto-checks checklist via API route
 * 4. Failure paths: 404 on missing session, 409 on ended session
 */
import { createPolicyFromText } from "@/lib/services/policyService";
import {
  createSession,
  endSession,
  listSessionsForUser,
} from "@/lib/services/sessionService";
import {
  appendTranscriptEvents,
  getTranscript,
} from "@/lib/services/transcriptService";
import { agentAuthHeaders, AGENT_USER_ID } from "@/lib/test-helpers/auth";
import { ensureSeedUsers } from "@/lib/repositories/seedUsers";

beforeAll(async () => {
  await ensureSeedUsers();
});

/* ────────────────────────────────────────────── */
/* Test 1: Full session lifecycle workflow        */
/* ────────────────────────────────────────────── */

describe("Full session lifecycle workflow", () => {
  it("create → ingest transcript → end → list via history", async () => {
    // 1. Create policy
    const policy = await createPolicyFromText(
      "Lifecycle Test",
      "Verify identity\nConfirm details"
    );

    // 2. Create session
    const createResult = await createSession(policy.id, AGENT_USER_ID);
    expect(createResult.success).toBe(true);
    if (!createResult.success) throw new Error("unreachable");
    const session = createResult.session;
    expect(session.status).toBe("active");

    // 3. Ingest transcript events
    await appendTranscriptEvents(session.id, [
      {
        text: "I need to verify identity before proceeding",
        isFinal: true,
        occurredAt: new Date().toISOString(),
      },
    ]);

    // 4. Verify transcript stored
    const { entries, fullText } = await getTranscript(session.id);
    expect(entries).toHaveLength(1);
    expect(fullText).toContain("verify identity");

    // 5. End session
    const endResult = await endSession(session.id);
    expect(endResult.success).toBe(true);
    if (endResult.success) {
      expect(endResult.session.status).toBe("ended");
      expect(endResult.session.endedAt).toBeDefined();
    }

    // 6. List sessions via history — ended session must appear
    const auth = { userId: AGENT_USER_ID, email: "", role: "agent" as const };
    const sessions = await listSessionsForUser(auth, "ended");
    const found = sessions.find((s) => s.id === session.id);
    expect(found).toBeDefined();
    expect(found!.status).toBe("ended");
  });
});

/* ────────────────────────────────────────────── */
/* Test 2: Session isolation                      */
/* ────────────────────────────────────────────── */

describe("Session isolation", () => {
  it("transcripts from session A do not leak into session B", async () => {
    const policy = await createPolicyFromText("Isolation Test", "Check step");

    // Session A
    const resultA = await createSession(policy.id, AGENT_USER_ID);
    if (!resultA.success) throw new Error("session A creation failed");
    const sessionA = resultA.session;

    await appendTranscriptEvents(sessionA.id, [
      {
        text: "Session A unique data alpha",
        isFinal: true,
        occurredAt: new Date().toISOString(),
      },
    ]);
    await endSession(sessionA.id);

    // Session B
    const resultB = await createSession(policy.id, AGENT_USER_ID);
    if (!resultB.success) throw new Error("session B creation failed");
    const sessionB = resultB.session;

    await appendTranscriptEvents(sessionB.id, [
      {
        text: "Session B unique data bravo",
        isFinal: true,
        occurredAt: new Date().toISOString(),
      },
    ]);

    // Verify isolation
    const transcriptA = await getTranscript(sessionA.id);
    const transcriptB = await getTranscript(sessionB.id);

    expect(transcriptA.fullText).toContain("alpha");
    expect(transcriptA.fullText).not.toContain("bravo");
    expect(transcriptB.fullText).toContain("bravo");
    expect(transcriptB.fullText).not.toContain("alpha");
  });
});

/* ────────────────────────────────────────────── */
/* Test 3: Integration — transcript auto-checks   */
/*         checklist via API route handler         */
/* ────────────────────────────────────────────── */

describe("Integration: transcript ingestion auto-checks checklist", () => {
  it("POST transcript-events triggers checklist match, GET state confirms", async () => {
    const headers = await agentAuthHeaders();

    // Create policy with specific checklist items
    const policy = await createPolicyFromText(
      "Autocheck Integration",
      "Verify caller identity\nConfirm account number\nRead disclosure"
    );

    // Create session
    const result = await createSession(policy.id, AGENT_USER_ID);
    if (!result.success) throw new Error("session creation failed");
    const sessionId = result.session.id;

    // POST transcript containing one checklist phrase
    const { POST } =
      await import("@/app/api/sessions/[sessionId]/transcript-events/route");
    const postRes = await POST(
      new Request("http://localhost/api/sessions/x/transcript-events", {
        method: "POST",
        headers,
        body: JSON.stringify({
          events: [
            {
              text: "I need to verify caller identity now",
              isFinal: true,
              occurredAt: new Date().toISOString(),
            },
          ],
        }),
      }),
      { params: Promise.resolve({ sessionId }) }
    );
    expect(postRes.status).toBe(200);

    // GET state and verify checklist
    const { GET } = await import("@/app/api/sessions/[sessionId]/state/route");
    const stateRes = await GET(
      new Request("http://localhost/api/sessions/x/state", { headers }),
      { params: Promise.resolve({ sessionId }) }
    );
    expect(stateRes.status).toBe(200);

    const state = await stateRes.json();

    const verifyItem = state.checklistState.find(
      (item: { text: string }) => item.text === "Verify caller identity"
    );
    const confirmItem = state.checklistState.find(
      (item: { text: string }) => item.text === "Confirm account number"
    );

    expect(verifyItem.checked).toBe(true);
    expect(confirmItem.checked).toBe(false);
  });
});

/* ────────────────────────────────────────────── */
/* Test 4: Failure paths                          */
/* ────────────────────────────────────────────── */

describe("Failure paths", () => {
  let headers: Record<string, string>;

  beforeAll(async () => {
    headers = await agentAuthHeaders();
  });

  it("GET state for non-existent session returns 404", async () => {
    const { GET } = await import("@/app/api/sessions/[sessionId]/state/route");

    const res = await GET(
      new Request("http://localhost/api/sessions/x/state", { headers }),
      { params: Promise.resolve({ sessionId: "non-existent-id" }) }
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("not found");
  });

  it("POST transcript to non-existent session returns 404", async () => {
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
              isFinal: true,
              occurredAt: new Date().toISOString(),
            },
          ],
        }),
      }),
      { params: Promise.resolve({ sessionId: "non-existent-id" }) }
    );

    expect(res.status).toBe(404);
  });

  it("POST transcript to ended session returns 409", async () => {
    const policy = await createPolicyFromText("Ended Test", "Item");
    const result = await createSession(policy.id, AGENT_USER_ID);
    if (!result.success) throw new Error("session creation failed");
    const sessionId = result.session.id;

    await endSession(sessionId);

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
              isFinal: true,
              occurredAt: new Date().toISOString(),
            },
          ],
        }),
      }),
      { params: Promise.resolve({ sessionId }) }
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("not active");
  });
});
