import { NextResponse } from "next/server";
import { fetchPolicy } from "@/lib/services/policyService";
import { authenticateRequest, authErrorResponse } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ policyId: string }> }
) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success) return authErrorResponse(authResult.error);

  const { policyId } = await params;

  const policy = await fetchPolicy(policyId);
  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  return NextResponse.json(policy);
}
