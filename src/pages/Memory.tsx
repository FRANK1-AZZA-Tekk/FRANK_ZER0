import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Activity, Database, Loader2, Save, Search, Share2, Trash2 } from 'lucide-react';
import { addLog, setMemoryContext } from '../store/slices/swarmSlice';
import { RootState } from '../store/store';
import { persistenceService, SavedResponse } from '../utils/persistence';
import * as d3 from 'd3';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return window.location.origin;
};

export default function Memory() {
  const dispatch = useDispatch();
  const { memoryContext } = useSelector((state: RootState) => state.swarm);
  const [memoryText, setMemoryText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'saving' | 'success' | 'error', msg: string }>({ type: 'idle', msg: '' });
  const [localResponses, setLocalResponses] = useState<SavedResponse[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadLocalResponses();
  }, []);

  const loadLocalResponses = async () => {
    try {
      const data = await persistenceService.getAllResponses();
      setLocalResponses(data.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      console.error('Failed to load local responses:', e);
    }
  };

  const handleDeleteLocal = async (id?: number) => {
    if (id === undefined) return;
    try {
      await persistenceService.deleteResponse(id);
      loadLocalResponses();
      dispatch(addLog({
        message: 'Registro local removido.',
        origin: 'MEMORY',
        type: 'warning'
      }));
    } catch (e) {
      dispatch(addLog({
        message: 'Falha ao remover registro local.',
        origin: 'MEMORY',
        type: 'error'
      }));
    }
  };

  // Graph Visualization Logic
  useEffect(() => {
    if (!svgRef.current) return;

    const updateGraph = () => {
      if (!svgRef.current) return;
      const container = svgRef.current.parentElement;
      if (!container) return;
      
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 400;
      
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      // Define glow filter
      const defs = svg.append("defs");
      const filter = defs.append("filter")
        .attr("id", "glow");
      filter.append("feGaussianBlur")
        .attr("stdDeviation", "3.5")
        .attr("result", "coloredBlur");
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode")
        .attr("in", "coloredBlur");
      feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");

      const nodes = [
        { id: "USER_CORE", group: 1, label: "USER" },
        { id: "FRANK_CORTEX", group: 2, label: "FRANK" },
        { id: "UMEM_OPTIMIZER", group: 3, label: "UMEM" },
        { id: "SEMANTIC_NEIGHBORHOOD", group: 4, label: "CLUSTERS" },
        { id: "BAYES_RAG", group: 5, label: "BAYES_RAG" },
        { id: "ZVEC_CHROMA", group: 6, label: "CHROMADB" },
        { id: "LANCEDB", group: 7, label: "LANCEDB" },
      ];

      const links = [
        { source: "USER_CORE", target: "FRANK_CORTEX", value: 2 },
        { source: "USER_CORE", target: "UMEM_OPTIMIZER", value: 1 },
        { source: "FRANK_CORTEX", target: "SEMANTIC_NEIGHBORHOOD", value: 2 },
        { source: "SEMANTIC_NEIGHBORHOOD", target: "BAYES_RAG", value: 1 },
        { source: "BAYES_RAG", target: "ZVEC_CHROMA", value: 3 },
        { source: "ZVEC_CHROMA", target: "LANCEDB", value: 3 },
        { source: "FRANK_CORTEX", target: "LANCEDB", value: 1 },
      ];

      const simulation = d3.forceSimulation(nodes as any)
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(width < 500 ? 80 : 120))
        .force("charge", d3.forceManyBody().strength(width < 500 ? -150 : -300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(width < 500 ? 25 : 40));

      const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", "#00ff88")
        .attr("stroke-opacity", 0.2)
        .attr("stroke-width", (d: any) => d.value * 1.5)
        .attr("class", "transition-all duration-500");

      const nodeGroup = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(d3.drag<any, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }));

      nodeGroup.append("circle")
        .attr("r", (d: any) => d.group === 2 ? (width < 500 ? 12 : 15) : (width < 500 ? 8 : 10))
        .attr("fill", (d: any) => {
          if (d.group === 1) return "#ff00ff";
          if (d.group === 2) return "#00ff88";
          return "#1a1a1a";
        })
        .attr("stroke", (d: any) => d.group > 2 ? "#00ff88" : "none")
        .attr("stroke-width", 1)
        .attr("filter", (d: any) => d.group <= 2 ? "url(#glow)" : "none")
        .style("cursor", "pointer")
        .on("mouseover", function() {
          d3.select(this).attr("r", (d: any) => (d.group === 2 ? (width < 500 ? 15 : 18) : (width < 500 ? 10 : 13)));
        })
        .on("mouseout", function() {
          d3.select(this).attr("r", (d: any) => (d.group === 2 ? (width < 500 ? 12 : 15) : (width < 500 ? 8 : 10)));
        });

      nodeGroup.append("text")
        .text((d: any) => d.label)
        .attr("font-size", "8px")
        .attr("font-weight", "bold")
        .attr("fill", "#666")
        .attr("dy", 25)
        .attr("text-anchor", "middle")
        .attr("class", "pointer-events-none uppercase tracking-widest");

      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        nodeGroup
          .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

      return simulation;
    };

    let simulation = updateGraph();

    const resizeObserver = new ResizeObserver(() => {
      if (simulation) simulation.stop();
      simulation = updateGraph();
    });
    
    if (svgRef.current.parentElement) {
      resizeObserver.observe(svgRef.current.parentElement);
    }

    return () => {
      if (simulation) simulation.stop();
      resizeObserver.disconnect();
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryText.trim()) return;

    setStatus({ type: 'saving', msg: 'Injetando no Vector Store...' });
    dispatch(addLog({
      message: 'Injetando novo contexto de memória...',
      origin: 'MEMORY',
      type: 'info'
    }));
    
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/swarm/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: memoryText })
      });
      
      if (res.ok) {
        setStatus({ type: 'success', msg: 'Memória armazenada com sucesso.' });
        dispatch(addLog({
          message: 'Injeção de memória bem sucedida. ChromaDB atualizado.',
          origin: 'MEMORY',
          type: 'success'
        }));
        setMemoryText('');
        setTimeout(() => setStatus({ type: 'idle', msg: '' }), 3000);
      } else {
        setStatus({ type: 'error', msg: 'Falha ao armazenar memória.' });
        dispatch(addLog({
          message: 'Falha na injeção de memória.',
          origin: 'MEMORY',
          type: 'error'
        }));
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'API Cortex inacessível.' });
      dispatch(addLog({
        message: 'Erro de memória: API inacessível.',
        origin: 'MEMORY',
        type: 'error'
      }));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    dispatch(addLog({
      message: `Buscando na Memória: "${searchQuery}"`,
      origin: 'MEMORY',
      type: 'info'
    }));
    
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/swarm/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      dispatch(setMemoryContext(data.context));
    } catch (e) {
      dispatch(addLog({
        message: 'Busca na memória falhou.',
        origin: 'MEMORY',
        type: 'error'
      }));
    }
  };

  const handleClearContext = () => {
    dispatch(setMemoryContext(''));
    dispatch(addLog({
      message: 'Contexto de memória limpo.',
      origin: 'MEMORY',
      type: 'warning'
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 w-full min-h-screen relative">
      {/* Background FX */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,136,0.05)_0%,transparent_50%)] pointer-events-none"></div>

      <div className="w-full max-w-6xl p-4 sm:p-10 rounded-2xl sm:rounded-[2.5rem] bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center relative overflow-hidden">
        
        <div className="w-full flex flex-col md:flex-row items-center justify-between mb-8 sm:mb-12 gap-6 z-10">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-[0.2em] md:tracking-[0.25em] mb-2" style={{ textShadow: '0 0 20px rgba(0,255,136,0.5)' }}>
              NÚCLEO_MEMÓRIA
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-[9px] font-bold tracking-widest text-[#00ff88]/60 uppercase">
              <span className="flex items-center gap-1"><Database size={12}/> ZVEC_MMAP_STORE</span>
              <span className="w-1 h-1 bg-white/20 rounded-full"></span>
              <span className="flex items-center gap-1"><Share2 size={12}/> UMEM_BAYES_RAG</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end px-4 border-r border-white/10">
              <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Nós_Ativos</span>
              <span className="text-xl font-black text-[#00ff88] tracking-tighter">1,248</span>
            </div>
            <div className="flex flex-col items-end px-4">
              <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Taxa_Sync</span>
              <span className="text-xl font-black text-blue-400 tracking-tighter">98.4%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full z-10">
          
          {/* Left Column: Graph Visualization */}
          <div className="flex flex-col gap-6">
            <div className="bg-black/60 rounded-3xl border border-white/5 p-4 sm:p-6 relative overflow-hidden group min-h-[300px] sm:min-h-[400px] flex flex-col">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff88]/40"></div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] sm:text-[10px] text-gray-500 font-black tracking-widest uppercase block">GRAFO_v2.0</span>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ff00ff]"></div>
                    <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Usuário</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"></div>
                    <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Frank</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 relative">
                <svg 
                  ref={svgRef} 
                  width="100%" 
                  height="100%" 
                  viewBox="0 0 800 400"
                  className="cursor-crosshair w-full h-full"
                ></svg>
              </div>
            </div>

            <div className="bg-black/40 rounded-3xl border border-white/5 p-6">
              <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase block mb-4">BUSCAR_MEMÓRIA</span>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="CONSULTAR_INTERAÇÕES_PASSADAS..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-xs font-mono text-[#00ff88] placeholder:text-gray-700 focus:outline-none focus:border-[#00ff88]/50 transition-all shadow-inner"
                />
                <button 
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-[#00ff88] transition-colors bg-white/5 rounded-lg border border-white/5"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Injection & Context */}
          <div className="flex flex-col gap-6">
            <form onSubmit={handleSave} className="bg-black/40 rounded-3xl border border-white/5 p-6 flex flex-col gap-4 group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase block">INJETAR_NOVO_CONTEXTO</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-[#00ff88] animate-ping"></div>
                  <div className="w-1 h-1 rounded-full bg-[#00ff88]/40"></div>
                </div>
              </div>
              <textarea
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                placeholder="INSERIR_NOVO_DADO_MEMÓRIA_PARA_EMBEDDING..."
                rows={4}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-xs font-mono text-white placeholder:text-gray-700 focus:outline-none focus:border-[#00ff88]/50 transition-all resize-none shadow-inner"
              />
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${status.type === 'error' ? 'text-[#ff00ff]' : 'text-[#00ff88]'}`}>
                  {status.msg || 'Pronto para injeção'}
                </span>
                <button 
                  type="submit"
                  disabled={status.type === 'saving' || !memoryText.trim()}
                  className="px-8 py-3 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-[#00ff88] hover:text-black hover:shadow-[0_0_30px_rgba(0,255,136,0.3)] transition-all duration-500 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status.type === 'saving' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>INJETAR</span>
                </button>
              </div>
            </form>

            <div className="bg-black/40 rounded-3xl border border-white/5 p-6 flex-1 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase block">RECUPERAÇÃO_CONTEXTO_ATIVO</span>
                {memoryContext && (
                  <button 
                    onClick={handleClearContext}
                    className="text-[9px] font-bold text-gray-600 hover:text-[#ff00ff] transition-colors flex items-center gap-1 uppercase tracking-widest"
                  >
                    <Trash2 size={12} />
                    Limpar
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {memoryContext ? (
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 relative group">
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Share2 size={14} className="text-gray-500 cursor-pointer hover:text-[#00ff88]" />
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed font-mono whitespace-pre-wrap">
                      {memoryContext}
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-700 italic text-center px-8">
                    <Database size={48} className="mb-6 opacity-10" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-30">Rede neural ociosa. Busque para recuperar contexto.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Local Persistence Store Section */}
        <div className="w-full mt-12 z-10">
          <div className="flex items-center gap-3 mb-6">
            <Save size={20} className="text-blue-400" />
            <h2 className="text-xl font-black text-white tracking-widest uppercase">Memória_Soberana (IndexedDB)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localResponses.length > 0 ? (
              localResponses.map((item) => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 group flex flex-col gap-3 relative overflow-hidden transition-all hover:bg-white/[0.07]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-gray-500 font-mono italic">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <button 
                      onClick={() => handleDeleteLocal(item.id)}
                      className="p-1.5 text-gray-600 hover:text-[#ff00ff] hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Input:</p>
                    <p className="text-xs text-gray-400 italic">"{item.transcript}"</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-[#00ff88] font-black uppercase tracking-widest">Frank:</p>
                    <p className="text-sm text-gray-200 leading-relaxed font-mono">
                      {item.response}
                    </p>
                  </div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30"></div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-white/5 border-dashed">
                <p className="text-gray-600 font-mono text-xs uppercase tracking-widest italic">
                  Nenhum comando salvo localmente. Use o botão de salvar no overlay de voz.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 w-full flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-600 tracking-widest uppercase">
          <div className="flex items-center gap-4">
            <span>Armazém Vetorial LanceDB v3.0</span>
            <span className="w-1 h-1 bg-white/10 rounded-full"></span>
            <span>Fallback ChromaDB</span>
          </div>
          <div className="flex gap-6">
            <span className="flex items-center gap-2 text-[#00ff88]/60"><Activity size={14}/> SYNC_ATIVO</span>
            <button className="flex items-center gap-2 hover:text-[#ff00ff] transition-colors"><Trash2 size={14}/> LIMPAR_CACHE</button>
          </div>
        </div>

      </div>
    </div>
  );
}
