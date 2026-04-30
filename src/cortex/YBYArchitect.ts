import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import crypto from "crypto";

// ==========================================
// CAMADA 1: RUNTIME (Segurança & Sandboxing)
// ==========================================
class RuntimeManager {
  private isKilled = false;
  private auditLog: any[] = [];

  public killSwitch() {
    this.isKilled = true;
    this.logAudit("KILL_SWITCH_ACTIVATED", { timestamp: Date.now() });
    console.error("[RUNTIME] KILL SWITCH ACTIVATED. All operations halted.");
  }

  public isAlive(): boolean {
    return !this.isKilled;
  }

  public logAudit(action: string, metadata: any) {
    this.auditLog.push({ action, metadata, time: new Date().toISOString() });
  }

  public privacyRouter(data: any): "LOCAL" | "CLOUD" {
    const hasPII = JSON.stringify(data).match(/(cpf|ssn|password|credit_card)/i);
    return hasPII ? "LOCAL" : "CLOUD";
  }
}

// ==========================================
// CAMADA 2: ORQUESTRAÇÃO DE MODELOS
// ==========================================
class ModelOrchestrator {
  private gemini: GoogleGenAI;
  private groq: Groq;

  constructor() {
    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
  }

  public async routeRequest(prompt: string, complexity: "HIGH" | "LOW", privacy: "LOCAL" | "CLOUD") {
    if (privacy === "LOCAL") {
      console.log("[ORCHESTRATOR] Routing to LOCAL Edge Model...");
      return "Local inference result (Simulated for PII protection)";
    }

    if (complexity === "HIGH") {
      console.log("[ORCHESTRATOR] Routing to FRONTIER API (Gemini 3.1 Pro)");
      const response = await this.gemini.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      return response.text;
    } else {
      console.log("[ORCHESTRATOR] Routing to OPEN MODEL via Groq (DeepSeek R1 / Llama 3)");
      const completion = await this.groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "deepseek-r1-distill-llama-70b",
      });
      return completion.choices[0]?.message?.content || "";
    }
  }
}

// ==========================================
// CAMADA 3: CREW AGENS E TAREFAS (Dynamic Assign)
// ==========================================

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'available' | 'busy' | 'offline';
  capabilities: string[];
  maxComplexitySupported: "HIGH" | "LOW";
  handleTask: (task: ArchitectTask, orchestrator: ModelOrchestrator, runtime: RuntimeManager) => Promise<any>;
}

export interface ArchitectTask {
  id: string;
  name: string;
  description: string;
  priority: 1 | 2 | 3; // 1 = Critical, 2 = Normal, 3 = Background
  complexity: "HIGH" | "LOW";
  condition?: () => boolean;
  requiredCapabilities: string[];
  payload: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
}

class AnalystAgent implements Agent {
  id = "agent_analyst";
  name = "Data Analyst Agent";
  role = "Analytics and Insights Mux";
  status: 'available' | 'busy' | 'offline' = "available";
  capabilities = ["DATA_ANALYSIS", "CHURN_PREDICTION", "REPORTING"];
  maxComplexitySupported: "HIGH" | "LOW" = "HIGH";

  async handleTask(task: ArchitectTask, orchestrator: ModelOrchestrator, runtime: RuntimeManager) {
    const prompt = `Analyze data payload for task ${task.name}. Payload: ${JSON.stringify(task.payload)}. Act as a Data Analyst.`;
    runtime.logAudit("AGENT_EXECUTION", { agent: this.id, task: task.id });
    return await orchestrator.routeRequest(prompt, task.complexity, runtime.privacyRouter(task.payload));
  }
}

class DevOpsAgent implements Agent {
  id = "agent_devops";
  name = "Cloud DevOps Agent";
  role = "Infrastructure and Billing Optimization";
  status: 'available' | 'busy' | 'offline' = "available";
  capabilities = ["INFRASTRUCTURE", "BILLING_OPTIMIZATION", "TERRAFORM"];
  maxComplexitySupported: "HIGH" | "LOW" = "LOW";

