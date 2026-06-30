'use client';

interface ModelSetupWizardProps {
  onClose: () => void;
}

export default function ModelSetupWizard({ onClose }: ModelSetupWizardProps) {
  const models = [
    { name: 'phi3:latest', label: 'Phi-3 Mini (3.8B)', desc: 'Fast, lightweight, good for CPU' },
    { name: 'qwen2.5:3b', label: 'Qwen2.5 (3B)', desc: 'Balanced speed and quality' },
    { name: 'gemma3:4b', label: 'Gemma 3 (4B)', desc: "Google's efficient small model" },
    { name: 'llama3.2:3b', label: 'Llama 3.2 (3B)', desc: 'Latest Meta small model' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/90 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-500/20 bg-zinc-950 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10">
            <svg
              className="h-8 w-8 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-100">No AI Models Detected</h2>
          <p className="mt-2 text-sm text-zinc-400">
            FRIDAY needs at least one local LLM to generate responses. Pull a model using Ollama to
            get started.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Recommended Models
          </p>
          {models.map((m) => (
            <div key={m.name} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{m.label}</p>
                  <p className="text-xs text-zinc-500">{m.desc}</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('http://localhost:8000/api/v1/status');
                      if (!res.ok) throw new Error('Backend not running');
                      onClose();
                      window.open('https://ollama.com/library/' + m.name.split(':')[0], '_blank');
                    } catch {
                      alert('Start the backend first, then run: ollama pull ' + m.name);
                    }
                  }}
                  className="shrink-0 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  Pull Model
                </button>
              </div>
              <p className="mt-2 text-[10px] font-mono text-zinc-600">ollama pull {m.name}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/20 p-4">
          <p className="text-xs font-mono text-zinc-400 mb-2">Manual setup</p>
          <code className="block text-[11px] text-zinc-500 font-mono leading-relaxed">
            # Install Ollama (one time)
            <br />
            curl -fsSL https://ollama.com/install.sh | sh
            <br />
            <br />
            # Pull a model
            <br />
            ollama pull phi3
            <br />
            <br />
            # Start Ollama
            <br />
            ollama serve
          </code>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-2 text-xs text-zinc-400 transition hover:text-zinc-200"
          >
            I&apos;ll set this up later
          </button>
        </div>
      </div>
    </div>
  );
}
