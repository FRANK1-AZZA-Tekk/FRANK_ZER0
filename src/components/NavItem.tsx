import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  tooltip?: string;
}

export function NavItem({ to, icon, label, tooltip }: NavItemProps) {
  return (
    <NavLink
      to={to}
      title={tooltip}
      className={({ isActive }) =>
        `flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase transition-all duration-500 group relative overflow-hidden ${
          isActive
            ? 'text-[#00ff88] bg-[#00ff88]/10 shadow-[0_0_30px_rgba(0,255,136,0.1)] border border-[#00ff88]/30'
            : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="transition-all duration-500 group-hover:scale-110 group-active:scale-95 relative z-10">
            {icon}
            <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#00ff88] opacity-0 group-hover:opacity-100 transition-opacity animate-pulse shadow-[0_0_10px_#00ff88]"></div>
          </div>
          <span className="hidden lg:inline transition-all duration-500 group-hover:translate-x-1 z-10 font-black tracking-[0.2em]">{label}</span>
          
          {/* Active Indicator Line */}
          {isActive && (
            <motion.div 
              layoutId="navActiveLine"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00ff88] rounded-r-full shadow-[0_0_20px_#00ff88] z-20" 
            />
          )}

          {/* Scanline Effect on Hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,#00ff88_50%)] bg-[length:100%_2px] animate-[scanline_1s_linear_infinite]"></div>
          </div>

          {/* Hover Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        </>
      )}
    </NavLink>
  );
}
