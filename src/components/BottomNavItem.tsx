import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';

interface BottomNavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

export function BottomNavItem({ to, icon, label }: BottomNavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1.5 transition-all duration-500 relative ${
          isActive 
            ? 'text-[#00ff88] -translate-y-1' 
            : 'text-gray-600 hover:text-gray-400'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`p-2.5 rounded-2xl transition-all duration-500 relative ${
            isActive 
              ? 'bg-[#00ff88]/10 shadow-[0_0_25px_rgba(0,255,136,0.3)] border border-[#00ff88]/30' 
              : 'bg-white/5 border border-transparent'
          }`}>
            {icon}
            {isActive && (
              <motion.div 
                layoutId="bottomNavActive"
                className="absolute -inset-1 rounded-[1.25rem] border border-[#00ff88]/20 blur-[2px]"
              />
            )}
          </div>
          <span className="text-[7px] font-black tracking-[0.2em] uppercase">{label}</span>
          
          {isActive && (
            <motion.div 
              layoutId="bottomNavDot"
              className="w-1 h-1 rounded-full bg-[#00ff88] shadow-[0_0_5px_#00ff88]"
            />
          )}
        </>
      )}
    </NavLink>
  );
}
