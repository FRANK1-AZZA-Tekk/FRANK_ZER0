# YBY AI CORTEX 2026 - V26

O YBY é um exocórtex cibernético, uma extensão do corpo, mente e alma do usuário. Ele opera de forma proativa, solucionando problemas antes que ocorram, com foco absoluto em "Function Over Form" (Funcionalidade acima da Forma).

## Arquitetura V26

A versão V26 introduz a arquitetura de **Agentes Híbridos (Swarm)** e **Zero UI**, otimizada para wearables (Lilygo T-Watch S3) e smartphones (Xiaomi 12).

### Componentes Principais

1. **Backend (FastAPI + LangGraph)**
   - **Roteamento Híbrido:** Utiliza `Gemini 2.5 Flash` para tarefas rápidas e `DeepSeek R1` (via Groq) para raciocínio complexo.
   - **UMEM (Unified Memory Extraction and Management):** Memória Bayesiana para atualização de crenças do sistema.
   - **Protocolo de Nutricao do Solo (5h00):** Job agendado (`node-cron`) que busca otimizações na internet e gera um "Pacote de Melhorias Diárias".
   - **Endpoints:** `/sensors` (telemetria), `/swarm/voice` (comandos), `/stream` (SSE).

2. **Frontend (React + Vite PWA)**
   - **Cyberpunk Glassmorphism:** Interface neon minimalista (#00ff88).
   - **Dashboard Analítico:** Monitoramento em tempo real de latência, bateria e nudges proativos.
   - **WebSocket:** Comunicação bidirecional para status dos agentes e notificações push.
   - **PWA Installable:** Suporte offline e instalação nativa no Xiaomi 12.

3. **Hardware (ESP32-S3 / T-Watch)**
   - **Sensores Reais:** Integração com Acelerômetro (BMA423) e PMU (AXP2101).
   - **Deep Sleep Optimization:** O dispositivo entra em Light/Deep Sleep e acorda via interrupção de movimento para economizar bateria.

4. **Android App (Kotlin + Compose)**
   - **Zero UI / Living Interfaces:** Interação baseada em gestos (Tap para comandos rápidos, Long Press para análises complexas).
   - **Integração Direta:** Comunicação direta com a API do YBY.

## Como Iniciar

### Backend (Node.js/Express Wrapper)
```bash
npm install
npm run dev
```

### Backend Python (Opcional, para desenvolvimento isolado)
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend (PWA)
O frontend é servido automaticamente pelo `server.ts` na porta 3000.

### ESP32
Compile e faça o upload do sketch `hardware/yby_esp32.ino` usando a IDE do Arduino ou PlatformIO.

### Android
Abra a pasta `android` no Android Studio e compile o APK.

## Princípios de Design

- **Function Over Form:** O código deve ser o mais limpo e eficiente possível.
- **Proatividade:** O sistema deve agir antes do usuário pedir.
- **Segurança:** Processamento offline sempre que possível (planejado para V27).
- **Sweet Spot:** Busca constante pelo equilíbrio perfeito entre performance e consumo de bateria.

## 🚀 YBY-SCAN: Auto-Evolução Cyberpunk

O YBY-SCAN é um sistema de auto-evolução integrado ao YBY. Ele permite que o assistente busque ativamente por otimizações (no GitHub, fóruns e documentações) e proponha melhorias no próprio código-fonte.

### Como Funciona (Workflow CrewAI / Gemini):
1. **ScannerAgent**: Busca por otimizações específicas (ex: "ESP32 battery opt").
2. **AnalyzerAgent**: Analisa o código atual (\`server.ts\`) e compara com as otimizações encontradas.
3. **DiffAgent**: Gera um relatório Markdown detalhado com os riscos, impacto e um *unified diff* das alterações propostas.
4. **MergerAgent**: Aguarda a aprovação humana. Se aprovado, aplica o patch com segurança e reinicia o sistema.

### Segurança (Safeguards):
- **Human-in-the-loop**: Nenhuma alteração é feita sem o clique no botão \`APROVAR MERGE\`.
- **Backup Automático**: Um arquivo \`.bak\` é criado antes de qualquer alteração.
- **Relatório Transparente**: O diff completo é exibido antes da aprovação.

### Como Usar:
1. Clique no botão **SCAN EVOLUA** no topo do Dashboard.
2. Aguarde a análise do código.
3. Leia o relatório gerado.
4. Clique em **APROVAR MERGE** para aplicar a evolução.
