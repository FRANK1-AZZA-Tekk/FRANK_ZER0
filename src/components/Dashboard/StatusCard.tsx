import React, { memo } from 'react';
import { Edit2 } from 'lucide-react';

interface StatusCardProps {
  title: string;
  device: string;
  status: string;
  icon: React.ReactNode;
  onEditIcon?: () => void;
  customIconUrl?: string;
  priority?: number;
  urgency?: number;
  complexity?: number;
}

export const StatusCard = memo(function StatusCard({ 
  title, 
  device, 
  status, 
  icon, 
  onEditIcon, 
  customIconUrl,
  priority,
  urgency,
  complexity
}: StatusCardProps) {
  const isWorking = status === 'working';
  const isError = status === 'error';
  const isIdle = status === 'idle' || !status;

  const showMetrics = priority !== undefined;

  return (
    <div className={`
      relative overflow-hidden group p-4 sm:p-5 rounded-2xl border transition-all duration-500
      ${isWorking ? 'bg-[#f39c12]/5 border-[#f39c12]/50 shadow-[0_0_30px_rgba(243,156,18,0.15)] ring-1 ring-[#f39c12]/20' : ''}
      ${isError ? 'bg-red-500/5 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20' : ''}
      ${isIdle ? 'bg-black/40 border-white/10 hover:border-[#00ff88]/30 hover:bg-[#00ff88]/5 transition-all' : ''}
      ${priority && priority > 70 ? 'border-[#00ff88]/60 shadow-[0_0_35px_rgba(0,255,136,0.2)] ring-1 ring-[#00ff88]/30' : ''}
    `}>
      {/* Corner Brackets */}
      <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-white/20 group-hover:border-[#00ff88]/40 transition-colors"></div>
      <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-white/20 group-hover:border-[#00ff88]/40 transition-colors"></div>
      <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-white/20 group-hover:border-[#00ff88]/40 transition-colors"></div>
      <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-white/20 group-hover:border-[#00ff88]/40 transition-colors"></div>

      <div className="absolute inset-0 scanline-overlay opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"></div>
      
      {onEditIcon && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEditIcon();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#00ff88]/20 text-gray-500 hover:text-white z-20"
        >
          <Edit2 size={10} />
        </button>
      )}

      {priority && priority > 80 && (
        <div className="absolute top-0 right-0 p-1 bg-[#00ff88] text-black text-[7px] font-black px-2 rounded-bl-lg tracking-tighter z-10 animate-pulse shadow-[0_0_10px_#00ff88]">
          CORE_NODE
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className={`p-2 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 ${isWorking ? 'text-[#f39c12] bg-[#f39c12]/15 shadow-[0_0_15px_rgba(243,156,18,0.2)]' : isError ? 'text-red-400 bg-red-400/15 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-400 bg-white/5 border border-white/5'}`}>
          {customIconUrl ? (
            <img src={customIconUrl} alt="Agent Icon" className="w-6 h-6 rounded-lg object-cover shadow-lg" />
          ) : (
            icon
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-mono font-black tracking-widest text-[#00ff88] uppercase group-hover:text-white transition-colors">{title}</span>
          <span className="text-[10px] font-serif italic text-gray-500 tracking-wide lowercase truncate max-w-[100px]">{device}</span>
        </div>
      </div>
      
      <div className="flex flex-col relative z-10">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-white/[0.05] pb-2">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${isWorking ? 'bg-[#f39c12] animate-pulse shadow-[0_0_8px_#f39c12]' : isError ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-gray-700'}`}></div>
            <span className={`text-[10px] font-mono font-bold tracking-widest transition-colors ${isWorking ? 'text-[#f39c12]' : isError ? 'text-red-400' : 'text-gray-500'}`}>
              {status?.toUpperCase() || 'IDLE'}
            </span>
          </div>

          {showMetrics && (
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-black font-mono text-white/90 drop-shadow-[0_0_5px_#00ff88]">
                {priority}%
              </span>
            </div>
          )}
        </div>

        {showMetrics && (
          <div className="mt-1 space-y-3">
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 font-serif italic tracking-wide mb-1 opacity-60">neural_urgency</span>
              <div className="flex gap-1 h-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i <= (urgency || 0) ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-white/5'}`}></div>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 font-serif italic tracking-wide mb-1 opacity-60">cycle_complexity</span>
              <div className="flex gap-1 h-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i <= (complexity || 0) ? 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'bg-white/5'}`}></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isWorking && (
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#f39c12]/10 overflow-hidden">
          <div className="w-[40%] h-full bg-[#f39c12] animate-[shimmer_2s_infinite]"></div>
        </div>
      )}
    </div>
  );
});
