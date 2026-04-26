import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AgentStatus {
  name: string;
  status: 'idle' | 'working' | 'error';
  iconName?: string;
  customIconUrl?: string;
  priority?: number; // 0-100 score
  urgency?: number; // 1-5
  complexity?: number; // 1-5
}

interface VisionResult {
  analysis: string;
  objects: string[];
  ocr?: string;
  ocr_language?: string;
  confidence: number;
}

interface LogEntry {
  id: string;
  message: string;
  timestamp: string;
  origin: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'command';
}

interface SwarmState {
  agents: Record<string, AgentStatus>;
  visionResults: VisionResult | null;
  memoryContext: string | null;
  isProcessingVision: boolean;
  lastError: string | null;
  logs: LogEntry[];
  pushNotification: string | null;
  dailyImprovements: { improvements: { id: string, title: string, description: string, impact: string, category: 'performance' | 'security' | 'feature' | 'optimization' }[] } | null;
  memory: {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
  };
  evolution: {
    lastSweep: string;
    nextSweep: string;
    autoCleaningActive: boolean;
    integrityScore: number;
    evolutionLevel: number;
  };
  wsStatus: 'connected' | 'disconnected' | 'connecting';
  hardware: {
    watch: {
      connected: boolean;
      battery: number;
      rssi: number;
      cpu: number;
      ram: number;
      temp: number;
    };
    atom: {
      connected: boolean;
      battery: number;
      rssi: number;
      cpu: number;
      ram: number;
      temp: number;
    };
  };
}

const initialState: SwarmState = {
  agents: {
    VOICE_AGENT: { name: 'VOICE_AGENT', status: 'idle', priority: 50 },
    RESEARCH_AGENT: { name: 'RESEARCH_AGENT', status: 'idle', priority: 30 },
    NOTIFY_AGENT: { name: 'NOTIFY_AGENT', status: 'idle', priority: 10 },
    VISION_AGENT: { name: 'VISION_AGENT', status: 'idle', priority: 20 },
    GESTURE_AGENT: { name: 'GESTURE_AGENT', status: 'idle', priority: 40 },
    CONTEXT_AGENT: { name: 'CONTEXT_AGENT', status: 'idle', priority: 60 },
  },
  visionResults: null,
  memoryContext: null,
  isProcessingVision: false,
  lastError: null,
  logs: [{ 
    id: 'init-0', 
    message: 'EXOCORTEX ONLINE. Host Xiaomi 12 Ativo.',
    timestamp: new Date().toISOString(),
    origin: 'SYSTEM',
    type: 'success'
  }],
  pushNotification: null,
  dailyImprovements: null,
  memory: {
    shortTerm: ["Sistema iniciado", "Calibragem neural concluída"],
    mediumTerm: ["Projeto FRANK v3.5 configurado"],
    longTerm: ["Objetivo: Interface homem-máquina perfeita"]
  },
  evolution: {
    lastSweep: new Date().toISOString(),
    nextSweep: new Date(Date.now() + 86400000).toISOString(),
    autoCleaningActive: true,
    integrityScore: 98,
    evolutionLevel: 12
  },
  wsStatus: 'disconnected',
  hardware: {
    watch: {
      connected: true,
      battery: 84,
      rssi: -64,
      cpu: 42,
      ram: 68,
      temp: 36.5
    },
    atom: {
      connected: true,
      battery: 92,
      rssi: -58,
      cpu: 25,
      ram: 45,
      temp: 34.2
    }
  }
};

