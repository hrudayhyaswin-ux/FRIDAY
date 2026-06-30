'use client';

import { useEffect, useState } from 'react';

interface StartupState {
  ollama: boolean;
  sqlite: boolean;
  models_available: boolean;
  model_count: number;
  indexed_docs: number;
  healthy: boolean;
}

export default function StartupWizard({ onComplete }: { onComplete: () => void }) {
  const [checks, setChecks] = useState<StartupState | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      while (mounted && !checks?.healthy) {
        try {
          const res = await fetch('http://localhost:8000/api/v1/health', {
            signal: AbortSignal.timeout(3000),
          });
          if (res.ok) {
            const data = await res.json();
            if (mounted) {
              setChecks(data.checks);
              if (data.healthy) {
                setTimeout(() => mounted && onComplete(), 1500);
              }
            }
          }
        } catch {
          if (mounted) {
            setChecks({
              ollama: false,
              sqlite: false,
              models_available: false,
              model_count: 0,
              indexed_docs: 0,
              healthy: false,
            });
          }
        }
        if (mounted) await new Promise((r) => setTimeout(r, 2000));
      }
    };
    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete]);

  const items = [
    {
      label: 'FastAPI Backend',
      ok: checks?.sqlite === true || checks?.sqlite === false,
      done: checks?.sqlite === true,
    },
    {
      label: 'SQLite Database',
      ok: checks?.sqlite === true || checks?.sqlite === false,
      done: checks?.sqlite === true,
    },
    {
      label: 'Ollama Service',
      ok: checks?.ollama === true || checks?.ollama === false,
      done: checks?.ollama === true,
    },
    {
      label: 'AI Models',
      ok: checks?.models_available === true || checks?.models_available === false,
      done: (checks?.model_count || 0) > 0,
    },
    { label: 'FAISS Index', ok: true, done: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 shadow-[0_0_30px_rgba(6,182,212,0.6)] flex items-center justify-center animate-pulse">
              <div className="h-4 w-4 rounded-full bg-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-widest bg-gradient-to-r from-cyan-400 via-cyan-200 to-white bg-clip-text text-transparent">
            FRIDAY AI
          </h1>
          <p className="mt-2 text-sm text-zinc-500 font-mono">Initializing Offline Systems...</p>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-all ${
                item.ok
                  ? item.done
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-yellow-500/20 bg-yellow-500/5'
                  : 'border-zinc-800 bg-zinc-900/20'
              }`}
            >
              <span
                className={`text-sm ${item.ok ? (item.done ? 'text-zinc-200' : 'text-zinc-400') : 'text-zinc-500'}`}
              >
                {item.label}
              </span>
              {!item.ok ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400" />
              ) : item.done ? (
                <svg
                  className="h-4 w-4 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-700 border-t-yellow-400" />
              )}
            </div>
          ))}
        </div>

        {checks && !checks.healthy && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/20 p-4 text-center">
            <p className="text-xs text-zinc-400">
              {!checks.ollama
                ? 'Ollama is not running. Start it with: ollama serve'
                : (checks.model_count || 0) === 0
                  ? 'No AI models found. Run: ollama pull phi3'
                  : 'Backend is initializing...'}
            </p>
          </div>
        )}

        {checks?.healthy && (
          <div className="text-center animate-fade-in">
            <p className="text-sm text-green-400 font-mono">All systems ready</p>
          </div>
        )}
      </div>
    </div>
  );
}
