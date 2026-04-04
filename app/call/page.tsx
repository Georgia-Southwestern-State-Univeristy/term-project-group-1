"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ── Types ───────────────────────────────────── */

interface PolicySummary {
  id: string;
  name: string;
}

interface ChecklistRow {
  itemId: string;
  text: string;
  checked: boolean;
}

interface TranscriptEntry {
  id: string;
  text: string;
  isFinal: boolean;
  occurredAt: string;
}

interface ThreatScore {
  overall: number;
  frequencyScore: number;
  complianceScore: number;
  keywordScore: number;
  level: "low" | "medium" | "high" | "critical";
}

interface SessionState {
  session: { id: string; status: string };
  transcript: { entries: TranscriptEntry[]; fullText: string | null };
  checklistState: ChecklistRow[];
  threatScore: ThreatScore;
}

/* ── Helpers ─────────────────────────────────── */

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
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

export default function CallPage() {
  const [policies, setPolicies] = useState<PolicySummary[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollFailures, setPollFailures] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  /* Fetch policies on mount */
  useEffect(() => {
    fetch("/api/policies", { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPolicies(data.policies ?? data))
      .catch(() => setPolicies([]));
  }, []);

  /* Poll session state */
  const pollState = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/sessions/${sid}/state`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        setPollFailures((prev) => prev + 1);
        return;
      }
      const data: SessionState = await res.json();
      setState(data);
      setPollFailures(0);
      if (data.session.status === "ended" && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch {
      setPollFailures((prev) => prev + 1);
    }
  }, []);

  /* Start polling when session starts */
  useEffect(() => {
    if (!sessionId) return;
    pollState(sessionId);
    pollRef.current = setInterval(() => pollState(sessionId), 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionId, pollState]);

  /* Auto-scroll transcript */
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state?.transcript.entries.length]);

  /* Start session */
  const startSession = async () => {
    if (!selectedPolicyId) {
      setError("Select a policy first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ policyId: selectedPolicyId }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Failed to create session");
        return;
      }
      const data = await res.json();
      setSessionId(data.id);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  /* End session */
  const endSession = async () => {
    if (!sessionId) return;
    await fetch(`/api/sessions/${sessionId}/end`, {
      method: "POST",
      headers: authHeaders(),
    });
    pollState(sessionId);
  };

  const isActive = state?.session.status === "active";
  const threatScore = state?.threatScore;

  /* ── Pre-session: policy selection ───────────── */

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-md p-8">
        <h1 className="mb-6 text-2xl font-bold">Start Call Session</h1>

        {!getToken() && (
          <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            Not logged in.{" "}
            <a href="/login" className="underline">
              Log in
            </a>{" "}
            first.
          </div>
        )}

        <label className="mb-2 block text-sm font-medium">Select Policy</label>
        <select
          className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={selectedPolicyId}
          onChange={(e) => setSelectedPolicyId(e.target.value)}
        >
          <option value="">— choose —</option>
          {policies.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={startSession}
          disabled={loading || !selectedPolicyId}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Start Session"}
        </button>
      </div>
    );
  }

  /* ── Active session: two-column layout ───────── */

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Call Co-pilot</h1>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-mono">
            {sessionId.slice(0, 8)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isActive ? "Active" : "Ended"}
          </span>
        </div>
        {isActive && (
          <button
            onClick={endSession}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            End Session
          </button>
        )}
      </header>

      {pollFailures >= 2 && (
        <div
          className={`px-6 py-2 text-center text-sm font-medium ${
            pollFailures >= 5
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
          role="alert"
        >
          {pollFailures >= 5
            ? "Unable to connect. Please check your connection."
            : "Connection lost — retrying..."}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column: transcript + checklist */}
        <div className="flex flex-1 flex-col border-r">
          {/* Transcript */}
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Transcript
            </h2>
            {state?.transcript.entries.length === 0 && (
              <p className="text-sm text-gray-400 italic">Waiting for audio…</p>
            )}
            <div className="space-y-1">
              {state?.transcript.entries.map((entry) => (
                <p
                  key={entry.id}
                  className={`text-sm ${
                    entry.isFinal ? "text-gray-900" : "text-gray-400 italic"
                  }`}
                >
                  {entry.text}
                </p>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>

          {/* Checklist */}
          <div className="border-t p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Checklist
            </h2>
            <ul className="space-y-1.5">
              {state?.checklistState.map((item) => (
                <li key={item.itemId} className="flex items-center gap-2">
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
        </div>

        {/* Right column: threat score */}
        <div className="w-80 overflow-y-auto p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Threat Assessment
          </h2>

          {threatScore ? (
            <>
              {/* Overall badge */}
              <div
                className={`mb-6 rounded-lg border p-4 text-center ${
                  LEVEL_COLORS[threatScore.level]
                } ${threatScore.level === "critical" ? "animate-pulse" : ""}`}
              >
                <div className="text-4xl font-bold">{threatScore.overall}</div>
                <div className="mt-1 text-sm font-medium uppercase">
                  {threatScore.level}
                </div>
              </div>

              {/* Sub-scores */}
              <div className="space-y-4">
                <ScoreBar
                  label="Frequency Stress"
                  value={threatScore.frequencyScore}
                  level={threatScore.level}
                />
                <ScoreBar
                  label="Compliance Gap"
                  value={threatScore.complianceScore}
                  level={threatScore.level}
                />
                <ScoreBar
                  label="Keyword Threat"
                  value={threatScore.keywordScore}
                  level={threatScore.level}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">Loading…</p>
          )}
        </div>
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
