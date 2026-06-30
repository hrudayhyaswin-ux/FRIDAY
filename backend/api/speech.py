import logging
import os
import shutil
import tempfile
import uuid

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from speech.stt import stt_engine
from tts.mac_tts import synthesize_text

router = APIRouter()
logger = logging.getLogger(__name__)


class TTSRequest(BaseModel):
    text: str


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)) -> dict:  # noqa: B008
    """Accepts an audio file and returns the transcribed text."""
    temp_dir = tempfile.mkdtemp(prefix="friday_stt_")

    file_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        # Transcribe using Whisper
        text = stt_engine.transcribe(file_path)
        return {"text": text}
    except Exception as e:
        logger.error(f"Transcription API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process audio")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@router.post("/synthesize")
def synthesize_speech(request: TTSRequest, background_tasks: BackgroundTasks):
    """Accepts text and returns a WAV audio file."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    result = synthesize_text(request.text)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to generate speech")

    wav_path, temp_dir = result

    # Clean up temp dir after response is sent
    background_tasks.add_task(shutil.rmtree, temp_dir, True)

    # Return the file directly as a downloadable/playable audio response
    return FileResponse(wav_path, media_type="audio/wav", filename="speech.wav")
