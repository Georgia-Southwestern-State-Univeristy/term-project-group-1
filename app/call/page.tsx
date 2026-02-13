'use client';

import { useState } from 'react';

interface Session {
  sessionId: string;
  status: string;
}

export default function CallPage() {
  const [session, setSession] = useState<Session | null>(null);

  const startSession = async () => {
    const res = await fetch('/api/session', { method: 'POST' });
    const data = await res.json();
    setSession(data);
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Call Session</h1>
      <button
        onClick={startSession}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 active:bg-blue-800"
      >
        Start Session
      </button>
      {session && (
        <div className="mt-4">
          <p>Session ID: {session.sessionId}</p>
          <p>Status: {session.status}</p>
        </div>
      )}
    </div>
  );
}
