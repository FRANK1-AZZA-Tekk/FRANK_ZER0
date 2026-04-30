#!/usr/bin/env python3
"""Orquestrador Vast.ai para a musculatura cloud do FRANK.

Este script roda localmente sem root. Ele conversa com a API Vast.ai, cria uma
instancia GPU sob demanda, sobe um container Ollama/vLLM por SSH e atualiza o
`.env` local com o endpoint remoto para o cognitive_router.

Por seguranca, o modo padrao e dry-run. Use `--execute` apenas quando quiser
criar/destruir instancias reais.
"""

from __future__ import annotations

import argparse
import json
import os
import shlex
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
VAST_API_URL = "https://console.vast.ai/api/v0"
TARGET_GPUS = ("RTX 3090", "RTX 4090", "RTX 6000 Ada")
DEFAULT_IMAGE = "ollama/ollama:latest"
DEFAULT_MODEL = "llama3"
DEFAULT_IDLE_MINUTES = 30


@dataclass
class VastConfig:
    api_key: str
    execute: bool


def load_env() -> None:
    """Carrega .env simples sem imprimir segredos."""
    if not ENV_PATH.exists():
        return
    for raw in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def require_config(execute: bool) -> VastConfig:
    load_env()
    api_key = os.getenv("VAST_API_KEY", "")
    if execute and not api_key:
        raise SystemExit("Defina VAST_API_KEY no .env antes de usar Vast.ai.")
    return VastConfig(api_key=api_key, execute=execute)


def vast_headers(config: VastConfig) -> dict[str, str]:
    return {"Authorization": f"Bearer {config.api_key}", "Accept": "application/json"}


def request_vast(config: VastConfig, method: str, path: str, **kwargs: Any) -> dict[str, Any]:
    url = f"{VAST_API_URL}{path}"
    response = requests.request(method, url, headers=vast_headers(config), timeout=30, **kwargs)
    response.raise_for_status()
    return response.json()


def search_offers(config: VastConfig, limit: int = 10) -> list[dict[str, Any]]:
    """Busca ofertas com GPUs alvo e ordena por custo/beneficio."""
    query = {
        "verified": {"eq": True},
        "rentable": {"eq": True},
        "external": {"eq": False},
        "gpu_name": {"in": list(TARGET_GPUS)},
        "reliability": {"gte": 0.95},
        "inet_down": {"gte": 100},
    }
    payload = {
        "q": query,
        "order": [["dph_total", "asc"]],
        "type": "on-demand",
        "limit": limit,
    }
    if not config.execute:
        print("[DRY-RUN] Consultaria Vast.ai com filtro:")
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return []
    data = request_vast(config, "POST", "/bundles", json=payload)
    offers = data.get("offers") or data.get("results") or []
    return sorted(offers, key=lambda item: float(item.get("dph_total", 9999)))


def create_instance(config: VastConfig, offer_id: int, image: str) -> dict[str, Any]:
    payload = {
        "client_id": "me",
        "image": image,
        "disk": 80,
        "onstart": "",
        "runtype": "ssh",
    }
    if not config.execute:
        print(f"[DRY-RUN] Criaria instancia Vast offer_id={offer_id} image={image}")
        return {"new_contract": "dry-run", "offer_id": offer_id}
    return request_vast(config, "PUT", f"/asks/{offer_id}/", json=payload)


def destroy_instance(config: VastConfig, instance_id: str) -> dict[str, Any]:
    if not config.execute:
        print(f"[DRY-RUN] Destruiria instancia Vast id={instance_id}")
        return {"destroyed": False, "dry_run": True}
    return request_vast(config, "DELETE", f"/instances/{instance_id}/")


def ssh(command: str, host: str, port: int, user: str = "root", execute: bool = False) -> None:
    """Executa comando remoto via SSH. Nao usa root local; root e usuario remoto da instancia."""
    ssh_cmd = [
        "ssh",
        "-o",
        "StrictHostKeyChecking=no",
        "-p",
        str(port),
        f"{user}@{host}",
        command,
    ]
    if not execute:
        print("[DRY-RUN] SSH:", " ".join(shlex.quote(part) for part in ssh_cmd))
        return
    subprocess.run(ssh_cmd, check=True)


