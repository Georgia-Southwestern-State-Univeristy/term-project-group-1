"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ── Types ───────────────────────────────────── */

interface SessionListItem {
  id: string;
  policyId: string;
  policyName: string;
  ownerId: string;
  status: string;
  createdAt: string;
  endedAt?: string;
}

interface TranscriptEntry {
  id: string;
  text: string;
  isFinal: boolean;
  occurredAt: string;
}

interface ChecklistRow {
  itemId: string;
  text: string;
  checked: boolean;
}

interface ThreatScore {
  overall: number;
  frequencyScore: number;
  complianceScore: number;
  keywordScore: number;
  level: "low" | "medium" | "high" | "critical";
}

interface SessionDetail {
  session: { id: string; status: string };
  transcript: { entries: TranscriptEntry[]; fullText: string | null };
  checklistState: ChecklistRow[];
  threatScore: ThreatScore;
}

/* ── Helpers ─────────────────────────────────── */

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatDuration(start: string, end?: string): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

const LEVEL_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  critical: "bg-red-100 text-red-800 border-red-300",
};

const LEVEL_BG: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

/* ── Component ───────────────────────────────── */

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* Auth guard + fetch session list */
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/sessions?status=ended", { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load sessions");
        const data = await res.json();
        setSessions(data.sessions);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  /* Expand/collapse a session */
  async function toggleSession(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }

    setExpandedId(id);
    setDetail(null);
    setDetailLoading(true);

    try {
      const res = await fetch(`/api/sessions/${id}/state`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load session detail");
      const data: SessionDetail = await res.json();
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  /* ── Render ─────────────────────────────────── */

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Session History</h1>

      {loading && <p className="text-sm text-gray-500">Loading sessions...</p>}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && sessions.length === 0 && (
        <p className="text-sm text-gray-500 italic">No ended sessions found.</p>
      )}

      <div className="space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className="rounded-lg border">
            {/* Session card header */}
            <button
              onClick={() => toggleSession(s.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
            >
              <div>
                <span className="font-medium">{s.policyName}</span>
                <span className="ml-3 text-sm text-gray-500">
                  {formatDate(s.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {formatDuration(s.createdAt, s.endedAt)}
                </span>
                <span className="text-xs text-gray-400">
                  {expandedId === s.id ? "▲" : "▼"}
                </span>
              </div>
            </button>

            {/* Expanded detail */}
            {expandedId === s.id && (
              <div className="border-t px-4 py-4">
                {detailLoading && (
                  <p className="text-sm text-gray-500">Loading details...</p>
                )}

                {!detailLoading && detail && (
                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Threat score */}
                    <div>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Threat Score
                      </h3>
                      <div
                        className={`mb-4 rounded-lg border p-3 text-center ${
                          LEVEL_COLORS[detail.threatScore.level]
                        }`}
                      >
                        <div className="text-3xl font-bold">
                          {detail.threatScore.overall}
                        </div>
                        <div className="mt-1 text-xs font-medium uppercase">
                          {detail.threatScore.level}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <ScoreBar
                          label="Frequency Stress"
                          value={detail.threatScore.frequencyScore}
                          level={detail.threatScore.level}
                        />
                        <ScoreBar
                          label="Compliance Gap"
                          value={detail.threatScore.complianceScore}
                          level={detail.threatScore.level}
                        />
                        <ScoreBar
                          label="Keyword Threat"
                          value={detail.threatScore.keywordScore}
                          level={detail.threatScore.level}
                        />
                      </div>
                    </div>

                    {/* Checklist */}
                    <div>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Checklist
                      </h3>
                      <ul className="space-y-1.5">
                        {detail.checklistState.map((item) => (
                          <li
                            key={item.itemId}
                            className="flex items-center gap-2"
                          >
                            <span
                              className={`inline-flex h-4 w-4 items-center justify-center rounded border text-xs ${
                                item.checked
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-gray-300"
                              }`}
                            >
                              {item.checked ? "✓" : ""}
                            </span>
                            <span
                              className={`text-sm ${
                                item.checked
                                  ? "text-gray-500 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {item.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Transcript */}
                    <div>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Transcript
                      </h3>
                      <div className="max-h-64 space-y-1 overflow-y-auto">
                        {detail.transcript.entries.filter((e) => e.isFinal)
                          .length === 0 && (
                          <p className="text-sm text-gray-400 italic">
                            No transcript entries.
                          </p>
                        )}
                        {detail.transcript.entries
                          .filter((e) => e.isFinal)
                          .map((entry) => (
                            <p key={entry.id} className="text-sm text-gray-900">
                              {entry.text}
                            </p>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {!detailLoading && !detail && (
                  <p className="text-sm text-red-500">
                    Failed to load session details.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sub-score bar ───────────────────────────── */

function ScoreBar({
  label,
  value,
  level,
}: {
  label: string;
  value: number;
  level: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-gray-600">{label}</span>
        <span className="font-mono text-gray-500">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${LEVEL_BG[level]}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
