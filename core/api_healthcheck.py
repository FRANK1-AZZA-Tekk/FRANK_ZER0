#!/usr/bin/env python3
"""Verificador seguro das APIs externas do YBY.

Le chaves de `.env`, `backend/.env` ou variaveis ja exportadas.
Nunca imprime valores de segredo; mostra apenas status por provedor.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
ENV_FILES = (ROOT / ".env", ROOT / "backend" / ".env")


def load_env_files() -> None:
    for env_file in ENV_FILES:
        if not env_file.exists():
            continue

        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def request_json(url: str, *, headers: dict[str, str] | None = None, payload: dict | None = None) -> tuple[int, str]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    req_headers = {"user-agent": "YBY-api-healthcheck/1.0", **(headers or {})}
    if body is not None:
        req_headers["content-type"] = "application/json"

    req = Request(url, data=body, headers=req_headers)
    with urlopen(req, timeout=15) as response:
        prefix = response.read(180).decode("utf-8", errors="replace").replace("\n", " ")
        return response.status, prefix


def bearer_headers(api_key: str) -> dict[str, str]:
    return {"authorization": f"Bearer {api_key}"}


def check_gemini(api_key: str) -> tuple[int, str]:
    return request_json(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}")


def check_groq(api_key: str) -> tuple[int, str]:
    return request_json("https://api.groq.com/openai/v1/models", headers=bearer_headers(api_key))


def check_openrouter(api_key: str) -> tuple[int, str]:
    return request_json("https://openrouter.ai/api/v1/models", headers=bearer_headers(api_key))


def check_openai(api_key: str) -> tuple[int, str]:
    return request_json("https://api.openai.com/v1/models", headers=bearer_headers(api_key))


def check_deepseek(api_key: str) -> tuple[int, str]:
    return request_json("https://api.deepseek.com/v1/models", headers=bearer_headers(api_key))


def check_perplexity(api_key: str) -> tuple[int, str]:
    return request_json(
        "https://api.perplexity.ai/chat/completions",
        headers=bearer_headers(api_key),
        payload={
            "model": "sonar-pro",
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 8,
        },
    )


PROVIDERS: dict[str, tuple[str, Callable[[str], tuple[int, str]]]] = {
    "gemini": ("GEMINI_API_KEY", check_gemini),
    "groq": ("GROQ_API_KEY", check_groq),
    "openrouter": ("OPENROUTER_API_KEY", check_openrouter),
    "openai": ("OPENAI_API_KEY", check_openai),
    "deepseek": ("DEEPSEEK_API_KEY", check_deepseek),
    "perplexity": ("PERPLEXITY_API_KEY", check_perplexity),
}


def main() -> int:
    load_env_files()
    failures = 0

    for provider, (env_name, checker) in PROVIDERS.items():
        api_key = os.getenv(env_name)
        if not api_key:
            failures += 1
            print(f"MISSING_ENV | {provider} | {env_name}")
            continue

        try:
            status, prefix = checker(api_key)
            ok = 200 <= status < 300
            if not ok:
                failures += 1
            print(f"{'OK' if ok else 'FAIL'} | {provider} | HTTP {status} | {prefix[:100]}")
        except HTTPError as exc:
            failures += 1
            detail = exc.read(180).decode("utf-8", errors="replace").replace("\n", " ")
            print(f"HTTP_ERROR | {provider} | HTTP {exc.code} | {detail[:100]}")
        except (TimeoutError, URLError, OSError) as exc:
            failures += 1
            print(f"ERROR | {provider} | {type(exc).__name__}: {exc}")

    return 0 if failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
