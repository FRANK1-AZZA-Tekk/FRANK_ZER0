from fastapi import APIRouter, HTTPException
import redis.asyncio as redis
from core.config import settings
import sqlite3

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/live")
async def liveness_probe():
    """Liveness probe para Kubernetes/Docker."""
    return {"status": "alive", "system": "FRANK_CORTEX_2026"}

@router.get("/ready")
async def readiness_probe():
    """Readiness probe verificando Redis e DB."""
    try:
        # Redis Ping
        r = redis.from_url(settings.REDIS_URL)
        if not await r.ping():
            raise Exception("Redis not responding")
        
        # DB Ping (SQLite)
        conn = sqlite3.connect("frank.db")
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        conn.close()
        
        return {"status": "ready", "redis": "ok", "db": "ok"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"System not ready: {str(e)}")
