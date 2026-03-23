"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FRONTEND_TURN_LIMIT } from "@/lib/config/transcription";

interface Policy {
  id: string;
  name: string;
  checklist: { id: string; text: string }[];
}

interface Session {
  id: string;
  policyId: string;
  status: string;
}

interface ChecklistStateRow {
  itemId: string;
  text: string;
  checked: boolean;
}

/* ── audio buffer helper ─────────────────────── */

function mergeBuffers(
  lhs: Int16Array<ArrayBufferLike>,
  rhs: Int16Array<ArrayBufferLike>
): Int16Array<ArrayBuffer> {
  const merged = new Int16Array(lhs.length + rhs.length);
  merged.set(lhs, 0);
  merged.set(rhs, lhs.length);
  return merged;
}

/* ── frequency bar chart ─────────────────────── */

const BAND_HZ_SPAN = (16000 / 2048) * (1024 / 32); // ~250 Hz per band

function FrequencyBars({ bands }: { bands: number[] }) {
  return (
    <div className="flex h-20 items-end gap-px">
      {bands.map((db, i) => {
        const normalized = Math.max(0, Math.min(1, (db + 100) / 100));
        return (
          <div
            key={i}
            className="flex-1 rounded-t bg-blue-500"
            style={{ height: `${normalized * 100}%` }}
            title={`${(i * BAND_HZ_SPAN).toFixed(0)}–${((i + 1) * BAND_HZ_SPAN).toFixed(0)} Hz: ${db.toFixed(1)} dB`}
          />
        );
      })}
    </div>
  );
}

/* ── component ───────────────────────────────── */

