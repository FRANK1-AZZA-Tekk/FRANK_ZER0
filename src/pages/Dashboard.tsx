import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Mic, 
  Radio, 
  Activity, 
  Database, 
  Search, 
  Terminal as TerminalIcon, 
  Bell, 
  Camera, 
  Loader2,
  Cpu,
  Zap,
  Shield,
  Maximize2,
  Minimize2,
  Download,
  Trash2,
  Send,
  Globe,
  Lock,
  ChevronRight,
  Monitor,
  Smartphone,
  Watch,
  Layers,
  Sparkles,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RootState } from '../store/store';
import { setAgentStatus, addLog, setPushNotification, setVisionResult, setProcessingVision, setLastError, setMemoryContext, setDailyImprovements, setAgentIcon, updateAgentMetrics } from '../store/slices/swarmSlice';
import { getApiUrl, getWsUrl } from '../utils/api';
import { processGeneralCommand, processVision } from '../utils/gemini';

import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { lazy, Suspense } from 'react';

const NeuralNetwork3D = lazy(() => import('../components/3D/NeuralNetwork3D').then(module => ({ default: module.NeuralNetwork3D })));

import { StatusCard } from '../components/Dashboard/StatusCard';
import { ActionButton } from '../components/Dashboard/ActionButton';
import { TelemetryDashboard } from '../components/Dashboard/TelemetryDashboard';
import { Terminal } from '../components/Dashboard/Terminal';
import { VisionAnalysis } from '../components/Dashboard/VisionAnalysis';
import { MemoryCortex } from '../components/Dashboard/MemoryCortex';
import { AnalyticsDashboard } from '../components/Dashboard/AnalyticsDashboard';
import { DailyImprovementsModal } from '../components/Dashboard/DailyImprovementsModal';
import { FRANKScanModal } from '../components/Dashboard/FRANKScanModal';
import { AgentIconSettingsModal } from '../components/Dashboard/AgentIconSettingsModal';
import { CommandHub } from '../components/CommandHub';
import { WebGLCanvasBoundary } from '../components/WebGLCanvasBoundary';
import { getIconComponent } from '../utils/icons';

