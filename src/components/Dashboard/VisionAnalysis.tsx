import React from 'react';
import { motion } from 'motion/react';
import { Camera, Layers } from 'lucide-react';

interface VisionAnalysisProps {
  visionResults: any;
}

export function VisionAnalysis({ visionResults }: VisionAnalysisProps) {
  return (
    <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00ff88]/40"></div>
      
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h3 className="text-[#00ff88] text-[10px] font-black tracking-[0.4em] uppercase flex items-center gap-3">
          <Camera size={18} />
          ANÁLISE_VISUAL
        </h3>
        {visionResults && (
          <div className="px-4 py-1.5 bg-[#00ff88]/10 rounded-full border border-[#00ff88]/20 text-[10px] font-black text-[#00ff88] tracking-widest">
            CONF: {visionResults.confidence}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {visionResults ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-8"
          >
            <div className="relative group/analysis">
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#00ff88]/40 transition-all group-hover/analysis:scale-110"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#00ff88]/40 transition-all group-hover/analysis:scale-110"></div>
              <p className="text-gray-300 text-xs leading-relaxed font-mono bg-black/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                {visionResults.analysis}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {visionResults.objects?.map((obj: any, i: number) => (
                <span key={`vision-obj-${i}`} className="px-3 py-1.5 bg-[#00ff88]/5 rounded-lg border border-[#00ff88]/20 text-[9px] font-black text-[#00ff88]/70 uppercase tracking-[0.2em] hover:text-[#00ff88] hover:border-[#00ff88]/50 hover:bg-[#00ff88]/10 transition-all cursor-default">
                  {typeof obj === 'string' ? obj : obj.label}
                </span>
              ))}
            </div>
            
            {visionResults.ocr && (
              <div className="p-6 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff88]/40 to-transparent"></div>
                <span className="text-[9px] text-gray-600 font-black tracking-[0.3em] uppercase block mb-4 flex items-center gap-2">
                  <Layers size={12} /> STREAM_OCR [{visionResults.ocr_language}]
                </span>
                <p className="text-[#00ff88]/90 font-mono text-xs leading-relaxed break-words selection:bg-[#00ff88] selection:text-black">
                  {visionResults.ocr}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-gray-700 group">
            <Camera size={64} className="mb-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700" />
            <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-30">Aguardando input visual...</span>
          </div>
        )}
      </div>
    </div>
  );
}
