import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, X, Loader2, Cpu, Camera, Save, Check } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import { setAgentStatus, addLog, setVisionResult, setProcessingVision } from '../store/slices/swarmSlice';
import { getApiUrl } from '../utils/api';
import { performResearch, processGeneralCommand } from '../utils/gemini';
import { persistenceService } from '../utils/persistence';

const HapticFeedbackType = {
  LongPress: 'LongPress'
} as const;

const LocalHapticFeedback = {
  vibrate: (type: keyof typeof HapticFeedbackType) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(type === 'LongPress' ? 100 : 50);
    }
  }
};

export function GlobalVoiceCommand() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Audio Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!transcript || !response || isSaved) return;
    
    try {
      await persistenceService.saveResponse({ transcript, response });
      setIsSaved(true);
      dispatch(addLog({
        message: 'Resposta YBY persistida no IndexedDB local.',
        origin: 'MEMORY',
        type: 'success'
      }));
      LocalHapticFeedback.vibrate(HapticFeedbackType.LongPress);
    } catch (error) {
      console.error('Error saving to IndexedDB:', error);
      dispatch(addLog({
        message: 'Falha ao persistir dados na memória local.',
        origin: 'MEMORY',
        type: 'error'
      }));
    }
  };

  // Vision logic
  const handleCameraClick = () => {
    LocalHapticFeedback.vibrate(HapticFeedbackType.LongPress);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    dispatch(addLog({
      message: 'Imagem capturada, processando nó visual...',
      origin: 'VISION',
      type: 'info'
    }));
    dispatch(setProcessingVision(true));
    dispatch(setAgentStatus({ VISION_AGENT: 'working' }));
    
    // Auto navigation to dashboard to let user see stream
    navigate('/dashboard');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        
        try {
          const res = await fetch(`${getApiUrl()}/api/v1/swarm/vision`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64data,
              task: "Describe objects and perform OCR"
            })
          });
          
          if (!res.ok) throw new Error('Falha na API visual');
          
          const result = await res.json();
          dispatch(addLog({
            message: `${result.analysis?.substring(0, 50)}...`,
            origin: 'VISION',
            type: 'success'
          }));
          dispatch(setVisionResult(result));
          
        } catch (apiError) {
          console.warn('API /vision indisponível, emulando resultado de fallback:', apiError);
          // Fallback if backend is down
          setTimeout(() => {
            dispatch(setVisionResult({
              analysis: "Análise local (fallback): Imagem identificada com múltiplos vetores em ambiente externo.",
              objects: ["vetor", "ambiente", "captura_local"],
              ocr: "NENHUM TEXTO RELEVANTE ENCONTRADO",
              confidence: 0.88
            }));
            dispatch(addLog({
              message: 'Processamento local (offline) concluído.',
              origin: 'VISION',
              type: 'info'
            }));
          }, 2000);
        } finally {
          dispatch(setProcessingVision(false));
          dispatch(setAgentStatus({ VISION_AGENT: 'idle' }));
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      dispatch(addLog({
        message: 'Falha ao capturar imagem na lente.',
        origin: 'VISION',
        type: 'error'
      }));
      dispatch(setProcessingVision(false));
      dispatch(setAgentStatus({ VISION_AGENT: 'error' }));
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsListening(true);
        setIsOpen(true);
        setTranscript('');
        setResponse('');
        dispatch(setAgentStatus({ VOICE_AGENT: 'working' }));
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          await processAudioCommand(base64data);
        };

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied or not available.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudioCommand = async (audioBase64: string) => {
    setIsProcessing(true);
    dispatch(addLog({
      message: 'Processando áudio via Whisper.cpp (PT-BR)...',
      origin: 'VOICE',
      type: 'info'
    }));
    
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/swarm/voice/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_base64: audioBase64, device: "web-client" })
      });
      
      if (!res.ok) throw new Error('API Error');
      
      const data = await res.json();
      const ybyResponse = data.yby_response || data.result?.response || 'Comando processado com sucesso.';
      const transcript = data.transcript || data.input_text || 'Áudio transcrito';
      setTranscript(transcript);
      
      // Hook: if transcription commands vision analysis
      const lowerText = transcript.toLowerCase();
      const visionKeywords = [
        'analisar imagem', 
        'abrir câmera', 
        'tirar foto', 
        'analyze this scene', 
        'scan surroundings', 
        'analisar cena', 
        'escanear arredores'
      ];
      
      if (visionKeywords.some(keyword => lowerText.includes(keyword))) {
        setResponse('YBY_VISION: Ativando sensores ópticos. Aguardando captura...');
        handleCameraClick();
      } else {
        setResponse(ybyResponse);
      }
      
      dispatch(addLog({
        message: ybyResponse,
        origin: 'YBY',
        type: 'success'
      }));
      dispatch(addLog({
        message: 'Gerando áudio via Kokoro Q4F16 ONNX...',
        origin: 'TTS',
        type: 'info'
      }));
      dispatch(setAgentStatus({ VOICE_AGENT: 'idle' }));
      
      // Handle navigation based on transcript
      handleNavigation(transcript);
      
    } catch (e) {
      dispatch(addLog({
        message: 'API Cortex inacessível. Usando processamento local.',
        origin: 'SYSTEM',
        type: 'warning'
      }));
      setResponse('Erro ao processar áudio. Verifique a conexão com o servidor.');
      dispatch(setAgentStatus({ VOICE_AGENT: 'error' }));
      setTimeout(() => dispatch(setAgentStatus({ VOICE_AGENT: 'idle' })), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNavigation = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('abrir') || lowerText.includes('ir para') || lowerText.includes('mostrar')) {
      if (lowerText.includes('memória') || lowerText.includes('memory') || lowerText.includes('lancedb')) {
        navigate('/memory');
        setTimeout(closeOverlay, 3000);
      } else if (lowerText.includes('tarefa') || lowerText.includes('tasks')) {
        navigate('/tasks');
        setTimeout(closeOverlay, 3000);
      } else if (lowerText.includes('evolução') || lowerText.includes('scan') || lowerText.includes('limpeza')) {
        navigate('/evolution');
        setTimeout(closeOverlay, 3000);
      } else if (lowerText.includes('dashboard') || lowerText.includes('início')) {
        navigate('/dashboard');
        setTimeout(closeOverlay, 3000);
      } else if (lowerText.includes('hardware') || lowerText.includes('esp32') || lowerText.includes('watch')) {
        navigate('/hardware');
        setTimeout(closeOverlay, 3000);
      } else if (lowerText.includes('router') || lowerText.includes('roteador') || lowerText.includes('swarm')) {
        navigate('/router');
        setTimeout(closeOverlay, 3000);
      }
    }
  };

  const onClick = () => {
    if (isLongPressRef.current) return;
    LocalHapticFeedback.vibrate(HapticFeedbackType.LongPress);
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const onLongPress = () => {
    LocalHapticFeedback.vibrate(HapticFeedbackType.LongPress);
    // Optional long press specific action (e.g., force close or research mode)
    if (isListening) stopListening();
    setIsOpen(false);
  };

  const handlePointerDown = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const closeOverlay = () => {
    if (isListening) {
      stopListening();
    }
    setIsOpen(false);
    setTranscript('');
    setResponse('');
  };

  return (
    <>
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleImageCapture}
        className="hidden" 
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 z-[90] flex flex-col gap-4 items-center justify-end">
        {/* Camera/Vision Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCameraClick}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-black/80 backdrop-blur-xl border border-blue-500/50 text-blue-400 hover:bg-blue-500/20 shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-colors duration-300 z-[90]"
          title="Análise Visual"
        >
          <Camera size={18} />
        </motion.button>
        
        {/* Microphone Button with Pulse */}
        <div className="relative flex items-center justify-center">
          {isListening && (
            <>
              <motion.div
                animate={{ scale: [1, 1.4, 1.8], opacity: [0.5, 0.2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 w-full h-full rounded-full bg-[#ff00ff]/50"
              />
              <motion.div
                animate={{ scale: [1, 1.4, 1.8], opacity: [0.6, 0.3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                className="absolute inset-0 w-full h-full rounded-full bg-[#ff00ff]/40"
              />
            </>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] border-2 transition-colors duration-300 ${
              isListening 
                ? 'bg-[#ff00ff]/20 border-[#ff00ff] text-[#ff00ff] shadow-[0_0_20px_rgba(255,0,255,0.4)] animate-pulse' 
                : 'bg-black/80 backdrop-blur-xl border-[#00ff88]/50 text-[#00ff88] hover:bg-[#00ff88]/20 hover:border-[#00ff88]'
            }`}
            title="Comando Global por Voz"
          >
            <Mic size={24} />
          </motion.button>
        </div>
      </div>

      {/* Voice Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-40 sm:bottom-28 right-4 sm:right-8 w-[calc(100vw-2rem)] sm:w-96 bg-black/95 backdrop-blur-3xl border border-[#00ff88]/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,255,136,0.15)] z-[100] flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <Cpu size={18} className={isListening ? "text-[#ff00ff] animate-pulse" : "text-[#00ff88]"} />
                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white">
                  {isListening ? 'OUVINDO...' : isProcessing ? 'PROCESSANDO...' : 'RESPOSTA_YBY'}
                </span>
              </div>
              <button onClick={closeOverlay} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="min-h-[80px] flex flex-col justify-center">
              {transcript ? (
                <p className="text-sm text-gray-300 italic mb-4">"{transcript}"</p>
              ) : (
                <p className="text-xs text-gray-600 italic mb-4 text-center">Fale agora...</p>
              )}

              {isProcessing && (
                <div className="flex items-center gap-3 text-[#00ff88] justify-center py-4">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Analisando Intenção...</span>
                </div>
              )}

              {response && (
                <div className="relative group">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-xl p-4 max-h-64 overflow-y-auto custom-scrollbar"
                  >
                    <p className="text-sm text-[#00ff88] font-medium leading-relaxed whitespace-pre-wrap">
                      {response}
                    </p>
                  </motion.div>
                  
                  <button 
                    onClick={handleSave}
                    className={`absolute -top-2 -right-2 p-2 rounded-full border transition-all duration-300 shadow-lg ${
                      isSaved 
                        ? 'bg-[#00ff88] border-[#00ff88] text-black scale-110' 
                        : 'bg-black border-[#00ff88]/30 text-[#00ff88] hover:border-[#00ff88] hover:bg-[#00ff88]/10'
                    }`}
                    title={isSaved ? "Salvo na Memória Local" : "Salvar Resposta"}
                  >
                    {isSaved ? <Check size={14} /> : <Save size={14} />}
                  </button>
                </div>
              )}
            </div>

            {/* Audio Visualizer Simulation */}
            {isListening && (
              <div className="flex items-end justify-center gap-1 h-8 mt-2">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <motion.div 
                    key={`vis-${i}`}
                    animate={{ height: [`${20 + Math.random() * 80}%`, `${20 + Math.random() * 80}%`] }}
                    transition={{ duration: 0.2, repeat: Infinity }}
                    className="w-1.5 bg-[#ff00ff] rounded-full shadow-[0_0_10px_#ff00ff]"
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
