import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Database, Search, History, Trash2, Brain, Layers } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';

interface MemoryCortexProps {
  memorySearchQuery: string;
  setMemorySearchQuery: (val: string) => void;
  onSearch: (queryOverride?: string) => void;
  recentSearches: string[];
  memoryContext: string;
  onClearContext: () => void;
}

export function MemoryCortex({ 
  memorySearchQuery, 
  setMemorySearchQuery, 
  onSearch, 
  recentSearches, 
  memoryContext, 
  onClearContext 
}: MemoryCortexProps) {
  const { memory } = useSelector((state: RootState) => state.swarm);
  const [activeLayer, setActiveLayer] = useState<'shortTerm' | 'mediumTerm' | 'longTerm'>('shortTerm');

  return (
    <div className="bg-black/80 backdrop-blur-3xl border-2 border-white/10 rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden h-[500px] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-0 scanline-overlay opacity-[0.05]"></div>
      
      {/* Hardware Accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff88]/5 blur-[60px] pointer-events-none"></div>
      <div className="absolute top-6 right-6 w-3 h-3 border-t-2 border-r-2 border-[#00ff88]/30"></div>
      <div className="absolute bottom-6 left-6 w-3 h-3 border-b-2 border-l-2 border-[#00ff88]/30"></div>

      <div className="flex justify-between items-center mb-10 relative z-10">
        <h3 className="text-[#00ff88] text-[11px] font-black tracking-[0.5em] uppercase flex items-center gap-4">
          <div className="p-2 bg-[#00ff88]/10 rounded-lg">
            <Brain size={20} className="animate-pulse" />
          </div>
          NEURAL_CORTEX_L3
        </h3>
        {memoryContext && (
          <button 
            onClick={onClearContext}
            className="group flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black text-red-400 uppercase tracking-widest hover:bg-red-500/20 transition-all"
          >
            <Trash2 size={12} /> PURGE_CACHÉ
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-8 z-10">
        {[
          { id: 'shortTerm', label: 'SHORT_TRM', color: 'text-cyan-400' },
          { id: 'mediumTerm', label: 'MID_TERM', color: 'text-blue-400' },
          { id: 'longTerm', label: 'LONG_TERM', color: 'text-purple-400' }
        ].map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id as any)}
            className={`flex-1 py-3 px-4 rounded-2xl border-2 text-[10px] font-black tracking-widest transition-all duration-300 ${activeLayer === layer.id ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.15)]' : 'bg-transparent border-white/5 text-gray-600 hover:text-gray-400 hover:border-white/10'}`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      <div className="relative mb-8 z-10 group/search">
        <input 
          type="text" 
          value={memorySearchQuery}
          onChange={(e) => setMemorySearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="ENTER_RECALL_VECTOR..."
          className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-5 text-sm font-mono text-white placeholder:text-gray-800 focus:outline-none focus:border-[#00ff88]/40 transition-all shadow-inner group-hover/search:border-white/10"
        />
        <button 
          onClick={() => onSearch()}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-gray-600 hover:text-[#00ff88] transition-all bg-white/5 rounded-xl border border-white/5 hover:scale-110 active:scale-95"
        >
          <Search size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide relative z-10 space-y-4 pr-2">
        {memory && memory[activeLayer] && memory[activeLayer].length > 0 ? (
          memory[activeLayer].map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative"
            >
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00ff88]/0 group-hover:bg-[#00ff88] transition-all duration-500 rounded-full"></div>
               <div className="text-gray-400 text-[12px] leading-relaxed font-mono bg-[#0a0a0a] p-5 rounded-2xl border border-white/5 group-hover:border-[#00ff88]/20 transition-all group-hover:translate-x-3 group-hover:bg-[#00ff88]/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest">{String(activeLayer).replace('Term', '')}_VECTOR_0{i}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-800 group-hover:bg-[#00ff88] animate-pulse"></div>
                  </div>
                  {item}
               </div>
            </motion.div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-900 group opacity-40">
            <Database size={64} className="mb-6 group-hover:scale-110 transition-transform duration-1000 group-hover:text-[#00ff88]" />
            <span className="text-[11px] uppercase tracking-[0.5em] font-black">Cortex_Layer_Empty</span>
          </div>
        )}

        {memoryContext && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 pt-10 border-t border-white/10"
          >
             <div className="flex items-center gap-3 mb-4">
                <Layers size={14} className="text-[#00ff88]" />
                <span className="text-[10px] font-black text-[#00ff88] tracking-[0.3em] uppercase block">SINCRO_RECALL_CONTEXT</span>
             </div>
             <p className="text-gray-200 text-xs leading-relaxed font-mono bg-black/60 p-6 rounded-3xl border border-[#00ff88]/30 shadow-[0_0_30px_rgba(0,255,136,0.1)] relative">
               <div className="absolute top-0 right-10 w-10 h-[2px] bg-[#00ff88]"></div>
               {memoryContext}
             </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
