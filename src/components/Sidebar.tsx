import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'motion/react';
import { Monitor, Zap, Lock, Command, Layers, TrendingUp, Trash2 } from 'lucide-react';
import { NavItem } from './NavItem';
import { MAIN_NAV_ITEMS, CONFIG_NAV_ITEMS } from '../config/navigation';
import { RootState } from '../store/store';
import { runSystemSweep, toggleAutoCleaning } from '../store/slices/swarmSlice';

export function Sidebar({ onOpenCommandHub }: { onOpenCommandHub?: () => void }) {
  const dispatch = useDispatch();
  const { evolution, memory } = useSelector((state: RootState) => state.swarm);
  const [neuralLoad, setNeuralLoad] = useState(72);

  useEffect(() => {
    const timer = setInterval(() => {
      setNeuralLoad(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 5)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="hidden sm:flex flex-col w-20 lg:w-72 bg-[#050505]/80 border-r border-[#00ff88]/10 backdrop-blur-3xl p-4 gap-2 sticky top-16 h-[calc(100vh-64px)] transition-all duration-500 z-30 overflow-hidden hardware-dashed divide-y divide-white/[0.03]">
      <div className="absolute inset-0 scanline-overlay opacity-[0.02] pointer-events-none"></div>
      
      <div className="mb-6 px-4 hidden lg:block pb-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-serif italic tracking-[0.2em] uppercase opacity-60">System_Core</span>
            <Monitor size={12} className="text-gray-700" />
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 relative overflow-hidden group hardware-dashed">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#00ff88]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_12px_#00ff88]"></div>
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#00ff88] animate-ping opacity-20"></div>
              </div>
              <span className="text-[10px] font-mono font-black text-[#00ff88] tracking-widest">NODE_ACTIVE</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[9px] font-mono font-bold text-gray-500 tracking-widest uppercase">
                <span>cycle_load</span>
                <span className="text-[#00ff88]">{neuralLoad.toFixed(0)}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden p-[1px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${neuralLoad}%` }}
                  className="h-full bg-gradient-to-r from-[#00ff88]/40 to-[#00ff88] shadow-[0_0_8px_#00ff88]"
                ></motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 mb-4">
        <button 
          onClick={onOpenCommandHub}
          className="w-full flex items-center justify-center lg:justify-start gap-4 p-3 lg:px-4 lg:py-3 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 hover:bg-[#00ff88] hover:text-black text-[#00ff88] transition-all group shadow-[0_0_15px_rgba(0,255,136,0.1)]"
        >
          <Command size={20} className="group-hover:scale-110 transition-transform" />
          <span className="hidden lg:block text-xs font-black tracking-widest uppercase">COMMAND HUB</span>
        </button>
      </div>

      <div className="flex flex-col gap-1.5 scrollbar-hide overflow-y-auto">
        {MAIN_NAV_ITEMS.map((item) => (
          <NavItem 
            key={`${item.to}-${item.label}`}
            to={item.to}
            icon={item.icon}
            label={item.label}
            tooltip={item.tooltip}
          />
        ))}
      </div>
      
      <div className="mt-auto pt-6 flex flex-col gap-1.5 h-auto shrink-0">
        <div className="hidden lg:block px-4 mb-4 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
             <span className="text-[10px] text-gray-600 font-serif italic tracking-[0.2em] uppercase opacity-60">Exocortex_Evolution</span>
             <TrendingUp size={12} className="text-[#00ff88]" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-l border-white/10 pl-3">
              <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Evol_Lvl</span>
              <span className="text-[11px] font-mono font-black text-[#00ff88]">{evolution?.evolutionLevel?.toFixed(1) || '1.0'}</span>
            </div>
            
            <div className="flex items-center justify-between border-l border-white/10 pl-3">
               <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Integrity</span>
               <span className="text-[11px] font-mono font-black text-gray-300">{evolution?.integrityScore || '100'}%</span>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => dispatch(runSystemSweep())}
                className="flex-1 p-2 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-[#00ff88]/10 hover:border-[#00ff88]/30 transition-all group/opt"
              >
                <Zap size={14} className="text-[#00ff88] mx-auto group-hover/opt:scale-110 transition-transform" />
              </button>
              <button 
                onClick={() => dispatch(toggleAutoCleaning())}
                className={`flex-1 p-2 border rounded-lg transition-all group/clean ${evolution?.autoCleaningActive ? 'bg-[#00ff88]/10 border-[#00ff88]/30' : 'bg-white/5 border-white/5'}`}
              >
                <Trash2 size={14} className={`${evolution?.autoCleaningActive ? 'text-[#00ff88]' : 'text-gray-600'} mx-auto`} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 mb-2 hidden lg:block border-t border-white/5 pt-4">
          <span className="text-[9px] text-gray-600 font-black tracking-[0.3em] uppercase">Cognitive_Layers</span>
        </div>
        
        <div className="hidden lg:block space-y-1 mb-4">
          {[
            { label: 'Short', count: memory?.shortTerm?.length || 0, color: 'text-cyan-400' },
            { label: 'Medium', count: memory?.mediumTerm?.length || 0, color: 'text-blue-400' },
            { label: 'Long', count: memory?.longTerm?.length || 0, color: 'text-purple-400' }
          ].map((layer) => (
            <div key={layer.label} className="flex items-center justify-between px-4 py-1.5 hover:bg-white/5 rounded-lg group/layer transition-colors">
              <div className="flex items-center gap-2">
                <Layers size={10} className={layer.color} />
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{layer.label}</span>
              </div>
              <span className="text-[9px] font-black text-gray-700">{layer.count}</span>
            </div>
          ))}
        </div>

        <div className="px-4 mb-2 hidden lg:block border-t border-white/5 pt-4">
          <span className="text-[9px] text-gray-600 font-black tracking-[0.3em] uppercase">Configuration</span>
        </div>
        {CONFIG_NAV_ITEMS.map((item) => (
          <NavItem 
            key={`${item.to}-${item.label}`}
            to={item.to}
            icon={item.icon}
            label={item.label}
            tooltip={item.tooltip}
          />
        ))}
      </div>
    </nav>
  );
}
