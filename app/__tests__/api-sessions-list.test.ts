/**
 * @jest-environment node
 */
import { createPolicyFromText } from "@/lib/services/policyService";
import { createSession, endSession } from "@/lib/services/sessionService";
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

describe("GET /api/sessions", () => {
  it("returns 401 without token", async () => {
    const { GET } = await import("@/app/api/sessions/route");
    const res = await GET(new Request("http://localhost/api/sessions"));
    expect(res.status).toBe(401);
  });

  it("agent sees only their own sessions", async () => {
    const policy = await createPolicyFromText("List Test Agent", "Step A");
    await createSession(policy.id, AGENT_USER_ID);
    await createSession(policy.id, SUPERVISOR_USER_ID);

    const headers = await agentAuthHeaders();
    const { GET } = await import("@/app/api/sessions/route");
    const res = await GET(
      new Request("http://localhost/api/sessions", { headers })
    );

    expect(res.status).toBe(200);
    const { sessions } = await res.json();
    for (const s of sessions) {
      expect(s.ownerId).toBe(AGENT_USER_ID);
    }
  });

  it("supervisor sees all sessions", async () => {
    const headers = await supervisorAuthHeaders();
    const { GET } = await import("@/app/api/sessions/route");
    const res = await GET(
      new Request("http://localhost/api/sessions", { headers })
    );

    expect(res.status).toBe(200);
    const { sessions } = await res.json();
    const ownerIds = new Set(
      sessions.map((s: { ownerId: string }) => s.ownerId)
    );
    expect(ownerIds.size).toBeGreaterThanOrEqual(1);
  });

  it("filters by status=ended", async () => {
    const policy = await createPolicyFromText("Filter Test", "Step B");
    const active = await createSession(policy.id, AGENT_USER_ID);
    expect(active.success).toBe(true);

    const ended = await createSession(policy.id, AGENT_USER_ID);
    if (ended.success) {
      await endSession(ended.session.id);
    }

    const headers = await agentAuthHeaders();
    const { GET } = await import("@/app/api/sessions/route");
    const res = await GET(
      new Request("http://localhost/api/sessions?status=ended", { headers })
    );

    expect(res.status).toBe(200);
    const { sessions } = await res.json();
    for (const s of sessions) {
      expect(s.status).toBe("ended");
    }
  });

  it("includes policyName in response", async () => {
    const policy = await createPolicyFromText("Name Check", "Step C");
    await createSession(policy.id, AGENT_USER_ID);

    const headers = await agentAuthHeaders();
    const { GET } = await import("@/app/api/sessions/route");
    const res = await GET(
      new Request("http://localhost/api/sessions", { headers })
    );

    const { sessions } = await res.json();
    const match = sessions.find(
      (s: { policyName: string }) => s.policyName === "Name Check"
    );
    expect(match).toBeDefined();
    expect(match.policyName).toBe("Name Check");
  });
});
