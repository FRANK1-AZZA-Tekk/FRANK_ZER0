import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface MobileNavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export function MobileNavItem({ to, icon, label, onClick }: MobileNavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center justify-between w-full px-8 py-4 rounded-2xl transition-all duration-500 group ${
          isActive 
            ? 'bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] shadow-[0_0_30px_rgba(0,255,136,0.2)]' 
            : 'text-gray-500 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-6">
            <div className="group-hover:rotate-12 transition-transform">{icon}</div>
            <span className="text-xl font-black tracking-[0.3em] uppercase">{label}</span>
          </div>
          <ChevronRight size={20} className={`transition-transform duration-500 ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`} />
        </>
      )}
    </NavLink>
  );
}
