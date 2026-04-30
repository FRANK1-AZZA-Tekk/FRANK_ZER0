import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from routers import llm_router, health, voice
from core.config import settings
from core.swarm import yby_swarm
import sentry_sdk
from prometheus_client import make_asgi_app, Counter, Histogram
import time
import json
import io
import base64
from PIL import Image

# --- Monitoring ---
REQUEST_COUNT = Counter("yby_requests_total", "Total requests", ["method", "endpoint", "http_status"])
REQUEST_LATENCY = Histogram("yby_request_latency_seconds", "Request latency", ["endpoint"])

# --- WebSocket Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# Sentry Error Reporting
if settings.APP_ENV == "production":
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan async para inicialização e limpeza."""
    logging.info("[YBY CORTEX] Inicializando Córtex Neural 2026...")
    # Inicialização de DB, Redis Sentinel, Neo4j, etc.
    # if settings.APP_ENV == "production":
    #     await init_redis_sentinel()
    #     await init_neo4j()
    yield
    logging.info("[YBY CORTEX] Desligando Córtex Neural...")

app = FastAPI(
    title="YBY AI CORTEX 2026",
    version="2026.3.0",
    lifespan=lifespan,
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc"
)

# Metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    latency = time.time() - start_time
    
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path, http_status=response.status_code).inc()
    REQUEST_LATENCY.labels(endpoint=request.url.path).observe(latency)
    
    return response

# Routers include
app.include_router(llm_router.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")
app.include_router(voice.router, prefix="/api/v1")

# --- Swarm Endpoint ---
@app.post("/api/v1/swarm")
async def run_swarm(request: dict):
    """
    Executa o enxame de 10 agentes (LangGraph + CrewAI).
    """
    prompt = request.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt missing")
    
    try:
        result = await yby_swarm.run(prompt)
        return result
    except Exception as e:
        logging.error(f"Swarm Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/swarm/vision")
async def run_vision_swarm(request: dict):
    """
    Endpoint para análise de imagem base64 via vision_agent com validação e compressão.
    """
    image_raw = request.get("image")
    if not image_raw:
        raise HTTPException(status_code=400, detail="Image base64 missing")
    
    start_time = time.time()
    
    async def log_step(step: str):
        await manager.broadcast({
            "type": "vision_progress",
            "data": {
                "step": step,
                "timestamp": time.time()
            }
        })

    try:
        # 1. Validation & Decoding
        await log_step("Decoding base64")
        try:
            # Remove header if present
            if "," in image_raw:
                image_raw = image_raw.split(",")[1]
            
            image_data = base64.b64decode(image_raw)
            img = Image.open(io.BytesIO(image_data))
        except Exception as e:
            await log_step(f"Error: Invalid image data - {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
            
        if img.format not in ["JPEG", "PNG", "WEBP"]:
             await log_step(f"Error: Unsupported format {img.format}")
             raise HTTPException(status_code=400, detail=f"Unsupported format: {img.format}")

        await log_step(f"Format validated: {img.format}")

        # 2. Compression (Target < 500KB)
        await log_step("Checking compression needs")
        if len(image_data) > 500 * 1024:
            await log_step("Compressing image (Target <500KB)")
            quality = 85
            while quality > 10:
                output = io.BytesIO()
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.save(output, format="JPEG", quality=quality, optimize=True)
                compressed_data = output.getvalue()
                if len(compressed_data) < 500 * 1024:
                    image_data = compressed_data
                    break
                quality -= 10
            await log_step(f"Compressed to {len(image_data)/1024:.1f}KB")
        else:
            await log_step(f"Compression skipped ({len(image_data)/1024:.1f}KB)")
        
        # 3. Process with Swarm
        await log_step("Sending to Vision Agent (Gemini 1.5 Flash)")
        processed_b64 = base64.b64encode(image_data).decode('utf-8')
        result = await run_in_threadpool(yby_swarm.process_vision_pipeline, processed_b64)
        
        await log_step("Analysis complete")
        
        latency = time.time() - start_time
        REQUEST_LATENCY.labels(endpoint="/api/v1/swarm/vision").observe(latency)
        
        # Log structured JSON for observability
        logging.info(json.dumps({
            "event": "vision_analysis",
            "latency": latency,
            "status": result.get("status"),
            "confidence": result.get("confidence"),
            "final_size_kb": len(image_data) / 1024
        }))
        
        return result
    except Exception as e:
        await log_step(f"Critical Error: {str(e)}")
        logging.error(f"Vision Swarm Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.concurrency import run_in_threadpool

@app.post("/api/v1/swarm/memory")
async def run_memory_swarm(request: dict):
    """
    Endpoint para busca e otimização de memória no Neo4j.
    """
    query = request.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Query missing")
    
    try:
        # Executa o nó de memória do enxame
        result = await run_in_threadpool(yby_swarm.process_memory_pipeline, query)
        return {"context": str(result), "status": "success"}
    except Exception as e:
        logging.error(f"Memory Swarm Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/swarm/voice")
async def run_voice_swarm(request: dict):
    """
    Endpoint para processamento de voz (NLP + Intenção).
    """
    audio_text = request.get("audio_text")
    if not audio_text:
        raise HTTPException(status_code=400, detail="Audio text missing")
    
    try:
        result = await run_in_threadpool(yby_swarm.process_voice_pipeline, audio_text)
        return {"yby_response": str(result), "status": "success"}
    except Exception as e:
        logging.error(f"Voice Swarm Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/swarm/research")
async def run_research_swarm(request: dict):
    query = request.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Query missing")
    try:
        result = await run_in_threadpool(yby_swarm.research, query)
        return {"result": str(result), "status": "success"}
    except Exception as e:
        logging.error(f"Research Swarm Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/swarm/optimize")
async def run_optimize_swarm(request: dict):
    improvement_id = request.get("improvement_id")
    if not improvement_id:
        raise HTTPException(status_code=400, detail="Improvement ID missing")
    try:
        # Mocking optimization application for now
        await asyncio.sleep(2)
        return {"status": "success", "message": f"Optimization {improvement_id} applied successfully."}
    except Exception as e:
        logging.error(f"Optimize Swarm Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/swarm/route")
async def run_route_swarm(request: dict):
    query = request.get("query")
    if not query:
        raise HTTPException(status_code=400, detail="Query missing")
    try:
        # Mocking routing logic
        await asyncio.sleep(1)
        return {"status": "success", "route": "RESEARCH_AGENT", "message": "Routed to Research Agent"}
    except Exception as e:
        logging.error(f"Route Swarm Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/nudges/{nudge_id}/complete")
async def complete_nudge(nudge_id: str):
    try:
        # Mocking nudge completion
        await asyncio.sleep(0.5)
        return {"status": "success", "message": f"Nudge {nudge_id} completed."}
    except Exception as e:
        logging.error(f"Complete Nudge Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/nudges/{nudge_id}/dismiss")
async def dismiss_nudge(nudge_id: str):
    try:
        # Mocking nudge dismissal
        await asyncio.sleep(0.5)
        return {"status": "success", "message": f"Nudge {nudge_id} dismissed."}
    except Exception as e:
        logging.error(f"Dismiss Nudge Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or handle messages
            await websocket.send_json({"type": "ack", "data": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Serve Frontend
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

@app.get("/api/v1/status")
async def status():
    return {
        "status": "online", 
        "system": "YBY_CORTEX_2026", 
        "version": "3.0.0",
        "env": settings.APP_ENV,
        "workers": settings.GUNICORN_WORKERS
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=3000, 
        workers=settings.GUNICORN_WORKERS if settings.APP_ENV == "production" else 1,
        reload=settings.DEBUG
    )
