import logging
from speech.stt import stt_engine

logger = logging.getLogger(__name__)

def transcribe_audio(audio_path: str) -> str:
    """Transcribes an audio file using the local speech-to-text engine."""
    logger.info(f"Transcribing audio file: {audio_path}")
    text = stt_engine.transcribe(audio_path)
    return text
