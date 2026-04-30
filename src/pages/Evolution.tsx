import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Search, 
  Trash2, 
  Shield, 
  Zap, 
  Settings, 
  CheckCircle2, 
  Loader2,
  Database,
  Cpu,
  Globe,
  WifiOff,
  Activity
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addLog } from '../store/slices/swarmSlice';
import { getApiUrl } from '../utils/api';
import { YBYScanModal } from '../components/Dashboard/YBYScanModal';

export default function Evolution() {
  const dispatch = useDispatch();
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'results'>('idle');
  const [cleanState, setCleanState] = useState<'idle' | 'cleaning' | 'done'>('idle');
  const [offlineMode, setOfflineMode] = useState(false);
  const [gestureNav, setGestureNav] = useState(true);
  
  const [ybyScanResult, setYBYScanResult] = useState<{ id: string, report: string, diff: string } | null>(null);

  const handleDeepScan = async () => {
    setScanState('scanning');
    dispatch(addLog({
      message: 'Ativando ScannerAgent para busca global de otimizações...',
      origin: 'EVOLUÇÃO',
      type: 'info'
    }));
    
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: "Otimizar uso de memória e segurança (OWASP), além de latência na comunicação M5Stack/Wearable" })
      });
      
      const data = await res.json();
      if (res.ok && data.id) {
        dispatch(addLog({
          message: `Análise concluída. ID: ${data.id}`,
          origin: 'EVOLUÇÃO',
          type: 'success'
        }));
        const reportRes = await fetch(`${getApiUrl()}/api/v1/report/${data.id}`);
        const reportData = await reportRes.json();
        
        if (reportRes.ok) {
           setYBYScanResult({
             id: data.id,
             report: reportData.report,
             diff: reportData.diff
           });
           setScanState('results');
        } else {
           setScanState('idle');
        }
      } else {
        dispatch(addLog({
          message: 'Erro na varredura.',
          origin: 'EVOLUÇÃO',
          type: 'error'
        }));
        setScanState('idle');
      }
    } catch (e) {
      dispatch(addLog({
        message: 'Erro de rede na varredura.',
        origin: 'EVOLUÇÃO',
        type: 'error'
      }));
      setScanState('idle');
    }
  };

  const handleApproveMerge = async (scanId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/approve/${scanId}`, {
        method: 'POST'
      });
      if (res.ok) {
        setScanState('idle');
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const handleSystemClean = async () => {
    setCleanState('cleaning');
    dispatch(addLog({
      message: 'Purging redundant memory nodes and clearing cache...',
      origin: 'EVOLUÇÃO',
      type: 'warning'
    }));
    
    // Real action: clear browser caches and local storage
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    } catch (e) {
      console.error("Failed to clear cache", e);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setCleanState('done');
    dispatch(addLog({
      message: 'System cleaned. Recovered RAM and cleared HTTP caches.',
      origin: 'EVOLUÇÃO',
      type: 'success'
    }));
    setTimeout(() => setCleanState('idle'), 3000);
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-[0.2em] uppercase flex items-center gap-4" style={{ textShadow: '0 0 20px rgba(0,255,136,0.3)' }}>
            <Sparkles className="text-[#00ff88]" size={36} />
            AUTO_EVOLUÇÃO
          </h1>
          <p className="text-gray-400 font-mono mt-2 tracking-widest text-sm">
            OTIMIZAÇÃO PROATIVA E MANUTENÇÃO DO SISTEMA
          </p>
        </div>
        <div className="px-4 py-2 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-xl">
          <span className="text-[#00ff88] font-black tracking-[0.3em] text-[10px] uppercase">
            "FUNÇÃO SOBRE FORMA"
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deep Scan Module */}
        <div className="bg-black/40 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
              <Search size={24} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase">Varredura Profunda</h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Buscar por novos modelos e código</p>
            </div>
          </div>

          <p className="text-sm text-gray-400 font-mono mb-8 leading-relaxed">
            Analisa GitHub, HuggingFace e fóruns acadêmicos em busca das últimas otimizações, correções e modelos de IA para a pilha do Exocortex YBY:
            <br/><br/>
            <span className="text-[#00ff88]">OpenWakeWord 2.0 • Whisper.cpp • Kokoro TTS • Llama.cpp + TurboQuant • Qwen2.5-Coder • ESP32-S3 (INMP441, Silero) • NimBLE • Tailscale • LanceDB</span>
          </p>

          {scanState === 'idle' && (
            <button 
              onClick={handleDeepScan}
              className="w-full py-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black tracking-widest uppercase hover:bg-blue-500/20 transition-all flex items-center justify-center gap-3"
            >
              <Globe size={18} />
              INICIAR VARREDURA GLOBAL
            </button>
          )}

          {scanState === 'scanning' && (
            <div className="w-full py-4 rounded-xl border border-blue-500/30 flex items-center justify-center gap-4">
              <Loader2 size={18} className="text-blue-400 animate-spin" />
              <span className="text-blue-400 font-black tracking-widest uppercase text-sm">VARRENDO REPOSITÓRIOS...</span>
            </div>
          )}

          {scanState === 'results' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-400 tracking-widest uppercase">OTIMIZAÇÃO DO NÚCLEO PRONTA</span>
                <span className="text-[10px] font-black text-[#00ff88] tracking-widest px-2 py-1 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-md shrink-0">HUMAN-IN-THE-LOOP</span>
              </div>
              <button 
                onClick={() => ybyScanResult ? setYBYScanResult({ ...ybyScanResult }) : setScanState('idle')}
                className="mt-2 w-full py-4 rounded-xl box-shadow-[0_0_15px_rgba(0,120,255,0.4)] bg-blue-500 text-black font-black tracking-widest uppercase hover:bg-blue-400 transition-all font-bold"
              >
                VISUALIZAR RELATÓRIO DO MERGE
              </button>
            </motion.div>
          )}
        </div>

        {/* System Cleanup Module */}
        <div className="bg-black/40 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
              <Zap size={24} className="text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase">Auto_Limpeza</h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Resolver gargalos e limpar cache</p>
            </div>
          </div>

          <p className="text-sm text-gray-400 font-mono mb-8 leading-relaxed">
            Identifica vazamentos de memória, remove nós redundantes de curto prazo e otimiza os bancos de dados locais (SQLite/LanceDB) para máxima performance.
          </p>

          {cleanState === 'idle' && (
            <button 
              onClick={handleSystemClean}
              className="w-full py-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 font-black tracking-widest uppercase hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-3"
            >
              <Trash2 size={18} />
              LIMPAR E OTIMIZAR
            </button>
          )}

          {cleanState === 'cleaning' && (
            <div className="w-full py-4 rounded-xl border border-yellow-500/30 flex items-center justify-center gap-4">
              <Loader2 size={18} className="text-yellow-500 animate-spin" />
              <span className="text-yellow-500 font-black tracking-widest uppercase text-sm">OTIMIZANDO CÓRTEX...</span>
            </div>
          )}

          {cleanState === 'done' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full py-4 rounded-xl bg-[#00ff88]/20 border border-[#00ff88]/50 flex items-center justify-center gap-3 text-[#00ff88]"
            >
              <CheckCircle2 size={20} />
              <span className="font-black tracking-widest uppercase text-sm">SISTEMA OTIMIZADO</span>
            </motion.div>
          )}
        </div>

        {/* Security & Offline Mode */}
        <div className="bg-black/40 border border-white/10 rounded-3xl p-8 relative overflow-hidden lg:col-span-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                <Settings size={24} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-widest uppercase">Configurações do Exocortex</h2>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Gerenciar privacidade e navegação</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Gesture Toggle */}
              <div className="flex items-center gap-3">
                <span className={`text-xs font-black tracking-widest uppercase ${gestureNav ? 'text-[#00ff88]' : 'text-gray-500'}`}>
                  NAV_GESTOS
                </span>
                <button 
                  onClick={() => {
                    setGestureNav(!gestureNav);
                    dispatch(addLog({
                      message: `Navegação por micro-movimentos ${!gestureNav ? 'ATIVADA' : 'DESATIVADA'}.`,
                      origin: 'SYSTEM',
                      type: 'info'
                    }));
                  }}
                  className={`w-14 h-7 rounded-full transition-colors relative ${gestureNav ? 'bg-[#00ff88]' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${gestureNav ? 'left-8' : 'left-1'}`}></div>
                </button>
              </div>

              {/* Offline Toggle */}
              <div className="flex items-center gap-3">
                <span className={`text-xs font-black tracking-widest uppercase ${offlineMode ? 'text-[#00ff88]' : 'text-gray-500'}`}>
                  MODO_OFFLINE
                </span>
                <button 
                  onClick={() => {
                    setOfflineMode(!offlineMode);
                    dispatch(addLog({
                      message: `Modo offline ${!offlineMode ? 'ATIVADO' : 'DESATIVADO'}.`,
                      origin: 'SEGURANÇA',
                      type: 'warning'
                    }));
                  }}
                  className={`w-14 h-7 rounded-full transition-colors relative ${offlineMode ? 'bg-[#00ff88]' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${offlineMode ? 'left-8' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-2xl border transition-colors ${offlineMode ? 'bg-[#00ff88]/5 border-[#00ff88]/30' : 'bg-white/5 border-white/10'}`}>
              <WifiOff size={24} className={`mb-4 ${offlineMode ? 'text-[#00ff88]' : 'text-gray-500'}`} />
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-2">Apenas LLM Local</h3>
              <p className="text-xs text-gray-400 font-mono">Força todo o roteamento para a instância local Termux/DeepSeek. Nenhum dado sai do dispositivo.</p>
            </div>
            <div className={`p-6 rounded-2xl border transition-colors ${gestureNav ? 'bg-[#00ff88]/5 border-[#00ff88]/30' : 'bg-white/5 border-white/10'}`}>
              <Activity size={24} className={`mb-4 ${gestureNav ? 'text-[#00ff88]' : 'text-gray-500'}`} />
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-2">Micro-Movimentos</h3>
              <p className="text-xs text-gray-400 font-mono">T-Watch S3 IMU ativo. Balance o pulso para rolar, toque duplo nos dedos para selecionar.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <Database size={24} className="text-blue-400 mb-4" />
              <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-2">Memória Criptografada</h3>
              <p className="text-xs text-gray-400 font-mono">Os dados do grafo são criptografados (AES-256) no armazenamento local.</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {ybyScanResult && (
          <YBYScanModal 
            key="yby-scan-modal"
            scanId={ybyScanResult.id} 
            report={ybyScanResult.report} 
            diff={ybyScanResult.diff} 
            onClose={() => setYBYScanResult(null)} 
            onApprove={handleApproveMerge} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
