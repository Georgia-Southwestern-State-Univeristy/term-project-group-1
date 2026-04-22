/**
 * @jest-environment node
 */
import { createPolicyFromText } from "@/lib/services/policyService";
import {
  agentAuthHeaders,
  supervisorAuthHeaders,
  AGENT_USER_ID,
} from "@/lib/test-helpers/auth";
import { ensureSeedUsers } from "@/lib/repositories/seedUsers";
import { signToken } from "@/lib/auth";
import { getUserByEmail } from "@/lib/repositories/userRepo";

beforeAll(async () => {
  await ensureSeedUsers();
});

/* ── Login ────────────────────────────────────── */

describe("POST /api/auth/login", () => {
  it("returns 401 for invalid credentials", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "agent@sentinel.local",
          password: "wrong",
        }),
      })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid credentials");
  });

  it("returns 200 with token for valid credentials", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "agent@sentinel.local",
          password: "agent123",
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.user.role).toBe("agent");
    expect(body.user.email).toBe("agent@sentinel.local");
  });
});

/* ── Route protection: 401 without token ──────── */

describe("unauthenticated access returns 401", () => {
  it("POST /api/sessions rejects without token", async () => {
    const { POST } = await import("@/app/api/sessions/route");
    const res = await POST(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId: "any" }),
      })
    );

    expect(res.status).toBe(401);
  });

  it("GET /api/policies rejects without token", async () => {
    const { GET } = await import("@/app/api/policies/route");
    const res = await GET(new Request("http://localhost/api/policies"));

    expect(res.status).toBe(401);
  });
});

/* ── Session creation sets ownerId ────────────── */

describe("session creation with auth", () => {
  it("creates session with ownerId matching authenticated user", async () => {
    const policy = await createPolicyFromText("Auth Test", "Check step");
    const headers = await agentAuthHeaders();
    const { POST } = await import("@/app/api/sessions/route");

    const res = await POST(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers,
        body: JSON.stringify({ policyId: policy.id }),
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ownerId).toBe(AGENT_USER_ID);
  });
});

/* ── Session ownership enforcement ────────────── */

describe("session ownership", () => {
  let sessionId: string;

  beforeAll(async () => {
    const policy = await createPolicyFromText("Ownership Test", "Item A");
    const headers = await agentAuthHeaders();
    const { POST } = await import("@/app/api/sessions/route");

    const res = await POST(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers,
        body: JSON.stringify({ policyId: policy.id }),
      })
    );
    const body = await res.json();
    sessionId = body.id;
  });

  it("owner can access their session state", async () => {
    const headers = await agentAuthHeaders();
    const { GET } = await import("@/app/api/sessions/[sessionId]/state/route");

    const res = await GET(new Request("http://localhost", { headers }), {
      params: Promise.resolve({ sessionId }),
    });

    expect(res.status).toBe(200);
  });

  it("non-owner agent gets 403", async () => {
    const headers = await supervisorAuthHeaders();
    // Create a second agent-owned session, then try to access with a
    // different agent. Since we only have one agent seed user, we use
    // a supervisor to create a session and then try the agent token.
    const { POST } = await import("@/app/api/sessions/route");
    const policy = await createPolicyFromText("Other Owner", "Item B");

    const supRes = await POST(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers,
        body: JSON.stringify({ policyId: policy.id }),
      })
    );
    const supSession = await supRes.json();

    // Now try to access the supervisor's session as the agent
    const agentHeaders = await agentAuthHeaders();
    const { GET } = await import("@/app/api/sessions/[sessionId]/state/route");

    const res = await GET(
      new Request("http://localhost", { headers: agentHeaders }),
      { params: Promise.resolve({ sessionId: supSession.id }) }
    );

    expect(res.status).toBe(403);
  });

  it("supervisor can access any session", async () => {
    const headers = await supervisorAuthHeaders();
    const { GET } = await import("@/app/api/sessions/[sessionId]/state/route");

    // Access the agent-owned session as supervisor
    const res = await GET(new Request("http://localhost", { headers }), {
      params: Promise.resolve({ sessionId }),
    });

    expect(res.status).toBe(200);
  });
});

/* ── Logout / token revocation ────────────────── */

describe("POST /api/auth/logout", () => {
  async function mintAgentToken(): Promise<string> {
    const user = await getUserByEmail("agent@sentinel.local");
    if (!user) throw new Error("agent seed user missing");
    return signToken(user);
  }

  it("returns 200 and clears the cookie for a valid token", async () => {
    const token = await mintAgentToken();
    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const setCookie = res.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toMatch(/token=;/);
    expect(setCookie).toMatch(/Max-Age=0/);
  });

  it("returns 401 when no token is supplied", async () => {
    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST(
      new Request("http://localhost/api/auth/logout", { method: "POST" })
    );

    expect(res.status).toBe(401);
  });

  it("revokes the token so subsequent protected requests return 401", async () => {
    const token = await mintAgentToken();
    const { POST: logout } = await import("@/app/api/auth/logout/route");
    await logout(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
    );

    const { POST: createSession } = await import("@/app/api/sessions/route");
    const res = await createSession(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ policyId: "any" }),
      })
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/revoked/i);
  });

  it("only revokes the specific jti — a freshly issued token still works", async () => {
    const tokenA = await mintAgentToken();
    const { POST: logout } = await import("@/app/api/auth/logout/route");
    await logout(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
      })
    );

    // New login → new token → should be accepted.
    const tokenB = await mintAgentToken();
    expect(tokenB).not.toBe(tokenA);

    const policy = await createPolicyFromText("Post-Revoke", "Step");
    const { POST: createSession } = await import("@/app/api/sessions/route");
    const res = await createSession(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ policyId: policy.id }),
      })
    );

    expect(res.status).toBe(201);
  });
});
