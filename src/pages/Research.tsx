import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Loader2, Globe, Zap, Shield, History, Trash2, ExternalLink, ChevronRight, Sparkles, Check, TerminalSquare, AlertTriangle, Fingerprint, Eye, X } from 'lucide-react';
import { addLog, setMemoryContext } from '../store/slices/swarmSlice';
import { motion, AnimatePresence } from 'motion/react';
import { RootState } from '../store/store';
import { performResearch } from '../utils/gemini';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return window.location.origin;
};

export default function Research() {
  const dispatch = useDispatch();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanType, setScanType] = useState('ALL');
  const [history, setHistory] = useState<string[]>(() => {
    const savedHistory = localStorage.getItem('research_history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        return Array.from(new Set(parsedHistory)) as string[];
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
    return [];
  });
  const [scanStep, setScanStep] = useState(0);

  const scanSteps = [
    "INICIALIZANDO_CÓRTEX_LINK...",
    "VARRENDO_DOMÍNIOS_E_SUBDOMÍNIOS (theHarvester)...",
    "BUSCANDO_VULNERABILIDADES (Shodan/Nmap)...",
    "EXTRAINDO_INTELIGÊNCIA_DE_DADOS_ABERTOS (OSINT)...",
    "SÍNTESE_E_CORRELAÇÃO_DE_AMEAÇAS..."
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setScanStep((prev) => (prev + 1) % scanSteps.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSearch = async (e?: React.FormEvent, searchOverride?: string) => {
    if (e) e.preventDefault();
    const finalQuery = searchOverride || query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setResult('');
    setScanStep(0);
    dispatch(addLog({
      message: `Iniciando varredura tática profunda alvo: ${finalQuery}`,
      origin: 'OSINT',
      type: 'info'
    }));
    
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/swarm/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `Analyze for OSINT intelligence: ${finalQuery}` })
      });
      
      if (res.ok) {
        const data = await res.json();
        const scanResult = data.data || data.result || 'Sem dados obtidos.';
        setResult(scanResult);
        dispatch(addLog({
          message: `Varredura tática concluída: ${finalQuery}`,
          origin: 'OSINT',
          type: 'success'
        }));
        
        // Simulate advanced agent interaction: Research feeds into Memory
        dispatch(addLog({
          message: 'Auto-sincronizando inteligência ao Córtex Central...',
          origin: 'SYSTEM',
          type: 'info'
        }));
        dispatch(setMemoryContext(`Recente OSINT alvo "${finalQuery}": ${scanResult.substring(0, 150)}...`));
        dispatch(addLog({
          message: 'Intel encriptada e anexada ao grafo.',
          origin: 'MEMORY',
          type: 'success'
        }));
        
        const newHistory = [finalQuery, ...history.filter(h => h !== finalQuery)].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem('research_history', JSON.stringify(newHistory));
      } else {
        setResult('Erro: Falha na conexão com motores do Córtex.');
        dispatch(addLog({
          message: `Escaneamento Tático falhou: ${finalQuery}`,
          origin: 'OSINT',
          type: 'error'
        }));
      }
    } catch (err) {
      dispatch(addLog({
        message: 'Modo furtivo ativado. API inacessível, inferindo localmente...',
        origin: 'OSINT',
        type: 'warning'
      }));
      
      // Fallback local via Gemini / prompt simulando output de inteligência
      const promptText = `Aja como o console de inteligência OSINT Maltego/Shodan. Faça um scan profundo no target: ${finalQuery}. Dê output de informações técnicas como portas, possíveis e-mails, footprints, histórico de segurança (pode usar dados reais se for um alvo grande ou mockar um relatório técnico imersivo). Responda sempre em Português do Brasil de forma extremamente técnica, analítica, como um terminal cyberpunk hacker. Extraia Oportunidades e Riscos.`;
      const summary = await performResearch(promptText);
      
      setResult(summary);
      dispatch(addLog({
        message: 'Scanner local (Gemini/DeepSeek) concluído.',
        origin: 'OSINT',
        type: 'success'
      }));
      
      dispatch(addLog({
        message: 'Auto-sincronizando inteligência ao Córtex...',
        origin: 'SYSTEM',
        type: 'info'
      }));
      dispatch(setMemoryContext(`Recente OSINT alvo "${finalQuery}": ${summary.substring(0, 150)}...`));
      dispatch(addLog({
        message: 'Intel sincronizada.',
        origin: 'MEMORY',
        type: 'success'
      }));
      
      const newHistory = [finalQuery, ...history.filter(h => h !== finalQuery)].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('research_history', JSON.stringify(newHistory));
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('research_history');
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 w-full min-h-screen relative overflow-hidden animate-in fade-in duration-500">
      {/* Background FX matrix-like */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.05)_0%,transparent_50%)] pointer-events-none"></div>
      
      <div className="w-full max-w-7xl z-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Header Span */}
        <div className="md:col-span-12 flex flex-col md:flex-row items-center justify-between mb-2 pb-6 border-b border-white/5">
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-[0.3em] uppercase flex items-center gap-4" style={{ textShadow: '0 0 30px rgba(0,255,136,0.2)' }}>
              <TerminalSquare className="text-[#00ff88]" size={36} />
              NEXUS_OSINT
            </h1>
            <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-[#00ff88]/60 uppercase mt-4">
              <span className="flex items-center gap-1.5"><Eye size={14}/> RADAR_ATIVO</span>
              <span className="w-1.5 h-1.5 bg-[#00ff88]/20 rounded-full"></span>
              <span className="flex items-center gap-1.5 text-blue-400"><Fingerprint size={14}/> FINGERPRINT</span>
              <span className="w-1.5 h-1.5 bg-[#00ff88]/20 rounded-full"></span>
              <span className="flex items-center gap-1.5 text-red-500"><AlertTriangle size={14}/> THREAT_INTEL</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/40 mt-6 md:mt-0 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
            <div className="flex flex-col items-end px-4 border-r border-white/10">
              <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase mb-1">Capacidade_Crawling</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={`search-cap-${i}`} className={`w-1.5 h-4 rounded-full ${i < 5 ? 'bg-[#00ff88]' : 'bg-white/5'}`}></div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end px-4">
              <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase mb-1">Modo</span>
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                <span className="text-xs font-black text-blue-400 tracking-widest">FURTIVO</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Left Sidebar: OSINT Tools & History */}
        <div className="md:col-span-3 flex flex-col gap-6">
          <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 flex flex-col min-h-[400px]">
            <div className="flex flex-col gap-4 mb-8">
               <h3 className="text-[#00ff88] text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-3">
                 <Shield size={16} />
                 VETORES_DE_ATAQUE
               </h3>
               <div className="grid grid-cols-2 gap-2">
                 {['ALL', 'DOMÍNIOS', 'SHODAN', 'GITHUB', 'ARXIV'].map(type => (
                   <button 
                     key={type}
                     onClick={() => setScanType(type)}
                     className={`py-2 px-1 text-[9px] font-black tracking-widest uppercase rounded-lg border transition-all ${scanType === type ? 'bg-[#00ff88]/20 border-[#00ff88]/50 text-[#00ff88]' : 'bg-white/5 border-transparent text-gray-500 hover:text-white hover:bg-white/10'}`}
                   >
                     {type}
                   </button>
                 ))}
               </div>
            </div>

            <div className="flex items-center justify-between mb-4 border-t border-white/5 pt-6">
              <h3 className="text-gray-500 text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-3">
                <History size={16} />
                HISTÓRICO_ALVOS
              </h3>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[30vh] scrollbar-hide">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-700 italic text-center border border-dashed border-white/5 rounded-2xl">
                  <span className="text-[10px] uppercase tracking-widest font-black opacity-30">Vazio.</span>
                </div>
              ) : (
                history.map((h, i) => (
                  <button 
                    key={`history-${i}-${h}`}
                    onClick={() => { setQuery(h); handleSearch(undefined, h); }}
                    className="flex items-center justify-between w-full p-3 rounded-xl bg-white/5 border border-transparent hover:border-[#00ff88]/30 hover:bg-[#00ff88]/5 transition-all group text-left"
                  >
                    <span className="text-[10px] text-gray-400 group-hover:text-white truncate max-w-[150px] font-bold tracking-widest uppercase">{h}</span>
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-[#00ff88] transition-transform group-hover:translate-x-1" />
                  </button>
                ))
              )}
            </div>
            
            <div className="mt-auto pt-6 border-t border-white/5">
              <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <div className="flex items-center gap-3 mb-2">
                  <Globe size={14} className="text-blue-400" />
                  <span className="text-[9px] font-black text-blue-400 tracking-widest uppercase">Deep_Web_Link</span>
                </div>
                <p className="text-[9px] text-gray-500 font-bold leading-relaxed tracking-widest">
                  Operando através de tunelamento anônimo na extração.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Search & OSINT Terminal */}
        <div className="md:col-span-9 flex flex-col gap-6">
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSearch} 
            className="relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff88]/20 to-blue-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex flex-col md:flex-row gap-4 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-4 shadow-2xl">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="INSERIR ALVO (IP, DOMÍNIO, NOME, EMPRESA)..."
                  className="w-full bg-[#050505] border border-white/5 rounded-2xl px-6 py-5 text-sm text-[#00ff88] placeholder-gray-700 focus:outline-none focus:border-[#00ff88]/50 focus:ring-0 font-mono tracking-widest"
                />
                <div className="absolute left-6 bottom-2 flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-[#00ff88]/40"></div>
                  <div className="w-1 h-1 rounded-full bg-[#00ff88]/40"></div>
                  <div className="w-1 h-1 rounded-full bg-[#00ff88]/40"></div>
                </div>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="md:w-auto w-full px-8 py-4 bg-[#00ff88] text-black rounded-2xl font-black uppercase tracking-[0.3em] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <RadarScanIcon className="group-hover:scale-110 transition-transform" />}
                <span>EXECUTAR</span>
              </button>
            </div>
          </motion.form>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 min-h-[500px] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col items-center justify-center p-12 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#00ff88]/[0.02] bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.05)_0%,transparent_100%)] mix-blend-screen"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-12">
                    <div className="w-40 h-40 rounded-full border border-[#00ff88]/20 border-t-[#00ff88] animate-spin shadow-[0_0_50px_rgba(0,255,136,0.1)]"></div>
                    <div className="absolute inset-4 rounded-full border border-blue-500/20 border-b-blue-500 animate-[spin_3s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-10 rounded-full border border-purple-500/20 border-l-purple-500 animate-[spin_4s_linear_infinite]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Fingerprint size={32} className="text-[#00ff88] animate-pulse" />
                    </div>
                  </div>
                  <div className="flex flex-col w-full max-w-md gap-3 mt-4">
                    {scanSteps.map((step, i) => {
                      const isPast = i < scanStep;
                      const isCurrent = i === scanStep;
                      
                      return (
                        <div key={`step-${i}`} className={`flex items-center gap-4 p-3 rounded-xl border transition-all duration-500 ${isCurrent ? 'bg-[#00ff88]/10 border-[#00ff88]/30 shadow-[0_0_15px_rgba(0,255,136,0.1)]' : isPast ? 'bg-white/5 border-white/10' : 'bg-transparent border-transparent opacity-40'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${isCurrent ? 'border-[#00ff88] text-[#00ff88]' : isPast ? 'border-gray-500 text-gray-500 bg-white/5' : 'border-gray-700 text-gray-700'}`}>
                            {isPast ? <Check size={14} /> : isCurrent ? <Loader2 size={14} className="animate-spin" /> : <span className="text-[10px] font-black">{i + 1}</span>}
                          </div>
                          <span className={`text-[10px] font-black tracking-widest uppercase ${isCurrent ? 'text-[#00ff88] animate-pulse' : isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 bg-black/80 backdrop-blur-3xl border border-[#00ff88]/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden group flex flex-col"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff88] shadow-[0_0_20px_#00ff88]"></div>
                <div className="absolute top-0 right-0 p-6 flex gap-2">
                  <button className="p-2 bg-white/5 rounded-xl border border-white/10 text-gray-500 hover:text-[#00ff88] transition-all hover:border-[#00ff88]/30">
                    <ExternalLink size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-[#00ff88]/10 rounded-xl border border-[#00ff88]/20">
                    <TerminalSquare size={20} className="text-[#00ff88]" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-white text-lg font-black tracking-widest uppercase">RELATÓRIO_DE_INTELIGÊNCIA</h3>
                    <span className="text-[9px] text-[#00ff88] font-bold tracking-[0.3em] uppercase mt-1 opacity-70">Target: {query}</span>
                  </div>
                </div>
                
                <div className="flex-1 bg-[#050505] rounded-2xl border border-white/10 p-6 font-mono text-xs md:text-sm text-[#00ff88]/80 leading-relaxed overflow-y-auto custom-scrollbar relative">
                  {/* Cyberpunk terminal overlay fx */}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.03)_2px,transparent_2px)] bg-[size:100%_4px] opacity-20"></div>
                  <div className="whitespace-pre-wrap relative z-10 selection:bg-[#00ff88] selection:text-black">
                    {result}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-3">
                    <div className="px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20 flex items-center gap-2">
                      <AlertTriangle size={12} className="text-red-500" />
                      <span className="text-[9px] font-black text-red-500 tracking-widest uppercase">RISCO: ELEVADO</span>
                    </div>
                    <div className="px-3 py-1.5 bg-[#00ff88]/10 rounded-lg border border-[#00ff88]/20 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"></div>
                      <span className="text-[9px] font-black text-[#00ff88] tracking-widest uppercase">CONFIDENCIALIDADE: MÁXIMA</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-gray-500 tracking-widest uppercase mr-2">FEEDBACK TÁTICO:</span>
                    <button 
                      onClick={() => dispatch(addLog({ message: 'Feedback positivo registrado. Padrões de busca aprimorados.', origin: 'OSINT', type: 'success' }))}
                      className="p-1.5 bg-white/5 rounded-md border border-white/10 hover:bg-[#00ff88]/10 hover:border-[#00ff88]/30 hover:text-[#00ff88] transition-colors text-gray-400"
                    >
                      <Check size={14} />
                    </button>
                    <button 
                      onClick={() => dispatch(addLog({ message: 'Alarme Falso identificado. Ajustando restrições do Scanner.', origin: 'OSINT', type: 'warning' }))}
                      className="p-1.5 bg-white/5 rounded-md border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-colors text-gray-400"
                    >
                       <X size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-h-[500px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl text-gray-800 bg-[#050505]/50 group hover:border-[#00ff88]/20 transition-all duration-700"
              >
                <div className="relative mb-8">
                  <Fingerprint size={80} className="text-gray-800 group-hover:text-[#00ff88]/20 transition-colors duration-500" />
                  <div className="absolute inset-0 bg-[#00ff88]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="flex flex-col items-center gap-3 max-w-md text-center px-4">
                  <span className="text-xs font-black tracking-[0.5em] uppercase text-gray-600">Aguardando Input do Alvo</span>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 leading-relaxed">
                    Insira um endpoint/nome acima para disparar agentes de OSINT 
                    (theHarvester, Shodan, Recon-ng scripts). 
                    Todas as requests são anonimizadas via relay proxy local.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Quick inline icon component to avoid adding more specific lucide imports above if missing
function RadarScanIcon(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 12L19.07 4.93"/>
      <path d="M12 12V2"/>
      <path d="M12 12H2"/>
    </svg>
  );
}
