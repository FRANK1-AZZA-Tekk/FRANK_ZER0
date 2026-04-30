import React, { useState } from 'react';
import { Bell, Activity, Shield, Zap, Clock, CheckCircle2, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Nudge {
  id: string;
  title: string;
  message: string;
  category: 'health' | 'productivity' | 'security' | 'system';
  time: string;
  status: 'active' | 'completed' | 'dismissed';
  device: 'watch' | 'atom' | 'phone';
}

const MOCK_NUDGES: Nudge[] = [
  { id: 'n1', title: 'Posture Check', message: 'You have been sitting for 2 hours. Stand up and stretch.', category: 'health', time: '10:30 AM', status: 'active', device: 'watch' },
  { id: 'n2', title: 'Focus Block', message: 'Deep work session starting in 5 mins. Muting non-essential alerts.', category: 'productivity', time: '11:00 AM', status: 'active', device: 'phone' },
  { id: 'n3', title: 'Network Anomaly', message: 'Unrecognized device attempting BLE pairing. Blocked.', category: 'security', time: '09:105:00 AM', status: 'completed', device: 'atom' },
  { id: 'n4', title: 'Battery Optimization', message: 'T-Watch S3 battery at 20%. Switching to low power mode.', category: 'system', time: '08:405:00 AM', status: 'completed', device: 'watch' },
];

export default function Nudges() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [nudges, setNudges] = useState<Nudge[]>(MOCK_NUDGES);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newNudge, setNewNudge] = useState<Partial<Nudge>>({
    title: '',
    message: '',
    category: 'productivity',
    device: 'phone'
  });

  const activeNudges = nudges.filter(n => n.status === 'active');
  const historyNudges = nudges.filter(n => n.status !== 'active');

  const completeNudge = async (id: string) => {
    setIsProcessing(id);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const res = await fetch(`${apiUrl}/api/v1/nudges/${id}/complete`, {
        method: 'POST'
      });
      
      if (res.ok) {
        setNudges(prev => prev.map(n => n.id === id ? { ...n, status: 'completed' } : n));
      } else {
        console.warn("API returned non-OK, applying local fallback");
        setNudges(prev => prev.map(n => n.id === id ? { ...n, status: 'completed' } : n));
      }
    } catch (error) {
      console.error("Failed to complete nudge via API, applying local fallback", error);
      setNudges(prev => prev.map(n => n.id === id ? { ...n, status: 'completed' } : n));
    } finally {
      setIsProcessing(null);
    }
  };

  const dismissNudge = async (id: string) => {
    setIsProcessing(id);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const res = await fetch(`${apiUrl}/api/v1/nudges/${id}/dismiss`, {
        method: 'POST'
      });
      
      if (res.ok) {
        setNudges(prev => prev.map(n => n.id === id ? { ...n, status: 'dismissed' } : n));
      } else {
        console.warn("API returned non-OK, applying local fallback");
        setNudges(prev => prev.map(n => n.id === id ? { ...n, status: 'dismissed' } : n));
      }
    } catch (error) {
      console.error("Failed to dismiss nudge via API, applying local fallback", error);
      setNudges(prev => prev.map(n => n.id === id ? { ...n, status: 'dismissed' } : n));
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCreateNudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNudge.title || !newNudge.message) return;
    
    const nudge: Nudge = {
      id: `n-${Date.now()}`,
      title: newNudge.title,
      message: newNudge.message,
      category: newNudge.category as any,
      device: newNudge.device as any,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'active'
    };
    
    setNudges(prev => [nudge, ...prev]);
    setIsCreating(false);
    setNewNudge({ title: '', message: '', category: 'productivity', device: 'phone' });
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 w-full min-h-screen relative overflow-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,0,255,0.05)_0%,transparent_50%)] pointer-events-none"></div>
      
      <div className="w-full max-w-6xl z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6"
        >
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-[0.3em] mb-4" style={{ textShadow: '0 0 30px rgba(255,0,255,0.3)' }}>
              NUDGE_PROTOCOL
            </h1>
            <div className="flex items-center gap-4 text-[10px] font-black tracking-widest text-[#ff00ff]/60 uppercase">
              <span className="flex items-center gap-1.5"><Bell size={14}/> PROACTIVE_ALERTS</span>
              <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
              <span className="flex items-center gap-1.5"><Activity size={14}/> BEHAVIORAL_SYNC</span>
            </div>
          </div>

          <button 
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-[#ff00ff]/10 hover:bg-[#ff00ff]/20 rounded-2xl border border-[#ff00ff]/30 text-[#ff00ff] font-black tracking-widest uppercase text-xs transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,0,255,0.1)]"
          >
            <Plus size={16} />
            CREATE_NUDGE
          </button>
        </motion.div>

        <div className="flex gap-4 mb-8">
          <TabButton active={activeTab === 'active'} onClick={() => setActiveTab('active')} label={`ACTIVE_QUEUE (${activeNudges.length})`} />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="NUDGE_HISTORY" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {(activeTab === 'active' ? activeNudges : historyNudges).map((nudge) => (
                <NudgeCard 
                  key={nudge.id} 
                  nudge={nudge} 
                  onComplete={() => completeNudge(nudge.id)}
                  onDismiss={() => dismissNudge(nudge.id)}
                  isProcessing={isProcessing === nudge.id}
                />
              ))}
              {(activeTab === 'active' && activeNudges.length === 0) && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-12 border border-white/5 border-dashed rounded-[2rem] flex flex-col items-center justify-center text-gray-500"
                >
                  <CheckCircle2 size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-black tracking-widest uppercase">NO_ACTIVE_NUDGES</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 flex flex-col gap-6">
              <h3 className="text-[#ff00ff] text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-3">
                <Activity size={16} />
                NUDGE_ANALYTICS
              </h3>
              
              <div className="flex flex-col gap-4">
                <AnalyticsStat label="COMPLETION_RATE" value="87%" color="text-[#00ff88]" />
                <AnalyticsStat label="AVG_RESPONSE_TIME" value="1.2s" color="text-blue-400" />
                <AnalyticsStat label="IGNORED_NUDGES" value="3" color="text-red-500" />
              </div>

              <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[9px] font-black text-gray-500 tracking-widest uppercase mb-3">
                  <span>Behavioral_Alignment</span>
                  <span className="text-[#ff00ff]">92%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '92%' }}
                    className="h-full bg-[#ff00ff] shadow-[0_0_10px_#ff00ff]"
                  ></motion.div>
                </div>
              </div>
            </div>

            <div className="bg-[#ff00ff]/5 rounded-[2rem] border border-[#ff00ff]/20 p-8 flex flex-col gap-4">
              <h3 className="text-[10px] font-black text-[#ff00ff] tracking-[0.2em] uppercase mb-2">CONTEXT_AWARENESS</h3>
              <p className="text-xs text-gray-400 font-mono leading-relaxed">
                YBY is currently monitoring your biometric data via T-Watch S3 and environmental context via AtomS3R to deliver timely, non-intrusive nudges.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Nudge Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#050505] border border-[#ff00ff]/30 rounded-3xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(255,0,255,0.1)] flex flex-col"
            >
              <div className="p-6 border-b border-white/10 bg-gradient-to-b from-[#ff00ff]/10 to-transparent relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent"></div>
                <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                  <Plus size={20} className="text-[#ff00ff]" />
                  CREATE_NUDGE
                </h2>
              </div>
              
              <form onSubmit={handleCreateNudge} className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-500 tracking-widest uppercase">TITLE</label>
                  <input 
                    type="text" 
                    value={newNudge.title}
                    onChange={e => setNewNudge({...newNudge, title: e.target.value})}
                    placeholder="E.g., Hydration Check"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff00ff]/50 transition-colors"
                    required
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-500 tracking-widest uppercase">MESSAGE</label>
                  <textarea 
                    value={newNudge.message}
                    onChange={e => setNewNudge({...newNudge, message: e.target.value})}
                    placeholder="E.g., Drink a glass of water."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff00ff]/50 transition-colors resize-none h-24"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-500 tracking-widest uppercase">CATEGORY</label>
                    <select 
                      value={newNudge.category}
                      onChange={e => setNewNudge({...newNudge, category: e.target.value as any})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff00ff]/50 transition-colors appearance-none"
                    >
                      <option value="health">Health</option>
                      <option value="productivity">Productivity</option>
                      <option value="security">Security</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-500 tracking-widest uppercase">DEVICE</label>
                    <select 
                      value={newNudge.device}
                      onChange={e => setNewNudge({...newNudge, device: e.target.value as any})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff00ff]/50 transition-colors appearance-none"
                    >
                      <option value="watch">T-Watch S3</option>
                      <option value="atom">AtomS3R</option>
                      <option value="phone">Xiaomi 12</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold tracking-widest text-xs transition-all uppercase"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[#ff00ff] text-black font-black tracking-widest text-xs hover:bg-[#ff00ff]/80 hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all uppercase"
                  >
                    DEPLOY_NUDGE
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${
        active 
          ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
          : 'bg-transparent text-gray-500 border border-transparent hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

function NudgeCard({ nudge, onComplete, onDismiss, isProcessing }: { nudge: Nudge, onComplete: () => void, onDismiss: () => void, isProcessing?: boolean }) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health': return <Activity size={16} className="text-[#00ff88]" />;
      case 'productivity': return <Zap size={16} className="text-yellow-500" />;
      case 'security': return <Shield size={16} className="text-red-500" />;
      case 'system': return <Clock size={16} className="text-blue-400" />;
      default: return <Bell size={16} className="text-gray-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'health': return 'border-[#00ff88]/30 bg-[#00ff88]/5';
      case 'productivity': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'security': return 'border-red-500/30 bg-red-500/5';
      case 'system': return 'border-blue-400/30 bg-blue-400/5';
      default: return 'border-white/10 bg-white/5';
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      className={`p-6 rounded-[2rem] border backdrop-blur-xl flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between group transition-all duration-500 ${getCategoryColor(nudge.category)} ${nudge.status !== 'active' ? 'opacity-60 grayscale' : ''}`}
    >
      <div className="flex items-start gap-5 flex-1">
        <div className="p-3 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
          {getCategoryIcon(nudge.category)}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-white tracking-widest uppercase">{nudge.title}</h3>
            <span className="px-2 py-0.5 rounded-md bg-black/50 border border-white/5 text-[8px] font-black text-gray-400 tracking-widest uppercase">
              {nudge.device}
            </span>
          </div>
          <p className="text-xs text-gray-400 font-mono leading-relaxed">{nudge.message}</p>
          <div className="flex items-center gap-2 mt-2 text-[9px] font-black text-gray-500 tracking-widest uppercase">
            <Clock size={10} />
            {nudge.time}
          </div>
        </div>
      </div>

      {nudge.status === 'active' && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={onDismiss}
            disabled={isProcessing}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl border border-white/10 text-[10px] font-black text-gray-400 tracking-widest uppercase transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}`}
          >
            DISMISS
          </button>
          <button 
            onClick={onComplete}
            disabled={isProcessing}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-[10px] font-black text-white tracking-widest uppercase transition-colors flex items-center justify-center gap-2 ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'}`}
          >
            {isProcessing ? 'PROCESSING...' : 'ACKNOWLEDGE'}
            {!isProcessing && <ChevronRight size={12} />}
          </button>
        </div>
      )}
      {nudge.status !== 'active' && (
        <div className="px-4 py-2 rounded-xl bg-black/40 border border-white/5 text-[10px] font-black text-gray-500 tracking-widest uppercase">
          {nudge.status}
        </div>
      )}
    </motion.div>
  );
}

function AnalyticsStat({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
      <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">{label}</span>
      <span className={`text-lg font-black tracking-widest tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
