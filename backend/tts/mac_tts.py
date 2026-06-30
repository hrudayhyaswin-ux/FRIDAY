import logging
import os
import shutil
import subprocess
import tempfile
import uuid

logger = logging.getLogger(__name__)


def synthesize_text(text: str) -> tuple[str, str] | None:
    """
    Uses macOS native 'say' command to generate speech,
    and outputs an AIFF file, then converts it to WAV using ffmpeg.
    Returns a tuple of (path_to_generated_wav, temp_dir_to_cleanup)
    or None on failure.
    """
    temp_dir = tempfile.mkdtemp(prefix="friday_tts_")

    file_id = str(uuid.uuid4())
    aiff_path = os.path.join(temp_dir, f"{file_id}.aiff")
    wav_path = os.path.join(temp_dir, f"{file_id}.wav")

    try:
        # Use native macOS speech synthesizer explicitly requesting English voice "Samantha"
        subprocess.run(["say", "-v", "Samantha", "-o", aiff_path, text], check=True)
        # Convert to WAV format for browser compatibility using ffmpeg
        subprocess.run(["ffmpeg", "-y", "-i", aiff_path, wav_path], check=True, capture_output=True)

        # Cleanup the intermediate AIFF file
        if os.path.exists(aiff_path):
            os.remove(aiff_path)

        return (wav_path, temp_dir)
    except subprocess.CalledProcessError as e:
        logger.error(f"TTS generation failed: {e}")
        shutil.rmtree(temp_dir, ignore_errors=True)
        return None
    except Exception as e:
        logger.error(f"TTS unexpected error: {e}")
        shutil.rmtree(temp_dir, ignore_errors=True)
        return None
