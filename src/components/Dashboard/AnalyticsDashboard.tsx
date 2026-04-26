import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Battery, Zap, Activity, Clock } from 'lucide-react';

export function AnalyticsDashboard() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Generate initial mock data
    const initialData = Array.from({ length: 20 }).map((_, i) => ({
      time: Date.now() - (20 - i) * 1000,
      battery: 85 - (i * 0.1),
      latency: 120 + Math.random() * 30,
      nudgeScore: Math.random() * 100
    }));
    setData(initialData);

    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1), {
          time: Date.now(),
          battery: Math.max(0, prev[prev.length - 1].battery - 0.05),
          latency: 110 + Math.random() * 40, // Keeping < 150ms
          nudgeScore: Math.random() * 100
        }];
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Battery KPIs */}
      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 flex flex-col gap-4">
        <h3 className="text-[#00ff88] text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-3">
          <Battery size={16} />
          KPIs DE BATERIA (JANELA DE 24H)
        </h3>
        <div className="h-48 md:h-64 w-full min-h-[192px]">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#ffffff50" 
                fontSize={10} 
                tickMargin={10} 
                tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
              />
              <YAxis stroke="#ffffff50" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000000dd', borderColor: '#00ff8833', borderRadius: '1rem' }}
                itemStyle={{ color: '#00ff88', fontSize: '12px', fontWeight: 'bold' }}
                labelFormatter={(label) => new Date(label).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
              />
              <Area type="monotone" dataKey="battery" stroke="#00ff88" strokeWidth={2} fillOpacity={1} fill="url(#colorBattery)" name="Bateria" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latency & Nudges */}
      <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 flex flex-col gap-4">
        <h3 className="text-blue-400 text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-3">
          <Clock size={16} />
          LATÊNCIA E INTERVENÇÕES (&lt;150ms)
        </h3>
        <div className="h-48 md:h-64 w-full min-h-[192px]">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#ffffff50" 
                fontSize={10} 
                tickMargin={10} 
                tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
              />
              <YAxis stroke="#ffffff50" fontSize={10} domain={[0, 200]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000000dd', borderColor: '#60a5fa33', borderRadius: '1rem' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                labelFormatter={(label) => new Date(label).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
              />
              <Line type="monotone" dataKey="latency" stroke="#60a5fa" strokeWidth={2} dot={false} name="Latência (ms)" />
              <Line type="monotone" dataKey="nudgeScore" stroke="#f472b6" strokeWidth={2} dot={false} name="Atividade de Intervenção" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
