/**
 * app.js - Holographic Sci-Fi HUD Controller
 * Pure JS integrating full backend capabilities: RAG documents, SQLite memories, Mac plugins, and LLM chat.
 */

import sound from './sound.js';
import { NeuralNetwork, HologramCore } from './canvas.js';

const backendHost = window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
const API_BASE = `http://${backendHost}:8000/api/v1`;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Canvases
    const bgCanvas = document.getElementById('background-canvas');
    const coreCanvas = document.getElementById('core-canvas');

    const network = new NeuralNetwork(bgCanvas);
    const core = new HologramCore(coreCanvas);

    window.addEventListener('click', (e) => {
        if (e.target.id === 'background-canvas') {
            network.addInteractiveParticle(e.clientX, e.clientY);
            sound.playHover();
        }
    });

    function renderLoop() {
        network.draw();
        core.draw();
        requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);

    // 2. UI Elements
    const terminalInput = document.getElementById('terminal-input');
    const terminalHistory = document.getElementById('terminal-history');
    const logMonitor = document.getElementById('log-monitor');
    
    const ollamaLed = document.getElementById('ollama-led');
    const ollamaText = document.getElementById('ollama-text');
    const modelSelect = document.getElementById('hud-model-select');
    const coreStatus = document.getElementById('core-status');

    // Tab Panel Switchers
    const tabs = document.querySelectorAll('.hud-tab');
    const leftTitle = document.getElementById('left-panel-title');
    const leftIcon = document.getElementById('left-panel-icon');
    const rightTitle = document.getElementById('right-panel-title');
    const rightIcon = document.getElementById('right-panel-icon');

    const leftDiagPanel = document.getElementById('left-diag-panel');
    const leftDocsPanel = document.getElementById('left-docs-panel');
    const rightControlPanel = document.getElementById('right-control-panel');
    const rightDetailsPanel = document.getElementById('right-details-panel');
    const rightMemoryPanel = document.getElementById('right-memory-panel');
    const rightPluginsPanel = document.getElementById('right-plugins-panel');

    // Controls
    const volumeSlider = document.getElementById('volume-slider');
    const shieldSlider = document.getElementById('shield-slider');
    const volumeVal = document.getElementById('volume-val');
    const shieldVal = document.getElementById('shield-val');

    const audioSwitch = document.getElementById('audio-switch');
    const matrixSwitch = document.getElementById('matrix-switch');
    const vectorSwitch = document.getElementById('vector-switch');

    // Dynamic State Values
    let selectedModel = "";
    let isSpeaking = false;
    let isSpeechInterrupted = false;   // flag to abort mid-stream TTS
    let voiceTimeout = null;
    let activeAudioSource = null;
    let logsSimulationInterval = null;

    // 3. Tab Navigation Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            sound.playClick();

            const target = tab.getAttribute('data-target');
            switchTab(target);
        });
    });

    function switchTab(target) {
        // Hide all sub panels
        leftDiagPanel.classList.remove('active');
        leftDocsPanel.classList.remove('active');
        rightControlPanel.classList.remove('active');
        rightDetailsPanel.classList.remove('active');
        rightMemoryPanel.classList.remove('active');
        rightPluginsPanel.classList.remove('active');

        if (target === 'chat') {
            leftTitle.textContent = "SYSTEMS_DIAGNOSTICS";
            leftIcon.setAttribute('data-lucide', 'activity');
            rightTitle.textContent = "SYSTEM_CONTROLS";
            rightIcon.setAttribute('data-lucide', 'sliders');

            leftDiagPanel.classList.add('active');
            rightControlPanel.classList.add('active');
            startMatrixLogSimulation();
        } 
        else if (target === 'docs') {
            leftTitle.textContent = "DOCUMENT_INDEXER";
            leftIcon.setAttribute('data-lucide', 'upload-cloud');
            rightTitle.textContent = "COGNITIVE_DETAILS";
            rightIcon.setAttribute('data-lucide', 'file-text');

            leftDocsPanel.classList.add('active');
            rightDetailsPanel.classList.add('active');
            stopMatrixLogSimulation();
            fetchDocuments();
        } 
        else if (target === 'memory') {
            leftTitle.textContent = "SYSTEMS_DIAGNOSTICS";
            leftIcon.setAttribute('data-lucide', 'activity');
            rightTitle.textContent = "SQLITE_MEMORY_CORE";
            rightIcon.setAttribute('data-lucide', 'database');

            leftDiagPanel.classList.add('active');
            rightMemoryPanel.classList.add('active');
            stopMatrixLogSimulation();
            fetchMemories();
        } 
        else if (target === 'plugins') {
            leftTitle.textContent = "SYSTEMS_DIAGNOSTICS";
            leftIcon.setAttribute('data-lucide', 'activity');
            rightTitle.textContent = "MODULAR_MAC_PLUGINS";
            rightIcon.setAttribute('data-lucide', 'cpu');

            leftDiagPanel.classList.add('active');
            rightPluginsPanel.classList.add('active');
            stopMatrixLogSimulation();
        }
        
        lucide.createIcons();
    }

    // 3.5 Cyber Switches Toggles
    audioSwitch.addEventListener('click', () => {
        const isActive = audioSwitch.classList.toggle('active');
        sound.playClick();
        sound.setMute(!isActive);
        if (!isActive) {
            stopAllSpeech();
        }
        addLog(`Speech output ${isActive ? 'enabled' : 'disabled'}`, 'system');
        addTerminalRow(`>> Voice synth: ${isActive ? 'ACTIVE' : 'MUTED'}`, isActive ? 'success-line' : 'warning-line');
    });

    matrixSwitch.addEventListener('click', () => {
        const isActive = matrixSwitch.classList.toggle('active');
        sound.playClick();
        if (isActive) {
            startMatrixLogSimulation();
            addLog("System diagnostic logstream active", "success");
        } else {
            stopMatrixLogSimulation();
            addLog("System diagnostic logstream suspended", "warning");
        }
    });

    vectorSwitch.addEventListener('click', () => {
        const isActive = vectorSwitch.classList.toggle('active');
        sound.playClick();
        addLog(`RAG Core indexing ${isActive ? 'online' : 'bypassed'}`, 'system');
    });

    // 4. Ollama System Status & Model List Sync
    async function checkSystemStatus() {
        try {
            const res = await fetch(`${API_BASE}/status`);
            const data = await res.json();
            
            if (data.ollama_connected) {
                ollamaLed.className = "status-dot pulsing";
                ollamaLed.style.backgroundColor = "var(--cyan-glow)";
                ollamaText.textContent = "Ollama Connected";
                document.getElementById('summary-llm-val').textContent = data.active_model ? data.active_model.toUpperCase() : "ACTIVE";
                document.getElementById('summary-llm-val').style.color = "#10b981";
            } else {
                setOllamaDisconnected();
            }
        } catch (e) {
            setOllamaDisconnected();
        }
    }

    function setOllamaDisconnected() {
        ollamaLed.className = "status-dot disconnected";
        ollamaLed.style.backgroundColor = "#ef4444";
        ollamaText.textContent = "Ollama Offline";
        document.getElementById('summary-llm-val').textContent = "DISCONNECTED";
        document.getElementById('summary-llm-val').style.color = "#ef4444";
    }

    async function fetchModels() {
        try {
            const res = await fetch(`${API_BASE}/models`);
            const data = await res.json();
            
            modelSelect.innerHTML = "";
            if (data.length > 0) {
                data.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.name;
                    opt.textContent = `${m.name} (${m.details.parameter_size || "Local"})`;
                    modelSelect.appendChild(opt);
                });
                selectedModel = data[0].name;
            } else {
                modelSelect.innerHTML = '<option value="">No models detected</option>';
            }
        } catch (e) {
            modelSelect.innerHTML = '<option value="">Failed to connect to backend</option>';
        }
    }

    modelSelect.addEventListener('change', (e) => {
        selectedModel = e.target.value;
        addLog(`Switched active core model to ${selectedModel}`, 'success');
        sound.playClick();
    });

    // Start background poller for status check
    setInterval(checkSystemStatus, 6000);
    checkSystemStatus();
    fetchModels();

    // 5. Neural Chat Engine (POST `/chat`)
    const hologramContainer = document.querySelector('.hologram-container');
    hologramContainer.addEventListener('click', () => {
        const isSpeaking = activeAudioSource !== null || (window.speechSynthesis && window.speechSynthesis.speaking);
        if (isSpeaking) {
            stopAllSpeech();
            addTerminalRow(">> Voice output stopped.", "warning-line");
        } else {
            sound.playStartup();
            triggerCoreReply("Hello Boss, welcome to FRIDAY, your personal AI assistant. All the files are ready to access. I am just one command away.");
        }
    });

    // 4.5 Web Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isListening = false;
    const micBtn = document.getElementById('terminal-mic-btn');

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            micBtn.innerHTML = '<i data-lucide="square" style="width:16px; color:#ef4444;" class="animate-pulse"></i>';
            lucide.createIcons();
            setHUDLoading(true, "LISTENING");
            addLog("Microphone active. Speak now...", "warning");
        };

        recognition.onspeechstart = () => {
            addLog("Speech detected, capturing transcript...", "warning");
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            addLog(`Voice query detected: "${transcript}"`, "success");
            addTerminalRow(`guest@friday:~$ ${transcript}`, 'user-line');
            
            if (transcript.toLowerCase().startsWith('/')) {
                processDirectives(transcript.toLowerCase());
            } else {
                await runChatInference(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            
            let userFriendlyMsg = `Voice error: ${event.error}`;
            if (event.error === 'not-allowed') {
                userFriendlyMsg = "MIC ACCESS DENIED: Please click the lock icon in the address bar and allow microphone permissions.";
                addTerminalRow(">> MIC BLOCKED: Microphone permission denied. Please allow it in the browser.", 'error-line');
            } else if (event.error === 'no-speech') {
                userFriendlyMsg = "No speech detected. Speak closer to your microphone.";
                addTerminalRow(">> NO SPEECH DETECTED: Speak clearly after clicking the Mic icon.", 'warning-line');
            } else if (event.error === 'network') {
                userFriendlyMsg = "Network error. Try Safari (supports offline dictation) or check internet.";
                addTerminalRow(">> NETWORK ERROR: Chrome requires internet for voice recognition. Try Safari.", 'error-line');
            }
            
            addLog(userFriendlyMsg, "error");
            sound.playAlert();
            stopListening();
        };

        recognition.onend = () => {
            stopListening();
        };

        function stopListening() {
            isListening = false;
            micBtn.innerHTML = '<i data-lucide="mic" style="width:16px; color:var(--cyan-glow);"></i>';
            lucide.createIcons();
            setHUDLoading(false);
        }

        micBtn.addEventListener('click', async () => {
            sound.playClick();
            if (isListening) {
                recognition.stop();
            } else {
                try {
                    addLog("Requesting microphone permission...", "system");
                    // Force browser mic prompt dialog if not already granted
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    recognition.start();
                } catch (err) {
                    console.error("Mic Access Error:", err);
                    addLog("MIC ACCESS DENIED: Ensure browser & Mac settings allow microphone.", "error");
                    addTerminalRow(">> MIC ERROR: Access denied. Please allow microphone permissions in browser.", 'error-line');
                    sound.playAlert();
                }
            }
        });
    } else {
        if (micBtn) micBtn.style.display = 'none';
    }

    terminalInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const cmd = terminalInput.value.trim();
            if (!cmd) return;

            sound.playClick();
            terminalInput.value = '';
            
            // Render user line
            addTerminalRow(`guest@friday:~$ ${cmd}`, 'user-line');
            
            // Check for / directives
            if (cmd.startsWith('/')) {
                processDirectives(cmd.toLowerCase());
                return;
            }

            // Normal LLM Chat request
            await runChatInference(cmd);
        }
    });

    let conversationHistory = [];

    async function runChatInference(message) {
        setHUDLoading(true, "REASONING");
        addLog(`Sending query to ${selectedModel}...`, 'system');

        conversationHistory.push({ role: "user", content: message });

        try {
            const res = await fetch(`${API_BASE}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: selectedModel || undefined,
                    messages: conversationHistory
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ detail: `HTTP ${res.status} ${res.statusText}` }));
                throw new Error(errData.detail || `HTTP ${res.status}`);
            }
            
            // Stop any currently playing speech before starting new response
            stopAllSpeech();
            isSpeechInterrupted = false;

            // Create target terminal row for assistant stream
            const row = document.createElement('div');
            row.className = `terminal-row assistant-line`;
            row.style.color = 'var(--cyan-glow)';
            row.style.textShadow = '0 0 5px rgba(6,182,212,0.3)';
            row.textContent = 'FRIDAY > ';
            terminalHistory.appendChild(row);
            terminalHistory.scrollTop = terminalHistory.scrollHeight;

            setHUDLoading(true, "TRANSMITTING");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let assistantReply = "";
            let ttsSentenceBuffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                assistantReply += chunk;
                ttsSentenceBuffer += chunk;
                
                row.textContent = `FRIDAY > ${assistantReply}`;
                terminalHistory.scrollTop = terminalHistory.scrollHeight;

                // Extract sentences as they arrive and speak in parallel (skip if interrupted)
                if (!isSpeechInterrupted) {
                    const sentenceMatch = ttsSentenceBuffer.match(/[^.!?\n]+[.!?\n](\s+|$)/);
                    if (sentenceMatch) {
                        const sentence = sentenceMatch[0].trim();
                        ttsSentenceBuffer = ttsSentenceBuffer.substring(sentenceMatch[0].length);
                        speakSentenceStream(sentence);
                    }
                }
            }

            // Speak any trailing text (only if not interrupted)
            if (!isSpeechInterrupted && ttsSentenceBuffer.trim()) {
                speakSentenceStream(ttsSentenceBuffer.trim());
            }

            setHUDLoading(false);
            
            // Add reply to history
            conversationHistory.push({ role: "assistant", content: assistantReply });
            addLog("Inference completed.", "success");

        } catch (error) {
            setHUDLoading(false);
            sound.playAlert();
            addTerminalRow(`>> ERROR: ${error.message}`, 'error-line');
            addLog(`LLM inference request failed: ${error.message}`, "error");
        }
    }

    function setHUDLoading(loading, label = "GENERATING") {
        if (loading) {
            core.setSpeaking(true);
            coreStatus.textContent = label;
            coreStatus.style.color = "var(--cyan-glow)";
        } else {
            core.setSpeaking(false);
            coreStatus.textContent = "SECURE INTELLIGENCE";
            coreStatus.style.color = "var(--text-secondary)";
        }
    }

    function stopAllSpeech() {
        isSpeechInterrupted = true;   // abort any in-flight sentence queue
        if (voiceTimeout) clearTimeout(voiceTimeout);
        if (activeAudioSource) {
            try {
                activeAudioSource.pause();
                activeAudioSource.currentTime = 0;
            } catch (e) {}
            activeAudioSource = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        core.setSpeaking(false);
    }

    function speakSentenceStream(sentence) {
        const isAudioActive = audioSwitch.classList.contains('active');
        if (!isAudioActive || isSpeechInterrupted) return;

        // Strip markdown and code artifacts for clean TTS
        const cleanText = sentence
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]*`/g, '')
            .replace(/[\*#_>|]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (!cleanText || cleanText.length < 2) return;

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            // JARVIS-style: confident, crisp, slightly fast, low pitch
            utterance.rate = 1.15;
            utterance.pitch = 0.85;
            utterance.volume = 1.0;
            
            const voices = window.speechSynthesis.getVoices();
            // Prefer deep male British/US voice like JARVIS
            const jarvisVoice = voices.find(v =>
                v.name.includes("Daniel") ||
                v.name.includes("Alex") ||
                v.name.includes("Google UK English Male") ||
                v.name.includes("Google US English") ||
                v.name.includes("Fred") ||
                v.name.includes("Tom")
            ) || voices.find(v => !v.name.toLowerCase().includes("female") && v.lang.startsWith("en"));
            
            if (jarvisVoice) utterance.voice = jarvisVoice;
            
            utterance.onstart = () => core.setSpeaking(true);
            utterance.onend = () => {
                if (!window.speechSynthesis.speaking) core.setSpeaking(false);
            };
            utterance.onerror = () => core.setSpeaking(false);
            
            window.speechSynthesis.speak(utterance);
        }
    }

    function triggerCoreReply(text) {
        stopAllSpeech();
        isSpeechInterrupted = false;  // allow new speech after stopping
        addTerminalRow(`FRIDAY > ${text}`, 'assistant-line');
        playAudioTTS(text);
    }

    async function playAudioTTS(text) {
        // Only synthesize if Speech is enabled
        const isAudioActive = audioSwitch.classList.contains('active');
        if (!isAudioActive) return;

        try {
            // Clean markdown syntax for clean speech
            const cleanText = text.replace(/[\*`#_-]/g, "");

            // Query backend speech engine
            const res = await fetch(`${API_BASE}/speech/synthesize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: cleanText, voice: "df_voice" })
            });

            if (res.ok) {
                const blob = await res.blob();
                const audioUrl = URL.createObjectURL(blob);
                const audio = new Audio(audioUrl);
                
                activeAudioSource = audio;
                
                // Beat visualizer frequencies while speaking
                core.setSpeaking(true);
                audio.play();
                
                audio.onended = () => {
                    core.setSpeaking(false);
                    activeAudioSource = null;
                };
            } else {
                // Fallback to Web Speech API
                playSpeechFallback(cleanText);
            }
        } catch (e) {
            playSpeechFallback(text);
        }
    }

    // Warm up speech synthesis voices
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

    function playSpeechFallback(text) {
        if (!('speechSynthesis' in window) || isSpeechInterrupted) return;

        const cleanText = text
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]*`/g, '')
            .replace(/[\*#_>|]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.15;
        utterance.pitch = 0.85;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const jarvisVoice = voices.find(v =>
            v.name.includes("Daniel") ||
            v.name.includes("Alex") ||
            v.name.includes("Google UK English Male") ||
            v.name.includes("Google US English") ||
            v.name.includes("Fred") ||
            v.name.includes("Tom")
        ) || voices.find(v => !v.name.toLowerCase().includes("female") && v.lang.startsWith("en"));

        if (jarvisVoice) utterance.voice = jarvisVoice;

        utterance.onstart = () => core.setSpeaking(true);
        utterance.onend = () => core.setSpeaking(false);
        utterance.onerror = () => core.setSpeaking(false);

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    function processDirectives(input) {
        if (input === '/help') {
            addTerminalRow("Available Core Directives:", 'system-line');
            addTerminalRow("  /scan    - Runs holographic system radar sweeps", 'info-line');
            addTerminalRow("  /status  - Displays active local model diagnostics", 'info-line');
            addTerminalRow("  /system  - Checks host Mac hardware stats", 'info-line');
            addTerminalRow("  /clear   - Clears console log buffer", 'info-line');
            addTerminalRow("  /mute    - Disables voice synth outputs", 'info-line');
            addTerminalRow("  /unmute  - Enables voice synth outputs", 'info-line');
        } 
        else if (input === '/clear') {
            terminalHistory.innerHTML = '';
        } 
        else if (input === '/scan') {
            sound.playAlert();
            addTerminalRow(">> INITIALIZING RADAR DEPTH SCAN...", 'warning-line');
            addLog("System blueprint scan requested.", "warning");
            
            setTimeout(() => {
                sound.playSuccess();
                addTerminalRow(">> RADAR ANALYSIS SUCCESSFUL:", 'success-line');
                addTerminalRow("   - Core Temperature: 31°C (STABLE)", 'info-line');
                addTerminalRow("   - Active Memory Nodes: SQLite (1), FAISS Vector Store (1)", 'info-line');
                addTerminalRow("   - Sandboxed host: BYPASSED", 'info-line');
                addLog("Radar blueprint scan complete.", "success");
            }, 1200);
        }
        else if (input === '/status') {
            addTerminalRow("FRIDAY CODES & LOCAL INFRASTRUCTURE:", 'system-line');
            addTerminalRow("   - RAG Database: SQLite + FAISS Index (Active)", 'info-line');
            addTerminalRow("   - STT Engine: Whisper local (Standby)", 'info-line');
            addTerminalRow("   - TTS Core: Procedural Voice Synthesizer (Active)", 'info-line');
            addTerminalRow("   - Host Permissions: Native Apple Sandbox Bypass (True)", 'info-line');
        }
        else if (input === '/system') {
            addTerminalRow("FRIDAY HOST MAC DIAGNOSTICS:", 'system-line');
            addTerminalRow("   - OS: macOS Apple Host", 'info-line');
            addTerminalRow("   - Active Plugins: system_stats, screenshots, audio_control, app_launcher", 'info-line');
        }
        else if (input === '/mute') {
            sound.setMute(true);
            audioSwitch.classList.remove('active');
            addTerminalRow("Voice synthesizer muted.", 'warning-line');
        }
        else if (input === '/unmute') {
            sound.setMute(false);
            audioSwitch.classList.add('active');
            addTerminalRow("Voice synthesizer active.", 'success-line');
        }
    }

    // 6. Document Intelligence Integration
    const dropzone = document.getElementById('dropzone');
    const fileUploader = document.getElementById('file-uploader');
    const hudFileList = document.getElementById('hud-file-list');
    const clearDocsBtn = document.getElementById('clear-docs-btn');

    // Document Viewer elements
    const detailsViewerActive = document.getElementById('details-viewer-active');
    const detailsViewerEmpty = document.getElementById('details-viewer-empty');
    const docSummary = document.getElementById('doc-summary');
    const docEntities = document.getElementById('doc-entities');
    const docFacts = document.getElementById('doc-facts');
    const docChecklist = document.getElementById('doc-checklist');

    dropzone.addEventListener('click', () => fileUploader.click());
    
    fileUploader.addEventListener('change', async () => {
        if (fileUploader.files.length === 0) return;
        const file = fileUploader.files[0];
        
        addLog(`Ingesting file ${file.name}...`, 'warning');
        sound.playAlert();

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_BASE}/docs/upload`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");
            
            const data = await res.json();
            sound.playSuccess();
            addLog(`Ingestion successful. Document ID: ${data.id}`, 'success');
            
            // Clear input
            fileUploader.value = '';
            
            // Reload files
            fetchDocuments();
        } catch (e) {
            sound.playAlert();
            addLog(`Failed to ingest file ${file.name}.`, 'error');
        }
    });

    async function fetchDocuments() {
        try {
            const res = await fetch(`${API_BASE}/docs`);
            const data = await res.json();
            
            const docs = data.documents || [];
            document.getElementById('summary-vstore-val').textContent = docs.length > 0 ? `${docs.length} BLOCKS` : "SYNCED";
            
            hudFileList.innerHTML = '';
            if (docs.length === 0) {
                hudFileList.innerHTML = '<div class="text-zinc-500 text-xs italic text-center py-4">No documents indexed yet.</div>';
                return;
            }

            docs.forEach(doc => {
                const item = document.createElement('div');
                item.className = "cyber-file-item";
                item.setAttribute('data-id', doc.id);
                
                const readyBadge = doc.status === 'ready' ? 'status-ready' : 
                                   doc.status === 'processing' ? 'status-processing' : 'status-failed';

                item.innerHTML = `
                    <div class="file-item-info">
                        <div class="file-item-name">${doc.filename}</div>
                        <div class="file-item-meta">
                            <span>${formatBytes(doc.file_size)}</span>
                            <span class="file-item-status ${readyBadge}">${doc.status}</span>
                        </div>
                    </div>
                    <button class="trash-btn delete-doc-btn" data-id="${doc.id}">
                        <i data-lucide="trash-2" style="width:12px;"></i>
                    </button>
                `;

                // Add select trigger
                item.addEventListener('click', (e) => {
                    if (e.target.closest('.trash-btn')) return;
                    document.querySelectorAll('.cyber-file-item').forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');
                    sound.playClick();
                    fetchDocDetails(doc.id);
                });

                hudFileList.appendChild(item);
            });

            // Re-render delete button triggers
            document.querySelectorAll('.delete-doc-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    sound.playClick();
                    await deleteDocument(id);
                });
            });

            lucide.createIcons();
        } catch (e) {
            hudFileList.innerHTML = '<div class="text-rose-500 text-xs italic text-center py-4">Database load error.</div>';
        }
    }

    async function fetchDocDetails(id) {
        try {
            const res = await fetch(`${API_BASE}/docs/${id}`);
            const doc = await res.json();
            
            detailsViewerEmpty.style.display = 'none';
            detailsViewerActive.style.display = 'flex';

            const knowledge = doc.extracted_knowledge || {};

            // Summary
            docSummary.textContent = knowledge.summary || "Summary generation pending or unavailable.";

            // Entities
            docEntities.innerHTML = '';
            const entities = knowledge.entities || [];
            if (entities.length > 0) {
                entities.forEach(ent => {
                    const tag = document.createElement('span');
                    tag.className = 'entity-tag';
                    tag.textContent = `${ent.type || 'Entity'}: ${ent.name}`;
                    docEntities.appendChild(tag);
                });
            } else {
                docEntities.innerHTML = '<span class="text-zinc-500 italic text-[10px]">No entities extracted.</span>';
            }

            // Key Facts
            docFacts.innerHTML = '';
            const facts = knowledge.key_facts || [];
            if (facts.length > 0) {
                facts.forEach(fact => {
                    const p = document.createElement('p');
                    p.className = 'text-[11px] leading-relaxed border-b border-zinc-900 pb-1 mb-1';
                    p.innerHTML = `<span style="color:var(--cyan-glow);">•</span> ${fact}`;
                    docFacts.appendChild(p);
                });
            } else {
                docFacts.innerHTML = '<p class="text-zinc-500 italic text-[10px]">No core facts logged.</p>';
            }

            // Action Items (Checklist)
            docChecklist.innerHTML = '';
            const actions = knowledge.action_items || [];
            if (actions.length > 0) {
                actions.forEach(action => {
                    const row = document.createElement('div');
                    row.className = 'checklist-item';
                    row.innerHTML = `
                        <div class="checklist-check"><i data-lucide="check" style="width:8px; color:var(--cyan-glow);"></i></div>
                        <span class="text-zinc-300 text-xs">${action}</span>
                    `;
                    docChecklist.appendChild(row);
                });
                lucide.createIcons();
            } else {
                docChecklist.innerHTML = '<span class="text-zinc-500 italic text-[10px]">No action items identified.</span>';
            }

        } catch (e) {
            addLog("Failed to fetch document details.", "error");
        }
    }

    async function deleteDocument(id) {
        addLog(`Deleting document blocks...`, 'warning');
        try {
            const res = await fetch(`${API_BASE}/docs/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                sound.playSuccess();
                addLog("Document deleted successfully.", "success");
                detailsViewerActive.style.display = 'none';
                detailsViewerEmpty.style.display = 'block';
                fetchDocuments();
            }
        } catch (e) {
            addLog("Failed to delete document.", "error");
        }
    }

    clearDocsBtn.addEventListener('click', async () => {
        if (!confirm("Are you sure you want to wipe the document database?")) return;
        addLog("Wiping document database...", 'warning');
        sound.playAlert();

        try {
            const res = await fetch(`${API_BASE}/docs/clear`, {
                method: "DELETE"
            });
            if (res.ok) {
                sound.playSuccess();
                addLog("Document database cleared.", "success");
                detailsViewerActive.style.display = 'none';
                detailsViewerEmpty.style.display = 'block';
                fetchDocuments();
            }
        } catch (e) {
            addLog("Failed to clear document database.", "error");
        }
    });

    // 7. SQLite Factual Memory Core
    const memoryForm = document.getElementById('memory-form');
    const hudMemoryList = document.getElementById('hud-memory-list');
    const memKey = document.getElementById('mem-key');
    const memVal = document.getElementById('mem-val');

    memoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const key = memKey.value.trim();
        const value = memVal.value.trim();
        if (!key || !value) return;

        sound.playClick();
        addLog(`Logging fact: ${key}...`, 'warning');

        try {
            const res = await fetch(`${API_BASE}/memory`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value })
            });

            if (res.ok) {
                sound.playSuccess();
                addLog(`Fact logged successfully: ${key}`, 'success');
                memKey.value = '';
                memVal.value = '';
                fetchMemories();
            }
        } catch (e) {
            addLog("Failed to write fact to memory core.", "error");
        }
    });

    async function fetchMemories() {
        try {
            const res = await fetch(`${API_BASE}/memory`);
            const data = await res.json();
            
            hudMemoryList.innerHTML = '';
            if (data.length === 0) {
                hudMemoryList.innerHTML = '<div class="text-zinc-500 text-xs italic text-center py-4">Factual database empty.</div>';
                return;
            }

            data.forEach(mem => {
                const item = document.createElement('div');
                item.className = "memory-fact-item";
                item.innerHTML = `
                    <div class="memory-fact-info">
                        <span class="memory-fact-key">${mem.key}</span>
                        <span class="memory-fact-value">${mem.value}</span>
                    </div>
                    <button class="trash-btn delete-fact-btn" data-key="${mem.key}">
                        <i data-lucide="trash-2" style="width:12px;"></i>
                    </button>
                `;
                
                // Add delete listener
                item.querySelector('.delete-fact-btn').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    sound.playClick();
                    await deleteMemory(mem.key);
                });

                hudMemoryList.appendChild(item);
            });

            lucide.createIcons();
        } catch (e) {
            hudMemoryList.innerHTML = '<div class="text-rose-500 text-xs italic text-center py-4">Failed to load facts.</div>';
        }
    }

    async function deleteMemory(key) {
        addLog(`Erasing memory fact: ${key}...`, 'warning');
        try {
            const res = await fetch(`${API_BASE}/memory/${key}`, {
                method: "DELETE"
            });
            if (res.ok) {
                sound.playSuccess();
                addLog(`Fact deleted: ${key}`, 'success');
                fetchMemories();
            }
        } catch (e) {
            addLog(`Failed to delete fact: ${key}`, "error");
        }
    }

    // 8. macOS Plugins Execution Integrations
    const runPluginBtns = document.querySelectorAll('.run-plugin-btn');
    
    runPluginBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const action = btn.getAttribute('data-action');
            const param = btn.getAttribute('data-param');
            sound.playClick();
            
            let params = {};
            if (action === 'volume' && param) {
                params = { direction: param };
            } else if (action === 'open_app' && param) {
                params = { app_name: param };
            }

            addLog(`Triggering host plugin [${action}]...`, 'warning');
            
            try {
                const res = await fetch(`${API_BASE}/plugins/run`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action, params })
                });

                const data = await res.json();
                
                if (res.ok && data.status === 'success') {
                    sound.playSuccess();
                    addLog(`[${action.toUpperCase()}] Execution complete: ${data.message || 'Success'}`, 'success');
                } else {
                    throw new Error(data.message || 'Execution error');
                }
            } catch (err) {
                sound.playAlert();
                addLog(`[${action.toUpperCase()}] Command failed: ${err.message}`, 'error');
            }
        });
    });

    // Ambient Matrix Log Simulator helper
    function startMatrixLogSimulation() {
        if (logsSimulationInterval) return;
        const messages = [
            "SYS_SCAN: Verifying vector store blocks...",
            "RAG_QUERY: Retrieving memory vector token=0x4F2A",
            "OFFLINE_CORE: Thread CPU usage normalized at 3.2GHz",
            "DB_READ: Fetching user memory facts... OK",
            "SPEECH_IN: Whisper STT engine idling (0.00% load)",
            "TTS_OUT: Piper speech synthesiser buffer clear",
            "SYSTEM: Temp check core=32C, fan=35%",
            "PLUGINS: Host plugins active: Volume, Screenshooter, AppLauncher"
        ];
        
        logsSimulationInterval = setInterval(() => {
            const randMsg = messages[Math.floor(Math.random() * messages.length)];
            const isRag = randMsg.includes("RAG_QUERY");
            addLog(randMsg, isRag ? "rag" : "system");
            
            // Randomly update system dials
            const randCpu = Math.floor(Math.random() * 20) + 30; // 30-50%
            const randRam = Math.floor(Math.random() * 10) + 50; // 50-60%
            updateProgress('cpu-bar', randCpu);
            updateProgress('ram-bar', randRam);
            
            updateDiagnosticRing('cpu-ring', randCpu, 176);
            updateDiagnosticRing('ram-ring', randRam, 176);
        }, 4000);
    }

    function stopMatrixLogSimulation() {
        if (logsSimulationInterval) {
            clearInterval(logsSimulationInterval);
            logsSimulationInterval = null;
        }
    }

    // Default helpers
    function updateProgress(id, percentage) {
        const bar = document.getElementById(id);
        if (bar) bar.style.width = `${percentage}%`;
    }

    function updateDiagnosticRing(id, value, maxStroke) {
        const ring = document.getElementById(id);
        if (ring) {
            const offset = maxStroke - (value / 100) * maxStroke;
            ring.style.strokeDashoffset = offset;
            
            const valLabel = ring.parentElement.querySelector('.ring-value');
            if (valLabel) valLabel.textContent = `${value}%`;
        }
    }

    function addTerminalRow(text, className) {
        const row = document.createElement('div');
        row.className = `terminal-row ${className || ''}`;
        row.textContent = text;
        
        if (className === 'user-line') row.style.color = 'var(--text-primary)';
        if (className === 'assistant-line') {
            row.style.color = 'var(--cyan-glow)';
            row.style.textShadow = '0 0 5px rgba(6,182,212,0.3)';
        }
        if (className === 'system-line') row.style.color = 'var(--indigo-glow)';
        if (className === 'info-line') row.style.color = 'var(--text-secondary)';
        if (className === 'success-line') row.style.color = '#10b981';
        if (className === 'warning-line') row.style.color = '#f59e0b';
        if (className === 'error-line') row.style.color = '#ef4444';
        
        terminalHistory.appendChild(row);
        terminalHistory.scrollTop = terminalHistory.scrollHeight;
    }

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    function addLog(text, type = 'system') {
        const time = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span style="color:var(--cyan-glow); font-size:9px;">[${time}]</span> ${text}`;
        
        if (logMonitor) {
            logMonitor.appendChild(entry);
            logMonitor.scrollTop = logMonitor.scrollHeight;

            if (logMonitor.children.length > 50) {
                logMonitor.removeChild(logMonitor.firstChild);
            }
        }
    }

    // Volume Slider Adjustments
    volumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        volumeVal.textContent = `${val}%`;
        sound.playHover();
        
        if (val == 0) {
            sound.setMute(true);
            audioSwitch.classList.remove('active');
        } else {
            sound.setMute(false);
            audioSwitch.classList.add('active');
        }
    });

    shieldSlider.addEventListener('input', (e) => {
        shieldVal.textContent = `${e.target.value}%`;
        sound.playHover();
    });

    // Default startup beeps
    startMatrixLogSimulation();
    addTerminalRow("=============================================", 'system-line');
    addTerminalRow("          FRIDAY HUD INTEGRATED CORE         ", 'system-line');
    addTerminalRow("=============================================", 'system-line');
    addTerminalRow("Bypassing sandboxes... Successful.", 'info-line');
    addTerminalRow("Establishing connection to local backend: http://localhost:8000", 'info-line');
    addTerminalRow("Awaiting instruction. Type /help to list directives.", 'success-line');
    // Global key listener for Escape to stop voice synthesis
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            stopAllSpeech();
            addLog("Voice synthesizer interrupted by user.", "warning");
            addTerminalRow(">> [ SPEECH INTERRUPTED ]" , "warning-line");
        }
    });
});
