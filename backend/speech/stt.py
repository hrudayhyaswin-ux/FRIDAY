import whisper
import logging
import torch
import os

logger = logging.getLogger(__name__)

class SpeechToText:
    def __init__(self, model_name="tiny"):
        logger.info(f"Loading Whisper model: {model_name}...")
        # Use Metal Performance Shaders (MPS) if on Apple Silicon, else fallback to CPU
        device = "mps" if torch.backends.mps.is_available() else "cpu"
        try:
            self.model = whisper.load_model(model_name, device=device)
            logger.info(f"Whisper model loaded on {device}")
        except Exception as e:
            logger.error(f"Failed to load whisper model on {device}, falling back to cpu. Error: {e}")
            self.model = whisper.load_model(model_name, device="cpu")
            logger.info("Whisper model loaded on CPU")

    def transcribe(self, audio_file_path: str) -> str:
        try:
            file_size = os.path.getsize(audio_file_path) if os.path.exists(audio_file_path) else 0
            print(f"[Whisper STT] Transcribing: {audio_file_path} | Size: {file_size} bytes", flush=True)
            
            result = self.model.transcribe(audio_file_path)
            text = result.get("text", "").strip()
            
            print(f"[Whisper STT] Decoded Text: '{text}'", flush=True)
            return text
        except Exception as e:
            print(f"[Whisper STT] ERROR during transcription: {e}", flush=True)
            return ""

stt_engine = SpeechToText(model_name="base")
