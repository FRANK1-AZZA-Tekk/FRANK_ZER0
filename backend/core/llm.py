import litellm
from core.config import settings
from typing import Dict, Any, Optional
import time
from google import genai
from google.genai import types
import base64
import json
import logging

class FrankRouter:
    """
    Router inteligente para 7 APIs com fallback e otimização de latência/custo.
    """
    def __init__(self):
        self.providers = {
            "groq": {"model": "groq/llama3-70b-8192", "api_key": settings.GROQ_API_KEY},
            "deepseek": {"model": "deepseek/deepseek-chat", "api_key": settings.DEEPSEEK_API_KEY},
            "openai": {"model": "gpt-4o-mini", "api_key": settings.OPENAI_API_KEY},
            "gemini": {"model": "gemini/gemini-1.5-flash", "api_key": settings.GEMINI_API_KEY},
            "openrouter": {"model": "openrouter/nvidia/llama-3.1-nemotron-70b-instruct", "api_key": settings.OPENROUTER_API_KEY},
            "perplexity": {"model": "perplexity/llama-3-sonar-large-32k-online", "api_key": settings.PERPLEXITY_API_KEY},
            "local_gpu": {"model": "huggingface/TinyLlama/TinyLlama-1.1B-Chat-v1.0", "api_key": "mock"}, # Local GPU via LiteLLM
        }

    async def route(self, prompt: str, intent: str = "general", image_base64: Optional[str] = None) -> Dict[str, Any]:
        start_time = time.time()
        
        # Detecção de intenção avançada
        if intent == "general" and prompt:
            lower_prompt = prompt.lower()
            if any(kw in lower_prompt for kw in ["research", "search", "find", "who is", "what is", "scan"]):
                intent = "research"
            elif any(kw in lower_prompt for kw in ["fast", "quick", "realtime", "now", "status"]):
                intent = "realtime"
            elif any(kw in lower_prompt for kw in ["remember", "memory", "past", "history", "save", "log"]):
                intent = "memory"
            elif any(kw in lower_prompt for kw in ["analyze", "look", "see", "vision", "image"]):
                intent = "vision"
            elif any(kw in lower_prompt for kw in ["local", "offline", "private"]):
                intent = "local"

        # Lógica de Roteamento (Latency vs Cost vs Capability)
        if intent == "research":
            selected_provider = "perplexity" # Melhor para busca web
        elif intent == "realtime":
            selected_provider = "groq" # Latência ultra-baixa
        elif intent == "vision":
            selected_provider = "gemini" # Nativo multimodal
        elif intent == "memory":
            selected_provider = "deepseek" # Bom para raciocínio estruturado/JSON
        elif intent == "local":
            selected_provider = "local_gpu" # Inference local com GPU
        else:
            selected_provider = "gemini" # Versátil

        provider_config = self.providers.get(selected_provider)
        if not provider_config or not provider_config["api_key"]:
            selected_provider = "openrouter"
            provider_config = self.providers["openrouter"]

        try:
            if selected_provider == "local_gpu":
                import torch
                from transformers import pipeline
                if torch.cuda.is_available():
                    pipe = pipeline("text-generation", model="TinyLlama/TinyLlama-1.1B-Chat-v1.0", device=0, torch_dtype=torch.float16)
                    res = pipe(prompt, max_new_tokens=256)
                    content = res[0]["generated_text"].replace(prompt, "").strip()
                else:
                    raise Exception("CUDA GPU not available for local inference.")
            elif intent == "vision" and image_base64:
                # Use Google GenAI SDK for vision with response_schema
                client = genai.Client(api_key=provider_config["api_key"])
                
                system_instruction = """
                Role: Advanced visual intelligence system for FRANK CORTEX 2026 (Wearable AI).
                Task: Analyze the provided image with high precision and sub-100ms processing intent.
                Response Format: STRICT JSON.
                """

                response_schema = {
                    "type": "OBJECT",
                    "properties": {
                        "analysis": {"type": "STRING", "description": "Concise summary of the scene."},
                        "objects": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "label": {"type": "STRING"},
                                    "confidence": {"type": "NUMBER"},
                                    "box_2d": {"type": "ARRAY", "items": {"type": "NUMBER"}}
                                }
                            }
                        },
                        "ocr": {"type": "STRING", "description": "Detected text if any."},
                        "ocr_language": {"type": "STRING", "description": "Detected language of the OCR text (e.g., 'pt', 'en')."},
                        "context": {"type": "STRING"},
                        "confidence": {"type": "STRING", "description": "Overall confidence percentage."}
                    },
                    "required": ["analysis", "objects", "confidence"]
                }

                response = client.models.generate_content(
                    model="gemini-1.5-flash-latest",
                    contents=[
                        types.Part.from_text(text=prompt),
                        types.Part.from_bytes(
                            data=base64.b64decode(image_base64),
                            mime_type="image/jpeg"
                        )
                    ],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        response_schema=response_schema,
                        temperature=0.1,
                        max_output_tokens=512
                    )
                )
                content = response.text
            else:
                response = await litellm.acompletion(
                    model=provider_config["model"],
                    messages=[{"role": "user", "content": prompt}],
                    api_key=provider_config["api_key"]
                )
                content = response.choices[0].message.content
            
            latency = time.time() - start_time
            return {
                "response": content,
                "provider": selected_provider,
                "model": provider_config["model"],
                "intent": intent,
                "latency": f"{latency:.2f}s"
            }
        except Exception as e:
            return {"error": str(e), "provider": selected_provider, "intent": intent}

frank_router = FrankRouter()
