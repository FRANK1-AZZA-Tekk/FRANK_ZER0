import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Activity, Cpu, Wifi, Battery, Radio, Zap, Shield, RefreshCw, Smartphone, Watch, Layers, Terminal as TerminalIcon, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { updateHardwareTelemetry } from '../store/slices/swarmSlice';

import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Float, PerspectiveCamera, Environment, ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { WebGLCanvasBoundary } from '../components/WebGLCanvasBoundary';

function Device3D({ telemetry }: { telemetry: any }) {
  const mesh = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, (telemetry.cpu - 50) * 0.01, 0.1);
      mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, (telemetry.ram - 50) * 0.01, 0.1);
      mesh.current.rotation.z = THREE.MathUtils.lerp(mesh.current.rotation.z, (telemetry.temp - 37) * 0.1, 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <RoundedBox ref={mesh} args={[4, 0.5, 3]} radius={0.05} smoothness={4}>
        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.8} />
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[3.8, 0.01, 2.8]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.5} transparent opacity={0.1} />
        </mesh>
      </RoundedBox>
    </Float>
  );
}

function HardwareItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-[#00ff88]/20 pl-3">
      <span className="text-[9px] text-gray-500 font-serif italic tracking-widest uppercase opacity-60 px-1">{label}</span>
      <span className="text-[12px] font-mono font-bold text-gray-200 tracking-tight">{value}</span>
    </div>
  );
}

