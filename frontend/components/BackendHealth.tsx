'use client';

import { useEffect, useState } from 'react';

type BackendStatus = 'checking' | 'connected' | 'disconnected';

interface HealthInfo {
  ollama: boolean;
  model: string;
  docs: number;
  models_available: boolean;
}

export default function BackendHealth() {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [backendUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('friday_api_base') || 'http://localhost:8000';
    }
    return 'http://localhost:8000';
  });

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/v1/status`, {
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) throw new Error('Backend unhealthy');
        const data = await res.json();
        if (!mounted) return;
        setStatus('connected');
        setHealth({
          ollama: data.ollama ?? false,
          model: data.model ?? 'unknown',
          docs: data.indexed_docs ?? 0,
          models_available: data.ollama_connected ?? false,
        });
      } catch {
        if (!mounted) return;
        setStatus('disconnected');
        setHealth(null);
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [backendUrl]);

  if (status === 'connected' && health) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/90 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center shadow-2xl">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <svg
              className="h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-red-300">
          {status === 'checking' ? 'Connecting...' : 'Local AI Engine is not running'}
        </h2>
        <p className="mb-6 text-sm text-zinc-400">
          Start the backend to enable chat, documents, voice, and memory.
        </p>
        <div className="mb-6 space-y-2 text-left text-xs text-zinc-500">
          <p className="font-mono">
            <span className="text-zinc-400">$</span> cd backend &amp;&amp; source venv/bin/activate
            &amp;&amp; python -m uvicorn main:app --host 0.0.0.0 --port 8000
          </p>
          <p className="font-mono">
            <span className="text-zinc-400">$</span> ollama serve
          </p>
          <p className="font-mono">
            <span className="text-zinc-400">$</span> ollama pull phi3
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-6 py-2 text-sm text-cyan-300 transition-all hover:bg-cyan-500/20"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}
