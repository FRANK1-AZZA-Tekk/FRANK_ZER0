import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { MobileMenu } from './components/MobileMenu';
import { BottomNav } from './components/BottomNav';
import { GlobalVoiceCommand } from './components/GlobalVoiceCommand';
import { CommandHub } from './components/CommandHub';
import { useWebSocket } from './hooks/useWebSocket';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Memory = lazy(() => import('./pages/Memory'));
const Hardware = lazy(() => import('./pages/Hardware'));
const Nudges = lazy(() => import('./pages/Nudges'));
const Research = lazy(() => import('./pages/Research'));
const VaultSettings = lazy(() => import('./pages/VaultSettings'));
const Tasks = lazy(() => import('./pages/Tasks'));
const SwarmRouter = lazy(() => import('./pages/Router'));
const Evolution = lazy(() => import('./pages/Evolution'));

const PageLoader = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
    <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
  </div>
);

export default function App() {
  useWebSocket();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isCommandHubOpen, setIsCommandHubOpen] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<(() => void) | null>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: -40, y: -40 });

  const handleMouseMove = (e: React.MouseEvent) => {
    pointerRef.current = { x: e.clientX, y: e.clientY };
    if (frameRef.current) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const cursor = cursorRef.current;
      if (!cursor) return;

      const { x, y } = pointerRef.current;
      cursor.style.transform = `translate3d(${x - 12}px, ${y - 12}px, 0)`;
    });
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const handleUpdateReady = (event: Event) => {
      const update = (event as CustomEvent<{ update?: () => void }>).detail?.update;
      if (update) setPendingUpdate(() => update);
    };

    window.addEventListener('yby:update-ready', handleUpdateReady);
    return () => window.removeEventListener('yby:update-ready', handleUpdateReady);
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <HashRouter>
      <div 
        className="min-h-screen bg-[#050505] text-white font-mono flex flex-col overflow-x-hidden selection:bg-[#00ff88] selection:text-black sm:cursor-none motion-reduce:cursor-auto"
        onMouseMove={handleMouseMove}
      >
        
        {/* Exocortex Neural Follower */}
        <div
          ref={cursorRef}
          className="fixed left-0 top-0 hidden h-6 w-6 rounded-full border border-[#00ff88]/40 pointer-events-none z-[9999] sm:flex items-center justify-center motion-reduce:hidden will-change-transform"
        >
          <div className="w-1.5 h-1.5 bg-[#00ff88] rounded-full shadow-[0_0_10px_#00ff88]"></div>
          <div className="absolute inset-0 border border-[#00ff88]/20 rounded-full animate-ping opacity-30"></div>
        </div>

        {/* Top System Bar */}
        <TopBar 
          isStatusOpen={isStatusOpen}
          setIsStatusOpen={setIsStatusOpen}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          onOpenCommandHub={() => setIsCommandHubOpen(true)}
        />

        <div className="flex flex-1 relative overflow-hidden">
          {/* Desktop Sidebar / Navigation */}
          <Sidebar onOpenCommandHub={() => setIsCommandHubOpen(true)} />

          {/* Mobile Overlay Menu */}
          <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col items-center w-full overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,#1a1a1a_0%,#050505_100%)] scroll-smooth">
            <div className="w-full max-w-7xl mx-auto pb-24 sm:pb-8">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/memory" element={<Memory />} />
                  <Route path="/hardware" element={<Hardware />} />
                  <Route path="/nudges" element={<Nudges />} />
                  <Route path="/research" element={<Research />} />
                  <Route path="/router" element={<SwarmRouter />} />
                  <Route path="/evolution" element={<Evolution />} />
                  <Route path="/settings" element={<VaultSettings />} />
                </Routes>
              </Suspense>
            </div>
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <BottomNav onOpenCommandHub={() => setIsCommandHubOpen(true)} />
        
        {/* Global Voice Command FAB */}
        <GlobalVoiceCommand />
        
        {/* Central Command Hub Overlay */}
        <CommandHub isOpen={isCommandHubOpen} onClose={() => setIsCommandHubOpen(false)} />

        {pendingUpdate && (
          <div className="fixed bottom-24 right-4 z-[9998] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-[#00ff88]/30 bg-black/90 p-5 shadow-[0_0_35px_rgba(0,255,136,0.18)] backdrop-blur-2xl">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#00ff88]">YBY_UPDATE_READY</p>
            <p className="mb-4 text-xs leading-relaxed text-gray-400">Nova versao pronta. Recarregue quando nao estiver no meio de uma operacao.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingUpdate(null)}
                className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/5"
              >
                Depois
              </button>
              <button
                onClick={pendingUpdate}
                className="flex-1 rounded-xl bg-[#00ff88] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black hover:bg-[#00ff88]/80"
              >
                Atualizar
              </button>
            </div>
          </div>
        )}
        
      </div>
    </HashRouter>
  );
}

