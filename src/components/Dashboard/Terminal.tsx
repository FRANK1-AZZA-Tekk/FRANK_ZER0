import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal as TerminalIcon, Download, Trash2, Minimize2, Maximize2, Loader2, Send, Search, Filter, Cpu, Shield, Zap, Globe, Clock } from 'lucide-react';

interface LogEntry {
  id: string;
  message: string;
  timestamp: string;
  origin: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'command';
}

interface TerminalProps {
  logs: LogEntry[];
  terminalInput: string;
  setTerminalInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  onExport: () => void;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
}

export function Terminal({ 
  logs, 
  terminalInput, 
  setTerminalInput, 
  onSubmit, 
  onClear, 
  onExport, 
  isExpanded, 
  setIsExpanded 
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.origin.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = !activeFilter || log.origin === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [logs, searchQuery, activeFilter]);

  const origins = useMemo(() => {
    const set = new Set(logs.map(l => l.origin));
    return Array.from(set);
  }, [logs]);

  return (
    <div className={`flex flex-col transition-all duration-700 lg:col-span-8 ${isExpanded ? 'fixed inset-4 z-50' : 'h-full min-h-[600px]'}`}>
      <div className="flex-1 bg-black/95 backdrop-blur-3xl border-2 border-white/10 rounded-[3rem] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
        <div className="absolute inset-0 scanline-overlay opacity-[0.05] pointer-events-none"></div>
        
        {/* Header */}
        <div className="px-4 py-6 sm:px-10 sm:py-8 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between bg-white/[0.02] gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="p-2 sm:p-3 bg-[#00ff88]/10 rounded-xl sm:rounded-2xl border border-[#00ff88]/30">
              <TerminalIcon size={20} className="text-[#00ff88] animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] sm:text-[12px] font-black tracking-[0.4em] sm:tracking-[0.6em] text-white uppercase block mb-1">TERMINAL_SISTEMA</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                  <Clock size={10} className="text-[#00ff88]" /> {new Date().toLocaleTimeString()}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-800"></span>
                <span className="text-[8px] font-bold text-[#00ff88] uppercase tracking-widest">STABLE_CONNECTION</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 py-2 group focus-within:border-[#00ff88]/50 transition-all">
              <Search size={14} className="text-gray-600 group-focus-within:text-[#00ff88]" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="PROCURAR_LOGS..."
                className="bg-transparent border-none focus:ring-0 text-[10px] font-mono text-white placeholder:text-gray-700 w-32 md:w-48 ml-2"
              />
            </div>
            
            <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
            
            <button 
              onClick={onExport}
              title="Exportar Logs"
              className="p-3 text-gray-400 hover:text-[#00ff88] transition-all bg-white/5 rounded-[1.25rem] border border-white/5 hover:border-[#00ff88]/40 hover:scale-110 active:scale-95"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={onClear}
              title="Limpar Terminal"
              className="p-3 text-gray-400 hover:text-red-400 transition-all bg-white/5 rounded-[1.25rem] border border-white/5 hover:border-red-500/40 hover:scale-110 active:scale-95"
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-3 hover:bg-white/10 rounded-[1.25rem] transition-all text-gray-400 hover:text-white border border-transparent hover:border-white/10 hover:scale-110 active:scale-95"
            >
              {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-10 py-3 bg-black/20 border-b border-white/5 flex items-center gap-4 overflow-x-auto scrollbar-hide">
          <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mr-2 flex items-center gap-2">
            <Filter size={10} /> ORIGENS:
          </span>
          <button 
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${!activeFilter ? 'bg-[#00ff88] text-black shadow-[0_0_15px_#00ff88]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
          >
            TODOS
          </button>
          {origins.map(origin => (
            <button 
              key={origin}
              onClick={() => setActiveFilter(origin)}
              className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${activeFilter === origin ? 'bg-[#00ff88] text-black shadow-[0_0_15px_#00ff88]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
            >
              {origin}
            </button>
          ))}
        </div>
        
        {/* Logs Container */}
        <div 
          ref={terminalRef}
          className="flex-1 p-0 overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-hide bg-[#020202] relative"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-[100px_120px_1fr] border-b border-white/10 bg-white/5 sticky top-0 z-20 backdrop-blur-md">
            <div className="px-6 py-2 text-[9px] font-serif italic text-gray-500 uppercase tracking-widest border-r border-white/10 hidden sm:block">timestamp</div>
            <div className="px-6 py-2 text-[9px] font-serif italic text-gray-500 uppercase tracking-widest border-r border-white/10 hidden sm:block">origin</div>
            <div className="px-6 py-2 text-[9px] font-serif italic text-gray-500 uppercase tracking-widest">message_stream</div>
          </div>

          {filteredLogs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-800 italic animate-pulse gap-4 opacity-50">
              <Loader2 size={32} className="animate-spin text-[#00ff88]" /> 
              <span className="uppercase tracking-[0.4em] text-[10px] font-black">Nenhum log encontrado para os critérios atuais</span>
            </div>
          )}
          
          <div className="divide-y divide-white/[0.05]">
            {filteredLogs.map((log, i) => {
              const date = new Date(log.timestamp);
              const timeStr = date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
              
              const isError = log.type === 'error';
              const isSuccess = log.type === 'success';
              const isWarning = log.type === 'warning';
              const isCommand = log.type === 'command';

              return (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  key={log.id} 
                  className={`flex flex-col sm:grid sm:grid-cols-[100px_120px_1fr] group relative transition-all hover:bg-white/[0.03] ${isCommand ? 'bg-[#00ff88]/5' : ''}`}
                >
                  <div className="px-6 py-1.5 sm:py-3 border-r border-white/10 flex items-center justify-start sm:justify-center">
                    <span className="text-[9px] sm:text-[10px] text-gray-500 font-mono group-hover:text-[#00ff88] transition-colors">
                      {timeStr}
                    </span>
                  </div>

                  <div className="px-6 py-1 sm:py-3 border-r border-white/10 flex items-center">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      isError ? 'text-red-500' :
                      isSuccess ? 'text-[#00ff88]' :
                      isWarning ? 'text-yellow-500' :
                      isCommand ? 'text-[#ff00ff]' :
                      'text-gray-400 opacity-60'
                    }`}>
                      {log.origin}
                    </span>
                  </div>

                  <div className="px-6 sm:px-8 py-2 sm:py-3 flex items-center">
                    <span className={`
                      text-[11px] font-mono leading-relaxed break-words
                      ${isError ? 'text-red-400 text-shadow-red' : ''}
                      ${isSuccess ? 'text-[#00ff88]' : ''}
                      ${isWarning ? 'text-yellow-200' : ''}
                      ${isCommand ? 'text-white font-bold' : ''}
                      ${!isError && !isSuccess && !isWarning && !isCommand ? 'text-gray-300' : ''}
                    `}>
                      {isCommand && <span className="text-[#00ff88] mr-2">{'>'}</span>}
                      {log.message}
                    </span>
                  </div>

                  {/* Hover Highlight */}
                  <div className="absolute inset-y-0 left-0 w-1 bg-[#00ff88] scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Terminal Input */}
        <form onSubmit={onSubmit} className="p-4 sm:p-8 bg-white/[0.02] border-t border-white/10 flex flex-col sm:flex-row gap-4 sm:gap-6 relative">
          <div className="absolute -top-[1px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff88]/40 to-transparent"></div>
          
          <div className="flex-1 relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#00ff88] font-black text-lg group-focus-within:animate-pulse">{'>'}</span>
            <input 
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="ENTER_SISTEMA_COMMAND..."
              className="w-full bg-black/60 border-2 border-white/5 rounded-2xl sm:rounded-3xl pl-12 sm:pl-14 pr-6 py-4 sm:py-6 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-[#00ff88]/40 transition-all shadow-inner placeholder:text-gray-800"
            />
          </div>
          <button 
            type="submit"
            className="px-6 sm:px-8 py-4 sm:py-0 h-auto sm:h-auto bg-[#00ff88]/10 text-[#00ff88] rounded-xl sm:rounded-[2rem] border-2 border-[#00ff88]/20 hover:bg-[#00ff88] hover:text-black transition-all group flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,136,0.1)] hover:shadow-[0_0_30px_#00ff88]"
          >
            EXECUTE <Send size={16} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