  async handleTask(task: ArchitectTask, orchestrator: ModelOrchestrator, runtime: RuntimeManager) {
    const prompt = `Act as DevOps. Evaluate infra for task ${task.name}. Payload: ${JSON.stringify(task.payload)}. Recommend actions.`;
    runtime.logAudit("AGENT_EXECUTION", { agent: this.id, task: task.id });
    // Cloud ops data is non PII.
    return await orchestrator.routeRequest(prompt, task.complexity, "CLOUD");
  }
}

// ==========================================
// CAMADA 4: PROATIVIDADE E FILA DE TAREFAS
// ==========================================
class ProactiveEngine {
  private runtime = new RuntimeManager();
  private orchestrator = new ModelOrchestrator();
  
  private agents: Agent[] = [new AnalystAgent(), new DevOpsAgent()];
  private taskQueue: ArchitectTask[] = [];
  private isProcessing = false;

  public submitTask(task: ArchitectTask) {
    this.taskQueue.push(task);
    console.log(`[PROACTIVE_ENGINE] Task Submetida: [${task.name}] (Priority: ${task.priority})`);
    this.processQueue();
  }

  // Task prioritization logic
  private sortQueue() {
    this.taskQueue.sort((a, b) => a.priority - b.priority);
  }

  // Dynamic agent assignment based on capability, complexity, and availability
  private assignAgent(task: ArchitectTask): Agent | null {
    const suitableAgents = this.agents.filter(agent => 
      agent.status === 'available' &&
      task.requiredCapabilities.every(req => agent.capabilities.includes(req)) &&
      (task.complexity === "LOW" || agent.maxComplexitySupported === "HIGH")
    );
    return suitableAgents.length > 0 ? suitableAgents[0] : null;
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.sortQueue(); // Priority Sorting Apply

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue[0];

      // Conditional task execution
      if (task.condition && !task.condition()) {
        console.log(`[PROACTIVE_ENGINE] Task Skipped (Condition not met): ${task.name}`);
        task.status = 'skipped';
        this.taskQueue.shift();
        continue;
      }

      // Dynamic Agent Assignment
      const assignedAgent = this.assignAgent(task);

      if (!assignedAgent) {
        console.log(`[PROACTIVE_ENGINE] Task Pending (No available agent): ${task.name}`);
        // Can't process right now, wait and retry later
        break; 
      }

      console.log(`[PROACTIVE_ENGINE] Executing Task: ${task.name} with Agent: ${assignedAgent.name}`);
      this.taskQueue.shift(); // Remove from pending
      task.status = 'running';
      assignedAgent.status = 'busy';

      try {
        const result = await assignedAgent.handleTask(task, this.orchestrator, this.runtime);
        console.log(`[PROACTIVE_ENGINE] Task Completed: ${task.name}. Result: ${result.substring(0, 100)}...`);
        task.status = 'completed';
      } catch (err) {
        console.error(`[PROACTIVE_ENGINE] Task Failed: ${task.name}`, err);
        task.status = 'failed';
      } finally {
        assignedAgent.status = 'available';
      }
    }

    this.isProcessing = false;
  }

  // Legacy event ingestion bridged to new Task Queue System
  public ingestEvent(source: string, payload: any) {
    if (source === "product_analytics") {
      this.submitTask({
        id: crypto.randomUUID(),
        name: `Churn Prediction ${payload.userId}`,
        description: "Analyze login drops to prevent churn.",
        priority: 1, // High priority
        complexity: "HIGH",
        // Conditional: Only run if login drop is significant
        condition: () => payload.loginDrop > 30,
        requiredCapabilities: ["DATA_ANALYSIS", "CHURN_PREDICTION"],
        payload,
        status: 'pending'
      });
    }

    if (source === "billing") {
      this.submitTask({
        id: crypto.randomUUID(),
        name: `Billing Op ${payload.clusterId}`,
        description: "Scale down underutilized resources.",
        priority: 2, // Medium priority
        complexity: "LOW",
        // Conditional: Only run if CPU is critically low
        condition: () => payload.cpu < 20,
        requiredCapabilities: ["INFRASTRUCTURE", "BILLING_OPTIMIZATION"],
        payload,
        status: 'pending'
      });
    }
  }
}

// ==========================================
// INICIALIZAÇÃO DO SISTEMA
// ==========================================
export const ybyCortex = new ProactiveEngine();
