import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NudgeEngine() {
    const [nudges, setNudges] = useState([]);

    useEffect(() => {
        // Mock WebSocket or Polling for Nudges
        const interval = setInterval(() => {
            if (Math.random() > 0.8) {
                setNudges(prev => [...prev, { id: Date.now() + Math.random(), text: "HRV Baixa. Respire 4-7-8.", type: "warning" }]);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            <AnimatePresence>
                {nudges.map(nudge => (
                    <motion.div
                        key={nudge.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="bg-black/80 border border-[#00ff88] text-[#00ff88] p-4 rounded-xl backdrop-blur-md shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                    >
                        {nudge.text}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
