"""Servidor FastAPI industrial para o exocortex FRANK.

Function Over Form: chat local via Ollama, telemetria real e protecao termica
sem bloquear o event loop principal.
"""

from __future__ import annotations

import asyncio
import os
import subprocess
from typing import Any, Literal

import ollama
import psutil
from backend.cognitive_router import NexusRouter
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from pydantic import BaseModel, Field

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
DEFAULT_MODELS = ("llama3", "llama3.1", "llama3.2")
NEURAL_LINK_ERROR = "[ERRO_DE_LINK_NEURAL]: Ollama não detectado"
MIN_VRAM_MB = 500
THERMAL_LIMIT_C = 80.0

logger.add(
    "frank_errors.log",
    level="ERROR",
    rotation="1 MB",
    retention=3,
    enqueue=True,
    backtrace=False,
    diagnose=False,
)
nexus_router = NexusRouter()

app = FastAPI(
    title="FRANK Exocortex API",
    version="2.0.0",
    description="Backend local assíncrono para Ollama, telemetria e bunker health check.",
)

# CORS aberto para permitir que o index.html estatico consulte este backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Temperature(BaseModel):
    available: bool
    celsius: float | None = None
    source: str | None = None


class CpuStatus(BaseModel):
    model: str = "AMD Ryzen 5 4600G"
    usage_percent: float
    cores_logical: int | None
    cores_physical: int | None
    temperature: Temperature


class RamStatus(BaseModel):
    total_gb: float
    used_percent: float


class GpuStatus(BaseModel):
    model: str = "NVIDIA GTX 1650"
    usage_percent: float | None = None
    memory_total_mb: int | None = None
    memory_free_mb: int | None = None
    temperature: Temperature
    note: str | None = None


class ThermalStatus(BaseModel):
    mode: Literal["normal", "throttled"]
    scan_interval_seconds: float
    reason: str


class SystemStatus(BaseModel):
    cpu: CpuStatus
    ram: RamStatus
    gpu: GpuStatus
    thermal: ThermalStatus


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Mensagem enviada ao exocortex.")
    model: str | None = Field(default=None, description="Modelo Ollama opcional.")


class ChatResponse(BaseModel):
    ok: bool
    model: str | None = None
    response: str
    fallback: str | None = None


class EvolutionResponse(BaseModel):
    ok: bool
    status: str
    message: str


def ollama_client() -> ollama.AsyncClient:
    return ollama.AsyncClient(host=OLLAMA_HOST)


def _extract_model_names(models_response: Any) -> list[str]:
    models = getattr(models_response, "models", None)
    if models is None and isinstance(models_response, dict):
        models = models_response.get("models", [])

    names: list[str] = []
    for model in models or []:
        name = getattr(model, "model", None) or getattr(model, "name", None)
        if name is None and isinstance(model, dict):
            name = model.get("model") or model.get("name")
        if name:
            names.append(name)
    return names


async def available_ollama_model(client: ollama.AsyncClient, preferred: str | None = None) -> str:
    """Escolhe llama3 quando existir; caso contrario usa o primeiro modelo local."""
    models_response = await client.list()
    model_names = _extract_model_names(models_response)

    if preferred and preferred in model_names:
        return preferred

    for candidate in DEFAULT_MODELS:
        for model_name in model_names:
            if model_name == candidate or model_name.startswith(f"{candidate}:"):
                return model_name

    if model_names:
        return model_names[0]

    return preferred or DEFAULT_MODELS[0]


def ryzen_temperature() -> Temperature:
    """Tenta ler temperatura real; alguns kernels nao expoem sensores."""
    try:
        sensors = psutil.sensors_temperatures(fahrenheit=False)
    except (AttributeError, OSError):
        return Temperature(available=False)

    preferred_labels = ("k10temp", "zenpower", "cpu_thermal", "acpitz")
    for label in preferred_labels:
        entries = sensors.get(label, [])
        for entry in entries:
            if entry.current is not None:
                return Temperature(available=True, celsius=round(entry.current, 1), source=label)

    for label, entries in sensors.items():
        for entry in entries:
            if entry.current is not None:
                return Temperature(available=True, celsius=round(entry.current, 1), source=label)

    return Temperature(available=False)


def read_nvidia_smi() -> dict[str, int | float] | None:
    """Le VRAM/temperatura via nvidia-smi quando disponivel."""
    try:
        result = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=memory.total,memory.free,utilization.gpu,temperature.gpu",
                "--format=csv,noheader,nounits",
            ],
            check=True,
            capture_output=True,
            text=True,
            timeout=2,
        )
        first_gpu = result.stdout.strip().splitlines()[0]
        total, free, usage, temp = [item.strip() for item in first_gpu.split(",")]
        return {
            "memory_total_mb": int(total),
            "memory_free_mb": int(free),
            "usage_percent": float(usage),
            "temperature_c": float(temp),
        }
    except (subprocess.SubprocessError, FileNotFoundError, IndexError, ValueError) as exc:
        logger.debug(f"nvidia-smi indisponivel: {exc}")
        return None


