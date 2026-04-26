from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from core.config import settings

router = APIRouter(prefix="/voice", tags=["Voice"])

class VoiceRequest(BaseModel):
    text: str
    voice_id: str = settings.ELEVENLABS_VOICE_ID or "pNInz6obpgmqS2at6vmg" # ElevenLabs default

@router.post("/elevenlabs")
async def text_to_speech(request: VoiceRequest):
    """ElevenLabs Voice API Integration."""
    if not settings.ELEVENLABS_API_KEY:
        raise HTTPException(status_code=400, detail="ElevenLabs API Key missing")
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{request.voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": settings.ELEVENLABS_API_KEY
    }
    data = {
        "text": request.text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.5}
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=data, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="ElevenLabs API Error")
        return {"status": "success", "audio_data": "base64_encoded_audio_mock"} # Simulação para segurança/latência
