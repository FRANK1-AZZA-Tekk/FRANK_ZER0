import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Wifi, ShieldCheck, Globe, Battery, X, Menu, Zap, Loader2, CheckCircle2, Command, Link2, Link2Off } from 'lucide-react';
import { StatusItem } from './StatusItem';
import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface TopBarProps {
  isStatusOpen: boolean;
  setIsStatusOpen: (open: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  onOpenCommandHub?: () => void;
}

export function TopBar({ 
  isStatusOpen, 
  setIsStatusOpen, 
  isMenuOpen, 
  setIsMenuOpen,
  onOpenCommandHub
}: TopBarProps) {
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'report' | 'merging' | 'done'>('idle');
  const [scanReport, setScanReport] = useState<any>(null);
  
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString());
  const [neuralLoad, setNeuralLoad] = useState(72);
  const wsStatus = useSelector((state: RootState) => state.swarm.wsStatus);

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString());
      setNeuralLoad(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 5)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleScan = async () => {
    setScanState('scanning');
    setIsScanOpen(true);
    try {
      const { generateOptimizations } = await import('../utils/gemini');
      const results = await generateOptimizations();
      
      const reportText = `### 🚀 YBY Exocortex Optimization Report

**Target:** Performance, Battery Life, and Latency

**Findings (Deep Scan - GitHub, Forums, ArXiv):**
${results.map((opt, i) => `${i + 1}. **${opt}**`).join('\n')}

**Recommended Actions:**
*   Apply the suggested optimizations to the local environment.
*   Monitor system stability after patches.

*Do you want to apply these patches?*`;

      const realReport = {
        id: 'scan-' + Date.now(),
        status: 'success',
        report: reportText
      };
      
      setScanReport(realReport);
      setScanState('report');
    } catch (err) {
      console.error(err);
      setScanState('idle');
    }
  };

  const handleApprove = async () => {
    if (!scanReport?.id) return;
    setScanState('merging');
    try {
      // Simulate applying patches
      await new Promise(resolve => setTimeout(resolve, 3000));
      setScanState('done');
      setTimeout(() => {
        setIsScanOpen(false);
        setScanState('idle');
      }, 3000);
    } catch (err) {
      console.error(err);
      setScanState('report');
    }
  };

  return (
    <header className="w-full bg-black/80 backdrop-blur-3xl border-b border-[#00ff88]/20 sticky top-0 z-50 px-4 sm:px-8 py-3 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 text-[#00ff88]"
        >
          <div className="relative">
            <Cpu size={20} className="animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00ff88] rounded-full blur-[2px] animate-ping"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.3em] leading-none">YBY_CORTEX</span>
            <span className="text-[8px] text-gray-500 font-bold tracking-widest mt-0.5">v3.0.4_STABLE</span>
          </div>
        </motion.div>
        
        <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
        
        <div className="hidden md:flex items-center gap-4 text-[9px] tracking-[0.2em] uppercase font-black">
          <div className={`flex items-center gap-1.5 group cursor-help transition-colors duration-500 ${
            wsStatus === 'connected' ? 'text-[#00ff88]/80' : 
            wsStatus === 'connecting' ? 'text-yellow-500 group-hover:text-yellow-400' : 
            'text-red-500 group-hover:text-red-400'
          }`}>
            {wsStatus === 'connected' ? (
              <>
                <Wifi size={12} className="group-hover:scale-110 transition-transform" />
                <span className="border-b border-transparent group-hover:border-[#00ff88]/40 transition-all">CORTEX_WS_OK</span>
              </>
            ) : wsStatus === 'connecting' ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span className="animate-pulse">RECONECTANDO...</span>
              </>
            ) : (
              <>
                <Link2Off size={12} />
                <span className="animate-pulse">OFFLINE</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-blue-400/80 group cursor-help">
            <ShieldCheck size={12} className="group-hover:scale-110 transition-transform" />
            <span className="border-b border-transparent group-hover:border-blue-400/40 transition-all">SEC_ENCRYPTED</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-400/80 group cursor-help">
            <Globe size={12} className="group-hover:scale-110 transition-transform" />
            <span className="border-b border-transparent group-hover:border-purple-400/40 transition-all">GLOBAL_SYNC</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden lg:flex items-center gap-6 pr-6 border-r border-white/5">
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-gray-600 font-black tracking-widest uppercase mb-1">Cortex_Load</span>
            <div className="flex gap-0.5">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={`cortex-load-${i}`} className={`w-1 h-3 rounded-full ${i < 6 ? 'bg-[#00ff88]' : 'bg-white/5'}`}></div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-gray-600 font-black tracking-widest uppercase mb-1">Neural_Sync</span>
            <div className="flex gap-0.5">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={`neural-sync-${i}`} className={`w-1 h-3 rounded-full ${i < 4 ? 'bg-blue-400' : 'bg-white/5'}`}></div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Hub Button (Desktop) */}
          <button
            onClick={onOpenCommandHub}
            className="hidden sm:flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-[#00ff88]/20 hover:border-[#00ff88]/50 hover:text-[#00ff88] transition-all"
            title="Abrir Command Hub (Ctrl+K)"
          >
            <Command size={18} />
          </button>

          <button
            onClick={handleScan}
            className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-full hover:bg-[#00ff88]/20 transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ff88]/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <Zap size={14} className="text-[#00ff88] group-hover:animate-pulse" />
            <span className="text-[10px] font-black text-[#00ff88] tracking-widest uppercase">SCAN EVOLUA</span>
          </button>

          <AnimatePresence>
            {isScanOpen && (
              <motion.div 
                key="scan-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed top-20 right-4 sm:right-8 w-[calc(100vw-2rem)] sm:w-[500px] max-h-[80vh] overflow-y-auto bg-black/95 backdrop-blur-3xl border border-[#00ff88]/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,255,136,0.15)] z-[200] scrollbar-hide"
              >
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Zap size={20} className="text-[#00ff88] animate-pulse" />
                    <h3 className="text-[#00ff88] font-black tracking-[0.2em] uppercase text-sm">YBY-SCAN v1.2</h3>
                  </div>
                  <button onClick={() => setIsScanOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {scanState === 'scanning' && (
                  <div className="flex flex-col items-center justify-center py-12 gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-2 border-[#00ff88]/20 border-t-[#00ff88] animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Cpu size={20} className="text-[#00ff88] animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[#00ff88] font-black tracking-widest text-xs uppercase mb-2">ANALISANDO GITHUB & FÓRUNS...</p>
                      <p className="text-gray-500 text-[10px] font-mono">Buscando otimizações de bateria e latência</p>
                    </div>
                  </div>
                )}

                {scanState === 'report' && scanReport && (
                  <div className="flex flex-col gap-6">
                    <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-a:text-[#00ff88]">
                      <ReactMarkdown>{scanReport.report}</ReactMarkdown>
                    </div>
                    
                    <div className="flex gap-4 pt-4 border-t border-white/10">
                      <button 
                        onClick={() => setIsScanOpen(false)}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 font-black tracking-widest text-[10px] uppercase hover:bg-white/5 hover:text-white transition-all"
                      >
                        REJEITAR
                      </button>
                      <button 
                        onClick={handleApprove}
                        className="flex-1 py-3 rounded-xl bg-[#00ff88]/20 border border-[#00ff88]/50 text-[#00ff88] font-black tracking-widest text-[10px] uppercase hover:bg-[#00ff88] hover:text-black transition-all flex items-center justify-center gap-2"
                      >
                        <ShieldCheck size={14} />
                        APROVAR MERGE
                      </button>
                    </div>
                  </div>
                )}

                {scanState === 'merging' && (
                  <div className="flex flex-col items-center justify-center py-12 gap-6">
                    <Loader2 size={32} className="text-[#00ff88] animate-spin" />
                    <p className="text-[#00ff88] font-black tracking-widest text-xs uppercase">APLICANDO PATCH SEGURO...</p>
                  </div>
                )}

                {scanState === 'done' && (
                  <div className="flex flex-col items-center justify-center py-12 gap-6">
                    <CheckCircle2 size={48} className="text-[#00ff88]" />
                    <div className="text-center">
                      <p className="text-[#00ff88] font-black tracking-widest text-sm uppercase mb-2">EVOLUÇÃO CONCLUÍDA</p>
                      <p className="text-gray-500 text-[10px] font-mono">Reiniciando sistema exocórtex...</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <button 
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-3 hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-1.5 text-yellow-500/80">
                <Battery size={14} />
                <span className="text-[10px] font-black tabular-nums">84%</span>
              </div>
              <div className="w-[1px] h-3 bg-white/10"></div>
              <div className="text-[#00ff88] text-[10px] font-black tracking-widest tabular-nums">
                {systemTime}
              </div>
            </button>

            <AnimatePresence>
              {isStatusOpen && (
                <motion.div 
                  key="status-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-64 bg-black/90 backdrop-blur-3xl border border-[#00ff88]/20 rounded-2xl p-6 shadow-2xl z-[100]"
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">System_Status</span>
                      <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse"></div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <StatusItem label="Neural_Load" value={`${neuralLoad.toFixed(1)}%`} progress={neuralLoad} color="bg-[#00ff88]" />
                      <StatusItem label="Memory_Usage" value="6.4GB / 12GB" progress={53} color="bg-blue-400" />
                      <StatusItem label="Mesh_Stability" value="99.9%" progress={99.9} color="bg-purple-400" />
                    </div>

                    <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                      <button className="w-full py-2 bg-white/5 rounded-xl text-[9px] font-black tracking-widest uppercase hover:bg-[#00ff88]/10 hover:text-[#00ff88] transition-all">
                        Run Diagnostics
                      </button>
                      <button className="w-full py-2 bg-white/5 rounded-xl text-[9px] font-black tracking-widest uppercase hover:bg-red-500/10 hover:text-red-500 transition-all">
                        Purge Cache
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            className="sm:hidden p-2 text-[#00ff88] hover:bg-[#00ff88]/10 rounded-xl transition-all"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
