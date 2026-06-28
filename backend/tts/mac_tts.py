import subprocess
import os
import uuid
import logging

logger = logging.getLogger(__name__)

def synthesize_text(text: str) -> str:
    """
    Uses macOS native 'say' command to generate speech, 
    and outputs an AIFF file, then converts it to WAV using ffmpeg.
    Returns the path to the generated .wav file.
    """
    temp_dir = "/tmp/friday_tts"
    os.makedirs(temp_dir, exist_ok=True)
    
    file_id = str(uuid.uuid4())
    aiff_path = os.path.join(temp_dir, f"{file_id}.aiff")
    wav_path = os.path.join(temp_dir, f"{file_id}.wav")
    
    try:
        # Use native macOS speech synthesizer
        subprocess.run(["say", "-o", aiff_path, text], check=True)
        # Convert to WAV format for browser compatibility using ffmpeg
        subprocess.run(["ffmpeg", "-y", "-i", aiff_path, wav_path], check=True, capture_output=True)
        
        # Cleanup the intermediate AIFF file
        if os.path.exists(aiff_path):
            os.remove(aiff_path)
            
        return wav_path
    except subprocess.CalledProcessError as e:
        logger.error(f"TTS generation failed: {e}")
        if os.path.exists(aiff_path):
            os.remove(aiff_path)
        return ""
    except Exception as e:
        logger.error(f"TTS unexpected error: {e}")
        return ""
