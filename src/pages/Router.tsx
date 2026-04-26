import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Network, Zap, Cpu, Database, Server, ArrowRight, CheckCircle2, Activity, User, AlertTriangle } from 'lucide-react';

const ROUTE_NODES = [
  { id: 'groq', name: 'GROQ Llama3.1', type: 'LPU 840 TPS', latency: '12ms', status: 'active', color: '#00ff88' },
  { id: 'deepseek', name: 'DEEPSEEK R1', type: 'AIDER DEBATE', latency: '45ms', status: 'standby', color: '#3b82f6' },
  { id: 'gemini', name: 'GEMINI PRO', type: 'MULTIMODAL', latency: '120ms', status: 'standby', color: '#a855f7' },
  { id: 'mimo', name: 'OPENROUTER MIMO', type: '50M TOKENS', latency: '250ms', status: 'standby', color: '#f59e0b' }
];

export default function Router() {
  const [isRouting, setIsRouting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [flowStep, setFlowStep] = useState<'idle' | 'input' | 'router' | 'agent' | 'fallback' | 'complete'>('idle');
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [failedAgent, setFailedAgent] = useState<string | null>(null);

  const [query, setQuery] = useState('Qual a capital do Brasil?');

  const executeRouting = async () => {
    if (isRouting || !query.trim()) return;
    setIsRouting(true);
    setLogs([]);
    setFailedAgent(null);
    setActiveAgent(null);
    
    // Step 1: Input
    setFlowStep('input');
    setLogs([`[SISTEMA] Recebendo requisição do usuário: "${query}"`]);
    
    // Step 2: Router
    setFlowStep('router');
    setLogs(prev => [...prev, '[ROTEADOR] Analisando intenção e capacidades necessárias...']);

    const startTime = performance.now();
    
    try {
      // Step 3: Agent (Attempt Backend)
      setFlowStep('agent');
      setActiveAgent('groq');
      setLogs(prev => [...prev, `[ROTEADOR] Encaminhando para API Backend...`]);
      
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const res = await fetch(`${apiUrl}/api/v1/swarm/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (res.ok) {
        const data = await res.json();
        const latency = Math.round(performance.now() - startTime);
        setFlowStep('complete');
        setLogs(prev => [...prev, `[SUCESSO] Requisição concluída por ${data.node || 'Backend'} em ${latency}ms.`]);
      } else {
        throw new Error('API Error');
      }
    } catch (error) {
      // Step 4: Fallback to Gemini Local
      setFailedAgent('groq');
      setLogs(prev => [...prev, `[ERRO] Falha no backend. Iniciando protocolo de fallback.`]);
      
      setFlowStep('fallback');
      setActiveAgent('gemini');
      setLogs(prev => [...prev, `[ROTEADOR] Fallback para GEMINI PRO (Local)...`]);
      
      try {
        const { processGeneralCommand } = await import('../utils/gemini');
        const response = await processGeneralCommand(query, "Swarm Router Fallback");
        const latency = Math.round(performance.now() - startTime);
        
        setFlowStep('complete');
        setLogs(prev => [...prev, `[SUCESSO] Requisição concluída por GEMINI PRO em ${latency}ms.`, `[RESPOSTA] ${response.substring(0, 50)}...`]);
      } catch (e) {
        setFlowStep('complete');
        setLogs(prev => [...prev, `[FATAL] Todos os nós de roteamento falharam.`]);
      }
    } finally {
      setIsRouting(false);
      setTimeout(() => {
        setFlowStep('idle');
        setActiveAgent(null);
        setFailedAgent(null);
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 w-full min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.05)_0%,transparent_50%)] pointer-events-none"></div>
      
      <div className="w-full max-w-6xl z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6"
        >
          <div className="flex flex-col items-center md:items-start w-full md:w-auto">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-[0.3em] mb-4" style={{ textShadow: '0 0 30px rgba(0,255,136,0.3)' }}>
              SWARM_ROUTER
            </h1>
            <div className="flex items-center gap-4 text-[10px] font-black tracking-widest text-[#00ff88]/60 uppercase mb-4">
              <span className="flex items-center gap-1.5"><Network size={14}/> TOPOLOGIA: CASCATA</span>
              <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
              <span className="flex items-center gap-1.5"><Activity size={14}/> AUTO_FALLBACK</span>
            </div>
            
            <div className="flex w-full max-w-md gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite a consulta para rotear..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]/50"
                disabled={isRouting}
              />
              <button
                onClick={executeRouting}
                disabled={isRouting}
                className="px-6 py-3 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 hover:bg-[#00ff88]/20 rounded-xl font-black tracking-[0.2em] transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_30px_rgba(0,255,136,0.1)] shrink-0"
              >
                <Zap size={18} className={isRouting ? "animate-pulse" : ""} />
                {isRouting ? "ROTEANDO..." : "EXECUTAR"}
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visual Flowchart */}
          <div className="lg:col-span-2 flex flex-col items-center bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 relative">
            
            {/* User Node */}
            <div className={`p-4 rounded-2xl border-2 transition-all duration-500 z-10 ${flowStep !== 'idle' ? 'border-[#00ff88] bg-[#00ff88]/20 shadow-[0_0_30px_rgba(0,255,136,0.3)]' : 'border-white/10 bg-black/50'}`}>
              <User size={32} className={flowStep !== 'idle' ? 'text-[#00ff88]' : 'text-gray-500'} />
            </div>

            {/* Line down to Router */}
            <div className="w-1 h-12 relative">
              <div className="absolute inset-0 bg-white/10"></div>
              <motion.div 
                className="absolute top-0 left-0 w-full bg-[#00ff88] shadow-[0_0_10px_#00ff88]"
                initial={{ height: 0 }}
                animate={{ height: flowStep !== 'idle' ? '100%' : 0 }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Router Node */}
            <div className={`p-6 rounded-3xl border-2 transition-all duration-500 z-10 flex items-center gap-4 ${flowStep === 'router' || flowStep === 'agent' || flowStep === 'fallback' || flowStep === 'complete' ? 'border-[#00ff88] bg-[#00ff88]/20 shadow-[0_0_40px_rgba(0,255,136,0.4)]' : 'border-white/10 bg-black/50'}`}>
              <Network size={40} className={flowStep === 'router' ? 'text-[#00ff88] animate-pulse' : flowStep !== 'idle' && flowStep !== 'input' ? 'text-[#00ff88]' : 'text-gray-500'} />
              <div className="flex flex-col">
                <span className="text-white font-black tracking-widest">SWARM_ROUTER</span>
                <span className="text-[10px] text-[#00ff88] tracking-widest">INTENT_ENGINE</span>
              </div>
            </div>

            {/* SVG Lines to Agents */}
            <div className="relative w-full max-w-2xl h-24">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                {ROUTE_NODES.map((node, i) => {
                  const targetX = 125 + i * 250;
                  const isActive = activeAgent === node.id;
                  const isFailed = failedAgent === node.id;
                  
                  return (
                    <g key={`path-${node.id}`}>
                      <path d={`M 500 0 C 500 50, ${targetX} 50, ${targetX} 100`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                      <motion.path 
                        d={`M 500 0 C 500 50, ${targetX} 50, ${targetX} 100`} 
                        fill="none" 
                        stroke={isFailed ? "#ef4444" : "#00ff88"} 
                        strokeWidth="6"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: isActive || isFailed ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                        style={{ filter: `drop-shadow(0 0 8px ${isFailed ? '#ef4444' : '#00ff88'})` }}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl z-10">
              {ROUTE_NODES.map((node, i) => {
                const isActive = activeAgent === node.id;
                const isFailed = failedAgent === node.id;
                
                return (
                  <div key={node.id} className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-500 bg-black/60 backdrop-blur-md relative ${
                    isActive ? 'border-[#00ff88] shadow-[0_0_30px_rgba(0,255,136,0.3)] scale-105' : 
                    isFailed ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] opacity-70' : 
                    'border-white/10 opacity-50'
                  }`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                      isActive ? 'bg-[#00ff88]/20 text-[#00ff88]' : 
                      isFailed ? 'bg-red-500/20 text-red-500' : 
                      'bg-white/5 text-gray-500'
                    }`}>
                      {i === 0 ? <Zap size={24} /> : i === 1 ? <Cpu size={24} /> : i === 2 ? <Database size={24} /> : <Server size={24} />}
                    </div>
                    <span className={`text-sm font-black tracking-widest text-center ${isActive ? 'text-[#00ff88]' : isFailed ? 'text-red-500' : 'text-white'}`}>{node.name}</span>
                    <span className="text-[9px] text-gray-500 tracking-widest mt-1">{node.type}</span>
                    
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-bold">
                      <Activity size={10} className={isActive ? 'text-[#00ff88]' : 'text-gray-600'} />
                      <span className={isActive ? 'text-[#00ff88]' : 'text-gray-600'}>{node.latency}</span>
                    </div>
                    
                    {isFailed && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-[0_0_10px_#ef4444]">
                        <AlertTriangle size={14} />
                      </div>
                    )}
                    {isActive && flowStep === 'complete' && (
                      <div className="absolute -top-2 -right-2 bg-[#00ff88] text-black rounded-full p-1 shadow-[0_0_10px_#00ff88]">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Routing Logs */}
          <div className="lg:col-span-1">
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 h-full min-h-[400px] flex flex-col">
              <h3 className="text-[#00ff88] text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-3 mb-6">
                <Network size={16} />
                LOGS_ROTEAMENTO
              </h3>
              
              <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-700 italic text-center">
                    <Activity size={32} className="mb-4 opacity-10" />
                    <span className="text-[10px] uppercase tracking-widest font-black opacity-30">Aguardando evento de roteamento...</span>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] font-mono text-gray-400 border-l-2 border-[#00ff88]/30 pl-3 py-1"
                    >
                      <span className="text-[#00ff88] mr-2">{'>'}</span>
                      {log}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
