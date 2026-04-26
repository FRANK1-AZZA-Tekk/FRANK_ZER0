import React from 'react';
import { motion } from 'motion/react';

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  color?: string;
  disabled?: boolean;
}

export function ActionButton({ onClick, icon, label, active, color, disabled }: ActionButtonProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-3 sm:gap-5 px-4 py-3 sm:px-10 sm:py-5 rounded-xl sm:rounded-[1.5rem] border-2 transition-all duration-500 group relative overflow-hidden backdrop-blur-md
        ${active 
          ? `bg-[#00ff88]/10 border-[#00ff88]/60 shadow-[0_0_40px_rgba(0,255,136,0.2),inset_0_0_20px_rgba(0,255,136,0.1)] text-[#00ff88]` 
          : 'bg-black/60 border-white/5 hover:bg-[#00ff88]/5 hover:border-[#00ff88]/30 text-gray-500 hover:text-white shadow-xl'
        }
        disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95
      `}
    >
      <div className="absolute inset-0 scanline-overlay opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"></div>
      
      {/* Glossy Reflection */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

      <div className={`relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.4)] ${active ? 'scale-110' : ''}`}>
        {icon}
      </div>
      
      <div className="flex flex-col items-start relative z-10">
        <span className="text-[11px] font-black tracking-[0.4em] uppercase leading-none">{label}</span>
        {active ? (
          <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
             <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping"></div>
             <span className="text-[7px] font-bold text-[#00ff88] tracking-widest uppercase">ACTIVE_NODE_LINK</span>
          </div>
        ) : (
          <span className="text-[7px] font-bold text-gray-700 mt-1.5 tracking-widest uppercase group-hover:text-gray-500 transition-colors">READY_FOR_SINCRO</span>
        )}
      </div>
      
      {active && (
        <>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff88] to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff88] to-transparent"></div>
        </>
      )}
      
      {/* Hardware Corner Accents */}
      <div className="absolute top-3 left-3 w-1.5 h-1.5 border-t border-l border-white/20 group-hover:border-[#00ff88]/50 transition-colors"></div>
      <div className="absolute top-3 right-3 w-1.5 h-1.5 border-t border-r border-white/20 group-hover:border-[#00ff88]/50 transition-colors"></div>
      <div className="absolute bottom-3 left-3 w-1.5 h-1.5 border-b border-l border-white/20 group-hover:border-[#00ff88]/50 transition-colors"></div>
      <div className="absolute bottom-3 right-3 w-1.5 h-1.5 border-b border-r border-white/20 group-hover:border-[#00ff88]/50 transition-colors"></div>
    </button>
  );
}
