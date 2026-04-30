"""Servidor FastAPI minimalista para o exocortex FRANK.

Foco: Function Over Form. Este modulo expõe chat local via Ollama e telemetria
real da maquina sem depender de servicos externos.
"""

from __future__ import annotations

import os
from typing import Any

import ollama
import psutil
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
DEFAULT_MODELS = ("llama3", "llama3.1", "llama3.2")
NEURAL_LINK_ERROR = "[ERRO_DE_LINK_NEURAL]: Ollama não detectado"

app = FastAPI(
    title="FRANK Exocortex API",
    version="1.0.0",
    description="Backend local para chat via Ollama e telemetria do bunker.",
)

# CORS aberto para permitir que o index.html estatico consulte este backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Mensagem enviada ao exocortex.")
    model: str | None = Field(default=None, description="Modelo Ollama opcional.")


class ChatResponse(BaseModel):
    ok: bool
    model: str | None = None
    response: str


def ollama_client() -> ollama.Client:
    return ollama.Client(host=OLLAMA_HOST)


def available_ollama_model(client: ollama.Client, preferred: str | None = None) -> str:
    """Escolhe llama3 quando existir; caso contrario usa o primeiro modelo local."""
    models_response = client.list()
    models = models_response.get("models", [])
    model_names = [
        model.get("name") or model.get("model")
        for model in models
        if model.get("name") or model.get("model")
    ]

    if preferred and preferred in model_names:
        return preferred

    for candidate in DEFAULT_MODELS:
        for model_name in model_names:
            if model_name == candidate or model_name.startswith(f"{candidate}:"):
                return model_name

    if model_names:
        return model_names[0]

    # Sem modelo instalado: deixa Ollama retornar o erro real no chat.
    return preferred or DEFAULT_MODELS[0]


def ryzen_temperature() -> dict[str, Any]:
    """Tenta ler temperatura real; alguns kernels nao expoem sensores."""
    try:
        sensors = psutil.sensors_temperatures(fahrenheit=False)
    except (AttributeError, OSError):
        return {"available": False, "celsius": None, "source": None}

    preferred_labels = ("k10temp", "zenpower", "cpu_thermal", "acpitz")
    for label in preferred_labels:
        entries = sensors.get(label, [])
        for entry in entries:
            if entry.current is not None:
                return {"available": True, "celsius": round(entry.current, 1), "source": label}

    for label, entries in sensors.items():
        for entry in entries:
            if entry.current is not None:
                return {"available": True, "celsius": round(entry.current, 1), "source": label}

    return {"available": False, "celsius": None, "source": None}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "system": "FRANK_EXOCORTEX"}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    """Envia mensagem para o Ollama local e retorna a resposta do modelo."""
    try:
        client = ollama_client()
        model = available_ollama_model(client, payload.model)
        result = client.chat(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "Você é o FRANK, um exocórtex local. Responda em português-BR, direto e útil.",
                },
                {"role": "user", "content": payload.message},
            ],
        )
        return ChatResponse(ok=True, model=model, response=result["message"]["content"])
    except Exception:
        return ChatResponse(ok=False, model=payload.model, response=NEURAL_LINK_ERROR)


@app.get("/status")
def status() -> dict[str, Any]:
    """Retorna telemetria real do sistema local."""
    return {
        "cpu": {
            "model": "AMD Ryzen 5 4600G",
            "usage_percent": psutil.cpu_percent(interval=0.2),
            "cores_logical": psutil.cpu_count(logical=True),
            "cores_physical": psutil.cpu_count(logical=False),
            "temperature": ryzen_temperature(),
        },
        "ram": {
            "total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
            "used_percent": psutil.virtual_memory().percent,
        },
        "gpu": {
            "model": "NVIDIA GTX 1650",
            "usage_percent": None,
            "note": "psutil nao expoe uso de GPU; integrar NVML/nvidia-smi se disponivel.",
        },
    }
