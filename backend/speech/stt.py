import whisper
import logging
import torch
import os

logger = logging.getLogger(__name__)

class LazySpeechToText:
    def __init__(self, model_name="tiny"):
        self.model_name = model_name
        self.model = None

    def _load_model(self):
        if self.model is not None:
            return
            
        print(f"[Whisper STT] Loading Whisper model '{self.model_name}' lazily...", flush=True)
        device = "mps" if torch.backends.mps.is_available() else "cpu"
        try:
            self.model = whisper.load_model(self.model_name, device=device)
            print(f"[Whisper STT] Model loaded successfully on {device}!", flush=True)
        except Exception as e:
            print(f"[Whisper STT] Failed loading model on {device}, falling back to CPU: {e}", flush=True)
            self.model = whisper.load_model(self.model_name, device="cpu")
            print(f"[Whisper STT] Model loaded successfully on CPU!", flush=True)

    def transcribe(self, audio_file_path: str) -> str:
        try:
            # Lazily load the model on the first request
            self._load_model()
            
            file_size = os.path.getsize(audio_file_path) if os.path.exists(audio_file_path) else 0
            print(f"[Whisper STT] Transcribing: {audio_file_path} | Size: {file_size} bytes", flush=True)
            
            # Enforce English language to avoid multilingual hallucinations
            result = self.model.transcribe(audio_file_path, language="en")
            text = result.get("text", "").strip()
            
            print(f"[Whisper STT] Decoded Text: '{text}'", flush=True)
            return text
        except Exception as e:
            print(f"[Whisper STT] ERROR during transcription: {e}", flush=True)
            return ""

stt_engine = LazySpeechToText(model_name="tiny")
