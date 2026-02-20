import { NextResponse } from "next/server";
import {
  createPolicyFromText,
  listPolicies,
} from "@/lib/services/policyService";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, text } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid 'name' field" },
      { status: 400 }
    );
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid 'text' field" },
      { status: 400 }
    );
  }

  const policy = createPolicyFromText(name.trim(), text);
  return NextResponse.json(policy, { status: 201 });
}

export async function GET() {
  const policies = listPolicies();
  return NextResponse.json({ policies });
}
