from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.llm import frank_router
from typing import Optional

class LLMRequest(BaseModel):
    prompt: str
    intent: Optional[str] = "general"

router = APIRouter(prefix="/llm", tags=["LLM"])

@router.post("/")
async def route_llm(request: LLMRequest):
    """
    Roteia o prompt para o provedor de LLM ideal baseado em latência, custo e intenção.
    """
    try:
        result = await frank_router.route(request.prompt, request.intent)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
