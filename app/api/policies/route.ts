import { NextResponse } from "next/server";
import {
  createPolicyFromText,
  listPolicies,
} from "@/lib/services/policyService";
import { authenticateRequest, authErrorResponse } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  createPolicyBodySchema,
  formatZodError,
} from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success) return authErrorResponse(authResult.error);
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

  const parsed = createPolicyBodySchema.safeParse(body);
  if (!parsed.success) {
    const message = formatZodError(parsed.error.issues);
    const field = String(parsed.error.issues[0]?.path?.[0] ?? "");
    logger.error("api.error", {
      data: {
        route: "POST /api/policies",
        status: 400,
        ...(field && { field }),
        reason: message,
      },
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const policy = await createPolicyFromText(parsed.data.name, parsed.data.text);

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

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success) return authErrorResponse(authResult.error);

  const policies = await listPolicies();
  return NextResponse.json({ policies });
}
