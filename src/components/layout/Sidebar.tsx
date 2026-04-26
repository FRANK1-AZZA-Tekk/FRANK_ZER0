import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Zap, 
  Shield, 
  Database, 
  Trash2, 
  Settings, 
  LayoutDashboard, 
  CheckSquare, 
  Github, 
  Cpu,
  Brain,
  Layers,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { RootState } from '../../store/store';
import { runSystemSweep, toggleAutoCleaning } from '../../store/slices/swarmSlice';
import { Link, useLocation } from 'react-router-dom';

export function Sidebar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { evolution, memory } = useSelector((state: RootState) => state.swarm);
  
  const navItems = [
    { path: '/', label: 'DASHBOARD', icon: LayoutDashboard },
    { path: '/tasks', label: 'TASKS', icon: CheckSquare },
  ];

  return (
    <div className="w-20 lg:w-72 h-screen bg-black/40 backdrop-blur-3xl border-r border-white/10 flex flex-col p-4 z-50 fixed left-0 top-0 transition-all duration-500 group overflow-hidden">
      <div className="absolute inset-0 scanline-overlay opacity-[0.03]"></div>
      
      {/* Brand */}
      <div className="flex items-center gap-4 mb-12 px-2">
        <div className="p-2 bg-[#00ff88]/10 rounded-xl border border-[#00ff88]/30 glow-border">
          <Cpu size={24} className="text-[#00ff88]" />
        </div>
        <div className="hidden lg:flex flex-col">
          <span className="text-sm font-black text-white tracking-[0.3em]">FRANK</span>
          <span className="text-[8px] font-bold text-gray-500 tracking-widest uppercase">Exocortex_v3.5</span>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative group/nav
                ${isActive 
                  ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 shadow-[0_0_20px_rgba(0,255,136,0.1)]' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <item.icon size={20} className={isActive ? 'text-[#00ff88]' : 'text-gray-500 group-hover/nav:text-white transition-colors'} />
              <span className={`text-[10px] font-black tracking-widest uppercase hidden lg:block ${isActive ? 'text-[#00ff88]' : 'text-gray-500'} group-hover/nav:text-white`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute left-[-4px] top-1/4 bottom-1/4 w-1 bg-[#00ff88] rounded-full shadow-[0_0_10px_#00ff88]"></div>
              )}
            </Link>
          );
        })}
        
        <div className="h-[1px] bg-white/5 my-6 mx-2"></div>
        
        <div className="hidden lg:block px-4 mb-4">
          <span className="text-[8px] font-black text-gray-600 tracking-[0.4em] uppercase">Cognitive_Layers</span>
        </div>

        <div className="space-y-1">
          <div className="flex lg:flex-col gap-2">
            {[
              { label: 'Short', count: memory.shortTerm.length, color: 'text-cyan-400' },
              { label: 'Medium', count: memory.mediumTerm.length, color: 'text-blue-400' },
              { label: 'Long', count: memory.longTerm.length, color: 'text-purple-400' }
            ].map((layer) => (
              <div key={layer.label} className="flex items-center justify-between px-4 py-2 hover:bg-white/5 rounded-lg group/item transition-colors">
                 <div className="flex items-center gap-3">
                   <Layers size={14} className={layer.color} />
                   <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest hidden lg:block">{layer.label}_Term</span>
                 </div>
                 <span className="text-[10px] font-black text-gray-700 hidden lg:block">{layer.count}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* System Status Footer */}
      <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
        <div className="hidden lg:flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-[#00ff88]" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Evolution_Lvl</span>
            </div>
            <span className="text-xs font-black text-[#00ff88]">{evolution.evolutionLevel.toFixed(1)}</span>
          </div>
          
          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${evolution.integrityScore}%` }}
              className="h-full bg-[#00ff88] shadow-[0_0_10px_#00ff88]"
            ></motion.div>
          </div>

          <div className="flex items-center justify-between">
             <span className="text-[8px] font-black text-gray-600 uppercase">Neural_Integrity</span>
             <span className="text-[10px] font-black text-gray-400">{evolution.integrityScore}%</span>
          </div>
        </div>

        <div className="flex lg:flex-col gap-2">
          <button 
             onClick={() => dispatch(runSystemSweep())}
             className="flex items-center gap-4 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-[#00ff88]/10 hover:border-[#00ff88]/30 transition-all group/btn"
          >
            <Zap size={18} className="text-[#00ff88] group-hover/btn:scale-110 transition-transform" />
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest hidden lg:block group-hover/btn:text-white">Neural_Sweep</span>
          </button>
          
          <button 
             onClick={() => dispatch(toggleAutoCleaning())}
             className={`flex items-center gap-4 px-4 py-3 border rounded-xl transition-all group/btn ${evolution.autoCleaningActive ? 'bg-[#00ff88]/5 border-[#00ff88]/20' : 'bg-white/5 border-white/10 opacity-50'}`}
          >
            <Trash2 size={18} className={evolution.autoCleaningActive ? 'text-[#00ff88]' : 'text-gray-500'} />
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest hidden lg:block group-hover/btn:text-white">Auto_Clean: {evolution.autoCleaningActive ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
