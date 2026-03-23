/** @jest-environment node */
import {
  createPolicyFromText,
  fetchPolicy,
} from "@/lib/services/policyService";
import { createSession } from "@/lib/services/sessionService";

describe("Policy Upload → Checklist Generation Flow", () => {
  it("creates a policy with a generated checklist", async () => {
    const policy = await createPolicyFromText(
      "HIPAA Basic",
      "line1\nline2\nline3"
    );

    expect(policy.name).toBe("HIPAA Basic");
    expect(policy.checklist).toHaveLength(3);
    expect(policy.checklist[0].text).toBe("line1");
    expect(policy.checklist[0].order).toBe(1);
    expect(policy.checklist[1].text).toBe("line2");
    expect(policy.checklist[1].order).toBe(2);
    expect(policy.checklist[2].text).toBe("line3");
    expect(policy.checklist[2].order).toBe(3);
  });

  it("fetches a stored policy by id", async () => {
    const created = await createPolicyFromText(
      "Security Protocol",
      "Verify badge\nCheck clearance"
    );

    const fetched = await fetchPolicy(created.id);

    expect(fetched).toBeDefined();
    expect(fetched!.id).toBe(created.id);
    expect(fetched!.name).toBe("Security Protocol");
    expect(fetched!.checklist).toHaveLength(2);
  });

  it("creates a session linked to an existing policy", async () => {
    const policy = await createPolicyFromText(
      "Test Policy",
      "Step one\nStep two"
    );

    const result = await createSession(policy.id, "test-owner");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.session.policyId).toBe(policy.id);
      expect(result.session.status).toBe("active");
    }
  });

  it("returns not_found for a non-existent policy", async () => {
    const result = await createSession("non-existent-id", "test-owner");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("not_found");
    }
  });
});
