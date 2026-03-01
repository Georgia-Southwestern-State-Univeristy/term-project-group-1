/**
 * @jest-environment node
 */
import { createPolicyFromText } from "@/lib/services/policyService";
import { createSession, endSession } from "@/lib/services/sessionService";
import {
  appendTranscriptEvents,
  getTranscript,
} from "@/lib/services/transcriptService";
import { autoCheckChecklist } from "@/lib/services/checklistService";
import { getCheckedIds } from "@/lib/repositories/checklistStateRepo";

describe("Week 7 — Real-time transcription & auto-checklist", () => {
  it("checks a checklist item when transcript contains matching text", () => {
    const policy = createPolicyFromText(
      "Security Protocol",
      "Verify caller identity\nConfirm account number"
    );
    const result = createSession(policy.id);
    if (!result.success) throw new Error("session creation failed");
    const session = result.session;

    appendTranscriptEvents(session.id, [
      {
        text: "I need to verify caller identity before proceeding",
        isFinal: true,
        occurredAt: new Date().toISOString(),
      },
    ]);

    const { fullText } = getTranscript(session.id);
    const newlyChecked = autoCheckChecklist(
      session.id,
      policy.checklist,
      fullText!
    );

    expect(newlyChecked).toHaveLength(1);
    const verifyItem = policy.checklist.find((c) =>
      c.text.includes("Verify caller identity")
    )!;
    expect(newlyChecked).toContain(verifyItem.id);

    const allChecked = getCheckedIds(session.id);
    expect(allChecked).toContain(verifyItem.id);
    expect(allChecked).not.toContain(
      policy.checklist.find((c) => c.text.includes("Confirm account number"))!
        .id
    );
  });

  it("builds fullText from final entries only and stores all entries", () => {
    const policy = createPolicyFromText("Test Policy", "Item one");
    const result = createSession(policy.id);
    if (!result.success) throw new Error("session creation failed");
    const session = result.session;

    appendTranscriptEvents(session.id, [
      {
        text: "partial speech",
        isFinal: false,
        occurredAt: new Date().toISOString(),
      },
      {
        text: "final sentence one",
        isFinal: true,
        occurredAt: new Date().toISOString(),
      },
      {
        text: "another partial",
        isFinal: false,
        occurredAt: new Date().toISOString(),
      },
      {
        text: "final sentence two",
        isFinal: true,
        occurredAt: new Date().toISOString(),
      },
    ]);

    const { entries, fullText } = getTranscript(session.id);

    expect(entries).toHaveLength(4);
    expect(fullText).toBe("final sentence one final sentence two");
  });

  it("rejects transcript events for an ended session (409)", async () => {
    const policy = createPolicyFromText("End Test", "Some item");
    const createResult = createSession(policy.id);
    if (!createResult.success) throw new Error("session creation failed");
    const session = createResult.session;

    endSession(session.id);

    const { POST } =
      await import("@/app/api/sessions/[sessionId]/transcript-events/route");

    const request = new Request(
      "http://localhost/api/sessions/" + session.id + "/transcript-events",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: [
            {
              text: "hello",
              isFinal: true,
              occurredAt: new Date().toISOString(),
            },
          ],
        }),
      }
    );

    const response = await POST(request, {
      params: Promise.resolve({ sessionId: session.id }),
    });

    expect(response.status).toBe(409);
  });

  it("matches checklist items regardless of casing, whitespace, and punctuation", () => {
    const policy = createPolicyFromText(
      "Fuzzy Policy",
      "Verify caller identity\nConfirm date of birth"
    );
    const result = createSession(policy.id);
    if (!result.success) throw new Error("session creation failed");
    const session = result.session;

    appendTranscriptEvents(session.id, [
      {
        text: "VERIFY   CALLER... IDENTITY!!",
        isFinal: true,
        occurredAt: new Date().toISOString(),
      },
      {
        text: "please CONFIRM   date-of-birth",
        isFinal: true,
        occurredAt: new Date().toISOString(),
      },
    ]);

    const { fullText } = getTranscript(session.id);
    const newlyChecked = autoCheckChecklist(
      session.id,
      policy.checklist,
      fullText!
    );

    expect(newlyChecked).toHaveLength(2);
    expect(newlyChecked).toContain(
      policy.checklist.find((c) => c.text === "Verify caller identity")!.id
    );
    expect(newlyChecked).toContain(
      policy.checklist.find((c) => c.text === "Confirm date of birth")!.id
    );
  });
});
