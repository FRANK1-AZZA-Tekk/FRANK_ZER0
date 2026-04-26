import React from 'react';
import { motion } from 'motion/react';

interface StatusItemProps {
  label: string;
  value: string;
  progress: number;
  color: string;
}

export function StatusItem({ label, value, progress, color }: StatusItemProps) {
  // Extract text color from bg color for consistent styling
  const textColorClass = color.includes('bg-[#00ff88]') ? 'text-[#00ff88]' : 
                        color.includes('bg-blue-400') ? 'text-blue-400' : 
                        color.includes('bg-purple-400') ? 'text-purple-400' : 
                        'text-white';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-[9px] font-bold text-gray-500 tracking-widest uppercase">
        <span>{label}</span>
        <span className={textColorClass}>{value}</span>
      </div>
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full ${color} shadow-[0_0_10px_currentColor]`}
        ></motion.div>
      </div>
    </div>
  );
}