def provision_runtime(
    host: str,
    ssh_port: int,
    model: str,
    runtime: str,
    execute: bool,
) -> int:
    """Sobe container Ollama ou vLLM e baixa o modelo desejado."""
    if runtime == "vllm":
        port = 8000
        command = (
            "docker run -d --gpus all --restart unless-stopped "
            f"-p {port}:8000 --name frank-vllm vllm/vllm-openai:latest "
            f"--model {shlex.quote(model)} --host 0.0.0.0"
        )
    else:
        port = 11434
        command = (
            "docker run -d --gpus all --restart unless-stopped "
            f"-p {port}:11434 --name frank-ollama {DEFAULT_IMAGE} && "
            f"sleep 5 && docker exec frank-ollama ollama pull {shlex.quote(model)}"
        )
    ssh(command, host, ssh_port, execute=execute)
    return port


def update_env(endpoint: str) -> None:
    """Atualiza .env sem tocar nos segredos existentes."""
    lines: list[str] = []
    if ENV_PATH.exists():
        lines = ENV_PATH.read_text(encoding="utf-8").splitlines()

    keys = {"VAST_INFERENCE_URL": endpoint}
    found = set()
    updated: list[str] = []
    for line in lines:
        if "=" in line and not line.strip().startswith("#"):
            key = line.split("=", 1)[0].strip()
            if key in keys:
                updated.append(f"{key}={json.dumps(keys[key])}")
                found.add(key)
                continue
        updated.append(line)

    for key, value in keys.items():
        if key not in found:
            updated.append(f"{key}={json.dumps(value)}")

    ENV_PATH.write_text("\n".join(updated) + "\n", encoding="utf-8")
    os.chmod(ENV_PATH, 0o600)
    print(f"[FRANK] .env atualizado com VAST_INFERENCE_URL={endpoint}")


def find_idle_instances(config: VastConfig, idle_minutes: int) -> list[dict[str, Any]]:
    """Lista instancias candidatas ao kill switch por tempo ocioso reportado."""
    data = request_vast(config, "GET", "/instances")
    instances = data.get("instances", [])
    cutoff = idle_minutes * 60
    return [
        item
        for item in instances
        if item.get("label") == "frank-vast-runtime" and float(item.get("duration", 0)) > cutoff
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="FRANK Vast.ai Orchestrator")
    parser.add_argument("action", choices=["search", "deploy", "destroy", "killswitch"])
    parser.add_argument("--execute", action="store_true", help="Executa alteracoes reais no Vast.ai.")
    parser.add_argument("--offer-id", type=int)
    parser.add_argument("--instance-id")
    parser.add_argument("--host", help="IP publico da instancia para provisionamento SSH.")
    parser.add_argument("--ssh-port", type=int, default=22)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--runtime", choices=["ollama", "vllm"], default="ollama")
    parser.add_argument("--idle-minutes", type=int, default=DEFAULT_IDLE_MINUTES)
    args = parser.parse_args()

    config = require_config(args.execute)

    try:
        if args.action == "search":
            offers = search_offers(config)
            for offer in offers[:10]:
                print(json.dumps({
                    "id": offer.get("id"),
                    "gpu": offer.get("gpu_name"),
                    "dph_total": offer.get("dph_total"),
                    "reliability": offer.get("reliability"),
                    "inet_down": offer.get("inet_down"),
                }, ensure_ascii=False))
            return 0

        if args.action == "deploy":
            if args.offer_id is None:
                offers = search_offers(config, limit=1)
                if not offers:
                    raise SystemExit("Nenhuma oferta Vast.ai encontrada para a stack FRANK.")
                args.offer_id = int(offers[0]["id"])
            instance = create_instance(config, args.offer_id, DEFAULT_IMAGE if args.runtime == "ollama" else "vllm/vllm-openai:latest")
            print(json.dumps(instance, ensure_ascii=False))
            if args.host:
                port = provision_runtime(args.host, args.ssh_port, args.model, args.runtime, args.execute)
                update_env(f"http://{args.host}:{port}")
            return 0

        if args.action == "destroy":
            if not args.instance_id:
                raise SystemExit("Informe --instance-id para destruir.")
            print(json.dumps(destroy_instance(config, args.instance_id), ensure_ascii=False))
            return 0

        if args.action == "killswitch":
            victims = find_idle_instances(config, args.idle_minutes)
            for instance in victims:
                instance_id = str(instance.get("id"))
                print(f"[FRANK] Kill switch candidato: {instance_id}")
                destroy_instance(config, instance_id)
            if not victims:
                print("[FRANK] Nenhuma instancia ociosa encontrada.")
            return 0
    except requests.RequestException as exc:
        print(f"[ERRO_REDE_VAST]: {exc}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