import { useDashboardCommands } from '../hooks/useDashboardCommands';
import { useDashboardEvolution } from '../hooks/useDashboardEvolution';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { agents, logs, pushNotification, visionResults, isProcessingVision, lastError, memoryContext, evolution } = useSelector((state: RootState) => state.swarm);
  
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [activeDevice, setActiveDevice] = useState<'watch' | 'atom'>('watch');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const [isScanningEvolve, setIsScanningEvolve] = useState(false);
  const [frankScanResult, setFrankScanResult] = useState<{ id: string, report: string, diff: string } | null>(null);

  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [isCommandHubOpen, setIsCommandHubOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const terminalRef = useRef<HTMLDivElement>(null);
  const visionInputRef = useRef<HTMLInputElement>(null);

  const { isListening, handleMicClick, handleVisionChange, handleTerminalSubmit, handleBleClick, log } = useDashboardCommands(activeDevice);
  const { dailyImprovements } = useDashboardEvolution();

  // Micro-movement tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleMemorySearch = async (queryOverride?: string) => {
    const query = queryOverride || memorySearchQuery;
    if (!query.trim()) return;
    
    log(`Searching Memory: "${query}"`);
    dispatch(setAgentStatus({ CONTEXT_AGENT: 'working' }));
    
    if (!recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev].slice(0, 5));
    }

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/swarm/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      dispatch(setMemoryContext(data.context));
      log(`Memory Context: ${data.context.substring(0, 50)}...`);
    } catch (e) {
      log('Error: Memory API unreachable.');
    } finally {
      dispatch(setAgentStatus({ CONTEXT_AGENT: 'idle' }));
    }
  };

  const onTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    await handleTerminalSubmit(terminalInput);
    setTerminalInput('');
  };

  const onVisionChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleVisionChange(file);
  };

  const handleEvolveClick = async () => {
    setIsScanningEvolve(true);
    log('[FRANK-SCAN] Ativando ScannerAgent para busca de otimizações...');
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: "Otimizar uso de memória e latência do frontend/backend" })
      });
      
      const data = await res.json();
      if (res.ok && data.id) {
        log(`[FRANK-SCAN] Análise concluída. ID: ${data.id}`);
        const reportRes = await fetch(`${getApiUrl()}/api/v1/report/${data.id}`);
        const reportData = await reportRes.json();
        
        if (reportRes.ok) {
           setFrankScanResult({
             id: data.id,
             report: reportData.report,
             diff: reportData.diff
           });
        }
      } else {
        log('[FRANK-SCAN] Erro na varredura.');
      }
    } catch (e) {
      log('[FRANK-SCAN] Erro de rede na varredura.');
    } finally {
      setIsScanningEvolve(false);
    }
  };

  const handleApproveMerge = async (scanId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/approve/${scanId}`, {
        method: 'POST'
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  };

  const handleSaveIcon = (iconName?: string, customUrl?: string) => {
    if (editingAgent) {
      dispatch(setAgentIcon({ agentId: editingAgent, iconName, customIconUrl: customUrl }));
      setEditingAgent(null);
      log(`[SYSTEM] Ícone do agente ${editingAgent} atualizado.`);
    }
  };

  // Dynamic Prioritization Simulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandHubOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const agentIds = Object.keys(agents);
      const randomAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
      
      // Random urgency (1-5) and complexity (1-5)
      const urgency = Math.floor(Math.random() * 5) + 1;
      const complexity = Math.floor(Math.random() * 5) + 1;
      
      dispatch(updateAgentMetrics({ agentId: randomAgent, urgency, complexity }));
      
      // Occasionally log priority shift
      if (Math.random() > 0.7) {
        log(`[SYSTEM] Agente ${randomAgent.replace('_AGENT', '')} repriorizado: Score ${((urgency * 15) + (complexity * 5))}/100`);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch, agents, log]);

  useEffect(() => {
    if (pushNotification) {
      const timer = setTimeout(() => {
        dispatch(setPushNotification(null));
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [pushNotification, dispatch]);

  return (
    <div className="flex flex-col items-center p-4 lg:p-8 w-full relative min-h-screen overflow-x-hidden selection:bg-[#00ff88] selection:text-black">
      
      <main className="flex-1 flex flex-col items-center w-full transition-all duration-500">
        <div className="w-full max-w-[1600px] flex flex-col items-center">
          
          {/* Neural Background FX */}
          <div className="fixed inset-0 bg-[#050505] -z-20"></div>
          <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none -z-10"></div>
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.08)_0%,transparent_50%)] pointer-events-none -z-10"></div>
      
      {/* Animated Neural Lines (CSS Simulation) */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-[#00ff88] to-transparent animate-[shimmer_8s_infinite]"></div>
        <div className="absolute top-0 left-2/4 w-[1px] h-full bg-gradient-to-b from-transparent via-[#00ff88] to-transparent animate-[shimmer_12s_infinite_reverse]"></div>
        <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-transparent via-[#00ff88] to-transparent animate-[shimmer_10s_infinite]"></div>
      </div>

      <AnimatePresence>
        {/* 3D Visualization Background */}
        <div key="bg-3d" className="fixed inset-0 z-0 opacity-40 pointer-events-none">
          <WebGLCanvasBoundary>
            <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
              <PerspectiveCamera makeDefault position={[0, 0, 15]} />
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <Suspense fallback={null}>
                <NeuralNetwork3D />
              </Suspense>
            </Canvas>
          </WebGLCanvasBoundary>
        </div>

        {/* Main Glassmorphism Container */}
        <motion.div 
          key="main-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full p-4 sm:p-10 rounded-2xl sm:rounded-[3rem] bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.6)] flex flex-col items-center relative overflow-hidden"
        >
          <div className="absolute inset-0 scanline-overlay opacity-[0.03] pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff88]/30 to-transparent"></div>
          
          {/* Neural Evolution Progress Bar */}
          <div className="w-full mb-12 relative px-2 hardware-dashed pt-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_8px_#00ff88]"></div>
                <span className="text-[11px] font-mono font-black text-[#00ff88] tracking-[0.4em] uppercase">Neural_Evolution_Integrity</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-400 font-mono italic">SYSTEM_STATUS</span>
                <span className="text-[10px] font-black text-white font-mono bg-white/10 px-2 py-0.5 rounded">STABLE // 94.2%</span>
              </div>
            </div>
            <div className="h-3 w-full bg-black/60 rounded-sm overflow-hidden border border-white/10 p-[2px] relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '94.2%' }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#00ff88]/40 via-[#00ff88] to-[#00ff88]/60 rounded-sm relative"
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-[shimmer_2s_infinite] w-20"></div>
              </motion.div>
              {/* Scale Markers */}
              <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-full w-[1px] bg-white/10"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Header Section */}
          <div className="w-full flex flex-col xl:flex-row items-center justify-between mb-16 gap-10 z-10">
            <div className="flex flex-col items-center xl:items-start">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 mb-4"
              >
                <div className="p-3 bg-[#00ff88]/10 rounded-2xl border border-[#00ff88]/30">
                  <Cpu size={32} className="text-[#00ff88] animate-pulse" />
                </div>
                <div className="h-10 w-[2px] bg-gradient-to-b from-[#00ff88]/40 to-transparent"></div>
                <div>
                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter italic font-serif">FRANK<span className="text-[#00ff88]">_</span>CORTEX</h1>
                    <p className="text-[8px] md:text-[10px] font-mono font-bold text-gray-500 tracking-[0.4em] md:tracking-[0.6em] uppercase mt-1">Experimental_Neural_Mesh_v3.5</p>
                </div>
              </motion.div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 bg-black/60 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex flex-col items-center px-4 sm:px-8 border-r border-white/10">
                <span className="text-[8px] text-gray-500 font-black tracking-[0.3em] uppercase mb-3">Neural_Sincro</span>
                <div className="flex gap-2 h-6 items-center">
                  {[1,2,3,4,5,6].map(i => (
                    <motion.div 
                      key={`neural-sync-${i}`} 
                      animate={{ 
                        height: [8, 24, 8],
                        backgroundColor: i < 5 ? '#00ff88' : '#333'
                      }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1.5 rounded-full"
                    ></motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center px-8">
                <span className="text-[8px] text-gray-500 font-black tracking-[0.3em] uppercase mb-3">System_Heat</span>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#00ff88] shadow-[0_0_15px_#00ff88] animate-pulse"></div>
                  <span className="text-xl font-black text-white tracking-tighter">NODE_COLD</span>
                </div>
              </div>
            </div>
          </div>

        {/* Orb & Interaction Area */}
        <div className="relative flex flex-col items-center mb-16 z-10 w-full group/orb">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00ff88]/3 rounded-full blur-[140px] pointer-events-none group-hover/orb:bg-[#00ff88]/6 transition-all duration-1000"></div>
          
          <div className="relative flex justify-center items-center mb-12">
            <motion.div 
              animate={{ 
                scale: isListening ? 1.15 : 1,
                rotate: isListening ? 360 : 0,
                y: [0, -10, 0]
              }}
              transition={{ 
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 2, repeat: isListening ? Infinity : 0, ease: "linear" },
                scale: { duration: 0.5 }
              }}
              className={`w-64 h-64 rounded-full transition-all duration-1000 relative flex items-center justify-center ${
                isListening 
                  ? 'bg-[#ff00ff]/10 shadow-[0_0_200px_rgba(255,0,255,0.3),inset_0_0_120px_rgba(255,0,255,0.2)] border-2 border-[#ff00ff]/50' 
                  : 'bg-[#00ff88]/5 shadow-[0_0_180px_rgba(0,255,136,0.25),inset_0_0_100px_rgba(0,255,136,0.15)] border-2 border-[#00ff88]/30'
              }`}
            >
              {/* Complex Rotating Rings */}
              <div className="absolute inset-0 rounded-full border border-white/10 animate-[spin_20s_linear_infinite]"></div>
              <div className="absolute inset-4 rounded-full border-2 border-t-[#00ff88]/40 border-r-transparent border-b-transparent border-l-transparent animate-[spin_12s_linear_infinite]"></div>
              <div className="absolute inset-8 rounded-full border border-[#00ff88]/20 animate-[spin_25s_linear_infinite_reverse] border-dashed"></div>
              <div className="absolute inset-16 rounded-full border-t-2 border-r-0 border-b-0 border-l-0 border-[#00ff88]/40 animate-[spin_8s_linear_infinite]"></div>
              
              {/* Core Orb with Visualizer Integration */}
              <motion.div 
                animate={{ 
                  scale: isListening ? [1, 1.3, 1] : 1,
                  boxShadow: isListening ? "0 0 80px rgba(255,0,255,0.6)" : "0 0 50px rgba(0,255,136,0.4)"
                }}
                transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
                className={`w-32 h-32 rounded-full transition-all duration-700 relative overflow-hidden flex items-center justify-center z-20 ${
                  isListening ? 'bg-[#ff00ff]/30' : 'bg-black/80'
                } border-2 border-white/10`}
              >
                <div className={`absolute inset-0 blur-3xl animate-pulse ${isListening ? 'bg-[#ff00ff]' : 'bg-[#00ff88]/20'}`}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_100%)]"></div>
                <Cpu size={48} className={`relative z-10 ${isListening ? 'text-[#ff00ff]' : 'text-[#00ff88]'} drop-shadow-[0_0_10px_currentColor]`} />
              </motion.div>

              {/* Orbital Diagnostics */}
              <div className="absolute -top-12 -right-12 bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl hidden lg:block animate-float hardware-dashed">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-mono font-black text-gray-500 uppercase tracking-widest opacity-60">NEURAL_SYNC</span>
                  <span className="text-[12px] font-mono font-black text-[#00ff88] tracking-widest drop-shadow-[0_0_5px_#00ff88]">98.2 MHz</span>
                </div>
              </div>
              
              <div className="absolute top-1/2 -left-20 bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl hidden lg:block animate-float hardware-dashed" style={{ animationDelay: '1s' }}>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-mono font-black text-gray-500 uppercase tracking-widest opacity-60">LATENCY_CORE</span>
                  <span className="text-[12px] font-mono font-black text-blue-400 tracking-widest drop-shadow-[0_0_5px_#60a5fa]">0.42 ms</span>
                </div>
              </div>
            </motion.div>
            
            {/* Visualizer bars */}
            <AnimatePresence>
              {isListening && (
                <motion.div 
                  key="listening-visualizer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute -bottom-10 flex items-end gap-2 h-16"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                    <motion.div 
                      key={`visualizer-dash-${i}`} 
                      animate={{ height: [`${20 + Math.random() * 80}%`, `${20 + Math.random() * 80}%`] }}
                      transition={{ duration: 0.2, repeat: Infinity }}
                      className="w-2 bg-[#ff00ff] rounded-full shadow-[0_0_15px_#ff00ff]"
                    ></motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <ActionButton 
              onClick={handleMicClick}
              active={isListening}
              icon={<Mic size={20} />}
              label={isListening ? "LISTENING..." : "VOICE_COMMAND"}
              color={isListening ? "bg-[#ff00ff]" : "text-[#00ff88]"}
            />

            <ActionButton 
              onClick={() => visionInputRef.current?.click()}
              active={isProcessingVision}
              icon={isProcessingVision ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
              label="VISION_SCAN"
              color="text-[#00ff88]"
              disabled={isProcessingVision}
            />
            <input type="file" ref={visionInputRef} onChange={onVisionChange} accept="image/*" className="hidden" />

            <ActionButton 
              onClick={handleEvolveClick}
              active={isScanningEvolve}
              icon={isScanningEvolve ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
              label="SCAN_EVOLUA"
              color="text-blue-400"
              disabled={isScanningEvolve}
            />

            <ActionButton 
              onClick={handleBleClick}
              icon={<Radio size={20} />}
              label={`BLE_${activeDevice.toUpperCase()}`}
              color="text-[#00ff88]"
            />
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 w-full mb-12 z-10">
          {Object.entries(agents)
            .sort(([, a], [, b]) => {
              // Sort by priority descending, then status ('working' first), then name
              const priorityA = a.priority || 0;
              const priorityB = b.priority || 0;
              if (priorityA !== priorityB) return priorityB - priorityA;
              if (a.status === 'working' && b.status !== 'working') return -1;
              if (b.status === 'working' && a.status !== 'working') return 1;
              return a.name.localeCompare(b.name);
            })
            .map(([id, agent]) => {
              const defaultIcons: Record<string, any> = {
                VOICE_AGENT: Mic,
                GESTURE_AGENT: Activity,
                CONTEXT_AGENT: Database,
                RESEARCH_AGENT: Search,
                VISION_AGENT: Camera,
                NOTIFY_AGENT: Bell
              };
              
              const defaultDevices: Record<string, string> = {
                VOICE_AGENT: 'M5Stack',
                GESTURE_AGENT: 'T-Watch',
                CONTEXT_AGENT: 'Neo4j',
                RESEARCH_AGENT: 'Perplexity',
                VISION_AGENT: 'AtomS3R',
                NOTIFY_AGENT: 'Xiaomi 12'
              };

              const Icon = defaultIcons[id] || Cpu;

              return (
                <StatusCard 
                  key={id}
                  title={agent.name.replace('_AGENT', '')} 
                  device={defaultDevices[id] || 'NODE'} 
                  status={agent.status} 
                  icon={getIconComponent(agent.iconName, <Icon size={16} />)} 
                  onEditIcon={() => setEditingAgent(id)}
                  customIconUrl={agent.customIconUrl}
                  priority={agent.priority}
                  urgency={agent.urgency}
                  complexity={agent.complexity}
                />
              );
            })}
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full z-10 items-start">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <VisionAnalysis visionResults={visionResults} />
              <Terminal 
                logs={logs}
                terminalInput={terminalInput}
                setTerminalInput={setTerminalInput}
                onSubmit={onTerminalSubmit}
                onClear={() => dispatch(addLog('--- LOGS PURGED ---'))}
                onExport={() => {}} // Handle this if needed
                isExpanded={isTerminalExpanded}
                setIsExpanded={setIsTerminalExpanded}
              />
            </div>
            
            <div className="lg:col-span-4 flex flex-col gap-8">
              <MemoryCortex 
                memorySearchQuery={memorySearchQuery}
                setMemorySearchQuery={setMemorySearchQuery}
                onSearch={handleMemorySearch}
                recentSearches={recentSearches}
                memoryContext={memoryContext}
                onClearContext={() => dispatch(setMemoryContext(''))}
              />
              <TelemetryDashboard activeDevice={activeDevice} />
            </div>
          </div>
          
          <div className="w-full mt-8 z-10">
            <AnalyticsDashboard />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Push Notification (Cyberpunk Style) */}
      {pushNotification && (
        <div className="fixed top-24 right-4 sm:right-8 max-w-sm w-[calc(100vw-2rem)] bg-black/90 backdrop-blur-2xl border-l-4 border-[#00ff88] rounded-xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-[100] animate-in slide-in-from-right-8 duration-300">
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-[#00ff88] text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-3">
              <Bell size={14} />
              SYSTEM_NOTIFICATION
            </h4>
            <button 
              onClick={() => dispatch(setPushNotification(null))}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
            >
              <Minimize2 size={14} />
            </button>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed font-medium">
            {pushNotification}
          </p>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
            <span className="text-[8px] font-bold text-gray-600 tracking-widest uppercase">Source: RESEARCH_AGENT</span>
          </div>
        </div>
      )}

      {/* Daily Improvements Modal */}
      <AnimatePresence>
        {dailyImprovements && (
          <DailyImprovementsModal key="daily-improvements-modal" improvements={dailyImprovements} />
        )}
        {frankScanResult && (
          <FRANKScanModal 
            key="frank-scan-modal"
            scanId={frankScanResult.id} 
            report={frankScanResult.report} 
            diff={frankScanResult.diff} 
            onClose={() => setFrankScanResult(null)} 
            onApprove={handleApproveMerge} 
          />
        )}
        {editingAgent && (
          <AgentIconSettingsModal 
            key="agent-icon-modal"
            agentName={agents[editingAgent]?.name || editingAgent}
            isOpen={!!editingAgent}
            currentIconName={agents[editingAgent]?.iconName}
            currentCustomUrl={agents[editingAgent]?.customIconUrl}
            onClose={() => setEditingAgent(null)}
            onSave={handleSaveIcon}
          />
        )}
      </AnimatePresence>

      <CommandHub isOpen={isCommandHubOpen} onClose={() => setIsCommandHubOpen(false)} />
        </div>
      </main>
    </div>
  );
}
