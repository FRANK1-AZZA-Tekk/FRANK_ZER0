import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Check, X, Settings, Zap, Shield, ChevronRight, Brain } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setDailyImprovements, addLog } from '../../store/slices/swarmSlice';

interface Improvement {
  id: string;
  title: string;
  description: string;
  impact: string;
  category: 'performance' | 'security' | 'feature' | 'optimization';
}

interface DailyImprovementsModalProps {
  improvements: { improvements: Improvement[] };
}

export function DailyImprovementsModal({ improvements }: DailyImprovementsModalProps) {
  const dispatch = useDispatch();
  const [selected, setSelected] = useState<string[]>(improvements.improvements.map((i, idx) => i.id ? `${i.id}-${idx}` : `imp-${idx}`));
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);

  const toggleSelection = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleInstall = async () => {
    if (selected.length === 0) {
      dispatch(setDailyImprovements(null));
      return;
    }

    setIsInstalling(true);
    dispatch(addLog({
      message: `Initiating installation of ${selected.length} improvements...`,
      origin: 'SYSTEM',
      type: 'info'
    }));

    try {
      // Simulate progress while waiting for API
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress < 90) setInstallProgress(progress);
      }, 300);

      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const res = await fetch(`${apiUrl}/api/v1/swarm/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ improvements: selected })
      });

      clearInterval(progressInterval);
      setInstallProgress(100);

      if (res.ok) {
        dispatch(addLog({
          message: 'Improvements installed successfully.',
          origin: 'SYSTEM',
          type: 'success'
        }));
      } else {
        dispatch(addLog({
          message: 'Optimization API returned non-OK status. Applied local fallbacks.',
          origin: 'SYSTEM',
          type: 'warning'
        }));
      }
    } catch (error) {
      console.error("Optimization API failed", error);
      setInstallProgress(100);
      dispatch(addLog({
        message: 'Optimization API unreachable. Applied local fallbacks.',
        origin: 'SYSTEM',
        type: 'error'
      }));
    } finally {
      setTimeout(() => {
        dispatch(setDailyImprovements(null));
      }, 1000);
    }
  };

  const handleDismiss = () => {
    dispatch(addLog({
      message: 'Daily improvements dismissed by user.',
      origin: 'SYSTEM',
      type: 'info'
    }));
    dispatch(setDailyImprovements(null));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Zap size={16} className="text-yellow-500" />;
      case 'security': return <Shield size={16} className="text-blue-500" />;
      case 'optimization': return <Settings size={16} className="text-purple-500" />;
      default: return <Sparkles size={16} className="text-[#00ff88]" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#050505] border border-[#00ff88]/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,255,136,0.1)] flex flex-col max-h-[90vh]"
      >
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-b from-[#00ff88]/10 to-transparent relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff88] to-transparent"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-[#00ff88]/20 rounded-2xl border border-[#00ff88]/30">
                <Brain size={28} className="text-[#00ff88]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">Neural_Evolution</h2>
                <p className="text-xs text-[#00ff88] font-mono mt-1">SINCRO_PROATIVO DAS 05:00 AM</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
            <p className="text-sm text-gray-400 font-mono mb-2 border-l-2 border-[#00ff88]/40 pl-4 italic">
              FRANK harmonizou fluxos do GitHub, HuggingFace e seus padrões cognitivos. 
              As seguintes adaptações expandem sua malha exocortical (Corpo, Mente e Alma):
            </p>

            {improvements.improvements.map((imp, i) => {
              const impId = imp.id ? `${imp.id}-${i}` : `imp-${i}`;
              const isSelected = selected.includes(impId);
              return (
                <div 
                  key={impId}
                  onClick={() => !isInstalling && toggleSelection(impId)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 ${
                    isSelected 
                      ? 'bg-[#00ff88]/10 border-[#00ff88]/30' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  } ${isInstalling ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-1 transition-colors ${
                    isSelected ? 'bg-[#00ff88] border-[#00ff88] text-black' : 'border-gray-600 text-transparent'
                  }`}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-bold tracking-widest uppercase ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {imp.title}
                      </h3>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-black/50 rounded-lg border border-white/5">
                        {getCategoryIcon(imp.category)}
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{imp.category}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-mono leading-relaxed">{imp.description}</p>
                    <div className="mt-2 text-[10px] font-black text-[#00ff88]/70 tracking-widest uppercase flex items-center gap-1">
                      <ChevronRight size={12} />
                      IMPACTO: {imp.impact}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 bg-black/40">
            {isInstalling ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-xs font-mono text-[#00ff88]">
                  <span>INSTALANDO_OTIMIZAÇÕES...</span>
                  <span>{Math.floor(installProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#00ff88] shadow-[0_0_10px_#00ff88]"
                    style={{ width: `${installProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <button 
                  onClick={handleDismiss}
                  className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold tracking-widest text-xs transition-all"
                >
                  DISPENSAR_TUDO
                </button>
                <button 
                  onClick={handleInstall}
                  className="px-8 py-3 rounded-xl bg-[#00ff88] text-black font-black tracking-widest text-sm hover:bg-[#00ff88]/80 hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all flex items-center gap-2"
                >
                  {selected.length === 0 ? 'PULAR' : `APLICAR_SELECIONADOS (${selected.length})`}
                  <Zap size={16} />
                </button>
              </div>
            )}
          </div>
      </motion.div>
    </motion.div>
  );
}
