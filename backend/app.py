# backend/app.py
import os
import json
import asyncio
import numpy as np
from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
from typing import List, Optional

# LangGraph & LangChain
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

app = FastAPI(title="YBY V26 - EXOCORTEX")

# Modelos Híbridos (OpenRouter / Groq / Gemini)
llm_gemini_pro = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.1)
llm_gemini_flash = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.1)
llm_groq_deepseek = ChatGroq(model="deepseek-r1-distill-llama-70b", temperature=0.2) 

# UMEM - Memória Bayesiana (Unified Memory Extraction and Management)
class YBYBayesianState:
    def __init__(self, agent_id: str, prior_beliefs: np.ndarray):
        self.agent_id = agent_id
        self.beliefs = prior_beliefs # P(H)

    def update_beliefs(self, likelihoods: np.ndarray) -> np.ndarray:
        unnormalized_posterior = likelihoods * self.beliefs
        evidence_normalizer = np.sum(unnormalized_posterior)
        self.beliefs = unnormalized_posterior / evidence_normalizer
        return self.beliefs

yby_mem = YBYBayesianState("CORE", np.array([0.33, 0.33, 0.33]))

# Tool Shim para DeepSeek R1 (Extração de <think>)
def parse_deepseek_reasoning(response_text: str):
    import re
    think_match = re.search(r'<think>(.*?)</think>', response_text, re.DOTALL)
    think_content = think_match.group(1).strip() if think_match else ""
    final_answer = re.sub(r'<think>.*?</think>', '', response_text, flags=re.DOTALL).strip()
    return think_content, final_answer

class SensorData(BaseModel):
    gyro: List[float]
    battery: int

class VoiceInput(BaseModel):
    text: str

@app.post("/sensors")
async def process_sensors(data: SensorData):
    # Simulação de detecção de anomalia via Gemini (SensorAnalyzer)
    is_anomaly = data.battery < 20 or (data.gyro and abs(data.gyro[0]) > 200)
    nudge = "CRITICAL: Power Cell Depleted" if data.battery < 20 else "WARNING: High G-Force Detected" if is_anomaly else "All systems nominal"
    
    return {"status": "success", "result": {"anomaly": is_anomaly, "nudge": nudge}}

@app.post("/swarm/voice")
async def swarm_voice(data: VoiceInput):
    # Roteamento Híbrido: Tarefas complexas -> DeepSeek R1, Tarefas rápidas -> Gemini Flash
    if "analise" in data.text.lower() or "calcule" in data.text.lower():
        response = await llm_groq_deepseek.ainvoke([HumanMessage(content=data.text)])
        think, final = parse_deepseek_reasoning(response.content)
        return {"status": "success", "result": {"response": final, "orb_color": "#ff00ff", "reasoning": think}}
    else:
        response = await llm_gemini_flash.ainvoke([
            SystemMessage(content="Você é o YBY V26, um exocórtex cibernético. Responda de forma ultra-concisa e direta."),
            HumanMessage(content=data.text)
        ])
        return {"status": "success", "result": {"response": response.content, "orb_color": "#00ff88"}}

async def sse_generator():
    while True:
        yield {"data": json.dumps({"event": "ping", "orb_color": "#00ff88"})}
        await asyncio.sleep(5)

@app.get("/stream")
async def stream():
    return EventSourceResponse(sse_generator())

# Protocolo de Nutricao do Solo (Cron Job simulado via endpoint)
@app.post("/api/trigger-scan")
async def trigger_scan():
    prompt = "Faça uma varredura na internet sobre as últimas otimizações para ESP32-S3, llama.cpp, quantização GGUF, e performance de React/Vite. Gere um 'Pacote de Melhorias Diárias' em JSON com 3 sugestões de otimização reais."
    response = await llm_gemini_pro.ainvoke([HumanMessage(content=prompt)])
    # Na prática, isso seria salvo no banco vetorial Zvec/pgvector
    return {"status": "success", "improvements": response.content}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
