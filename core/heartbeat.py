#!/usr/bin/env python3
"""Pulso operacional do Exocortex YBY.

Sem root, sem magia: este script apenas verifica Ollama local, CPU/RAM
e garante que o diario de evolucao exista.
"""

from __future__ import annotations

from datetime import datetime, timezone
import os
from pathlib import Path
from urllib.error import URLError, HTTPError
from urllib.request import urlopen

import psutil

ROOT = Path(__file__).resolve().parents[1]
LOG_PATH = ROOT / "logs" / "evolution.md"
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_URL = f"{OLLAMA_HOST}/api/tags"

BANNER = r"""
__   __  ______   __   __
\ \ / / |  _ \ \ / /
 \ V /  | |_) \ V /
  | |   |  _ < | |
  |_|   |_| \_\|_|
"""


def ensure_evolution_log() -> bool:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    if LOG_PATH.exists():
        return True

    LOG_PATH.write_text(
        "# Evolucao YBY\n\n"
        "## Status Inicial\n"
        f"- Criado em: {datetime.now(timezone.utc).isoformat()}\n"
        "- Estado: [YBY] Sistema Estavel.\n",
        encoding="utf-8",
    )
    return True


def check_ollama() -> tuple[bool, str]:
    try:
        with urlopen(OLLAMA_URL, timeout=2) as response:
            return response.status == 200, f"HTTP {response.status}"
    except HTTPError as exc:
        return False, f"HTTP {exc.code}"
    except URLError as exc:
        return False, str(exc.reason)
    except TimeoutError:
        return False, "timeout"


def read_resources() -> tuple[float, float]:
    cpu_percent = psutil.cpu_percent(interval=0.2)
    ram_percent = psutil.virtual_memory().percent
    return cpu_percent, ram_percent


def main() -> int:
    print(BANNER.strip())

    log_ok = ensure_evolution_log()
    ollama_ok, ollama_detail = check_ollama()
    cpu_percent, ram_percent = read_resources()

    print(f"[YBY] Ollama local: {'OK' if ollama_ok else 'ATENCAO'} ({ollama_detail})")
    print(f"[YBY] CPU: {cpu_percent:.1f}%")
    print(f"[YBY] RAM: {ram_percent:.1f}%")
    print(f"[YBY] Log evolutivo: {'OK' if log_ok else 'ATENCAO'} ({LOG_PATH.relative_to(ROOT)})")

    print("[YBY] Sistema Estavel.")
    return 0 if log_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
