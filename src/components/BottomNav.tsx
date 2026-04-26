import React from 'react';
import { BottomNavItem } from './BottomNavItem';
import { LayoutDashboard, Database, Activity, Search, Settings, CheckSquare, Zap, Command } from 'lucide-react';

export function BottomNav({ onOpenCommandHub }: { onOpenCommandHub?: () => void }) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-[#00ff88]/10 flex justify-around items-center h-20 px-2 z-50 rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <BottomNavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="DASH" />
      <BottomNavItem to="/tasks" icon={<CheckSquare size={20} />} label="TASKS" />
      
      {/* Central Hub Button */}
      <button 
        onClick={onOpenCommandHub}
        className="flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/50 text-[#00ff88] -mt-6 hover:bg-[#00ff88] hover:text-black transition-all shadow-[0_0_20px_rgba(0,255,136,0.3)] z-[60]"
      >
        <Command size={22} />
      </button>

      <BottomNavItem to="/memory" icon={<Database size={20} />} label="MEM" />
      <BottomNavItem to="/evolution" icon={<Zap size={20} />} label="EVO" />
    </nav>
  );
}