function BackgroundParticles() {
  const count = 50;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 10,
        speed: Math.random() * 0.5 + 0.1,
        offset: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      particles.forEach((particle, i) => {
        dummy.position.set(
          particle.x,
          particle.y + Math.sin(time * particle.speed + particle.offset) * 0.5,
          particle.z
        );
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial color="#00ff88" />
    </instancedMesh>
  );
}

export default function Hardware() {
  const dispatch = useDispatch();
  const hardware = useSelector((state: RootState) => state.swarm.hardware);
  const [activeDevice, setActiveDevice] = useState<'watch' | 'atom'>('watch');

  const telemetry = hardware[activeDevice];

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates for both devices
      const devices: ('watch' | 'atom')[] = ['watch', 'atom'];
      devices.forEach(device => {
        dispatch(updateHardwareTelemetry({
          device,
          data: {
            cpu: Math.floor(20 + Math.random() * 50),
            ram: Math.floor(40 + Math.random() * 40),
            temp: 34 + Math.random() * 6,
            rssi: -50 - Math.floor(Math.random() * 20),
            battery: Math.max(0, hardware[device].battery - (Math.random() > 0.95 ? 1 : 0))
          }
        }));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [dispatch, hardware]);

  return (
    <div className="flex flex-col items-center p-4 sm:p-8 w-full min-h-screen relative overflow-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,136,0.05)_0%,transparent_50%)] pointer-events-none"></div>
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <WebGLCanvasBoundary>
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 0, 10]} />
            <BackgroundParticles />
          </Canvas>
        </WebGLCanvasBoundary>
      </div>
      
      <div className="w-full max-w-6xl z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6"
        >
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 font-serif italic" style={{ textShadow: '0 0 30px rgba(0,255,136,0.3)' }}>
              HARDWARE<span className="text-[#00ff88]">_</span>LINK
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono font-bold tracking-[0.2em] text-[#00ff88]/60 uppercase border-y border-white/10 py-2 hardware-dashed">
              <span className="flex items-center gap-1.5"><Radio size={14} className="text-[#00ff88]" /> BLE_MESH_ATIVO</span>
              <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
              <span className="flex items-center gap-1.5"><Shield size={14} className="text-blue-400" /> FIRMWARE_v3.2</span>
              <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
              <span className="flex items-center gap-1.5"><Zap size={14} className="text-yellow-500" /> BAIXA_LATÊNCIA</span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/40 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
            <button className="p-3 bg-white/5 rounded-2xl border border-white/10 text-[#00ff88] hover:bg-[#00ff88]/10 transition-all group">
              <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
            </button>
            <div className="h-10 w-[1px] bg-white/10"></div>
            <div className="flex flex-col items-end px-4">
              <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase mb-1">Nós_Mesh</span>
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse"></div>
                <span className="text-xs font-black text-[#00ff88] tracking-widest">02_ATIVOS</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Device Selection & Status */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <DeviceCard 
              type="watch" 
              name="T-WATCH S3" 
              status={hardware.watch.connected ? "CONNECTED" : "OFFLINE"} 
              battery={hardware.watch.battery} 
              active={activeDevice === 'watch'} 
              onClick={() => setActiveDevice('watch')}
              icon={<Watch size={24} />}
              signal={hardware.watch.rssi}
            />
            <DeviceCard 
              type="atom" 
              name="ATOM S3R" 
              status={hardware.atom.connected ? "CONNECTED" : "OFFLINE"} 
              battery={hardware.atom.battery} 
              active={activeDevice === 'atom'} 
              onClick={() => setActiveDevice('atom')}
              icon={<Smartphone size={24} />}
              signal={hardware.atom.rssi}
            />

            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 flex flex-col gap-6">
              <h3 className="text-[#00ff88] text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-3">
                <Activity size={16} />
                TELEMETRIA_AO_VIVO
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <TelemetryStat label="CARGA_CPU" value={`${telemetry.cpu}%`} color="text-[#00ff88]" />
                <TelemetryStat label="USO_RAM" value={`${telemetry.ram}%`} color="text-blue-400" />
                <TelemetryStat label="TEMP_NÚCLEO" value={`${telemetry.temp.toFixed(1)}°C`} color="text-yellow-500" />
                <TelemetryStat label="RSSI_SIG" value={`${telemetry.rssi}dBm`} color="text-purple-400" />
              </div>

              <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[9px] font-black text-gray-500 tracking-widest uppercase mb-3">
                  <span>Buffer_Sync</span>
                  <span className="text-[#00ff88]">98%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: '98%' }}
                    className="h-full bg-[#00ff88] shadow-[0_0_10px_#00ff88]"
                  ></motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Visualization Area */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="bg-black/60 backdrop-blur-3xl border border-[#00ff88]/20 rounded-2xl sm:rounded-[3rem] p-4 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col min-h-[400px] sm:min-h-[500px]">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#00ff88]/40"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 sm:p-4 bg-[#00ff88]/10 rounded-xl sm:rounded-2xl border border-[#00ff88]/20">
                    <Layers size={20} className="text-[#00ff88]" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-white text-base sm:text-xl font-black tracking-widest uppercase">MAPEAMENTO_ESPACIAL</h3>
                    <span className="text-[9px] text-gray-500 font-bold tracking-[0.2em] uppercase mt-1">DISPOSITIVO: {activeDevice.toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      try {
                        const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
                        await fetch(`${apiUrl}/swarm/gesture`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ gesture_type: 'SWIPE_RIGHT', duration: 300 })
                        });
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="px-4 py-2 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 rounded-xl border border-[#00ff88]/30 text-[10px] font-black text-[#00ff88] tracking-widest uppercase transition-colors"
                  >
                    SIMULAR_GESTO
                  </button>
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black text-[#00ff88] tracking-widest uppercase">
                    6-EIXOS_ATIVO
                  </div>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center relative min-h-[300px]">
                <WebGLCanvasBoundary fallback={
                  <div className="flex h-full min-h-[300px] w-full items-center justify-center rounded-3xl border border-[#00ff88]/20 bg-[#00ff88]/5 text-[10px] font-black uppercase tracking-[0.3em] text-[#00ff88]/70">
                    WEBGL_OFFLINE
                  </div>
                }>
                  <Canvas>
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
                    <Device3D telemetry={telemetry} />
                    <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
                    <Environment preset="city" />
                  </Canvas>
                </WebGLCanvasBoundary>

                {/* Axis Indicators */}
                <div className="absolute bottom-0 left-0 flex flex-col gap-4">
                  <AxisIndicator label="EIXO_X" value={telemetry.cpu} color="bg-red-500" />
                  <AxisIndicator label="EIXO_Y" value={telemetry.ram} color="bg-green-500" />
                  <AxisIndicator label="EIXO_Z" value={telemetry.temp * 2} color="bg-blue-500" />
                </div>
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                  <h4 className="text-[10px] font-black text-gray-500 tracking-[0.3em] uppercase">MAPEAMENTO_GESTUAL</h4>
                  <div className="flex flex-wrap gap-2">
                    <GestureTag label="DESLIZE_CIMA" active={telemetry.cpu > 60} />
                    <GestureTag label="DESLIZE_BAIXO" active={telemetry.ram > 75} />
                    <GestureTag label="TOQUE_DUPLO" active={telemetry.temp > 38} />
                    <GestureTag label="AGITAR" active={telemetry.rssi < -68} />
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <h4 className="text-[10px] font-black text-gray-500 tracking-[0.3em] uppercase">LOGS_HARDWARE</h4>
                  <div className="bg-black/40 rounded-2xl border border-white/5 p-4 h-32 overflow-y-auto scrollbar-hide font-mono text-[10px] text-gray-500">
                    <div className="mb-1 text-[#00ff88]">[07:25:19] BLE_HANDSHAKE_SUCESSO</div>
                    <div className="mb-1">[07:25:20] CALIBRACAO_IMU_COMPLETA</div>
                    <div className="mb-1">[07:25:21] SYNC_MESH_ESTAVEL</div>
                    <div className="mb-1 text-yellow-500">[07:25:22] TESTE_BATERIA_BAIXA</div>
                    <div className="mb-1">[07:25:23] HEARTBEAT_ACK_RECEBIDO</div>
                  </div>
                </div>
              </div>

              {/* Detailed Hardware Mesh */}
              <div className="mt-12 flex flex-col gap-6">
                <h4 className="text-[10px] font-black text-[#00ff88] tracking-[0.3em] uppercase flex items-center gap-2 border-b border-white/10 pb-2">
                  <TerminalIcon size={14} />
                  MALHA_DE_HARDWARE_DO_SISTEMA
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-black/40 rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
                    <h5 className="text-[12px] font-black text-white tracking-widest uppercase mb-2">PC_CORE_NODE</h5>
                    <HardwareItem label="GPU" value="Vast.ai RTX 6000 ADA (Cloud Burst)" />
                    <HardwareItem label="CPU" value="AMD Ryzen 5 4600G, 3.7GHz" />
                    <HardwareItem label="RAM" value="16GB 3000MHz" />
                    <HardwareItem label="LLM_ROUTER" value="LiteLLM (Groq/MiMo/RTX6000)" />
                    <HardwareItem label="VECTOR_DB" value="Zvec/ChromaDB -> LanceDB" />
                    <HardwareItem label="MQTT" value="Eclipse Mosquitto" />
                    <HardwareItem label="MESH" value="Tailscale Secure Mesh" />
                    <HardwareItem label="ORCHESTRATION" value="Asyncio + Wake-on-LAN" />
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="bg-black/40 rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
                      <h5 className="text-[12px] font-black text-white tracking-widest uppercase mb-2">MOBILE_&_WEARABLES</h5>
                      <HardwareItem label="HOST" value="XIAOMI 12 Android 15 + hyperOS 3.0" />
                      <HardwareItem label="WATCH" value="LILYGO T-WATCH S3 (ESP32-S3)" />
                      <HardwareItem label="MIC" value="INMP441 PDM (<10ms Wake)" />
                      <HardwareItem label="TELEMETRY" value="ESP-NOW + NimBLE-Arduino (2ms)" />
                      <HardwareItem label="AUDIO_ENGINE" value="OpenWakeWord 2.0 + Silero VAD" />
                      <HardwareItem label="STT_TTS" value="Whisper.cpp + Kokoro Q4F16 ONNX" />
                      <HardwareItem label="HEALTH" value="TinyML ESP32-S3 HRV Predictor" />
                    </div>
                    
                    <div className="bg-[#00ff88]/5 rounded-2xl border border-[#00ff88]/20 p-6 flex flex-col gap-2">
                      <h5 className="text-[10px] font-black text-[#00ff88] tracking-[0.2em] uppercase mb-1">CORTEX_STATUS</h5>
                      <p className="text-xs text-gray-400 font-mono leading-relaxed">
                        All nodes synchronized via Tailscale. Offline AI models (Llama.cpp + TurboQuant PR#441) ready. Deep Sleep active on T-Watch. Aider v0.42.0 + Qwen2.5-Coder 32B standing by.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ type, name, status, battery, active, onClick, icon, signal }: { 
  type: string, name: string, status: string, battery: number, active: boolean, onClick: () => void, icon: React.ReactNode, signal?: number 
}) {
  const signalPercent = signal ? Math.max(0, Math.min(100, (signal + 100) * (100 / 60))) : 100;

  return (
    <button 
      onClick={onClick}
      className={`w-full p-6 rounded-[2rem] border transition-all duration-500 flex flex-col group relative overflow-hidden ${
        active 
          ? 'bg-[#00ff88]/10 border-[#00ff88]/30 shadow-[0_0_40px_rgba(0,255,136,0.15)]' 
          : 'bg-black/40 border-white/5 hover:border-white/20'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-2xl transition-all duration-500 ${
            active ? 'bg-[#00ff88] text-black shadow-[0_0_20px_#00ff88]' : 'bg-white/5 text-gray-500 group-hover:text-white'
          }`}>
            {icon}
          </div>
          <div className="flex flex-col items-start">
            <span className={`text-sm font-black tracking-widest uppercase transition-colors ${active ? 'text-white' : 'text-gray-500'}`}>{name}</span>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#00ff88] animate-pulse' : 'bg-gray-700'}`}></div>
              <span className={`text-[9px] font-black tracking-widest uppercase ${active ? 'text-[#00ff88]' : 'text-gray-600'}`}>{status}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          {!active && (
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Battery size={14} className={battery < 20 ? 'text-red-500 animate-pulse' : ''} />
              <span className="text-[10px] font-black tabular-nums">{battery}%</span>
            </div>
          )}
          <ChevronRight size={18} className={`transition-all duration-500 ${active ? 'text-[#00ff88] translate-x-0' : 'text-gray-800 -translate-x-4 opacity-0'}`} />
        </div>
      </div>

      {active && (
        <div className="w-full flex flex-col gap-4 mt-6 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black text-gray-500 tracking-widest uppercase flex items-center gap-1.5">
                <Battery size={10} className={battery < 20 ? 'text-red-500' : 'text-[#00ff88]'} /> 
                CÉLULA_ENERGIA
              </span>
              <span className={`text-[10px] font-black tabular-nums ${battery < 20 ? 'text-red-500' : 'text-[#00ff88]'}`}>{battery}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${battery}%` }}
                className={`h-full ${battery < 20 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-[#00ff88] shadow-[0_0_10px_#00ff88]'}`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black text-gray-500 tracking-widest uppercase flex items-center gap-1.5">
                <Wifi size={10} className="text-blue-400" /> 
                FORÇA_SINAL
              </span>
              <span className="text-[10px] font-black text-blue-400 tabular-nums">{signal ? `${signal} dBm` : '100%'}</span>
            </div>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${signalPercent}%` }}
                className="h-full bg-blue-400 shadow-[0_0_10px_#60a5fa]"
              />
            </div>
          </div>
        </div>
      )}
      
      {active && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ff88] to-transparent opacity-50"></div>
      )}
    </button>
  );
}

function TelemetryStat({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 bg-black/60 rounded-xl border border-white/5 hardware-dashed">
      <span className="text-[9px] text-gray-600 font-serif italic tracking-widest uppercase opacity-60">{label}</span>
      <span className={`text-base font-black font-mono tracking-tight tabular-nums ${color} drop-shadow-[0_0_8px_currentColor]`}>{value}</span>
    </div>
  );
}

function AxisIndicator({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-16 text-[8px] text-gray-600 font-black tracking-widest uppercase">{label}</div>
      <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          animate={{ width: `${Math.min(100, value)}%` }}
          className={`h-full ${color} shadow-[0_0_10px_currentColor]`}
        ></motion.div>
      </div>
      <div className="w-8 text-[9px] font-black text-gray-500 tabular-nums">{Math.floor(value)}</div>
    </div>
  );
}

function GestureTag({ label, active }: { label: string, active: boolean }) {
  return (
    <div className={`px-3 py-1.5 rounded-lg border text-[9px] font-black tracking-widest uppercase transition-all duration-500 ${
      active 
        ? 'bg-[#00ff88]/20 border-[#00ff88]/40 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.2)] scale-105' 
        : 'bg-white/5 border-white/5 text-gray-700'
    }`}>
      {label}
    </div>
  );
}
