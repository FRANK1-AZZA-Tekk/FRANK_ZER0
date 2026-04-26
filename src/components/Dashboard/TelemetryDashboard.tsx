import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Cpu, Layers, Zap, Radio, Watch, Smartphone } from 'lucide-react';
import { TelemetryStat } from './TelemetryStat';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface TelemetryDashboardProps {
  activeDevice: 'watch' | 'atom';
}

export function TelemetryDashboard({ activeDevice }: TelemetryDashboardProps) {
  const agents = useSelector((state: RootState) => state.swarm.agents);

  const [telemetry, setTelemetry] = useState({
    cpu: 42,
    ram: 68,
    temp: 36.5,
    signal: -64,
    load: 45
  });

  useEffect(() => {
    const interval = setInterval(() => {
      let activeLoad = 0;
      let activeCount = 0;

      Object.values(agents).forEach(agent => {
        if (agent.status === 'working') {
          activeCount++;
          if (agent.name === 'RESEARCH_AGENT') activeLoad += 35;
          else if (agent.name === 'VISION_AGENT') activeLoad += 40;
          else if (agent.name === 'CONTEXT_AGENT') activeLoad += 20;
          else if (agent.name === 'VOICE_AGENT') activeLoad += 15;
          else activeLoad += 10;
        }
      });

      const baseLoad = 10 + Math.random() * 5;
      const calculatedCpu = Math.min(99, Math.floor(baseLoad + activeLoad + (Math.random() * 5)));
      const calculatedRam = Math.min(95, Math.floor(40 + (activeCount * 8) + (Math.random() * 10)));
      const calculatedTemp = 35 + (calculatedCpu * 0.15) + (Math.random() * 2);

      setTelemetry(prev => ({
        cpu: calculatedCpu,
        ram: calculatedRam,
        temp: calculatedTemp,
        signal: -60 - Math.floor(Math.random() * 10),
        load: Math.min(100, Math.floor(20 + (activeCount * 15) + Math.random() * 10))
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [agents]);

  return (
    <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1.5 h-full bg-[#00ff88]/40"></div>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h3 className="text-[#00ff88] text-[10px] font-black tracking-[0.4em] uppercase flex items-center gap-3">
          <Activity size={18} />
          TELEMETRIA_DO_NÓ
        </h3>
        <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 tracking-widest uppercase">
          {activeDevice === 'watch' ? <Watch size={14} /> : <Smartphone size={14} />}
          {activeDevice === 'watch' ? 'T-WATCH_S3' : 'ATOM_S3R'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <TelemetryStat label="CARGA_CPU" value={`${telemetry.cpu}%`} icon={<Cpu size={12}/>} color="text-[#00ff88]" />
        <TelemetryStat label="USO_RAM" value={`${telemetry.ram}%`} icon={<Layers size={12}/>} color="text-blue-400" />
        <TelemetryStat label="TEMP_NÚCLEO" value={`${telemetry.temp.toFixed(1)}°C`} icon={<Zap size={12}/>} color="text-yellow-500" />
        <TelemetryStat label="SINAL" value={`${telemetry.signal}dBm`} icon={<Radio size={12}/>} color="text-purple-400" />
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex justify-between text-[9px] font-black text-gray-600 tracking-widest uppercase">
          <span>Buffer_Sync_Neural</span>
          <span className="text-[#00ff88]">{telemetry.load}%</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            animate={{ width: `${telemetry.load}%` }}
            className="h-full bg-[#00ff88] shadow-[0_0_15px_#00ff88]"
          ></motion.div>
        </div>
      </div>
    </div>
  );
}
