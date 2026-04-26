import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Check, Image as ImageIcon } from 'lucide-react';
import { PREDEFINED_ICONS, IconName } from '../../utils/icons';

interface AgentIconSettingsModalProps {
  agentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (iconName?: string, customUrl?: string) => void;
  currentIconName?: string;
  currentCustomUrl?: string;
}

export function AgentIconSettingsModal({ 
  agentName, 
  isOpen, 
  onClose, 
  onSave,
  currentIconName,
  currentCustomUrl
}: AgentIconSettingsModalProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(currentIconName);
  const [customUrl, setCustomUrl] = useState<string | undefined>(currentCustomUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCustomUrl(result);
      setSelectedIcon(undefined);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-white tracking-widest uppercase">Customizar_Agente</h3>
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">{agentName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <label className="text-[10px] font-black text-[#00ff88] tracking-widest uppercase mb-4 block">Design_Predefinido</label>
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(PREDEFINED_ICONS).map(([name, Icon]) => (
                <button
                  key={name}
                  onClick={() => {
                    setSelectedIcon(name);
                    setCustomUrl(undefined);
                  }}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-center ${
                    selectedIcon === name 
                      ? 'bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88]' 
                      : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                  }`}
                >
                  <Icon size={20} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-[#00ff88] tracking-widest uppercase mb-4 block">Upload_Personalizado</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full aspect-video rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                customUrl 
                  ? 'border-[#00ff88]/50 bg-[#00ff88]/5' 
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              {customUrl ? (
                <div className="relative group">
                  <img src={customUrl} alt="Preview" className="max-h-24 rounded-lg shadow-2xl" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <Upload size={20} className="text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={32} className="text-gray-700 mb-2" />
                  <span className="text-[10px] font-bold text-gray-600 tracking-widest uppercase">Arraste ou clique para upload</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>

        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase hover:text-white transition-colors"
          >
            CANCELAR
          </button>
          <button 
            onClick={() => onSave(selectedIcon, customUrl)}
            className="flex-1 py-4 bg-[#00ff88] text-black text-[10px] font-black tracking-[0.2em] uppercase rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,255,136,0.3)] flex items-center justify-center gap-2"
          >
            <Check size={14} strokeWidth={3} />
            CONFIRMAR_UPDATE
          </button>
        </div>
      </motion.div>
    </div>
  );
}
