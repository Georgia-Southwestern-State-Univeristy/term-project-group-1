import { NextResponse } from "next/server";
import {
  createPolicyFromText,
  listPolicies,
} from "@/lib/services/policyService";
import { authenticateRequest, authErrorResponse } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createPolicyBodySchema } from "@/lib/validation/schemas";
import { parseRequestBody } from "@/lib/validation/parseRequestBody";

const ROUTE = "POST /api/policies";

export async function POST(request: Request) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success) return authErrorResponse(authResult.error);

  const parsed = await parseRequestBody(request, createPolicyBodySchema, ROUTE);
  if (!parsed.success) return parsed.response;

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
