import { NextResponse } from "next/server";
import {
  createPolicyFromText,
  listPolicies,
} from "@/lib/services/policyService";
import { logger } from "@/lib/logger";

const POLICY_NAME_MAX_LENGTH = 200;
const POLICY_TEXT_MAX_LENGTH = 50_000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logger.error("api.error", {
      data: {
        route: "POST /api/policies",
        status: 400,
        reason: "Invalid JSON body",
      },
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, text } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0) {
    logger.error("api.error", {
      data: { route: "POST /api/policies", status: 400, field: "name" },
    });
    return NextResponse.json(
      { error: "Missing or invalid 'name' field" },
      { status: 400 }
    );
  }

  if (name.trim().length > POLICY_NAME_MAX_LENGTH) {
    logger.error("api.error", {
      data: {
        route: "POST /api/policies",
        status: 400,
        field: "name",
        reason: `Exceeds ${POLICY_NAME_MAX_LENGTH} character limit`,
      },
    });
    return NextResponse.json(
      {
        error: `'name' must be at most ${POLICY_NAME_MAX_LENGTH} characters`,
      },
      { status: 400 }
    );
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    logger.error("api.error", {
      data: { route: "POST /api/policies", status: 400, field: "text" },
    });
    return NextResponse.json(
      { error: "Missing or invalid 'text' field" },
      { status: 400 }
    );
  }

  if (text.length > POLICY_TEXT_MAX_LENGTH) {
    logger.error("api.error", {
      data: {
        route: "POST /api/policies",
        status: 400,
        field: "text",
        reason: `Exceeds ${POLICY_TEXT_MAX_LENGTH} character limit`,
      },
    });
    return NextResponse.json(
      {
        error: `'text' must be at most ${POLICY_TEXT_MAX_LENGTH} characters`,
      },
      { status: 400 }
    );
  }

  const policy = createPolicyFromText(name.trim(), text);

  if (policy.checklist.length === 0) {
    logger.error("api.error", {
      data: {
        route: "POST /api/policies",
        status: 400,
        reason: "Policy text produced zero checklist items",
      },
    });
    return NextResponse.json(
      {
        error:
          "Policy text must contain at least one non-empty line for checklist generation",
      },
      { status: 400 }
    );
  }

  logger.info("policy.upload", {
    data: {
      policyId: policy.id,
      name: policy.name,
      checklistItemCount: policy.checklist.length,
    },
  });

  return NextResponse.json(policy, { status: 201 });
}

export async function GET() {
  const policies = listPolicies();
  return NextResponse.json({ policies });
}
