export interface ChecklistItem {
  id: string;
  policyId: string;
  text: string;
  order: number;
}

export interface Policy {
  id: string;
  name: string;
  text: string;
  createdAt: string;
  checklist: ChecklistItem[];
}

export interface PolicySummary {
  id: string;
  name: string;
  createdAt: string;
}

export interface Session {
  id: string;
  policyId: string;
  status: "active" | "ended";
  createdAt: string;
  endedAt?: string;
}

export interface PolicyUploadRequest {
  name: string;
  text: string;
}

export interface CreateSessionRequest {
  policyId: string;
}
