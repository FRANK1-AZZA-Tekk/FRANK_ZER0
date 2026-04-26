import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Terminal, Search, Zap, CheckSquare, Layers, Database, 
  Settings, Cpu, Activity, LayoutDashboard, Globe, X, Command
} from 'lucide-react';
import { MAIN_NAV_ITEMS, CONFIG_NAV_ITEMS } from '../config/navigation';

interface CommandHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandHub({ isOpen, onClose }: CommandHubProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Handle global shortcuts to open Command Hub
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle string `Cmd/Ctrl + K`
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open not handled here because this component is only rendered sometimes, 
          // wait, let's assume it mounts when it's open, or it's always mounted and controlled via visibility.
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const allItems = [...MAIN_NAV_ITEMS, ...CONFIG_NAV_ITEMS];
  
  const filteredItems = searchQuery 
    ? allItems.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.tooltip.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allItems;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4 sm:px-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-black/90 border border-[#00ff88]/30 rounded-3xl shadow-[0_0_50px_rgba(0,255,136,0.15)] overflow-hidden flex flex-col"
          >
            {/* Search Input */}
            <div className="flex items-center px-6 py-4 border-b border-white/10 bg-white/5 relative">
              <Command className="w-6 h-6 text-[#00ff88] mr-4 opacity-70" />
              <input
                autoFocus
                type="text"
                placeholder="PROCURAR FERRAMENTA OU COMANDO... (VOZ OU MICRO-MOVIMENTO)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-lg font-mono text-white placeholder:text-gray-600 focus:outline-none"
              />
              <button 
                onClick={onClose}
                className="ml-4 p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
              <div className="text-[10px] items-center mb-4 text-[#00ff88] font-black tracking-[0.3em] uppercase flex justify-between px-2">
                <span>Hub_Central // Exocórtex FRANK</span>
                <span>(CTRL+K)</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredItems.map((item, idx) => (
                  <button
                    key={`${item.to}-${idx}`}
                    onClick={() => handleNavigate(item.to)}
                    className="flex flex-col items-start gap-4 p-5 rounded-2xl bg-white/5 hover:bg-[#00ff88]/10 border border-white/5 hover:border-[#00ff88]/30 transition-all text-left group"
                  >
                    <div className="text-[#00ff88]/70 group-hover:text-[#00ff88] group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white tracking-widest uppercase mb-1">{item.label}</h4>
                      <p className="text-[10px] text-gray-500 font-mono tracking-wide">{item.tooltip}</p>
                    </div>
                  </button>
                ))}
                
                {filteredItems.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500 font-mono">
                    Nenhum módulo encontrado.
                  </div>
                )}
              </div>
            </div>
            
            {/* Context/Telemetry Footer */}
            <div className="bg-[#00ff88]/5 border-t border-[#00ff88]/10 p-4 px-6 flex justify-between items-center text-[10px] font-mono text-[#00ff88]/70">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2"><Activity size={12} /> REDE NEURAL ONLINE</span>
                <span className="flex items-center gap-2"><Cpu size={12} /> INFERÊNCIA LOCAL</span>
              </div>
              <span className="tracking-[0.2em] uppercase font-black">"FUNCTION OVER FORM"</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
