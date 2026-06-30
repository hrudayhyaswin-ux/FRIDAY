'use client';

import { useEffect, useState } from 'react';

interface OfflineState {
  online: boolean;
  backend: 'checking' | 'connected' | 'disconnected';
  llmModel: string;
  modelsCount: number;
}

export default function OfflineStatus() {
  const [state, setState] = useState<OfflineState>({
    online: navigator.onLine,
    backend: 'checking',
    llmModel: '',
    modelsCount: 0,
  });

  useEffect(() => {
    const goOnline = () => setState((s) => ({ ...s, online: true }));
    const goOffline = () => setState((s) => ({ ...s, online: false }));
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/status', {
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!mounted) return;
        setState((s) => ({
          ...s,
          backend: 'connected',
          llmModel: data.model || '',
          modelsCount: data.indexed_docs || 0,
        }));
      } catch {
        if (!mounted) return;
        setState((s) => ({ ...s, backend: 'disconnected', llmModel: '' }));
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="border-t border-zinc-800/60 px-3 py-2">
      <div className="text-[10px] font-mono text-zinc-500 mb-1.5 tracking-wider uppercase flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
        System Status
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <span className="text-zinc-600">Runtime</span>
        <span className="text-zinc-400 text-right">CPU</span>
        <span className="text-zinc-600">LLM</span>
        <span className={`text-right ${state.llmModel ? 'text-cyan-400' : 'text-zinc-500'}`}>
          {state.llmModel || '—'}
        </span>
        <span className="text-zinc-600">Backend</span>
        <span
          className={`text-right ${
            state.backend === 'connected'
              ? 'text-green-400'
              : state.backend === 'checking'
                ? 'text-yellow-400'
                : 'text-red-400'
          }`}
        >
          {state.backend === 'connected'
            ? 'Connected'
            : state.backend === 'checking'
              ? 'Checking...'
              : 'Disconnected'}
        </span>
        <span className="text-zinc-600">Internet</span>
        <span className={`text-right ${state.online ? 'text-green-400' : 'text-red-400'}`}>
          {state.online ? 'Online' : 'Offline'}
        </span>
      </div>
      <div className="mt-1.5 text-[10px] text-cyan-400/70 font-mono text-center border-t border-zinc-800/40 pt-1">
        Offline Ready — Everything runs locally
      </div>
    </div>
  );
}
