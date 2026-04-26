import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldAlert, Key, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return window.location.origin;
};

export default function VaultSettings() {
  const [keys, setKeys] = useState<Record<string, string>>({
    GROQ_API_KEY: '',
    DEEPSEEK_API_KEY: '',
    OPENROUTER_API_KEY: '',
    GEMINI_API_KEY: '',
    PERPLEXITY_API_KEY: '',
    TAVILY_API_KEY: '',
    ELEVENLABS_API_KEY: '',
    CARTESIA_API_KEY: '',
    DEEPGRAM_API_KEY: '',
    WEATHER_API_KEY: '',
    OLLAMA_HOST: ''
  });
  
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<{ type: 'idle' | 'saving' | 'success' | 'error', msg: string }>({ type: 'idle', msg: '' });

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/vault/keys`);
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys);
      }
    } catch (e) {
      console.error("Failed to fetch keys", e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeys({ ...keys, [e.target.name]: e.target.value });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value.includes('***')) {
      setKeys({ ...keys, [e.target.name]: '' });
    }
  };

  const toggleVisibility = (keyName: string) => {
    setVisibleKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleSave = async () => {
    setStatus({ type: 'saving', msg: 'ENCRYPTING_VAULT_DATA...' });
    try {
      const res = await fetch(`${getApiUrl()}/vault/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys })
      });
      
      if (res.ok) {
        setStatus({ type: 'success', msg: 'VAULT_SECURED_SUCCESSFULLY' });
        setTimeout(() => setStatus({ type: 'idle', msg: '' }), 3000);
        fetchKeys(); // Refresh masked keys
      } else {
        setStatus({ type: 'error', msg: 'ENCRYPTION_FAILED' });
      }
    } catch (e) {
      setStatus({ type: 'error', msg: 'VAULT_UNREACHABLE' });
    }
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 w-full min-h-screen relative overflow-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.05)_0%,transparent_50%)] pointer-events-none"></div>
      
      <div className="w-full max-w-4xl z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6"
        >
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-[0.3em] mb-4" style={{ textShadow: '0 0 30px rgba(0,255,136,0.3)' }}>
              API_VAULT
            </h1>
            <div className="flex items-center gap-4 text-[10px] font-black tracking-widest text-[#00ff88]/60 uppercase">
              <span className="flex items-center gap-1.5"><ShieldAlert size={14}/> AES-256_ENCRYPTED</span>
              <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
              <span className="flex items-center gap-1.5"><Lock size={14}/> LOCAL_STORAGE_ONLY</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/40 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
            <div className="flex flex-col items-end px-4">
              <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase mb-1">Vault_Status</span>
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse shadow-[0_0_10px_#00ff88]"></div>
                <span className="text-xs font-black text-[#00ff88] tracking-widest">SECURE</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-[#00ff88]/40"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {Object.keys(keys).map((keyName, index) => (
              <motion.div 
                key={keyName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col gap-3"
              >
                <label className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase flex items-center gap-2">
                  <Key size={12} className="text-[#00ff88]" />
                  {keyName.replace(/_/g, ' ')}
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00ff88]/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative flex items-center bg-black/80 border border-white/10 rounded-2xl overflow-hidden focus-within:border-[#00ff88]/50 transition-colors">
                    <input
                      type={visibleKeys[keyName] ? "text" : "password"}
                      name={keyName}
                      value={keys[keyName]}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      placeholder={keyName === 'OLLAMA_HOST' ? 'http://127.0.0.1:11434' : 'Enter API Key...'}
                      className="w-full bg-transparent px-4 py-4 text-sm text-white placeholder-gray-700 focus:outline-none focus:ring-0 font-mono tracking-widest"
                    />
                    <button 
                      type="button"
                      onClick={() => toggleVisibility(keyName)}
                      className="p-4 text-gray-500 hover:text-[#00ff88] transition-colors"
                    >
                      {visibleKeys[keyName] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/5 gap-6">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {status.msg && (
                  <motion.div 
                    key={status.msg}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-center gap-3 text-[10px] font-black tracking-widest uppercase px-4 py-3 rounded-xl border ${
                      status.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 
                      status.type === 'success' ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]' : 
                      'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    }`}
                  >
                    {status.type === 'error' && <AlertTriangle size={14} />}
                    {status.type === 'success' && <CheckCircle2 size={14} />}
                    {status.type === 'saving' && <Loader2 size={14} className="animate-spin" />}
                    {status.msg}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={handleSave}
              disabled={status.type === 'saving'}
              className="w-full sm:w-auto px-10 py-4 bg-[#00ff88] text-black rounded-2xl font-black uppercase tracking-[0.3em] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
            >
              {status.type === 'saving' ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} className="group-hover:scale-110 transition-transform" />
              )}
              <span>{status.type === 'saving' ? 'ENCRYPTING...' : 'SAVE_VAULT'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
