"""Roteador cognitivo hibrido do FRANK.

Function Over Form: uma classe, heuristica simples e saida JSON padronizada.
O roteador tenta a melhor rota cognitiva e volta para Ollama quando a nuvem falha.
"""

from __future__ import annotations

import os
import re
from typing import Any, Literal

import httpx
from dotenv import load_dotenv
from loguru import logger
from pydantic import BaseModel

load_dotenv()

RouteName = Literal["ollama", "groq", "deepseek", "gemini", "perplexity", "vast"]

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
DEFAULT_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
NEURAL_LINK_ERROR = "[ERRO_DE_LINK_NEURAL]: Ollama não detectado"


class RouterResult(BaseModel):
    ok: bool
    route: RouteName
    model: str | None = None
    response: str
    fallback: str | None = None
    error: str | None = None


class NexusRouter:
    """Orquestra modelos locais e APIs cloud usando uma bussola de intencao."""

    def __init__(self, timeout: float = 30.0) -> None:
        self.timeout = timeout

    def decide_route(self, prompt: str) -> RouteName:
        """Detecta intencao com regex simples, rapido e auditavel."""
        text = prompt.lower()

        if re.search(r"\b(pesquise|pesquisar|busque|buscar|hoje|notícias|noticias|internet|tempo real)\b", text):
            return "perplexity"

        if os.getenv("VAST_INFERENCE_URL") and re.search(
            r"\b(vast|gpu pesada|3090|4090|rtx 6000|modelo grande|contexto extremo)\b",
            text,
        ):
            return "vast"

        if re.search(r"\b(analise este log|analise o log|stacktrace|traceback|grande bloco|contexto longo|raciocínio|raciocinio)\b", text):
            return "deepseek" if os.getenv("DEEPSEEK_API_KEY") else "gemini"

        if re.search(r"\b(rápido|rapido|terminal|comando|agora|status|latência|latencia)\b", text):
            return "groq"

        return "ollama"

    async def route(self, prompt: str, preferred_model: str | None = None) -> RouterResult:
        selected = self.decide_route(prompt)

        try:
            if selected == "perplexity":
                return await self._perplexity(prompt)
            if selected == "groq":
                return await self._groq(prompt)
            if selected == "deepseek":
                return await self._deepseek(prompt)
            if selected == "gemini":
                return await self._gemini(prompt)
            if selected == "vast":
                return await self._vast(prompt)
            return await self._ollama(prompt, preferred_model)
        except Exception as exc:
            logger.error(f"NexusRouter falhou em {selected}: {type(exc).__name__}: {exc}")
            fallback = await self._safe_ollama_fallback(prompt, preferred_model)
            fallback.fallback = selected
            return fallback

    async def _safe_ollama_fallback(self, prompt: str, preferred_model: str | None = None) -> RouterResult:
        try:
            return await self._ollama(prompt, preferred_model)
        except Exception as exc:
            logger.error(f"Fallback Ollama indisponivel: {type(exc).__name__}: {exc}")
            return RouterResult(
                ok=False,
                route="ollama",
                model=preferred_model or DEFAULT_OLLAMA_MODEL,
                response=NEURAL_LINK_ERROR,
                error=str(exc),
            )

    async def _ollama(self, prompt: str, preferred_model: str | None = None) -> RouterResult:
        model = preferred_model or DEFAULT_OLLAMA_MODEL
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "Você é o FRANK, exocórtex local. Responda em português-BR, direto e útil."},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
        }
        data = await self._post_json(f"{OLLAMA_HOST}/api/chat", payload)
        return RouterResult(ok=True, route="ollama", model=model, response=data["message"]["content"])

    async def _groq(self, prompt: str) -> RouterResult:
        api_key = self._required_key("GROQ_API_KEY")
        model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        data = await self._openai_compatible(
            "https://api.groq.com/openai/v1/chat/completions",
            api_key,
            model,
            prompt,
        )
        return RouterResult(ok=True, route="groq", model=model, response=self._choice_text(data))

    async def _deepseek(self, prompt: str) -> RouterResult:
        api_key = self._required_key("DEEPSEEK_API_KEY")
        model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
        data = await self._openai_compatible(
            "https://api.deepseek.com/v1/chat/completions",
            api_key,
            model,
            prompt,
        )
        return RouterResult(ok=True, route="deepseek", model=model, response=self._choice_text(data))

    async def _gemini(self, prompt: str) -> RouterResult:
        api_key = self._required_key("GEMINI_API_KEY")
        model = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        data = await self._post_json(url, {"contents": [{"parts": [{"text": prompt}]}]})
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return RouterResult(ok=True, route="gemini", model=model, response=text)

    async def _perplexity(self, prompt: str) -> RouterResult:
        api_key = self._required_key("PERPLEXITY_API_KEY")
        model = os.getenv("PERPLEXITY_MODEL", "sonar-pro")
        data = await self._openai_compatible(
            "https://api.perplexity.ai/chat/completions",
            api_key,
            model,
            prompt,
            system="Você pesquisa dados atuais e responde com fatos diretos em português-BR.",
        )
        return RouterResult(ok=True, route="perplexity", model=model, response=self._choice_text(data))

    async def _vast(self, prompt: str) -> RouterResult:
        base_url = os.getenv("VAST_INFERENCE_URL", "").rstrip("/")
        if not base_url:
            raise RuntimeError("VAST_INFERENCE_URL ausente no .env")

        model = os.getenv("VAST_MODEL", "local-heavy-model")
        chat_url = (
            f"{base_url}/chat/completions"
            if base_url.endswith("/v1")
            else f"{base_url}/v1/chat/completions"
        )
        data = await self._openai_compatible(
            chat_url,
            os.getenv("VAST_API_KEY", "not-required"),
            model,
            prompt,
        )
        return RouterResult(ok=True, route="vast", model=model, response=self._choice_text(data))

    async def _openai_compatible(
        self,
        url: str,
        api_key: str,
        model: str,
        prompt: str,
        *,
        system: str = "Você é o FRANK. Responda em português-BR, direto e útil.",
    ) -> dict[str, Any]:
        return await self._post_json(
            url,
            {
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
            },
            headers={"authorization": f"Bearer {api_key}"},
        )

    async def _post_json(
        self,
        url: str,
        payload: dict[str, Any],
        *,
        headers: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        request_headers = {"content-type": "application/json", **(headers or {})}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload, headers=request_headers)
            response.raise_for_status()
            return response.json()

    @staticmethod
    def _choice_text(data: dict[str, Any]) -> str:
        return data["choices"][0]["message"]["content"]

    @staticmethod
    def _required_key(name: str) -> str:
        value = os.getenv(name)
        if not value:
            raise RuntimeError(f"{name} ausente no .env")
        return value
