import React, { useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <HashRouter>
      <div 
        className="min-h-screen bg-[#050505] text-white font-mono flex flex-col overflow-x-hidden selection:bg-[#00ff88] selection:text-black cursor-none"
        onMouseMove={handleMouseMove}
      >
        
        {/* Exocortex Neural Follower */}
        <motion.div 
          animate={{ x: mousePos.x, y: mousePos.y }}
          transition={{ type: "spring", damping: 40, stiffness: 250, mass: 0.5 }}
          className="fixed w-6 h-6 rounded-full border border-[#00ff88]/40 pointer-events-none z-[9999] flex items-center justify-center"
          style={{ left: -12, top: -12 }}
        >
          <div className="w-1.5 h-1.5 bg-[#00ff88] rounded-full shadow-[0_0_10px_#00ff88]"></div>
          <div className="absolute inset-0 border border-[#00ff88]/20 rounded-full animate-ping opacity-30"></div>
        </motion.div>

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
        
      </div>
    </HashRouter>
  );
}

