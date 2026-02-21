import { NextResponse } from "next/server";
import { fetchPolicy } from "@/lib/services/policyService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ policyId: string }> }
) {
  const { policyId } = await params;

  const policy = fetchPolicy(policyId);
  if (!policy) {
    return NextResponse.json({ error: "Policy not found" }, { status: 404 });
  }

  return NextResponse.json(policy);
}