export default function DemoPage() {
  const router = useRouter();

  // policy & session state
  const [policyName, setPolicyName] = useState("");
  const [policyText, setPolicyText] = useState("");
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // transcript & checklist state
  const [transcriptText, setTranscriptText] = useState("");
  const [checklist, setChecklist] = useState<ChecklistStateRow[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  });

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  function authHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    router.push("/login");
  }

  // frequency analysis state
  const [dominantHz, setDominantHz] = useState<number | null>(null);
  const [frequencyBands, setFrequencyBands] = useState<number[]>([]);

  // mutable refs for audio/ws resources
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const turnsRef = useRef<Record<number, string>>({} as Record<number, string>);
  const postedTurnsRef = useRef(new Set<number>());
  const analyserIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  /* ── API helpers ─────────────────────────────── */

  async function createPolicy() {
    setError(null);
    const res = await fetch("/api/policies", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: policyName, text: policyText }),
    });
    if (!res.ok) {
      setError(`Policy creation failed: ${res.status}`);
      return;
    }
    const data = await res.json();
    setPolicy(data);
    setSession(null);
    setChecklist([]);
    setTranscriptText("");
  }

  async function createSession() {
    if (!policy) return;
    setError(null);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ policyId: policy.id }),
    });
    if (!res.ok) {
      setError(`Session creation failed: ${res.status}`);
      return;
    }
    const data = await res.json();
    setSession(data);
    setTranscriptText("");
    await refreshState(data.id);
  }

  async function refreshState(sessionId: string) {
    const res = await fetch(`/api/sessions/${sessionId}/state`, {
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const data = await res.json();
    setChecklist(data.checklistState);
  }

  async function postTranscriptEvent(sessionId: string, text: string) {
    await fetch(`/api/sessions/${sessionId}/transcript-events`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        events: [{ text, isFinal: true, occurredAt: new Date().toISOString() }],
      }),
    });
    await refreshState(sessionId);
  }

  async function endSession() {
    if (!session) return;
    await fetch(`/api/sessions/${session.id}/end`, {
      method: "POST",
      headers: authHeaders(),
    });
    await refreshState(session.id);
    setSession((s) => (s ? { ...s, status: "ended" } : s));
  }

  /* ── start/stop streaming ────────────────────── */

  async function startStreaming() {
    if (!session) return;
    setError(null);

    // 1. Get temp token
    const tokenRes = await fetch("/api/assemblyai/token", { method: "POST" });
    if (!tokenRes.ok) {
      setError(
        `Token request failed: ${tokenRes.status}. Is ASSEMBLYAI_API_KEY set?`
      );
      return;
    }
    const { token } = await tokenRes.json();

    // 2. Request mic permission first
    let mediaStream: MediaStream;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setError(`Microphone access failed: ${err}`);
      return;
    }
    streamRef.current = mediaStream;

    // 3. Open WebSocket with sample_rate param
    const ws = new WebSocket(
      `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&formatted_finals=true&token=${token}`
    );
    wsRef.current = ws;

    // Reset turn tracking
    turnsRef.current = {};
    postedTurnsRef.current = new Set();
    let maxTurnSeen = -1;

    ws.onopen = async () => {
      setStreaming(true);

      try {
        // 4. AudioContext at 16kHz — browser resamples natively
        const audioCtx = new AudioContext({
          sampleRate: 16000,
        });
        audioCtxRef.current = audioCtx;
        await audioCtx.audioWorklet.addModule("/worklets/pcm-processor.js");

        const source = audioCtx.createMediaStreamSource(mediaStream);
        const workletNode = new AudioWorkletNode(audioCtx, "pcm-processor");

        // Insert AnalyserNode for real-time FFT (PCM → frequency Hz)
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048; // 1024 bins, ~7.8 Hz resolution at 16kHz
        source.connect(analyser);
        analyser.connect(workletNode);
        workletNode.connect(audioCtx.destination);

        // Sample frequency data every 250ms
        const freqDataArray = new Float32Array(analyser.frequencyBinCount);
        const sampleRate = audioCtx.sampleRate;
        const fftSize = analyser.fftSize;
        const binResolution = sampleRate / fftSize;
        const numBands = 32;
        const binsPerBand = Math.floor(analyser.frequencyBinCount / numBands);

        analyserIntervalRef.current = setInterval(() => {
          analyser.getFloatFrequencyData(freqDataArray);

          // Find dominant frequency (bin with max dB)
          let maxDb = -Infinity;
          let maxBin = 0;
          for (let i = 1; i < freqDataArray.length; i++) {
            if (freqDataArray[i] > maxDb) {
              maxDb = freqDataArray[i];
              maxBin = i;
            }
          }
          const dominant = maxBin * binResolution;
          setDominantHz(dominant);

          // Condense to 32 bands (average dB per band)
          const bands: number[] = [];
          for (let b = 0; b < numBands; b++) {
            let sum = 0;
            for (let i = 0; i < binsPerBand; i++) {
              sum += freqDataArray[b * binsPerBand + i];
            }
            bands.push(sum / binsPerBand);
          }
          setFrequencyBands(bands);

          // Fire-and-forget POST to backend
          if (session) {
            fetch(`/api/sessions/${session.id}/frequency`, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({
                dominantFrequencyHz: dominant,
                frequencyBins: bands,
                sampleRateHz: sampleRate,
                fftSize,
                binResolutionHz: binResolution,
              }),
            }).catch(() => {
              // Silently ignore — must not affect streaming
            });
          }
        }, 250);

        // 5. Buffer audio to ~100ms chunks before sending
        let audioBufferQueue = new Int16Array(0);

        workletNode.port.onmessage = (event: MessageEvent) => {
          if (ws.readyState !== WebSocket.OPEN) return;

          const currentBuffer = new Int16Array(
            event.data.audio_data as ArrayBuffer
          );
          audioBufferQueue = mergeBuffers(audioBufferQueue, currentBuffer);

          const bufferDuration =
            (audioBufferQueue.length / audioCtx.sampleRate) * 1000;

          if (bufferDuration >= 100) {
            const totalSamples = Math.floor(audioCtx.sampleRate * 0.1);
            const finalBuffer = new Uint8Array(
              audioBufferQueue.subarray(0, totalSamples).buffer
            );
            audioBufferQueue = audioBufferQueue.subarray(totalSamples);
            ws.send(finalBuffer);
          }
        };
      } catch (err) {
        setError(`Audio setup failed: ${err}`);
        ws.close();
        setStreaming(false);
      }
    };

    // 6. Handle v3 Turn messages
    ws.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "Turn") {
        const { turn_order, transcript, end_of_turn } = msg;
        const turns = turnsRef.current;
        const posted = postedTurnsRef.current;
        turns[turn_order as number] = transcript;

        const sortedKeys = Object.keys(turns)
          .sort((a, b) => Number(a) - Number(b))
          .map(Number);

        // Prune oldest turns to keep memory stable
        if (sortedKeys.length > FRONTEND_TURN_LIMIT) {
          const toRemove = sortedKeys.slice(
            0,
            sortedKeys.length - FRONTEND_TURN_LIMIT
          );
          for (const k of toRemove) {
            delete turns[k];
            posted.delete(k);
          }
          sortedKeys.splice(0, sortedKeys.length - FRONTEND_TURN_LIMIT);
        }

        const fullText = sortedKeys.map((k) => turns[k]).join(" ");
        setTranscriptText(fullText);

        // Post previous turns that ended implicitly (new turn_order appeared)
        if (turn_order > maxTurnSeen) {
          for (let t = maxTurnSeen; t >= 0; t--) {
            if (!posted.has(t) && turns[t]) {
              posted.add(t);
              postTranscriptEvent(session.id, turns[t]);
            }
          }
          maxTurnSeen = turn_order;
        }

        // Post when AssemblyAI explicitly marks turn as ended
        if (end_of_turn && transcript && !posted.has(turn_order)) {
          posted.add(turn_order);
          postTranscriptEvent(session.id, transcript);
        }
      }
    };

    ws.onerror = () => {
      setError("WebSocket error — check browser console");
      setStreaming(false);
    };

    ws.onclose = () => {
      setStreaming(false);
    };
  }

  async function stopStreaming() {
    // Flush any unposted turns to backend
    if (session) {
      const turns = turnsRef.current;
      const posted = postedTurnsRef.current;
      for (const key of Object.keys(turns)) {
        const t = Number(key);
        if (!posted.has(t) && turns[t]) {
          posted.add(t);
          await postTranscriptEvent(session.id, turns[t]);
        }
      }
    }

    // Stop frequency sampling
    if (analyserIntervalRef.current) {
      clearInterval(analyserIntervalRef.current);
      analyserIntervalRef.current = null;
    }

    // Send terminate and close WS
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "Terminate" }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Close AudioContext
    if (audioCtxRef.current) {
      await audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    setStreaming(false);
    await endSession();
  }

  /* ── render ──────────────────────────────────── */

  const btnBase =
    "rounded-md px-4 py-2 text-sm font-medium text-white focus:outline-2 focus:outline-offset-2";

  if (!token) return null;

  return (
    <div className="mx-auto max-w-2xl p-5">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Call Co-pilot Demo</h1>
        <button
          onClick={handleLogout}
          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Logout
        </button>
      </div>

      {/* JWT Token display */}
      <div className="mb-6 rounded-md bg-gray-100 p-3 dark:bg-gray-800">
        <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          JWT Token
        </p>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-gray-700 dark:text-gray-300">
          {token}
        </pre>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* ── Create Policy ─────────────────────── */}
      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">1. Create Policy</h2>
        <input
          type="text"
          placeholder="Policy name"
          value={policyName}
          onChange={(e) => setPolicyName(e.target.value)}
          className="mb-2 block w-full rounded border p-2 text-sm"
        />
        <textarea
          placeholder={
            "One checklist item per line, e.g.:\nVerify caller identity\nConfirm account number\nRead disclosure statement"
          }
          value={policyText}
          onChange={(e) => setPolicyText(e.target.value)}
          rows={4}
          className="mb-2 block w-full rounded border p-2 text-sm"
        />
        <button
          onClick={createPolicy}
          disabled={!policyName.trim() || !policyText.trim()}
          className={`${btnBase} bg-blue-600 hover:bg-blue-700 disabled:opacity-50`}
        >
          Create Policy
        </button>
        {policy && (
          <p className="mt-2 text-sm text-gray-600">
            Policy created: {policy.name} ({policy.checklist.length} items)
          </p>
        )}
      </section>

      {/* ── Create Session ────────────────────── */}
      {policy && (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">2. Create Session</h2>
          <button
            onClick={createSession}
            disabled={!!session}
            className={`${btnBase} bg-green-600 hover:bg-green-700 disabled:opacity-50`}
          >
            Create Session
          </button>
          {session && (
            <p className="mt-2 text-sm text-gray-600">
              Session: {session.id} ({session.status})
            </p>
          )}
        </section>
      )}

      {/* ── Checklist ─────────────────────────── */}
      {session && checklist.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">Checklist</h2>
          <ul className="space-y-1">
            {checklist.map((item) => (
              <li key={item.itemId} className="flex items-center gap-2 text-sm">
                <span
                  className={item.checked ? "text-green-600" : "text-gray-400"}
                >
                  {item.checked ? "[x]" : "[ ]"}
                </span>
                <span className={item.checked ? "line-through" : ""}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Transcription controls ────────────── */}
      {session && session.status === "active" && (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">3. Transcription</h2>
          <div className="flex gap-2">
            {!streaming ? (
              <button
                onClick={startStreaming}
                className={`${btnBase} bg-green-600 hover:bg-green-700`}
              >
                Start
              </button>
            ) : (
              <button
                onClick={stopStreaming}
                className={`${btnBase} bg-red-600 hover:bg-red-700`}
              >
                Stop
              </button>
            )}
          </div>

          {/* Live transcript */}
          <div className="mt-4">
            <h3 className="mb-1 text-sm font-medium">Live Transcript</h3>
            <div className="min-h-[60px] rounded border bg-gray-50 p-3 text-sm text-gray-900">
              {transcriptText || (
                <span className="text-gray-400">
                  {streaming
                    ? "Listening..."
                    : "Press Start to begin transcription"}
                </span>
              )}
            </div>
          </div>

          {/* Live frequency analysis */}
          {streaming && (
            <div className="mt-4">
              <h3 className="mb-1 text-sm font-medium">
                Frequency Analysis (FFT)
              </h3>
              <div className="rounded border bg-gray-50 p-3">
                <p className="mb-2 text-xs text-gray-500">
                  PCM → FFT → Frequency (Hz) · 16 kHz sample rate · 2048-point
                  FFT · ~7.8 Hz/bin
                </p>
                {dominantHz !== null && (
                  <p className="mb-3 text-lg font-semibold tabular-nums">
                    Dominant: {dominantHz.toFixed(1)} Hz
                  </p>
                )}
                {frequencyBands.length > 0 && (
                  <FrequencyBars bands={frequencyBands} />
                )}
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>0 Hz</span>
                  <span>8000 Hz</span>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