export const swarmSlice = createSlice({
  name: 'swarm',
  initialState,
  reducers: {
    setAgentStatus: (state, action: PayloadAction<Record<string, string>>) => {
      const statuses = action.payload;
      Object.entries(statuses).forEach(([agent, status]) => {
        if (state.agents[agent]) {
          state.agents[agent].status = status as 'idle' | 'working' | 'error';
        }
      });
    },
    setVisionResult: (state, action: PayloadAction<VisionResult>) => {
      state.visionResults = action.payload;
      state.isProcessingVision = false;
    },
    setProcessingVision: (state, action: PayloadAction<boolean>) => {
      state.isProcessingVision = action.payload;
    },
    setLastError: (state, action: PayloadAction<string | null>) => {
      state.lastError = action.payload;
    },
    addLog: (state, action: PayloadAction<string | { message: string, origin?: string, type?: LogEntry['type'] }>) => {
      const payload = action.payload;
      const message = typeof payload === 'string' ? payload : payload.message;
      const origin = typeof payload === 'string' ? 'SYSTEM' : (payload.origin || 'SYSTEM');
      const type = typeof payload === 'string' ? 'info' : (payload.type || 'info');

      state.logs.push({ 
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36), 
        message,
        timestamp: new Date().toISOString(),
        origin,
        type
      });
      if (state.logs.length > 100) {
        state.logs.shift();
      }
    },
    setPushNotification: (state, action: PayloadAction<string | null>) => {
      state.pushNotification = action.payload;
    },
    setMemoryContext: (state, action: PayloadAction<string | null>) => {
      state.memoryContext = action.payload;
    },
    setDailyImprovements: (state, action: PayloadAction<any | null>) => {
      state.dailyImprovements = action.payload;
    },
    setAgentIcon: (state, action: PayloadAction<{ agentId: string, iconName?: string, customIconUrl?: string }>) => {
      const { agentId, iconName, customIconUrl } = action.payload;
      if (state.agents[agentId]) {
        state.agents[agentId].iconName = iconName;
        state.agents[agentId].customIconUrl = customIconUrl;
      }
    },
    updateAgentMetrics: (state, action: PayloadAction<{ agentId: string, urgency: number, complexity: number }>) => {
      const { agentId, urgency, complexity } = action.payload;
      const agent = state.agents[agentId];
      if (agent) {
        agent.urgency = urgency;
        agent.complexity = complexity;
        // Priority formula: (Urgency * 15) + (Complexity * 5)
        agent.priority = (urgency * 15) + (complexity * 5);
      }
    },
    runSystemSweep: (state) => {
      state.evolution.lastSweep = new Date().toISOString();
      state.evolution.nextSweep = new Date(Date.now() + 86400000).toISOString();
      state.evolution.integrityScore = Math.min(100, (state.evolution.integrityScore || 90) + 2);
      state.evolution.evolutionLevel = (state.evolution.evolutionLevel || 1.0) + 0.1;
      state.logs.push({ 
        id: `sweep-${Date.now()}`, 
        message: `> [EVOLUÇÃO] Varredura neural completa. Integridade: ${state.evolution.integrityScore}%`,
        timestamp: new Date().toISOString(),
        origin: 'EVOLUÇÃO',
        type: 'info'
      });
      if (state.logs.length > 100) state.logs.shift();
    },
    toggleAutoCleaning: (state) => {
      state.evolution.autoCleaningActive = !state.evolution.autoCleaningActive;
    },
    addMemory: (state, action: PayloadAction<{ content: string, layer: 'shortTerm' | 'mediumTerm' | 'longTerm' }>) => {
      const { content, layer } = action.payload;
      state.memory[layer].push(content);
      if (state.memory[layer].length > 20) state.memory[layer].shift();
    },
    updateHardwareTelemetry: (state, action: PayloadAction<{ device: 'watch' | 'atom', data: Partial<SwarmState['hardware']['watch']> }>) => {
      const { device, data } = action.payload;
      state.hardware[device] = { ...state.hardware[device], ...data };
    },
    setWsStatus: (state, action: PayloadAction<SwarmState['wsStatus']>) => {
      state.wsStatus = action.payload;
    },
  },
});

export const { 
  setAgentStatus, 
  setVisionResult, 
  setProcessingVision, 
  setLastError, 
  addLog, 
  setPushNotification,
  setMemoryContext,
  setDailyImprovements,
  setAgentIcon,
  updateAgentMetrics,
  runSystemSweep,
  toggleAutoCleaning,
  addMemory,
  updateHardwareTelemetry,
  setWsStatus
} = swarmSlice.actions;

export default swarmSlice.reducer;
