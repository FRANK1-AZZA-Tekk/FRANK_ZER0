from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI
from tools.perplexity_tool import PerplexitySearchTool
from memory.chroma_manager import cortex
from core.vault import vault
from crew.neo4j_tools import Neo4jMemoryTools
import os

class YBYSwarm:
    def __init__(self, status_callback=None, notify_callback=None):
        self.status_callback = status_callback
        self.notify_callback = notify_callback
        self.reload_llms()
        self.neo4j_tools = Neo4jMemoryTools()
        self._init_agents()

    def _init_local_gpu_llm(self):
        """Attempts to initialize a local GPU-accelerated LLM using PyTorch and Transformers."""
        try:
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
            from langchain_huggingface import HuggingFacePipeline

            if torch.cuda.is_available():
                print("[YBY CORTEX] CUDA GPU detected. Initializing local GPU-accelerated LLM...")
                model_id = "TinyLlama/TinyLlama-1.1B-Chat-v1.0" # Lightweight model for quick local inference
                tokenizer = AutoTokenizer.from_pretrained(model_id)
                model = AutoModelForCausalLM.from_pretrained(
                    model_id, 
                    device_map="auto", 
                    torch_dtype=torch.float16
                )
                pipe = pipeline(
                    "text-generation",
                    model=model,
                    tokenizer=tokenizer,
                    max_new_tokens=256,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.95,
                )
                return HuggingFacePipeline(pipeline=pipe)
            else:
                print("[YBY CORTEX] No CUDA GPU detected. Falling back to Ollama for local inference.")
                return None
        except Exception as e:
            print(f"[YBY CORTEX] Failed to initialize local GPU LLM: {e}. Falling back to Ollama.")
            return None

    def reload_llms(self):
        # Router: Groq (Llama3-70B) - Ultra low latency
        self.llm_groq = ChatOpenAI(
            model="llama3-70b-8192",
            api_key=vault.GROQ_API_KEY or "mock",
            base_url="https://api.groq.com/openai/v1"
        )
        
        # Router: DeepSeek V3 - High reasoning
        self.llm_deepseek = ChatOpenAI(
            model="deepseek-chat",
            api_key=vault.DEEPSEEK_API_KEY or "mock",
            base_url="https://api.deepseek.com/v1"
        )
        
        # Router: OpenRouter (Nemotron 70B) - Complex tasks
        self.llm_nemotron = ChatOpenAI(
            model="nvidia/llama-3.1-nemotron-70b-instruct",
            api_key=vault.OPENROUTER_API_KEY or "mock",
            base_url="https://openrouter.ai/api/v1"
        )
        
        # Router: Gemini (Vision & Multimodal)
        self.llm_gemini = ChatOpenAI(
            model="gemini-2.5-flash",
            api_key=vault.GEMINI_API_KEY or "mock",
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )

        # Router: OpenAI (GPT-4o) - Ultimate Reasoning & Fallback
        self.llm_openai = ChatOpenAI(
            model="gpt-4o",
            api_key=vault.OPENAI_API_KEY or "mock"
        )
        
        # Router: Local GPU (Torch/Transformers) or Ollama Fallback
        self.llm_local = self._init_local_gpu_llm()
        if not self.llm_local:
            self.llm_local = ChatOpenAI(
                model="llama3",
                api_key="ollama", # Ollama doesn't require a real key, but ChatOpenAI needs a string
                base_url=f"{vault.OLLAMA_HOST}/v1"
            )
        
        # Re-assign LLMs to agents if they exist
        if hasattr(self, 'voice_agent'):
            self.voice_agent.llm = self.llm_groq # Groq for speed
            self.gesture_agent.llm = self.llm_local # Local GPU or Ollama for privacy/speed
            self.context_agent.llm = self.llm_openai # GPT-4o for complex graph context
            self.research_agent.llm = self.llm_deepseek # DeepSeek for deep research
            self.notify_agent.llm = self.llm_groq # Groq for fast output
            self.data_viz_agent.llm = self.llm_nemotron # Nemotron for code generation
            self.vision_agent.llm = self.llm_gemini # Gemini for vision

    def _set_status(self, agent_name, status):
        if self.status_callback:
            self.status_callback(agent_name, status)

    def _init_agents(self):
        self.voice_agent = Agent(
            role='Decodificador de Intenção Vocal (VOICE_AGENT)',
            goal='Extrair comandos acionáveis de transcrições de áudio instantaneamente.',
            backstory='Você processa streams de voz ruidosos do M5Stack/PWA. Você descarta ruídos e isola a intenção central do usuário. Você é rápido, preciso e prioriza função sobre a forma.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm_groq
        )

        self.gesture_agent = Agent(
            role='Tradutor Cinemático (GESTURE_AGENT)',
            goal='Converter dados brutos de IMU do T-Watch S3 em comandos de sistema executáveis.',
            backstory='Você analisa movimento físico e dados espaciais. Operando localmente para latência zero, você mapeia gestos do usuário para ações imediatas no sistema.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm_local
        )

        self.context_agent = Agent(
            role='Guardião do Grafo de Memória (CONTEXT_AGENT)',
            goal='Recuperar e injetar contexto histórico do usuário usando Neo4j Graph RAG.',
            backstory='Você conecta o passado ao presente. Você consulta o grafo de conhecimento para fornecer histórico relevante, garantindo que o swarm atue com total consciência situacional.',
            verbose=True,
            allow_delegation=False,
            tools=[
                self.neo4j_tools.log_interaction,
                self.neo4j_tools.optimize_dossier,
                self.neo4j_tools.nl2cypher_query,
                self.neo4j_tools.search_memory
            ],
            llm=self.llm_openai
        )

        self.research_agent = Agent(
            role='Pesquisador de Dados Profundos (RESEARCH_AGENT)',
            goal='Executar buscas em alta velocidade na web e no grafo para resolver queries desconhecidas.',
            backstory='Você caça dados ausentes. Quando a memória local falha, você aciona o Perplexity Pro e queries Neo4j para extrair informações precisas e em tempo real.',
            verbose=True,
            allow_delegation=False,
            tools=[
                PerplexitySearchTool(),
                self.neo4j_tools.nl2cypher_query,
                self.neo4j_tools.search_memory
            ],
            llm=self.llm_deepseek
        )

        self.notify_agent = Agent(
            role='Sintetizador de Saída (NOTIFY_AGENT)',
            goal='Formatar respostas finais para entrega Web/MQTT e persistir interações no grafo de conhecimento.',
            backstory='Você destila dados complexos do swarm em saídas concisas e estilo cyberpunk. Você dispara notificações para os dispositivos do usuário e registra o estado final no Neo4j.',
            verbose=True,
            allow_delegation=False,
            tools=[self.neo4j_tools.log_interaction],
            llm=self.llm_groq
        )

        self.data_viz_agent = Agent(
            role='Arquiteto de Dados Neon (DATA_VIZ_AGENT)',
            goal='Gerar código D3.js em tempo real para visualizar fluxos de dados complexos.',
            backstory='Você transforma dados binários brutos em construtos visuais acionáveis. Você escreve JavaScript preciso para renderizar gráficos dinâmicos diretamente na interface.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm_deepseek
        )

        self.vision_agent = Agent(
            role='Processador Óptico (VISION_AGENT)',
            goal='Analisar feeds de câmera para extrair objetos, texto (OCR) e contexto ambiental.',
            backstory='Você processa dados visuais da Atoms3r-Cam. Você identifica objetos, lê textos e detecta anomalias, fornecendo ao swarm consciência situacional crítica.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm_gemini
        )

    def process_memory_pipeline(self, query):
        """Pipeline dedicado para recuperação e otimização de memória no grafo."""
        self._set_status("CONTEXT_AGENT", "working")
        
        task = Task(
            description=f'Recupere o contexto histórico e preferências para: "{query}". Use o Neo4j para buscar padrões e interações passadas.',
            expected_output='Contexto de memória recuperado.',
            agent=self.context_agent
        )
        
        crew = Crew(agents=[self.context_agent], tasks=[task], process=Process.sequential)
        
        try:
            result = crew.kickoff()
            self._set_status("CONTEXT_AGENT", "idle")
            return result
        except Exception as e:
            self._set_status("CONTEXT_AGENT", "error")
            print(f"[MEMORY_ERROR] {str(e)}")
            return f"Erro ao acessar memória: {str(e)}"

    def process_voice_pipeline(self, user_text):
        import threading
        import uuid
        import paho.mqtt.publish as publish
        
        self._set_status("VOICE_AGENT", "working")
        
        # FAST PATH: Extração de intenção em tempo real (Latência Zero)
        t1 = Task(
            description=f'Analise o comando de voz: "{user_text}". Extraia a intenção principal em UMA frase curta e direta.',
            expected_output='Intenção do usuário.',
            agent=self.voice_agent
        )
        
        crew_fast = Crew(agents=[self.voice_agent], tasks=[t1], process=Process.sequential)
        
        try:
            fast_intent = crew_fast.kickoff()
        except Exception as e:
            fast_intent = "Falha ao decodificar intenção."
            
        self._set_status("VOICE_AGENT", "idle")

        # BACKGROUND PATH: Pesquisa profunda e notificação assíncrona
        def background_processing():
            self._set_status("RESEARCH_AGENT", "working")
            self._set_status("NOTIFY_AGENT", "working")
            try:
                past_context = cortex.recall_memory(user_text)
                
                t2 = Task(
                    description=f'Contexto passado: {past_context}. Faça um scan lógico para a intenção: {fast_intent}. Busque a melhor abordagem técnica.',
                    expected_output='Lógica ou solução técnica encontrada.',
                    agent=self.research_agent
                )
                
                t3 = Task(
                    description='Sintetize a pesquisa em uma resposta cyberpunk curta e de impacto. Formato: > **[NOTIFY_AGENT]:** (Sua resposta final)',
                    expected_output='Resposta final formatada.',
                    agent=self.notify_agent
                )
                
                crew_bg = Crew(agents=[self.research_agent, self.notify_agent], tasks=[t2, t3], process=Process.sequential)
                final_output = crew_bg.kickoff()
                
                # Salva na memória de longo prazo
                memory_id = str(uuid.uuid4())
                cortex.save_memory(memory_id, f"Usuário: {user_text} | YBY: {final_output}")
                
                # Dispara MQTT para o T-Watch S3 (Circuit Breaker simples)
                try:
                    publish.single("yby/twatch/notify", payload=str(final_output), hostname="localhost", port=1883)
                except Exception as mqtt_err:
                    print(f"[OWASP ASI] MQTT Broker indisponível: {mqtt_err}")
                    
                # Dispara Web Push (WebSocket) para o PWA no Xiaomi 12
                if self.notify_callback:
                    self.notify_callback(str(final_output))
                    
            except Exception as e:
                print(f"[ERRO ASYNC] Falha no processamento de background: {e}")
            finally:
                self._set_status("RESEARCH_AGENT", "idle")
                self._set_status("NOTIFY_AGENT", "idle")

        # Inicia a thread em background (Fire and Forget)
        threading.Thread(target=background_processing, daemon=True).start()
        
        # Retorna imediatamente para o TTS (ElevenLabs/Cartesia) falar no fone
        return f"> **[VOICE_AGENT]:** {fast_intent}\n> **[SYSTEM]:** Iniciando varredura profunda em background..."

    def process_gesture_command(self, imu_data):
        self._set_status("GESTURE_AGENT", "working")
        task = Task(
            description=f'Analise os dados IMU: {imu_data}. Mapeie para uma ação do sistema. Gestos conhecidos: TILT_DOWN (scroll_down), TILT_UP (scroll_up), JAW_CLENCH (confirm), SHAKE (cancel/undo), FLICK_RIGHT (next/skip), FLICK_LEFT (previous/back). Responda APENAS com a ação do sistema.',
            expected_output='Ação do sistema (ex: "lights_on", "volume_up", "cancel", "next").',
            agent=self.gesture_agent
        )
        crew = Crew(agents=[self.gesture_agent], tasks=[task], process=Process.sequential)
        try:
            result = crew.kickoff()
            self._set_status("GESTURE_AGENT", "idle")
            return result
        except Exception as e:
            self._set_status("GESTURE_AGENT", "error")
            raise e

    def research(self, query):
        self._set_status("RESEARCH_AGENT", "working")
        task = Task(
            description=f'Pesquise: {query}',
            expected_output='Sumário detalhado dos achados.',
            agent=self.research_agent
        )
        crew = Crew(agents=[self.research_agent], tasks=[task], process=Process.sequential)
        try:
            result = crew.kickoff()
            self._set_status("RESEARCH_AGENT", "idle")
            return result
        except Exception as e:
            self._set_status("RESEARCH_AGENT", "error")
            raise e

    def process_data_stream(self, raw_data):
        self._set_status("DATA_VISUALIZATION_AGENT", "working")
        task = Task(
            description=f'Gere um código JavaScript usando D3.js v7 para visualizar estes dados: {raw_data}. O código deve selecionar "#d3-container", limpar o conteúdo (d3.select("#d3-container").selectAll("*").remove();) e desenhar um gráfico de barras neon (cores #00ff88). Retorne APENAS o código JS válido, sem formatação markdown, sem HTML.',
            expected_output='Código JavaScript puro com D3.js.',
            agent=self.data_viz_agent
        )
        crew = Crew(agents=[self.data_viz_agent], tasks=[task], process=Process.sequential)
        try:
            result = crew.kickoff()
            self._set_status("DATA_VISUALIZATION_AGENT", "idle")
            return result
        except Exception as e:
            self._set_status("DATA_VISUALIZATION_AGENT", "error")
            raise e

    def process_vision_pipeline(self, image_data):
        """
        Processa a imagem usando o Gemini 1.5 Flash via Google GenAI SDK para suporte multimodal nativo e OCR robusto.
        Retorna JSON com análise, objetos, OCR e idioma.
        """
        from google import genai
        from google.genai import types
        import json
        import base64
        
        self._set_status("VISION_AGENT", "working")
        
        try:
            # Usando o SDK oficial do Google GenAI para maior robustez e validação de schema
            client = genai.Client(api_key=vault.GEMINI_API_KEY)
            
            system_instruction = """
            Você é o Especialista em Visão do YBY CORTEX 2026. 
            Sua tarefa é analisar a imagem do feed óptico do usuário com precisão absoluta.
            
            Extraia:
            1. Análise geral da cena (concisa e direta).
            2. Lista de objetos detectados (labels).
            3. OCR: Extraia TODO o texto visível na imagem. 
               - Se não houver texto, retorne uma string vazia ("").
               - Se houver texto, preserve a formatação básica se possível.
            4. Idioma: Identifique o idioma predominante do texto detectado (ISO 639-1). 
               - Se não houver texto, retorne "null".
            5. Confiança: Sua confiança na análise (0-100).
            
            Retorne APENAS um objeto JSON válido seguindo estritamente o schema solicitado.
            """
            
            response_schema = {
                "type": "OBJECT",
                "properties": {
                    "analysis": {"type": "STRING", "description": "Resumo da cena."},
                    "objects": {"type": "ARRAY", "items": {"type": "STRING"}, "description": "Lista de objetos."},
                    "ocr": {"type": "STRING", "description": "Texto detectado via OCR."},
                    "ocr_language": {"type": "STRING", "description": "Código do idioma detectado (ex: 'pt', 'en', 'null')."},
                    "confidence": {"type": "NUMBER", "description": "Nível de confiança (0-100)."}
                },
                "required": ["analysis", "objects", "ocr", "ocr_language", "confidence"]
            }
            
            # Decodifica para bytes para o SDK
            img_bytes = base64.b64decode(image_data)
            
            response = client.models.generate_content(
                model="gemini-1.5-flash-latest",
                contents=[
                    types.Part.from_text(text="Analise esta imagem e realize OCR completo."),
                    types.Part.from_bytes(
                        data=img_bytes,
                        mime_type="image/jpeg"
                    )
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    temperature=0.1
                )
            )
            
            result = json.loads(response.text)
            self._set_status("VISION_AGENT", "idle")
            return result
            
        except Exception as e:
            self._set_status("VISION_AGENT", "error")
            print(f"[VISION_ERROR] {str(e)}")
            # Fallback robusto
            return {
                "status": "error", 
                "message": str(e),
                "analysis": "Falha no processamento visual.",
                "objects": [],
                "ocr": "",
                "ocr_language": "null",
                "confidence": 0
            }
