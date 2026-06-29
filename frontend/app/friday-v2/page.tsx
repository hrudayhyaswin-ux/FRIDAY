"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Cpu,
  Mic,
  Send,
  Trash2,
  RefreshCw,
  Sparkles,
  Database,
  Terminal,
  Activity,
  Volume2,
  VolumeX,
  Play,
  Layers,
  Shield,
  FileText,
  Upload,
  HardDrive,
  Info
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

const API_BASE = "http://localhost:8000/api/v1";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface Model {
  name: string;
  size: number;
  details: {
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

interface SystemStatus {
  status: string;
  ollama_connected: boolean;
  ollama_host: string;
}

interface MemoryFact {
  key: string;
  value: string;
  created?: string;
}

interface PluginModule {
  id: string;
  name: string;
  desc: string;
  params: Record<string, string>;
  status: string;
}

export default function FridayApp() {
  // Navigation / Panel states
  const [activePanel, setActivePanel] = useState<"hud" | "memory" | "plugins" | "docs">("hud");
  
  // Core AI & Chat states
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "F.R.I.D.A.Y. system activated. Network interface offline. Mainframe linked to local Ollama core. How may I assist you, sir?"
    }
  ]);
  const [input, setInput] = useState<string>("");
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [status, setStatus] = useState<SystemStatus>({
    status: "initializing",
    ollama_connected: false,
    ollama_host: ""
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [assistantState, setAssistantState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");

  // Monospace Terminal Feed
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    "SYS_INIT: Establishing secure sandbox environment...",
    "DB_INIT: Mapping offline SQLite facts core...",
    "SPEECH_CORE: Loading Whisper transcription pipeline...",
    "PLUGIN_MGR: Scanning macOS plugin permissions...",
  ]);

  // Voice States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceMode, setVoiceMode] = useState<boolean>(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // SQLite Memory States
  const [memories, setMemories] = useState<MemoryFact[]>([]);
  const [memKey, setMemKey] = useState<string>("");
  const [memVal, setMemVal] = useState<string>("");

  // RAG States
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plugin states
  const [plugins, setPlugins] = useState<PluginModule[]>([]);
  const [volumeValue, setVolumeValue] = useState<number>(50);
  const [appName, setAppName] = useState<string>("");
  const [systemStats, setSystemStats] = useState<string>("");

  // Visualizer ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Fetches
  useEffect(() => {
    fetchStatus();
    fetchModels();
    fetchMemories();
    fetchPlugins();
    fetchUploadedFiles();
  }, []);

  // Update loop when switching tabs
  useEffect(() => {
    if (activePanel === "memory") fetchMemories();
    if (activePanel === "docs") fetchUploadedFiles();
    if (activePanel === "plugins") fetchPlugins();
  }, [activePanel]);

  // Canvas visualizer logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    let phase = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      phase += 0.05;

      // Define visualizer waves based on active state
      let numWaves = 3;
      let amplitude = 10;
      let speedMultiplier = 1;
      let color = "rgba(6, 182, 212, 0.4)"; // Cyan

      if (assistantState === "listening") {
        numWaves = 5;
        amplitude = 30;
        speedMultiplier = 2.5;
        color = "rgba(244, 63, 94, 0.5)"; // Rose-red/Pink
      } else if (assistantState === "thinking") {
        numWaves = 4;
        amplitude = 15;
        speedMultiplier = 1.8;
        color = "rgba(168, 85, 247, 0.5)"; // Purple
      } else if (assistantState === "speaking") {
        numWaves = 6;
        amplitude = 25;
        speedMultiplier = 1.2;
        color = "rgba(59, 130, 246, 0.5)"; // Blue
      } else {
        // Idle
        numWaves = 2;
        amplitude = 3;
        speedMultiplier = 0.5;
        color = "rgba(6, 182, 212, 0.25)";
      }

      ctx.lineWidth = 1.5;
      
      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        const wavePhase = phase + i * (Math.PI / 4);
        const waveAmp = amplitude * (1 - i / numWaves);
        
        ctx.strokeStyle = color;
        if (i === 0) {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = color.replace(/[\d.]+\)$/, "0.8)");
        } else {
          ctx.lineWidth = 1;
        }

        for (let x = 0; x < width; x++) {
          const angle = (x / width) * Math.PI * 2 * (1.5 + i * 0.5) - wavePhase * speedMultiplier;
          const y = height / 2 + Math.sin(angle) * waveAmp * Math.sin(x / width * Math.PI);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Add central horizontal line glow
      ctx.beginPath();
      ctx.strokeStyle = color.replace(/[\d.]+\)$/, "0.1)");
      ctx.lineWidth = 4;
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [assistantState]);

  const addTelemetry = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTelemetryLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // API calls
  const fetchStatus = async () => {
    try {
      addTelemetry("SYS_PING: Connecting backend heartbeat...");
      const res = await fetch(`${API_BASE}/status`);
      if (!res.ok) throw new Error("Backend offline");
      const data = await res.json();
      setStatus(data);
      if (data.ollama_connected) {
        addTelemetry(`SYS_STATUS: Ollama core ONLINE at ${data.ollama_host}`);
      } else {
        addTelemetry("SYS_WARN: Ollama framework offline. Voice response degraded.");
      }
    } catch (err: any) {
      addTelemetry(`SYS_ERR: Connection timed out: ${err.message}`);
      setStatus({ status: "offline", ollama_connected: false, ollama_host: "" });
    }
  };

  const fetchModels = async () => {
    try {
      addTelemetry("MODEL_CORE: Scanning local index cache...");
      const res = await fetch(`${API_BASE}/models`);
      if (!res.ok) throw new Error("Offline index unreachable");
      const data = await res.json();
      setModels(data);
      if (data.length > 0) {
        setSelectedModel(data[0].name);
        addTelemetry(`MODEL_CORE: Found ${data.length} GGUF files: ${data.map((m: any) => m.name).join(", ")}`);
      } else {
        addTelemetry("MODEL_WARN: Index empty. Load models via 'ollama pull phi3'.");
      }
    } catch (err: any) {
      addTelemetry(`MODEL_ERR: Query failed: ${err.message}`);
    }
  };

  const fetchMemories = async () => {
    try {
      const res = await fetch(`${API_BASE}/memory`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (err: any) {
      addTelemetry(`DB_ERR: SQLite index error: ${err.message}`);
    }
  };

  const fetchPlugins = async () => {
    try {
      const res = await fetch(`${API_BASE}/plugins`);
      if (res.ok) {
        const data = await res.json();
        setPlugins(data.plugins || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/docs/files`);
      if (res.ok) {
        const data = await res.json();
        setUploadedFiles(data.files || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Actions
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memKey.trim() || !memVal.trim()) return;
    try {
      addTelemetry(`DB_WRITE: Storing memory key '${memKey}'...`);
      const res = await fetch(`${API_BASE}/memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: memKey, value: memVal })
      });
      if (!res.ok) throw new Error("Write failed");
      addTelemetry(`DB_WRITE: Stored successfully: ${memKey}`);
      setMemKey("");
      setMemVal("");
      fetchMemories();
    } catch (err: any) {
      addTelemetry(`DB_ERR: Write failed: ${err.message}`);
    }
  };

  const handleDeleteMemory = async (key: string) => {
    try {
      addTelemetry(`DB_WRITE: Erasing memory key '${key}'...`);
      const res = await fetch(`${API_BASE}/memory/${key}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      addTelemetry(`DB_WRITE: Erased successfully.`);
      fetchMemories();
    } catch (err: any) {
      addTelemetry(`DB_ERR: Erase failed: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    addTelemetry(`RAG_ENGINE: Vectorizing '${file.name}'...`);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/docs/upload`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Vectorization failed");
      const data = await res.json();
      addTelemetry(`RAG_ENGINE: Chunked '${file.name}' into ${data.chunks_count} nodes.`);
      fetchUploadedFiles();
    } catch (err: any) {
      addTelemetry(`RAG_ERR: Indexing failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearDocs = async () => {
    try {
      addTelemetry("RAG_ENGINE: Wiping vector cache...");
      const res = await fetch(`${API_BASE}/docs/clear`, { method: "DELETE" });
      if (res.ok) {
        addTelemetry("RAG_ENGINE: Vector store cleared.");
        fetchUploadedFiles();
      }
    } catch (err: any) {
      addTelemetry(`RAG_ERR: Clear failed: ${err.message}`);
    }
  };

  const handleRunPlugin = async (action: string, params: Record<string, any> = {}) => {
    addTelemetry(`MODULE_RUN: Executing plugin action '${action}'...`);
    try {
      const res = await fetch(`${API_BASE}/plugins/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, params })
      });
      if (!res.ok) throw new Error("Execution failed");
      const data = await res.json();
      addTelemetry(`MODULE_RESP: Success: ${data.message}`);
      if (action === "system_stats") {
        setSystemStats(data.message);
      }
    } catch (err: any) {
      addTelemetry(`MODULE_ERR: Execution failed: ${err.message}`);
    }
  };

  const playTTS = async (text: string) => {
    try {
      setAssistantState("speaking");
      addTelemetry("TTS_CORE: Generating audio stream synthesis...");
      const res = await fetch(`${API_BASE}/speech/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error("Audio synthesis failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onended = () => {
        setAssistantState("idle");
        addTelemetry("TTS_CORE: Speech output playback completed.");
      };

      await audio.play();
    } catch (err: any) {
      setAssistantState("idle");
      addTelemetry(`TTS_ERR: Audio render blocked: ${err.message}`);
    }
  };

  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const query = overrideText || input;
    if (!query.trim() || isLoading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setAssistantState("thinking");
    addTelemetry(`LLM_QUERY: Pipeline payload size ${query.length} chars.`);

    // Add assistant response container
    const assistantIndex = updatedMessages.length;
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel || undefined,
          messages: updatedMessages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Model server disconnected");
      }

      if (!response.body) throw new Error("Payload empty");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let responseText = "";

      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;
        if (value) {
          const chunk = decoder.decode(value);
          responseText += chunk;
          setMessages(prev => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex].content = responseText;
            }
            return next;
          });
        }
      }
      
      addTelemetry("LLM_QUERY: Streaming finalized.");
      setIsLoading(false);

      if (voiceMode && responseText.trim()) {
        await playTTS(responseText);
      } else {
        setAssistantState("idle");
      }
    } catch (error: any) {
      setIsLoading(false);
      setAssistantState("idle");
      addTelemetry(`LLM_ERR: Stream aborted: ${error.message}`);
      setMessages(prev => {
        const next = [...prev];
        if (next[assistantIndex]) {
          next[assistantIndex].content = `SYSTEM FAILURE: ${error.message}. Please restart local LLM services.`;
        }
        return next;
      });
    }
  };

  const startRecording = async () => {
    try {
      setAssistantState("listening");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options = {};
      let mimeType = "audio/webm";

      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          options = { mimeType: "audio/webm" };
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          options = { mimeType: "audio/mp4" };
          mimeType = "audio/mp4";
        }
      }

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
        mimeType = mediaRecorder.mimeType || "audio/webm";
      }

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const finalMimeType = mediaRecorder.mimeType || mimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
        await processVoiceBlob(audioBlob, finalMimeType);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      addTelemetry("STT_CORE: Capture pipeline ACTIVE. Listening...");
    } catch (err: any) {
      setAssistantState("idle");
      addTelemetry(`STT_ERR: Recording failed: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAssistantState("thinking");
      addTelemetry("STT_CORE: Compiling audio waveform buffer...");
    }
  };

  const processVoiceBlob = async (audioBlob: Blob, mimeType: string) => {
    try {
      const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("wav") ? "wav" : "webm";
      const formData = new FormData();
      formData.append("file", audioBlob, `voice.${ext}`);
      
      addTelemetry("STT_CORE: Vectorizing sound buffer to speech matrix...");
      const res = await fetch(`${API_BASE}/speech/transcribe`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Whisper decode failed");
      const data = await res.json();
      const text = data.text;
      
      if (text) {
        addTelemetry(`STT_CORE: Decoded: "${text}"`);
        handleSend(undefined, text);
      } else {
        addTelemetry("STT_WARN: No text recognized in wave buffer.");
        setAssistantState("idle");
      }
    } catch (err: any) {
      setAssistantState("idle");
      addTelemetry(`STT_ERR: Whisper decoding error: ${err.message}`);
    }
  };

  const clearChatHistory = () => {
    setMessages([
      {
        role: "assistant",
        content: "Core history registers purged. Awaiting instructions, sir."
      }
    ]);
    addTelemetry("SYS_MAINTENANCE: purges all memory caches.");
  };

  return (
    <div className="relative min-h-screen bg-[#020512] text-[#0ea5e9] font-mono overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      
      {/* Sci-Fi HUD Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)+50%,rgba(0,0,0,0.25)+50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%+4px,3px+100%] z-50"></div>
      
      {/* Sci-Fi Grid Background */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(14,165,233,0.03)+1px,transparent+1px),linear-gradient(90deg,rgba(14,165,233,0.03)+1px,transparent+1px)] bg-[size:40px+40px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]"></div>

      {/* Futuristic Header */}
      <header className="relative border-b border-cyan-950 bg-black/60 backdrop-blur-md px-6 py-4 flex items-center justify-between z-40 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-cyan-500 animate-pulse">
            <div className="absolute w-6 h-6 rounded-full border border-dashed border-cyan-400 animate-[spin_10s_linear_infinite]"></div>
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-cyan-400 flex items-center gap-2">
              F.R.I.D.A.Y. <span className="text-[10px] bg-cyan-950 px-2 py-0.5 border border-cyan-800 text-cyan-300 rounded font-normal">V2.0 PRO</span>
            </h1>
            <p className="text-[10px] text-cyan-600">OFFLINE DECISION INTELLIGENCE CORE</p>
          </div>
        </div>

        {/* Global Stats */}
        <div className="hidden md:flex items-center gap-6 text-[10px] text-cyan-500">
          <div className="flex items-center gap-2 border border-cyan-950 px-3 py-1 bg-cyan-950/20 rounded">
            <Activity size={10} className="text-cyan-400 animate-pulse" />
            <span>OLLAMA: </span>
            <span className={status.ollama_connected ? "text-green-400" : "text-red-500"}>
              {status.ollama_connected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          <div className="flex items-center gap-2 border border-cyan-950 px-3 py-1 bg-cyan-950/20 rounded">
            <Cpu size={10} className="text-purple-400" />
            <span>MODEL:</span>
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                addTelemetry(`SYS_CONFIG: Model switched to: ${e.target.value}`);
              }}
              className="bg-transparent border-none text-cyan-300 font-mono outline-none cursor-pointer"
            >
              {models.length > 0 ? (
                models.map(m => <option key={m.name} value={m.name} className="bg-[#020512]">{m.name}</option>)
              ) : (
                <option value="">None Loaded</option>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 border border-cyan-950 px-3 py-1 bg-cyan-950/20 rounded">
            <button
              onClick={() => {
                setVoiceMode(!voiceMode);
                addTelemetry(`SYS_CONFIG: TTS speech output ${!voiceMode ? "ENABLED" : "DISABLED"}`);
              }}
              className="flex items-center gap-1.5 focus:outline-none"
            >
              {voiceMode ? (
                <>
                  <Volume2 size={12} className="text-cyan-400 animate-bounce" />
                  <span className="text-cyan-300">TTS: ACTIVE</span>
                </>
              ) : (
                <>
                  <VolumeX size={12} className="text-cyan-600" />
                  <span className="text-cyan-600">TTS: MUTED</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <main className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-30 max-w-[1600px] mx-auto min-h-[calc(100vh-80px)]">
        
        {/* LEFT COLUMN: Controls & telemetry modules (lg:col-span-4) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Module 1: Navigation Grid */}
          <div className="border border-cyan-950 bg-black/40 backdrop-blur-md rounded-lg p-4 shadow-[inset_0_0_15px_rgba(6,182,212,0.02)]">
            <h2 className="text-xs text-cyan-400 font-bold mb-3 tracking-widest border-b border-cyan-950 pb-1.5 flex items-center gap-2">
              <Layers size={12} className="text-cyan-400" /> SYSTEM NAVIGATION
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "hud", label: "MAIN HUD", icon: Activity, desc: "Friday central core" },
                { id: "memory", label: "SQL MEMORY", icon: Database, desc: "Knowledge matrix" },
                { id: "plugins", label: "MAC PLUGINS", icon: Cpu, desc: "OS control unit" },
                { id: "docs", label: "DOC INTEL", icon: FileText, desc: "RAG engine core" }
              ].map(panel => {
                const IconComp = panel.icon;
                const isSelected = activePanel === panel.id;
                return (
                  <button
                    key={panel.id}
                    onClick={() => setActivePanel(panel.id as any)}
                    className={`flex flex-col items-start p-3 rounded border text-left transition-all ${
                      isSelected
                        ? "bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        : "bg-black/40 border-cyan-950 text-cyan-600 hover:border-cyan-800 hover:text-cyan-400"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <IconComp size={14} className={isSelected ? "text-cyan-400" : "text-cyan-600"} />
                      {panel.label}
                    </div>
                    <span className="text-[9px] opacity-75 mt-1 block font-sans">{panel.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module 2: Monospace Telemetry Logs Feed */}
          <div className="border border-cyan-950 bg-black/40 backdrop-blur-md rounded-lg p-4 flex-1 flex flex-col min-h-[220px] shadow-[inset_0_0_15px_rgba(6,182,212,0.02)]">
            <h2 className="text-xs text-cyan-400 font-bold mb-2 tracking-widest border-b border-cyan-950 pb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-2"><Terminal size={12} /> CORE TELEMETRY FEED</span>
              <button 
                onClick={() => setTelemetryLogs(["SYS_LOGS: Purged. Terminal restarted."])}
                className="text-[9px] text-cyan-600 hover:text-cyan-400 flex items-center gap-1"
              >
                Clear
              </button>
            </h2>
            <div className="flex-1 overflow-y-auto text-[9.5px] leading-relaxed text-cyan-500 font-mono space-y-1 h-[180px] pr-2 scrollbar-thin">
              {telemetryLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2 border-l border-cyan-950 pl-2 py-0.5 hover:bg-cyan-950/10">
                  <span className="text-cyan-700 select-none">&gt;</span>
                  <span className={log.includes("ERR") ? "text-rose-500" : log.includes("WARN") ? "text-amber-500" : log.includes("SUCCESS") || log.includes("ONLINE") ? "text-green-400" : "text-cyan-400"}>
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Module 3: Security & Health Status Card */}
          <div className="border border-cyan-950 bg-black/40 backdrop-blur-md rounded-lg p-4 shadow-[inset_0_0_15px_rgba(6,182,212,0.02)]">
            <h2 className="text-xs text-cyan-400 font-bold mb-3 tracking-widest border-b border-cyan-950 pb-1.5 flex items-center gap-2">
              <Shield size={12} className="text-cyan-400" /> DEPLOYMENT INTEGRITY
            </h2>
            <div className="space-y-2.5 text-[10px] text-cyan-500">
              <div className="flex items-center justify-between border-b border-cyan-950 pb-1.5">
                <span>Core Framework:</span>
                <span className="text-green-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
                  SECURE & OFFLINE
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-cyan-950 pb-1.5">
                <span>RAG Database Vector store:</span>
                <span className="text-cyan-300">{uploadedFiles.length} file index nodes</span>
              </div>
              <div className="flex items-center justify-between border-b border-cyan-950 pb-1.5">
                <span>SQLite Memory Registers:</span>
                <span className="text-cyan-300">{memories.length} fact associations</span>
              </div>
              <div className="flex items-center justify-between">
                <span>OS Plugins Linked:</span>
                <span className="text-green-400">5 plugins active</span>
              </div>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: Display Screen (lg:col-span-8) */}
        <section className="lg:col-span-8 flex flex-col gap-6">

          {/* Panel A: MAIN HUD (Concentric Radar Rings & Central Visualizer) */}
          {activePanel === "hud" && (
            <div className="border border-cyan-950 bg-black/40 backdrop-blur-md rounded-lg p-6 flex flex-col md:flex-row items-center justify-center gap-8 relative overflow-hidden min-h-[320px] shadow-[0_0_30px_rgba(6,182,212,0.02)]">
              
              {/* Star Trek Grid Overlay inside HUD */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#020512_90%)] pointer-events-none"></div>
              
              {/* Left Side: Animated Concentric Ring HUD / ARC Reactor */}
              <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center flex-shrink-0 z-10">
                
                {/* Outermost Ring (Radar tick rotation) */}
                <div className={`absolute w-full h-full rounded-full border border-dashed border-cyan-950 animate-[spin_60s_linear_infinite]`}></div>
                
                {/* Secondary Ring (Thicker sections rotating opposite) */}
                <div className={`absolute w-[88%] h-[88%] rounded-full border-2 border-dashed border-cyan-800/40 animate-[spin_40s_linear_reverse_infinite]`}></div>
                
                {/* Animated Scanner Radar sweeps */}
                <div className="absolute w-[80%] h-[80%] rounded-full border border-cyan-600/10 bg-[conic-gradient(from_0deg,rgba(6,182,212,0.08)_0deg,transparent_120deg)] animate-[spin_5s_linear_infinite]"></div>

                {/* Third Concentric Ring (Glowing stats dots) */}
                <div className={`absolute w-[75%] h-[75%] rounded-full border border-cyan-500/20 flex items-center justify-center`}>
                  <div className="absolute w-2 h-2 bg-cyan-400 rounded-full top-0 left-1/2 -translate-x-1/2 animate-pulse"></div>
                  <div className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full bottom-0 left-1/2 -translate-x-1/2 animate-pulse"></div>
                </div>

                {/* Fourth Ring (Speed shift based on states) */}
                <div className={`absolute w-[60%] h-[60%] rounded-full border border-double ${
                  assistantState === "listening" ? "border-rose-500 animate-[spin_4s_linear_infinite]" :
                  assistantState === "thinking" ? "border-purple-500 animate-[spin_6s_linear_infinite]" :
                  assistantState === "speaking" ? "border-blue-500 animate-[spin_8s_linear_infinite]" :
                  "border-cyan-500/30 animate-[spin_20s_linear_infinite]"
                }`}></div>

                {/* Inner Glowing Reactor Core */}
                <div className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center border-4 backdrop-blur-md transition-all duration-500 ${
                  assistantState === "listening" 
                    ? "bg-rose-950/40 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.5)]" 
                    : assistantState === "thinking"
                    ? "bg-purple-950/40 border-purple-500 shadow-[0_0_35px_rgba(168,85,247,0.5)]"
                    : assistantState === "speaking"
                    ? "bg-blue-950/40 border-blue-500 shadow-[0_0_35px_rgba(59,130,246,0.5)]"
                    : "bg-cyan-950/40 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:scale-105"
                }`}>
                  <span className={`text-[9px] tracking-widest font-sans font-bold ${
                    assistantState === "listening" ? "text-rose-400" :
                    assistantState === "thinking" ? "text-purple-400" :
                    assistantState === "speaking" ? "text-blue-400" :
                    "text-cyan-300"
                  }`}>
                    {assistantState.toUpperCase()}
                  </span>
                  
                  {/* Central interactive voice button inside core */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`mt-1.5 p-2.5 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? "bg-rose-500 text-white animate-pulse"
                        : "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-black"
                    }`}
                    title={isRecording ? "Stop recording voice" : "Trigger voice search input"}
                  >
                    <Mic size={18} />
                  </button>
                </div>
              </div>

              {/* Right Side: Waveform Visualizer & Telemetry Text */}
              <div className="flex-1 w-full flex flex-col gap-4 z-10">
                <div className="border border-cyan-950/60 bg-black/40 rounded-lg p-4">
                  <h3 className="text-xs text-cyan-400 font-bold mb-2 tracking-wider flex items-center gap-1.5">
                    <Activity size={12} className="text-cyan-400 animate-pulse" /> SPEECH HARMONIC FREQUENCY
                  </h3>
                  
                  {/* Waveform Canvas */}
                  <div className="h-20 w-full bg-black/60 rounded border border-cyan-950/80 overflow-hidden relative">
                    <canvas ref={canvasRef} className="w-full h-full" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] text-cyan-500">
                  <div className="border border-cyan-950 bg-black/40 p-2.5 rounded">
                    <span className="text-cyan-600 block mb-0.5">MATRIX STATUS:</span>
                    <span className="font-bold text-cyan-300">Heartbeat Active</span>
                  </div>
                  <div className="border border-cyan-950 bg-black/40 p-2.5 rounded">
                    <span className="text-cyan-600 block mb-0.5">VOICE TRANSLATION:</span>
                    <span className="font-bold text-cyan-300">Whisper Tiny/EN</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Panel B: SQL MEMORY REGISTER MANAGER */}
          {activePanel === "memory" && (
            <div className="border border-cyan-950 bg-black/40 backdrop-blur-md rounded-lg p-6 flex flex-col gap-4 shadow-[0_0_30px_rgba(6,182,212,0.02)]">
              <div className="flex items-center justify-between border-b border-cyan-950 pb-2">
                <h2 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Database size={16} /> SQLITE OFFLINE ASSOCIATIONS CORE
                </h2>
                <button
                  onClick={fetchMemories}
                  className="text-xs text-cyan-400 hover:text-white flex items-center gap-1 bg-cyan-950/40 border border-cyan-800 px-2 py-0.5 rounded"
                >
                  <RefreshCw size={10} /> Sync
                </button>
              </div>

              {/* Memory Add Input Row */}
              <form onSubmit={handleAddMemory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. Owner)"
                  value={memKey}
                  onChange={(e) => setMemKey(e.target.value)}
                  className="bg-black/60 border border-cyan-950 focus:border-cyan-500 px-3 py-1.5 text-xs text-cyan-300 font-mono outline-none rounded flex-1"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Tony Stark)"
                  value={memVal}
                  onChange={(e) => setMemVal(e.target.value)}
                  className="bg-black/60 border border-cyan-950 focus:border-cyan-500 px-3 py-1.5 text-xs text-cyan-300 font-mono outline-none rounded flex-1"
                />
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs px-4 py-1.5 rounded transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                >
                  Store Fact
                </button>
              </form>

              {/* Memory Table Grid */}
              <div className="border border-cyan-950 rounded overflow-hidden mt-2 bg-black/20">
                <div className="grid grid-cols-12 bg-cyan-950/40 p-2 text-xs font-bold border-b border-cyan-950 text-cyan-300">
                  <div className="col-span-4 border-r border-cyan-950/60 pr-2">FACT IDENTIFIER</div>
                  <div className="col-span-7 pl-2">SAVED TELEMETRY VALUE</div>
                  <div className="col-span-1 text-center">purge</div>
                </div>
                <div className="max-h-[220px] overflow-y-auto divide-y divide-cyan-950/40 text-xs">
                  {memories.length > 0 ? (
                    memories.map((mem) => (
                      <div key={mem.key} className="grid grid-cols-12 p-2 hover:bg-cyan-950/10 items-center text-cyan-400">
                        <div className="col-span-4 border-r border-cyan-950/60 pr-2 truncate font-bold text-cyan-300">{mem.key}</div>
                        <div className="col-span-7 pl-2 truncate">{mem.value}</div>
                        <div className="col-span-1 text-center">
                          <button
                            onClick={() => handleDeleteMemory(mem.key)}
                            className="text-rose-500 hover:text-rose-300 focus:outline-none"
                            title="Purge fact register"
                          >
                            <Trash2 size={12} className="mx-auto" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-cyan-700 italic">
                      Offline association databases index empty. Storing memories will seed LLM queries automatically!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Panel C: MAC OS SYSTEM CONTROL MODULES */}
          {activePanel === "plugins" && (
            <div className="border border-cyan-950 bg-black/40 backdrop-blur-md rounded-lg p-6 flex flex-col gap-4 shadow-[0_0_30px_rgba(6,182,212,0.02)]">
              <div className="flex items-center justify-between border-b border-cyan-950 pb-2">
                <h2 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Cpu size={16} /> MACOS NATIVE CONTROLLERS & SERVICES
                </h2>
              </div>

              {/* Grid of Plugin Control Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Controller 1: Volume Adjustment slider */}
                <div className="border border-cyan-950 bg-black/40 p-4 rounded-lg flex flex-col gap-2">
                  <h3 className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                    <Volume2 size={12} /> VOLUME GAIN AMPLIFIER
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volumeValue}
                      onChange={(e) => setVolumeValue(Number(e.target.value))}
                      className="w-full accent-cyan-500 bg-cyan-950 h-1.5 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-cyan-400 w-8">{volumeValue}%</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleRunPlugin("set_volume", { level: volumeValue })}
                      className="flex-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold text-[10px] py-1.5 rounded transition-all"
                    >
                      Set Level
                    </button>
                    <button
                      onClick={() => handleRunPlugin("mute_system")}
                      className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900 text-rose-400 font-bold text-[10px] px-3 py-1.5 rounded transition-all"
                    >
                      Mute
                    </button>
                  </div>
                </div>

                {/* Controller 2: System Stats Monitor */}
                <div className="border border-cyan-950 bg-black/40 p-4 rounded-lg flex flex-col gap-2">
                  <h3 className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                    <Activity size={12} /> SYSTEM RESOURCE FEED
                  </h3>
                  <div className="flex-1 min-h-[50px] max-h-[75px] bg-black/60 rounded border border-cyan-950/80 p-2 font-mono text-[9px] text-cyan-400 overflow-y-auto pr-1">
                    {systemStats ? (
                      <pre className="whitespace-pre-wrap">{systemStats}</pre>
                    ) : (
                      <span className="text-cyan-700 italic">Query resources to print metrics.</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRunPlugin("system_stats")}
                    className="w-full bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold text-[10px] py-1.5 rounded mt-1 transition-all"
                  >
                    Query Telemetry Metrics
                  </button>
                </div>

                {/* Controller 3: Desktop App Launcher */}
                <div className="border border-cyan-950 bg-black/40 p-4 rounded-lg flex flex-col gap-2">
                  <h3 className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                    <Play size={12} /> APP LAUNCH COMMANDER
                  </h3>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="App Name (e.g. Safari)"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="bg-black/60 border border-cyan-950 focus:border-cyan-500 px-3 py-1 text-xs text-cyan-300 font-mono outline-none rounded flex-1"
                    />
                    <button
                      onClick={() => {
                        if (appName.trim()) {
                          handleRunPlugin("launch_app", { app_name: appName });
                          setAppName("");
                        }
                      }}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-[10px] px-4 py-1 rounded transition-all"
                    >
                      Launch
                    </button>
                  </div>
                  <span className="text-[8px] text-cyan-600 italic">Opens applications inside the local macOS shell environment.</span>
                </div>

                {/* Controller 4: High-Res Screenshot Capture */}
                <div className="border border-cyan-950 bg-black/40 p-4 rounded-lg flex flex-col justify-between gap-2">
                  <div>
                    <h3 className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                      <Terminal size={12} /> HOST DISPLAY MONITOR
                    </h3>
                    <p className="text-[9px] text-cyan-600 leading-normal mt-1">
                      Commands the system display engine to snap active displays and dump files into the local workspace screenshot pool.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRunPlugin("take_screenshot")}
                    className="w-full bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-bold text-[10px] py-1.5 rounded transition-all"
                  >
                    Capture Main Display Output
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Panel D: DOCUMENT RAG VECTOR INDEXING CORE */}
          {activePanel === "docs" && (
            <div className="border border-cyan-950 bg-black/40 backdrop-blur-md rounded-lg p-6 flex flex-col gap-4 shadow-[0_0_30px_rgba(6,182,212,0.02)]">
              <div className="flex items-center justify-between border-b border-cyan-950 pb-2">
                <h2 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <FileText size={16} /> RAG INDEXING KNOWLEDGE BASE
                </h2>
                <button
                  onClick={handleClearDocs}
                  className="text-xs text-rose-500 hover:text-rose-300 flex items-center gap-1 bg-rose-950/20 border border-rose-900/60 px-2 py-0.5 rounded transition-all"
                >
                  <Trash2 size={10} /> Clear Stores
                </button>
              </div>

              {/* Upload Interface */}
              <div className="border border-dashed border-cyan-950 rounded-lg p-6 text-center hover:border-cyan-500 transition-all cursor-pointer bg-black/20"
                   onClick={() => fileInputRef.current?.click()}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.pdf,.docx"
                  className="hidden"
                />
                <Upload size={24} className="mx-auto text-cyan-500 mb-2 animate-bounce" />
                <span className="text-xs text-cyan-300 block font-bold">DRAG & DROP OR SELECT MANUSCRIPT SOURCE</span>
                <span className="text-[9px] text-cyan-600 mt-1 block">Supports .txt, .pdf, .docx (Vectorized on local host machine)</span>
              </div>

              {/* Upload Queue loading bar */}
              {isUploading && (
                <div className="w-full bg-cyan-950/40 rounded border border-cyan-800 p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] text-cyan-400">
                    <span className="font-bold flex items-center gap-1.5">
                      <RefreshCw size={10} className="animate-spin" /> Vectorizing document assets...
                    </span>
                  </div>
                  <div className="w-full bg-cyan-950 h-1.5 rounded overflow-hidden">
                    <div className="bg-cyan-400 h-full animate-[progress_1.5s_infinite_linear]" style={{ width: "30%" }}></div>
                  </div>
                </div>
              )}

              {/* List of uploaded files */}
              <div className="flex-1 mt-2">
                <h3 className="text-xs text-cyan-400 font-bold mb-2 tracking-wider flex items-center gap-1">
                  <HardDrive size={11} /> INDEXED DOCUMENT REPOSITORIES
                </h3>
                <div className="border border-cyan-950 bg-black/20 rounded max-h-[140px] overflow-y-auto divide-y divide-cyan-950/40 text-xs">
                  {uploadedFiles.length > 0 ? (
                    uploadedFiles.map((file, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-cyan-400 hover:bg-cyan-950/10">
                        <span className="font-mono flex items-center gap-2">
                          <FileText size={12} className="text-cyan-500" />
                          {file}
                        </span>
                        <span className="text-[9px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded">INDEXED</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-cyan-700 italic">
                      No vector documents uploaded. Drag documents to feed local LLM queries.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CENTRAL CHAT SHELL CARD (Stays present below active panel) */}
          <div className="flex-1 border border-cyan-950 bg-black/40 backdrop-blur-md rounded-lg p-4 flex flex-col min-h-[350px] shadow-[0_0_30px_rgba(6,182,212,0.02)]">
            
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-cyan-950 pb-2 mb-3">
              <span className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                <MessageSquare size={13} className="text-cyan-400 animate-pulse" /> Friday chat mainframe
              </span>
              <div className="flex gap-2">
                <button
                  onClick={clearChatHistory}
                  className="text-[9px] text-cyan-600 hover:text-rose-400 transition-colors"
                  title="Purge chat history registers"
                >
                  Purge History
                </button>
              </div>
            </div>

            {/* Chat Messages viewport */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[320px] scrollbar-thin scroll-smooth">
              {messages.map((msg, index) => {
                const isAssistant = msg.role === "assistant";
                return (
                  <div
                    key={index}
                    className={`flex flex-col max-w-[85%] rounded border transition-all ${
                      isAssistant
                        ? "mr-auto bg-cyan-950/10 border-cyan-950 text-cyan-300 shadow-[inset_0_0_10px_rgba(6,182,212,0.02)]"
                        : "ml-auto bg-[#030922]/60 border-cyan-900 text-cyan-100"
                    } p-3.5`}
                  >
                    {/* User / Assistant header tag */}
                    <div className={`text-[9px] font-bold mb-1 tracking-widest ${
                      isAssistant ? "text-cyan-400" : "text-cyan-600"
                    }`}>
                      {isAssistant ? "✦ F.R.I.D.A.Y." : "✦ USER"}
                    </div>
                    
                    {/* Rendered content */}
                    <div className="text-xs leading-relaxed font-mono whitespace-pre-wrap select-text selection:bg-cyan-500 selection:text-black">
                      {isAssistant ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Spinner loader indicator */}
              {isLoading && (
                <div className="mr-auto max-w-[85%] rounded border border-cyan-950 bg-cyan-950/10 p-3.5 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  <span className="text-[10px] text-cyan-500 italic">Thinking...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Send command line form */}
            <form onSubmit={handleSend} className="mt-4 flex gap-2 border border-cyan-950 p-1.5 rounded-lg bg-black/60 focus-within:border-cyan-500 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter command parameters..."
                className="flex-1 bg-transparent border-none text-xs text-cyan-300 font-mono focus:outline-none px-3"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="p-2 rounded bg-cyan-950/60 hover:bg-cyan-500 hover:text-black text-cyan-400 transition-all border border-cyan-800/80 flex items-center justify-center"
                disabled={isLoading || !input.trim()}
              >
                <Send size={14} />
              </button>
            </form>
          </div>

        </section>

      </main>

      {/* Global Bottom Status Bar */}
      <footer className="border-t border-cyan-950 bg-black/80 backdrop-blur-md px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-cyan-600 z-40 relative">
        <span>© 2026 FRIDAY CORE LABS. SYSTEM LICENSED UNDER OFFLINE STANDBY RULES.</span>
        <span className="flex items-center gap-2 mt-1 sm:mt-0">
          <Info size={10} />
          <span>PORT HANDSHAKE: http://localhost:8000/api/v1 (FastAPI)</span>
        </span>
      </footer>

    </div>
  );
}
