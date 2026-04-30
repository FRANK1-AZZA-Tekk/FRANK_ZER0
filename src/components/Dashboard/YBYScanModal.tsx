import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, TerminalSquare, AlertTriangle, Check, Shield, FileCode2, ChevronRight, Minimize2, Loader2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addLog } from '../../store/slices/swarmSlice';

interface YBYScanModalProps {
  scanId: string;
  report: string;
  diff: string;
  onClose: () => void;
  onApprove: (id: string) => Promise<boolean>;
}

export function YBYScanModal({ scanId, report, diff, onClose, onApprove }: YBYScanModalProps) {
  const dispatch = useDispatch();
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);

  const handleApprove = async () => {
    setIsMerging(true);
    dispatch(addLog({
      message: `Iniciando processo de MERGE da otimização ${scanId}...`,
      origin: 'EVOLUÇÃO',
      type: 'info'
    }));

    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress < 90) setMergeProgress(progress);
    }, 400);

    const success = await onApprove(scanId);

    clearInterval(progressInterval);
    setMergeProgress(100);

    if (success) {
      dispatch(addLog({
        message: 'MERGE CONCLUÍDO. O sistema foi reiniciado e otimizado com sucesso.',
        origin: 'EVOLUÇÃO',
        type: 'success'
      }));
    } else {
      dispatch(addLog({
        message: 'ERRO. O merge falhou ou foi abortado.',
        origin: 'EVOLUÇÃO',
        type: 'error'
      }));
    }

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#050505] border border-blue-500/30 rounded-3xl w-full max-w-4xl overflow-hidden shadow-[0_0_80px_rgba(59,130,246,0.15)] flex flex-col max-h-full"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-b from-blue-500/10 to-transparent relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          <div className="flex items-center justify-between relative z-10 w-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                <TerminalSquare size={28} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">Relatório YBY-SCAN</h2>
                <p className="text-xs text-blue-400 font-mono mt-1">ID: {scanId} | STATUS: AGUARDANDO APROVAÇÃO</p>
              </div>
            </div>
            {!isMerging && (
              <button 
                onClick={onClose}
                className="p-3 bg-white/5 rounded-xl border border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-all"
              >
                <Minimize2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-0 overflow-y-auto flex-1 flex flex-col sm:flex-row bg-[#080808]">
          {/* Markdown Report Side */}
          <div className="w-full sm:w-1/3 p-6 border-b sm:border-b-0 sm:border-r border-white/5 bg-black/20 flex flex-col gap-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
               <Sparkles size={16} className="text-[#00ff88]" />
               <h3 className="text-xs font-black text-white tracking-widest uppercase">Overview da Evolução</h3>
            </div>
            
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-blue-400 prose-a:text-blue-500 font-mono">
              <div dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br />') }} />
            </div>

            <div className="mt-auto pt-6 border-t border-white/5">
              <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle size={14} />
                  <span className="text-[10px] font-black tracking-widest uppercase">Human-in-the-Loop Requerido</span>
                </div>
                <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                  O YBY-SCAN propôs uma alteração direta no `server.ts`. 
                  Revise o diff de código minuciosamente antes de aprovar. 
                  Um snapshot automático .bak será criado por segurança.
                </p>
              </div>
            </div>
          </div>

          {/* Unified Diff Side */}
          <div className="w-full sm:w-2/3 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
               <FileCode2 size={16} className="text-gray-400" />
               <h3 className="text-xs font-black text-gray-400 tracking-widest uppercase">Diff Code: server.ts</h3>
            </div>
            <div className="flex-1 bg-[#030303] rounded-2xl border border-white/5 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed relative rounded-xl custom-scrollbar shadow-inner">
               <pre className="whitespace-pre-wrap"><code dangerouslySetInnerHTML={{ __html: diff.replace(/^(diff .*|index .*|--- .*|\+\+\+ .*)$/gm, '<span class="text-gray-500 font-bold">$1</span>').replace(/^(-.*)$/gm, '<span class="text-red-400 bg-red-400/10 block w-full">$1</span>').replace(/^(\+.*)$/gm, '<span class="text-[#00ff88] bg-[#00ff88]/10 block w-full">$1</span>') }} /></pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/60 flex-shrink-0">
          {isMerging ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-xs font-mono text-blue-400">
                <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> EXECUTANDO MERGE NA BASE DE CÓDIGO...</span>
                <span>{Math.floor(mergeProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                  style={{ width: `${mergeProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={onClose}
                className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold tracking-widest text-xs transition-all uppercase"
              >
                Abortar / Dispensar
              </button>
              <button 
                onClick={handleApprove}
                className="px-8 py-3 rounded-xl bg-blue-500 text-black font-black tracking-widest text-sm hover:bg-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all flex items-center gap-2 uppercase group"
              >
                <Shield size={16} className="group-hover:scale-110 transition-transform" />
                APROVAR MERGE
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
