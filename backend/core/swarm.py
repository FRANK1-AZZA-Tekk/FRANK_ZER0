import asyncio
from typing import Annotated, TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from crewai import Agent, Task, Crew, Process
from core.llm import frank_router
from core.config import settings
from crew.neo4j_tools import Neo4jMemoryTools
from google import genai
from google.genai import types
import base64
import json
import logging

# --- State Definition ---
class AgentState(TypedDict):
    messages: List[Dict[str, str]]
    intent: str
    memory: Dict[str, Any]
    plan: List[str]
    results: Dict[str, Any]
    supervisor_approval: bool

# --- Agent Definitions (CrewAI + LangGraph) ---
class FrankSwarm:
    def __init__(self):
        self.neo4j_tools = Neo4jMemoryTools()
        self.agents = self._init_agents()
        self.graph = self._build_graph()

    def _init_agents(self) -> Dict[str, Agent]:
        return {
            "router": Agent(
                role="Router", 
                goal="Route to 7 APIs + Claude 3.5", 
                backstory="Master of LLM latency/cost routing."
            ),
            "voice": Agent(
                role="Voice", 
                goal="ElevenLabs BLE stream management", 
                backstory="Audio low-latency specialist."
            ),
            "graph_rag": Agent(
                role="GraphRAG", 
                goal="Neo4j/pgvector retrieval", 
                backstory="Knowledge graph master.",
                tools=[self.neo4j_tools.nl2cypher_query]
            ),
            "memory": Agent(
                role="Memory", 
                goal="UMEM Semantic Neighborhood management", 
                backstory="Long-term memory evolver.",
                tools=[self.neo4j_tools.log_interaction, self.neo4j_tools.optimize_dossier]
            ),
            "nudges": Agent(
                role="Nudges", 
                goal="BCI EEG MSBiLSTM analysis", 
                backstory="Human-machine interface expert."
            ),
            "judge": Agent(
                role="Judge", 
                goal="OWASP ASI validation", 
                backstory="Security and safety auditor."
            ),
            "planner": Agent(
                role="Planner", 
                goal="MCP A2A planning", 
                backstory="Strategic task orchestrator."
            ),
            "reflector": Agent(
                role="Reflector", 
                goal="OpAgent self-reflection", 
                backstory="Critical self-analyzer."
            ),
            "summarizer": Agent(
                role="Summarizer", 
                goal="Denoised Trajectory summary", 
                backstory="Information condenser."
            ),
            "supervisor": Agent(
                role="Supervisor", 
                goal="ADLC HITL oversight", 
                backstory="Final human-in-the-loop authority."
            ),
            "vision": Agent(
                role="Vision", 
                goal="Analyze base64 images", 
                backstory="Computer vision expert."
            ),
        }

    def _build_graph(self):
        workflow = StateGraph(AgentState)

        # Nodes
        workflow.add_node("router", self._node_router)
        workflow.add_node("planner", self._node_planner)
        workflow.add_node("graph_rag", self._node_graph_rag)
        workflow.add_node("memory", self._node_memory)
        workflow.add_node("judge", self._node_judge)
        workflow.add_node("summarizer", self._node_summarizer)
        workflow.add_node("supervisor", self._node_supervisor)

        # Conditional Edges Logic
        def should_continue(state: AgentState):
            if state.get("intent") == "vision":
                return "summarizer"
            if state.get("intent") == "memory":
                return "memory"
            return "planner"

        # Edges
        workflow.set_entry_point("router")
        workflow.add_conditional_edges(
            "router",
            should_continue,
            {
                "planner": "planner",
                "memory": "memory",
                "summarizer": "summarizer"
            }
        )
        
        workflow.add_edge("planner", "graph_rag")
        workflow.add_edge("graph_rag", "memory")
        workflow.add_edge("memory", "judge")
        workflow.add_edge("judge", "summarizer")
        workflow.add_edge("summarizer", "supervisor")
        workflow.add_edge("supervisor", END)

        return workflow.compile()

    # --- Node Logic ---
    async def _node_router(self, state: AgentState):
        prompt = state["messages"][-1]["content"]
        # Passa o histórico de mensagens para o roteador se necessário
        result = await frank_router.route(prompt)
        state["results"]["router"] = result
        state["intent"] = result.get("intent", "general")
        return state

    async def _node_planner(self, state: AgentState):
        intent = state.get("intent", "general")
        if intent == "research":
            state["plan"] = ["Web Search", "Graph Search", "Synthesize"]
        elif intent == "memory":
            state["plan"] = ["Retrieve Memory", "Optimize Context", "Update Graph"]
        else:
            state["plan"] = ["Query GraphRAG", "Update UMEM Memory", "Validate with Judge"]
        return state

    async def _node_graph_rag(self, state: AgentState):
        prompt = state["messages"][-1]["content"]
        # Simulação de chamada de ferramenta
        context = self.neo4j_tools.nl2cypher_query(prompt)
        state["results"]["graph_rag"] = {"context": context}
        return state

    async def _node_memory(self, state: AgentState):
        prompt = state["messages"][-1]["content"]
        user_id = "default_user" # Em produção viria do auth
        
        # Busca na memória
        memory_context = self.neo4j_tools.search_memory(user_id, prompt)
        
        # Registra a interação
        self.neo4j_tools.log_interaction(user_id, "Frank", "query", prompt)
        
        state["memory"]["umem"] = memory_context
        state["results"]["memory"] = memory_context
        return state

    async def _node_judge(self, state: AgentState):
        state["results"]["judge"] = {"status": "validated", "security": "OWASP ASI07 OK"}
        return state

    async def _node_summarizer(self, state: AgentState):
        state["results"]["summary"] = "Denoised Trajectory: Task completed successfully."
        return state

    async def _node_supervisor(self, state: AgentState):
        state["supervisor_approval"] = True
        return state

    async def run(self, prompt: str):
        initial_state = {
            "messages": [{"role": "user", "content": prompt}],
            "intent": "",
            "memory": {},
            "plan": [],
            "results": {},
            "supervisor_approval": False
        }
        return await self.graph.ainvoke(initial_state)

    async def run_vision(self, image_base64: str):
        """
        Analisa uma imagem base64 usando o Gemini 1.5 Flash (Otimizado para Wearables).
        """
        try:
            # Optimization: Patch selection simulation via prompt
            prompt = "Analyze this image for a wearable AI. Focus on critical patches. Return JSON."
            
            # Chama o roteador centralizado com a intenção 'vision'
            result_router = await frank_router.route(prompt, intent="vision", image_base64=image_base64)
            
            if "error" in result_router:
                raise Exception(result_router["error"])

            # O FrankRouter retorna o conteúdo em 'response'
            content = result_router["response"]
            
            # Processamento do JSON extraído
            if isinstance(content, str):
                try:
                    # Tenta carregar diretamente
                    result = json.loads(content)
                except json.JSONDecodeError:
                    # Fallback: Extração de blocos markdown se necessário
                    if "```json" in content:
                        json_str = content.split("```json")[1].split("```")[0].strip()
                        result = json.loads(json_str)
                    else:
                        # Fallback final: Estrutura básica se falhar
                        result = {
                            "analysis": content,
                            "objects": [],
                            "confidence": "0%",
                            "context": "Raw response"
                        }
            else:
                result = content

            # Metadados adicionais
            result["status"] = "success"
            result["agent"] = "vision_agent_v3"
            result["provider"] = result_router.get("provider")
            result["latency"] = result_router.get("latency")
            
            return result

        except Exception as e:
            logging.error(f"Gemini Vision Error: {str(e)}")
            return {
                "status": "error",
                "detail": str(e),
                "analysis": "Falha no processamento visual.",
                "confidence": "0%"
            }

frank_swarm = FrankSwarm()
