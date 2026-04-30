# FRANK ZERO STACK

## V1.0 - Core Architecture

Este documento fixa a stack operacional do FRANK ZERO: um exocortex local-first, otimizado para Ryzen 5 4600G, GTX 1650 4GB, Xiaomi 12/Termux e ESP32-S3. A regra principal permanece: Function Over Form.

## 1. Infraestrutura e Rede - Sistema Nervoso

| Componente | Funcao | Regra de uso |
| --- | --- | --- |
| Tailscale | Rede mesh P2P entre PC, Xiaomi e nos futuros. | Usar para acesso remoto sem abrir portas no roteador. |
| Mosquitto | Broker MQTT com WebSockets. | Canal de baixa latencia para telemetria, comandos e eventos do ESP32/mobile. |
| Python + uv + Ninja | Ambiente local rapido. | Preferir `uv` para ambientes Python novos; usar Ninja em builds nativos quando disponivel. |

Portas sugeridas:
- `3000`: dashboard bunker estatico / Vite wrapper.
- `8001`: FastAPI local (`backend.frank_api`).
- `11434`: Ollama local.
- `1883`: MQTT TCP interno.
- `9001`: MQTT via WebSocket para browser/mobile.

## 2. Cerebro Local - PC como Fornalha

| Componente | Papel | Otimizacao para GTX 1650 4GB |
| --- | --- | --- |
| ExLlamaV2 / EXL2 | Motor local prioritario para modelos quantizados. | Usar modelos pequenos/quantizados; alvo: caber em 4GB VRAM. |
| LiteLLM | Failover e roteamento. | Tentar local primeiro; se VRAM < 500MB, desviar para OpenRouter/DeepSeek/Gemini. |
| LanceDB | Memoria longa vetorial. | Manter embeddings locais e busca hibrida leve. |
| FastAPI | API de borda local. | Endpoints async, telemetria em thread, WebSocket para status. |

Estado atual no repo:
- `backend/frank_api.py` ja implementa FastAPI async, Ollama, telemetria e WebSocket.
- O proximo passo natural e adicionar adaptador LiteLLM/ExLlamaV2 atras do mesmo contrato de `/chat`.

## 3. Sistema Vocal e Auditivo - Latencia Zero

| Componente | Papel | Diretriz |
| --- | --- | --- |
| Whisper.cpp | Ouvido local no Ryzen. | Rodar CPU-first, sem depender de GPU. |
| Kokoro-82M | Voz local leve. | Preferir ONNX/quantizacao para baixa latencia. |
| OpenWakeWord + Wyoming | Palavra de ativacao. | PC dorme ate ouvir "Frank". |

Fluxo-alvo:
1. Wake word detecta "Frank".
2. Whisper.cpp transcreve.
3. FastAPI envia para roteador local/cloud.
4. Kokoro responde em audio.
5. MQTT/WebSocket publica status para dashboard e Xiaomi.

## 4. Automacao e Desenvolvimento - Fabrica

| Componente | Papel |
| --- | --- |
| Cursor IDE | Ambiente principal de Vibe Coding. |
| Aider v0.42.0 | Par de programacao em terminal. |
| LangGraph | Orquestracao de decisoes e ferramentas. |

Regra operacional:
- Toda automacao deve gerar diffs auditaveis.
- Nada aplica patch destrutivo sem log e confirmacao humana.

## 5. No Mobile - Xiaomi 12 como Controle Remoto

| Componente | Papel | Restricao |
| --- | --- | --- |
| Termux | Terminal Android. | Sem root. |
| Proot-Distro | Debian isolado. | Sem tocar no sistema Android real. |
| htop | Monitoramento local. | Apenas leitura/observabilidade. |
| Dash/FastAPI HUD | Interface simples. | Acessar via Tailscale/browser. |

Regra critica:
- Nao usar ferramenta que exija root no Xiaomi.
- O mobile deve comandar e observar; a fornalha computacional fica no PC.

## 6. Hardware de Borda - ESP32-S3

| Componente | Papel |
| --- | --- |
| PlatformIO | Build/flash dentro do Cursor. |
| ESP-IDF v5.3 | Base C/C++ de baixo nivel. |
| AsyncMQTT_ESP32 | Conexao MQTT sem travar o loop principal. |

Topicos MQTT sugeridos:
- `frank/esp32/status`
- `frank/esp32/sensors`
- `frank/mobile/command`
- `frank/pc/telemetry`
- `frank/agents/events`

## Contrato de Fallback

O FRANK ZERO deve sempre escolher a rota mais barata e soberana:

1. Local EXL2/ExLlamaV2 se VRAM permitir.
2. Ollama local se modelo estiver disponivel.
3. OpenRouter/DeepSeek/Gemini via LiteLLM se a VRAM estiver abaixo do limite.
4. Resposta de erro clara quando nenhum cerebro estiver disponivel.

Mensagem padrao de falha local:

`[ERRO_DE_LINK_NEURAL]: Ollama nao detectado`

## Protecao Termica

Se CPU ou GPU passar de 80C:
- reduzir frequencia de telemetria;
- evitar cargas locais pesadas;
- preferir cloud fallback;
- registrar evento no log de erro/telemetria.

## Proximas Implementacoes

1. Adicionar `docker-compose.mqtt.yml` para Mosquitto + WebSockets.
2. Criar `core/litellm_router.py` com politica local-first/cloud-fallback.
3. Criar adaptador `core/lancedb_memory.py`.
4. Criar scripts Termux em `mobile/` para bootstrap sem root.
5. Criar firmware base PlatformIO em `wearable/` ou `esp32/` padronizado para MQTT.
