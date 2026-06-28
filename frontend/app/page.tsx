"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  FileText, 
  Cpu, 
  Play, 
  Settings as SettingsIcon, 
  Activity, 
  Send, 
  Trash2, 
  RefreshCw, 
  ChevronRight, 
  Sparkles, 
  HardDrive, 
  Database,
  Terminal,
  Paperclip,
  Mic,
  AlertCircle,
  HelpCircle,
  Square,
  Volume2,
  VolumeX
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

export default function Home() {
  // Tabs: 'chat' | 'docs' | 'memory' | 'plugins' | 'system'
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello. I am FRIDAY. Systems are fully loaded and running offline. How can I assist you today?"
    }
  ]);
  const [input, setInput] = useState<string>("");
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [status, setStatus] = useState<SystemStatus>({
    status: "connecting",
    ollama_connected: false,
    ollama_host: ""
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "Initializing FRIDAY AI Core...",
    "Loading offline system variables...",
  ]);

  // Voice Interaction State (Phase 2)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceMode, setVoiceMode] = useState<boolean>(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // SQLite Memory State (Phase 3)
  const [memories, setMemories] = useState<MemoryFact[]>([]);
  const [newMemKey, setNewMemKey] = useState<string>("");
  const [newMemVal, setNewMemVal] = useState<string>("");

  // Document Intel RAG State (Phase 4)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch status, models, and memories on mount
  useEffect(() => {
    fetchSystemStatus();
    fetchModels();
    fetchMemories();
  }, []);

  // Sync memory when activeTab switches to memory
  useEffect(() => {
    if (activeTab === "memory") {
      fetchMemories();
    }
    if (activeTab === "docs") {
      fetchUploadedFiles();
    }
  }, [activeTab]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const fetchSystemStatus = async () => {
    try {
      addLog("Checking Ollama local connection status...");
      const res = await fetch(`${API_BASE}/status`);
      if (!res.ok) throw new Error("Status API returned error");
      const data = await res.json();
      setStatus(data);
      if (data.ollama_connected) {
        addLog(`Connected to Ollama host at ${data.ollama_host}`);
      } else {
        addLog("Ollama service not detected. Make sure Ollama app is running.");
      }
    } catch (err: any) {
      addLog(`Status Check Failed: ${err.message}`);
      setStatus({
        status: "offline",
        ollama_connected: false,
        ollama_host: "http://localhost:11434"
      });
    }
  };

  const fetchModels = async () => {
    try {
      addLog("Fetching locally available GGUF/Ollama models...");
      const res = await fetch(`${API_BASE}/models`);
      if (!res.ok) throw new Error("Models API returned error");
      const data = await res.json();
      setModels(data);
      if (data.length > 0) {
        setSelectedModel(data[0].name);
        addLog(`Found ${data.length} local model(s): ${data.map((m: any) => m.name).join(", ")}`);
      } else {
        addLog("No local models found. Pull a model using 'ollama pull phi3'.");
      }
    } catch (err: any) {
      addLog(`Models Fetch Failed: ${err.message}`);
    }
  };

  const fetchMemories = async () => {
    try {
      addLog("Syncing offline SQLite memory core...");
      const res = await fetch(`${API_BASE}/memory`);
      if (!res.ok) throw new Error("Memory API error");
      const data = await res.json();
      setMemories(data);
      addLog(`Loaded ${data.length} keys from SQLite.`);
    } catch (err: any) {
      addLog(`SQLite Fetch Failed: ${err.message}`);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemKey.trim() || !newMemVal.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newMemKey, value: newMemVal })
      });
      if (!res.ok) throw new Error("Failed to add memory");
      addLog(`Saved memory fact: ${newMemKey} -> ${newMemVal}`);
      setNewMemKey("");
      setNewMemVal("");
      fetchMemories();
    } catch (err: any) {
      addLog(`Memory Save Error: ${err.message}`);
    }
  };

  const handleDeleteMemory = async (key: string) => {
    try {
      const res = await fetch(`${API_BASE}/memory/${key}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete memory");
      addLog(`Deleted memory fact: ${key}`);
      fetchMemories();
    } catch (err: any) {
      addLog(`Memory Delete Error: ${err.message}`);
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
      console.error("Error fetching uploaded files:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    addLog(`Uploading document: ${file.name}...`);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch(`${API_BASE}/docs/upload`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      addLog(`Indexed '${file.name}' (${data.chunks_count} fragments stored locally)`);
      fetchUploadedFiles();
    } catch (err: any) {
      addLog(`RAG Upload Failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearDocs = async () => {
    try {
      const res = await fetch(`${API_BASE}/docs/clear`, {
        method: "DELETE"
      });
      if (res.ok) {
        addLog("SQLite Vector Store cleared.");
        fetchUploadedFiles();
      }
    } catch (err: any) {
      addLog(`RAG Clear Failed: ${err.message}`);
    }
  };

  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const userMessageText = overrideText || input;
    if (!userMessageText.trim() || isLoading) return;

    setInput("");
    
    const userMsg: Message = { role: "user", content: userMessageText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    addLog(`User command: "${userMessageText.substring(0, 30)}${userMessageText.length > 30 ? '...' : ''}"`);

    // Prepare assistant placeholder
    const assistantMsgIndex = updatedMessages.length;
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      addLog(`Streaming using model: ${selectedModel || "default"}`);
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
        throw new Error(errorText || "Failed to connect to model server");
      }

      if (!response.body) {
        throw new Error("Response body is empty");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedResponse = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          streamedResponse += chunk;
          
          setMessages(prev => {
            const next = [...prev];
            if (next[assistantMsgIndex]) {
              next[assistantMsgIndex].content = streamedResponse;
            }
            return next;
          });
        }
      }
      addLog("Stream finished successfully.");
      
      // Play TTS if voice mode is enabled
      if (voiceMode && streamedResponse.trim()) {
        playTTS(streamedResponse);
      }
    } catch (error: any) {
      console.error(error);
      addLog(`LLM Query Error: ${error.message}`);
      setMessages(prev => {
        const next = [...prev];
        if (next[assistantMsgIndex]) {
          next[assistantMsgIndex].content = `Error generating response: ${error.message}. Please verify the backend and Ollama server are active.`;
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playTTS = async (text: string) => {
    try {
      const res = await fetch(`${API_BASE}/speech/synthesize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error("TTS failed");
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play().catch((e) => {
        console.warn("Browser blocked audio playback:", e);
        addLog("Audio playback blocked by browser. Please interact with the page first.");
      });
    } catch (err: any) {
      addLog(`TTS Error: ${err.message}`);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudioInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      addLog("Microphone activated. Listening...");
    } catch (err: any) {
      addLog(`Microphone Error: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      addLog("Processing voice input...");
    }
  };

  const processAudioInput = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "voice.webm");
      
      const res = await fetch(`${API_BASE}/speech/transcribe`, {
        method: "POST",
        body: formData
      });
      
      if (!res.ok) throw new Error("Transcription failed");
      const data = await res.json();
      const transcribedText = data.text;
      
      if (transcribedText) {
        addLog(`Transcribed: "${transcribedText}"`);
        handleSend(undefined, transcribedText);
      } else {
        addLog("No speech detected.");
        setIsLoading(false);
      }
    } catch (err: any) {
      addLog(`STT Error: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: "assistant",
        content: "FRIDAY systems refreshed. Command history cleared. How can I help you?"
      }
    ]);
    addLog("Chat history cleared.");
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const suggestions = [
    "Write a Python script to scan files",
    "Explain what neural networks are in simple terms",
    "Generate a bash script to back up folders",
    "Help me organize my personal project roadmap"
  ];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#030712] text-zinc-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-full lg:w-80 flex flex-col border-r border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md">
        
        {/* Core Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Pulsing Core Orb */}
            <div className="relative flex items-center justify-center">
              <div className={`absolute w-8 h-8 rounded-full bg-cyan-500/20 blur-md ${isLoading ? 'animate-pulse' : ''}`} />
              <div className={`w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] flex items-center justify-center ${isLoading ? 'animate-spin' : ''}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-widest bg-gradient-to-r from-cyan-400 via-cyan-200 to-white bg-clip-text text-transparent">
                FRIDAY AI
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wider">OFFLINE PERSONAL CORE</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setVoiceMode(!voiceMode);
                addLog(`Voice synthesis ${!voiceMode ? 'enabled' : 'disabled'}`);
              }}
              className={`p-1.5 rounded-md ${voiceMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-800 text-zinc-500'} transition flex items-center justify-center`}
              title="Toggle Voice Mode"
            >
              {voiceMode ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <span className={`h-2 w-2 rounded-full ${status.ollama_connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`} />
            <span className="text-[10px] font-mono text-zinc-400 uppercase">
              {status.ollama_connected ? "Local" : "Offline"}
            </span>
          </div>
        </div>

        {/* Model Configuration Selector */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/20">
          <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-2 tracking-wider">
            Active Core Engine (LLM)
          </label>
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                addLog(`Switched active model to ${e.target.value}`);
              }}
              disabled={models.length === 0}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
            >
              {models.length > 0 ? (
                models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.details.parameter_size || "Local"})
                  </option>
                ))
              ) : (
                <option value="">No models detected</option>
              )}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
              ▼
            </div>
          </div>
          {models.length === 0 && (
            <p className="mt-2 text-[10px] text-rose-400 flex items-center gap-1">
              <AlertCircle size={10} /> Running in demo/offline mode. Pull a model.
            </p>
          )}
        </div>

        {/* Tabs Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {[
            { id: "chat", label: "Neural Chat", icon: MessageSquare, badge: null },
            { id: "docs", label: "Document Intel", icon: FileText, badge: "Phase 4" },
            { id: "memory", label: "SQLite Memory", icon: Database, badge: "Phase 3" },
            { id: "plugins", label: "Modular Plugins", icon: Cpu, badge: "Phase 5" },
            { id: "system", label: "System Status", icon: Activity, badge: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  active 
                    ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-md shadow-cyan-950/20" 
                    : "text-zinc-400 border border-transparent hover:bg-zinc-900/60 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={active ? "text-cyan-400" : "text-zinc-500"} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-zinc-800 text-zinc-500 uppercase tracking-widest border border-zinc-700/50">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Diagnostic Monitor Console */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/90 font-mono text-[9px] text-zinc-500 flex flex-col h-40">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-zinc-900">
            <span className="text-[10px] font-bold text-zinc-400 tracking-wider flex items-center gap-1">
              <Terminal size={10} /> SYSTEM_MONITOR
            </span>
            <button 
              onClick={() => {
                fetchSystemStatus();
                fetchModels();
              }}
              className="text-zinc-600 hover:text-zinc-300 transition"
              title="Refresh status"
            >
              <RefreshCw size={10} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none select-none">
            {consoleLogs.map((log, index) => (
              <div key={index} className="truncate">{log}</div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full bg-[#030712] relative">
        {/* Holographic grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/15 via-zinc-950/5 to-zinc-950 pointer-events-none z-0" />
        
        {/* TOP STATUS BAR */}
        <header className="h-16 border-b border-zinc-800/80 flex items-center justify-between px-6 bg-zinc-950/20 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">SESSION:</span>
            <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-800/30">
              OFFLINE_SESSION_01
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 text-[10px] font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Cpu size={12} className="text-purple-400" />
                <span>CPU: ACTIVE (LOCAL)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HardDrive size={12} className="text-cyan-400" />
                <span>RAM: ~4-8GB REQ.</span>
              </div>
            </div>
            
            {activeTab === "chat" && (
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Flush Core</span>
              </button>
            )}
          </div>
        </header>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-hidden flex flex-col z-10">
          
          {/* TAB 1: NEURAL CHAT */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800/80">
                {messages.length <= 1 && (
                  <div className="max-w-2xl mx-auto mt-8 p-6 rounded-xl border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-md text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto border border-cyan-500/20">
                      <Sparkles className="text-cyan-400 animate-pulse" size={24} />
                    </div>
                    <h3 className="text-base font-bold text-zinc-100">Welcome to FRIDAY Offline Chat</h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      All computations and reasoning happen strictly locally on your Mac's CPU. No data ever leaves this machine. Choose prompts below or type your inquiry.
                    </p>
                    
                    {/* Prompt suggestions grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left">
                      {suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(sug)}
                          className="p-3 text-xs bg-zinc-950/40 border border-zinc-800 hover:border-cyan-500/40 hover:bg-cyan-950/10 text-zinc-300 rounded-lg transition text-left flex items-start justify-between group"
                        >
                          <span className="group-hover:text-zinc-200">{sug}</span>
                          <ChevronRight size={14} className="text-zinc-600 group-hover:text-cyan-400 transition shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div 
                      key={i} 
                      className={`flex gap-4 max-w-3xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Avatar for Assistant */}
                      {!isUser && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-950 to-indigo-950 border border-cyan-800/40 flex items-center justify-center shadow-lg shadow-cyan-950/10 shrink-0">
                          <span className="text-[10px] font-bold text-cyan-400 font-mono">FRI</span>
                        </div>
                      )}

                      <div className={`p-4 rounded-xl border max-w-[85%] leading-relaxed ${
                        isUser 
                          ? 'bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border-cyan-500/20 text-zinc-100 shadow-md shadow-cyan-950/10' 
                          : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-200'
                      }`}>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
                          {isUser ? 'User Authorization' : 'FRIDAY Core Intelligence'}
                        </div>
                        {msg.content ? (
                          <MarkdownRenderer content={msg.content} />
                        ) : (
                          <div className="flex items-center gap-2 py-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        )}
                      </div>

                      {/* Avatar for User */}
                      {isUser && (
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-zinc-300 font-mono">USR</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 focus-within:border-cyan-500/50 rounded-xl px-4 py-2.5 transition">
                    <button 
                      type="button" 
                      onClick={() => addLog("File attach requested (Phase 4 mock)")}
                      className="text-zinc-500 hover:text-cyan-400 transition" 
                      title="Attach documents (Phase 4)"
                    >
                      <Paperclip size={18} />
                    </button>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isLoading ? "Generating response..." : "Instruct FRIDAY assistant..."}
                      disabled={isLoading}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-200 placeholder-zinc-500 focus:ring-0"
                    />
                    <div className="flex items-center px-2">
                    <button 
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`${isRecording ? 'text-rose-500 animate-pulse' : 'text-zinc-500 hover:text-cyan-400'} transition`} 
                      title={isRecording ? "Stop Recording" : "Voice Command (Phase 2)"}
                    >
                      {isRecording ? <Square size={18} /> : <Mic size={18} />}
                    </button>
                  </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold hover:from-cyan-400 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 shadow-md shadow-cyan-950/20 transition flex items-center justify-center"
                  >
                    <Send size={16} />
                  </button>
                </form>
                <div className="max-w-3xl mx-auto mt-2 text-[10px] text-zinc-500 flex justify-between font-mono px-1">
                  <span>Press ENTER to issue query</span>
                  <span className="flex items-center gap-1"><HardDrive size={8} /> Local CPU Execution</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENT INTEL (PHASE 4 ACTIVE) */}
          {activeTab === "docs" && (
            <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto space-y-6">
              <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <FileText className="text-purple-400" size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Document Intelligence & Local RAG</h2>
                    <p className="text-xs text-zinc-400">Phase 4 Active (Offline Vector Search)</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Analyze PDFs, DOCX, TXT, CSV, or MD files completely locally. FRIDAY will chunk the document content, run it through the offline embeddings pipeline, store it inside a local vector database, and perform semantic lookup.
                </p>

                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".pdf,.docx,.doc,.txt,.csv,.md"
                  className="hidden" 
                />

                <div className="p-8 border border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center text-center space-y-3 bg-zinc-950/40">
                  <FileText size={32} className={`text-zinc-600 ${isUploading ? 'animate-bounce text-purple-400' : ''}`} />
                  <div>
                    <p className="text-xs font-bold text-zinc-400">
                      {isUploading ? "Parsing & indexing document..." : "Select documents to index offline"}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">Supports PDF, DOCX, TXT, CSV, MD up to 50MB</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-1.5 rounded bg-purple-500/20 border border-purple-500/40 text-xs text-purple-300 hover:bg-purple-500/30 transition disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Select File"}
                  </button>
                </div>

                {/* Active Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="border border-zinc-800 rounded-lg overflow-hidden font-mono text-xs mt-4">
                    <div className="bg-zinc-900/60 px-4 py-2 border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider flex justify-between items-center">
                      <span>Indexed Document References ({uploadedFiles.length})</span>
                      <button 
                        onClick={handleClearDocs}
                        className="text-[9px] text-rose-400 hover:text-rose-300 font-sans tracking-normal uppercase border border-rose-500/30 rounded px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 transition"
                      >
                        Wipe Index
                      </button>
                    </div>
                    <ul className="divide-y divide-zinc-900 bg-zinc-950/20 text-zinc-400 p-2">
                      {uploadedFiles.map((file, idx) => (
                        <li key={idx} className="p-2 flex items-center gap-2 text-[11px]">
                          <span className="text-purple-400">✔</span>
                          <span>{file}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SQLITE MEMORY (PHASE 3 PREVIEW) */}
          {activeTab === "memory" && (
            <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto space-y-6">
              <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                    <Database className="text-pink-400" size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Persistent SQLite Memory Core</h2>
                    <p className="text-xs text-zinc-400">Phase 3 Roadmap Preview</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  FRIDAY remembers user details, context, and persistent logs across sessions. The memory bank is structured around a local SQLite database that records conversation nodes, key facts about the user, and custom tags for long-term recall.
                </p>
                
                {/* Add new memory fact */}
                <form onSubmit={handleAddMemory} className="flex gap-2 bg-zinc-900/20 p-4 border border-zinc-800 rounded-lg">
                  <input
                    type="text"
                    value={newMemKey}
                    onChange={(e) => setNewMemKey(e.target.value)}
                    placeholder="Fact key (e.g. favorite_color)"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-pink-500/50"
                  />
                  <input
                    type="text"
                    value={newMemVal}
                    onChange={(e) => setNewMemVal(e.target.value)}
                    placeholder="Fact value (e.g. Purple)"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-pink-500/50"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold hover:from-pink-400 hover:to-rose-500 text-xs transition"
                  >
                    Save Fact
                  </button>
                </form>

                <div className="border border-zinc-800 rounded-lg overflow-hidden font-mono text-xs">
                  <div className="bg-zinc-900/60 px-4 py-2 border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider flex justify-between items-center">
                    <span>SQLite Database Memory Table</span>
                    <span className="text-[9px] text-pink-400 animate-pulse">● Live Connection</span>
                  </div>
                  <table className="w-full text-left bg-zinc-950/20">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 text-[10px]">
                        <th className="p-3">KEY</th>
                        <th className="p-3">VALUE</th>
                        <th className="p-3">CREATED</th>
                        <th className="p-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="text-zinc-400 text-[11px]">
                      {memories.length > 0 ? (
                        memories.map((mem) => (
                          <tr key={mem.key} className="border-b border-zinc-900 hover:bg-zinc-900/10">
                            <td className="p-3 font-semibold text-cyan-400">{mem.key}</td>
                            <td className="p-3">{mem.value}</td>
                            <td className="p-3 text-[10px] text-zinc-500">{mem.created ? new Date(mem.created).toLocaleDateString() : 'N/A'}</td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteMemory(mem.key)}
                                className="text-rose-500 hover:text-rose-400 transition font-sans text-[10px]"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-zinc-600 italic">No facts stored in SQLite memory bank yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MODULAR PLUGINS (PHASE 5 PREVIEW) */}
          {activeTab === "plugins" && (
            <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto space-y-6">
              <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Cpu className="text-emerald-400" size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Modular Python Plugins</h2>
                    <p className="text-xs text-zinc-400">Phase 5 Roadmap Preview</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Extensible ecosystem allowing FRIDAY to invoke custom Python plugins and automate OS commands. When FRIDAY identifies a user intent matching a plugin function, it triggers the module (e.g. system controls, file browser, camera feed).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {[
                    { name: "File Automation", desc: "Create, rename, or move files on host.", status: "Locked" },
                    { name: "System Controller", desc: "Adjust volume, open apps, take screenshots.", status: "Locked" },
                    { name: "Local Calculator", desc: "Precise computational engine bypass.", status: "Locked" },
                    { name: "Notes & Reminders", desc: "Create markdown tasks and file notes.", status: "Locked" },
                  ].map((p, idx) => (
                    <div key={idx} className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-lg flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-300">{p.name}</h4>
                        <p className="text-[10px] text-zinc-500 mt-1">{p.desc}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-600">
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM STATUS */}
          {activeTab === "system" && (
            <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Panel 1 */}
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/20 flex flex-col justify-between h-40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300">Ollama API Service</span>
                    <span className={`h-2 w-2 rounded-full ${status.ollama_connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white font-mono uppercase">
                      {status.ollama_connected ? "ONLINE" : "OFFLINE"}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">Host: {status.ollama_host || "N/A"}</p>
                  </div>
                </div>

                {/* Panel 2 */}
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/20 flex flex-col justify-between h-40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300">Models Loaded</span>
                    <Cpu size={16} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white font-mono">
                      {models.length}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">Available locally on host</p>
                  </div>
                </div>

                {/* Panel 3 */}
                <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/20 flex flex-col justify-between h-40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300">System Execution</span>
                    <Activity size={16} className="text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white font-mono">
                      CPU-ONLY
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">Privacy-first hardware bound</p>
                  </div>
                </div>

              </div>

              {/* Models List Details */}
              <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/20 space-y-4">
                <h3 className="text-sm font-bold text-zinc-200">Installed Ollama Models Details</h3>
                <div className="space-y-3">
                  {models.length > 0 ? (
                    models.map((model) => (
                      <div key={model.name} className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-cyan-400 font-mono">{model.name}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-500 font-mono mt-1">
                            <span>Format: {model.details.family || "GGUF"}</span>
                            <span>Params: {model.details.parameter_size || "N/A"}</span>
                            <span>Quant: {model.details.quantization_level || "N/A"}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-mono font-bold text-zinc-300">{formatBytes(model.size)}</p>
                          <p className="text-[9px] text-zinc-600 font-mono">Size on Disk</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg text-xs text-zinc-500 space-y-2">
                      <p>No models detected on your Ollama server.</p>
                      <p className="font-mono text-[10px] text-zinc-600">Run: ollama pull phi3</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Developer Configuration Note */}
              <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/10 space-y-3 text-xs leading-relaxed text-zinc-400">
                <h4 className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-cyan-400" />
                  Developer Architecture Notice
                </h4>
                <p>
                  To change default model behavior or connection endpoints, edit variables in your local <code className="text-zinc-300 font-mono">backend/core/config.py</code> file. This layout will connect automatically on page load to your local port <code className="text-zinc-300 font-mono">8000</code>.
                </p>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