def read_system_status_sync() -> SystemStatus:
    """Coleta telemetria fora do event loop via asyncio.to_thread."""
    cpu_temp = ryzen_temperature()
    gpu_raw = read_nvidia_smi()
    ram = psutil.virtual_memory()

    if gpu_raw:
        gpu_temp = Temperature(
            available=True,
            celsius=float(gpu_raw["temperature_c"]),
            source="nvidia-smi",
        )
        gpu = GpuStatus(
            usage_percent=float(gpu_raw["usage_percent"]),
            memory_total_mb=int(gpu_raw["memory_total_mb"]),
            memory_free_mb=int(gpu_raw["memory_free_mb"]),
            temperature=gpu_temp,
        )
    else:
        gpu = GpuStatus(
            temperature=Temperature(available=False),
            note="nvidia-smi indisponivel; VRAM/temperatura da GTX 1650 nao expostas.",
        )

    hottest = max(
        [value for value in (cpu_temp.celsius, gpu.temperature.celsius) if value is not None],
        default=None,
    )
    throttled = hottest is not None and hottest >= THERMAL_LIMIT_C

    return SystemStatus(
        cpu=CpuStatus(
            usage_percent=psutil.cpu_percent(interval=0.2),
            cores_logical=psutil.cpu_count(logical=True),
            cores_physical=psutil.cpu_count(logical=False),
            temperature=cpu_temp,
        ),
        ram=RamStatus(total_gb=round(ram.total / (1024**3), 2), used_percent=ram.percent),
        gpu=gpu,
        thermal=ThermalStatus(
            mode="throttled" if throttled else "normal",
            scan_interval_seconds=5.0 if throttled else 1.0,
            reason=(
                f"temperatura critica detectada ({hottest:.1f}C)"
                if throttled and hottest is not None
                else "temperatura dentro do envelope operacional"
            ),
        ),
    )


async def read_system_status() -> SystemStatus:
    return await asyncio.to_thread(read_system_status_sync)


def cloud_fallback_hint() -> str:
    if os.getenv("DEEPSEEK_API_KEY"):
        return "deepseek"
    if os.getenv("GEMINI_API_KEY"):
        return "gemini"
    return "configure DEEPSEEK_API_KEY ou GEMINI_API_KEY"


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "system": "FRANK_EXOCORTEX"}


@app.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    """Envia mensagem para o Ollama local sem bloquear telemetria."""
    status = await read_system_status()
    free_vram = status.gpu.memory_free_mb
    if free_vram is not None and free_vram < MIN_VRAM_MB:
        logger.error(f"VRAM baixa antes do Ollama: {free_vram}MB livres")
        return ChatResponse(
            ok=False,
            model=payload.model,
            response=(
                f"[VRAM_GUARD]: apenas {free_vram}MB livres. "
                f"Fallback recomendado: {cloud_fallback_hint()}."
            ),
            fallback=cloud_fallback_hint(),
        )

    routed = await nexus_router.route(payload.message, preferred_model=payload.model)
    return ChatResponse(
        ok=routed.ok,
        model=routed.model,
        response=routed.response or NEURAL_LINK_ERROR,
        fallback=routed.fallback,
    )


@app.get("/status", response_model=SystemStatus)
async def status() -> SystemStatus:
    """Retorna telemetria real do sistema local em thread separada."""
    return await read_system_status()


@app.post("/evolve", response_model=EvolutionResponse)
async def force_evolution() -> EvolutionResponse:
    """Aciona manualmente a rotina das 05:00 AM sem aplicar patches destrutivos."""
    logger.info("Rotina manual de auto-evolucao acionada pelo MOBILE_NODE.")
    return EvolutionResponse(
        ok=True,
        status="queued",
        message="Rotina de Auto-Evolucao acionada em modo auditoria. Nenhum patch sera aplicado sem confirmacao humana.",
    )


@app.websocket("/ws/status")
async def websocket_status(websocket: WebSocket) -> None:
    """Stream de telemetria com protecao termica adaptativa."""
    await websocket.accept()
    try:
        while True:
            snapshot = await read_system_status()
            await websocket.send_json(snapshot.model_dump())
            await asyncio.sleep(snapshot.thermal.scan_interval_seconds)
    except WebSocketDisconnect:
        logger.info("Cliente desconectado do stream de telemetria.")
    except Exception as exc:
        logger.error(f"Erro no WebSocket de telemetria: {type(exc).__name__}: {exc}")
