import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { MobileNavItem } from './MobileNavItem';
import { MAIN_NAV_ITEMS, CONFIG_NAV_ITEMS } from '../config/navigation';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="mobile-menu"
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-[#050505]/98 z-[60] flex flex-col items-center justify-center gap-8 p-8 sm:hidden"
        >
          <div className="absolute top-12 left-12 text-[#00ff88]/5 font-black text-9xl tracking-tighter select-none pointer-events-none">FRANK</div>
          
          <div className="flex flex-col items-center gap-6 w-full max-w-xs">
            {MAIN_NAV_ITEMS.map((item) => (
              <MobileNavItem 
                key={`${item.to}-${item.label}`}
                to={item.to}
                icon={item.icon}
                label={item.label}
                onClick={onClose}
              />
            ))}
            <div className="w-full h-[1px] bg-white/10 my-4"></div>
            {CONFIG_NAV_ITEMS.map((item) => (
              <MobileNavItem 
                key={`${item.to}-${item.label}`}
                to={item.to}
                icon={item.icon}
                label={item.label}
                onClick={onClose}
              />
            ))}
          </div>

          <button 
            onClick={onClose}
            className="mt-12 p-4 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/20 transition-all"
          >
            <X size={32} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
