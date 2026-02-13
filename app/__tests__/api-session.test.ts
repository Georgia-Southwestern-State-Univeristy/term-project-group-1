/**
 * @jest-environment node
 */
import { POST } from "../api/session/route";

describe("POST /api/session", () => {
  it("returns a JSON response with sessionId and status", async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty("sessionId");
    expect(body).toHaveProperty("status", "created");
  });

  it("returns a valid UUID as sessionId", async () => {
    const response = await POST();
    const body = await response.json();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    expect(body.sessionId).toMatch(uuidRegex);
  });

  it("returns a unique sessionId on each call", async () => {
    const first = await (await POST()).json();
    const second = await (await POST()).json();

    expect(first.sessionId).not.toBe(second.sessionId);
  });
});
