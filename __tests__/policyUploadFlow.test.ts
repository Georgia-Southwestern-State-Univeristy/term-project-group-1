/** @jest-environment node */
import {
  createPolicyFromText,
  fetchPolicy,
} from "@/lib/services/policyService";
import { createSession } from "@/lib/services/sessionService";

describe("Policy Upload → Checklist Generation Flow", () => {
  it("creates a policy with a generated checklist", () => {
    const policy = createPolicyFromText("HIPAA Basic", "line1\nline2\nline3");

    expect(policy.name).toBe("HIPAA Basic");
    expect(policy.checklist).toHaveLength(3);
    expect(policy.checklist[0].text).toBe("line1");
    expect(policy.checklist[0].order).toBe(1);
    expect(policy.checklist[1].text).toBe("line2");
    expect(policy.checklist[1].order).toBe(2);
    expect(policy.checklist[2].text).toBe("line3");
    expect(policy.checklist[2].order).toBe(3);
  });

  it("fetches a stored policy by id", () => {
    const created = createPolicyFromText(
      "Security Protocol",
      "Verify badge\nCheck clearance"
    );

    const fetched = fetchPolicy(created.id);

    expect(fetched).toBeDefined();
    expect(fetched!.id).toBe(created.id);
    expect(fetched!.name).toBe("Security Protocol");
    expect(fetched!.checklist).toHaveLength(2);
  });

  it("creates a session linked to an existing policy", () => {
    const policy = createPolicyFromText("Test Policy", "Step one\nStep two");

    const result = createSession(policy.id);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.session.policyId).toBe(policy.id);
      expect(result.session.status).toBe("active");
    }
  });

  it("returns not_found for a non-existent policy", () => {
    const result = createSession("non-existent-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("not_found");
    }
  });
});
