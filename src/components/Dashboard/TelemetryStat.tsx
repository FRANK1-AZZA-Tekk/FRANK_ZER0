import React from 'react';

interface TelemetryStatProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

export function TelemetryStat({ label, value, icon, color }: TelemetryStatProps) {
  return (
    <div className="flex flex-col gap-3 p-3 sm:p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-white/20 transition-all group relative overflow-hidden">
      <div className="absolute inset-0 scanline-overlay opacity-5 group-hover:opacity-10"></div>
      <div className="flex items-center justify-between relative z-10">
        <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${color} group-hover:scale-110 group-hover:glow-border transition-all duration-500`}>
          {icon}
        </div>
        <div className="flex flex-col items-end">
          <div className="w-10 hardware-dashed h-[1px]"></div>
          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#00ff88]/20 group-hover:bg-[#00ff88] group-hover:shadow-[0_0_10px_#00ff88] transition-all duration-500"></div>
        </div>
      </div>
      <div className="flex flex-col relative z-10">
        <span className="text-[9px] sm:text-[10px] text-gray-500 font-black tracking-widest uppercase mb-1">{label}</span>
        <span className={`text-lg sm:text-xl font-black font-mono tracking-tighter ${color} drop-shadow-lg`}>{value}</span>
      </div>
      <div className="absolute bottom-0 right-0 p-1 opacity-10">
        <div className="w-4 h-4 border-r border-b border-white"></div>
      </div>
    </div>
  );
}
