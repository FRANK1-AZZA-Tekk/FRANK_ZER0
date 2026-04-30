import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addLog, setAgentStatus, setVisionResult, setProcessingVision, setLastError } from '../store/slices/swarmSlice';
import { getApiUrl } from '../utils/api';
import { processGeneralCommand, processVision } from '../utils/gemini';

export function useDashboardCommands(activeDevice: string) {
  const dispatch = useDispatch();
  const [isListening, setIsListening] = useState(false);

  const log = useCallback((msg: string, origin = 'SYSTEM', type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    dispatch(addLog({ message: msg, origin, type }));
  }, [dispatch]);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      log('Mic deactivated.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      log('Error: Speech Recognition API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      dispatch(setAgentStatus({ VOICE_AGENT: 'working' }));
      log('Mic active. Listening for commands...');
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      log(`Recognized: "${transcript}"`);
      setIsListening(false);

      try {
        log('Routing to VOICE_AGENT (Groq/DeepSeek)...');
        const res = await fetch(`${getApiUrl()}/api/v1/swarm/voice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio_text: transcript, device: activeDevice === 'watch' ? "t-watch-s3" : "m5stack-atom" })
        });
        
        if (!res.ok) throw new Error('API Error');
        
        const data = await res.json();
        log(`YBY: ${data.yby_response || 'Error processing'}`);
        dispatch(setAgentStatus({ VOICE_AGENT: 'idle' }));
      } catch (e) {
        log('Error: Cortex API unreachable. Simulating offline response...');
        dispatch(setAgentStatus({ VOICE_AGENT: 'error' }));
        setTimeout(() => {
          log(`YBY (Offline): I heard "${transcript}", but I am currently disconnected from the main cortex. Processing locally with limited context.`);
          dispatch(setAgentStatus({ VOICE_AGENT: 'idle' }));
        }, 1000);
      }
    };

    recognition.onerror = (event: any) => {
      log(`Error: Speech recognition failed (${event.error})`);
      setIsListening(false);
      dispatch(setAgentStatus({ VOICE_AGENT: 'error' }));
      setTimeout(() => dispatch(setAgentStatus({ VOICE_AGENT: 'idle' })), 2000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isListening, activeDevice, dispatch, log]);

  const handleBleClick = useCallback(async () => {
    log('Scanning for T-Watch S3 / M5Stack AtomS3R...');
    dispatch(setAgentStatus({ GESTURE_AGENT: 'working' }));
    
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) {
        throw new Error("Web Bluetooth API não suportada neste navegador.");
      }
      
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'] // Example service
      });
      
      log(`Connected to: ${device.name || 'Unknown Device'} (BLE)`);
      dispatch(setAgentStatus({ GESTURE_AGENT: 'idle' }));
      
      // Listen for disconnect
      device.addEventListener('gattserverdisconnected', () => {
        log(`[BLE] Device ${device.name} disconnected.`);
      });
      
    } catch (error) {
      log(`[BLE Error] ${error instanceof Error ? error.message : String(error)}`);
      dispatch(setAgentStatus({ GESTURE_AGENT: 'error' }));
      setTimeout(() => dispatch(setAgentStatus({ GESTURE_AGENT: 'idle' })), 2000);
    }
  }, [dispatch, log]);

  const handleVisionChange = useCallback(async (file: File) => {
    log(`Processing Vision: ${file.name}`);
    dispatch(setProcessingVision(true));
    dispatch(setLastError(null));
    dispatch(setAgentStatus({ VISION_AGENT: 'working' }));

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
      });
      
      const res = await fetch(`${getApiUrl()}/api/v1/swarm/vision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });
      
      const data = await res.json();
      if (res.ok) {
        dispatch(setVisionResult(data));
        log(`Vision Analysis: ${data.analysis}`);
        dispatch(setAgentStatus({ VISION_AGENT: 'idle' }));
      } else {
        throw new Error(data.detail || 'Vision processing failed on backend');
      }
    } catch (err) {
      log('Cortex API unreachable. Usando Gemini Vision local...');
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = error => reject(error);
        });
        const analysis = await processVision(base64);
        dispatch(setVisionResult({ analysis, objects: [], confidence: 0.95 }));
        log(`Vision Analysis (Local): ${analysis.substring(0, 50)}...`);
        dispatch(setAgentStatus({ VISION_AGENT: 'idle' }));
      } catch (e) {
        dispatch(setLastError('Falha no processamento visual local'));
        log('Vision Error: Falha local');
        dispatch(setAgentStatus({ VISION_AGENT: 'error' }));
      }
    } finally {
      dispatch(setProcessingVision(false));
    }
  }, [dispatch, log]);

  const handleTerminalSubmit = useCallback(async (command: string) => {
    dispatch(addLog({ message: command, origin: 'HOST', type: 'command' }));
    
    if (command.toLowerCase() === 'clear') {
      dispatch(addLog({ message: '--- LOGS PURGED ---', origin: 'SYSTEM', type: 'warning' }));
      return;
    }

    dispatch(setAgentStatus({ VOICE_AGENT: 'working' }));

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/swarm/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_text: command })
      });
      
      if (!res.ok) throw new Error('API Error');
      
      const data = await res.json();
      
      if (data.yby_response) {
        dispatch(addLog({ message: data.yby_response, origin: 'SWARM', type: 'success' }));
      }
      dispatch(setAgentStatus({ VOICE_AGENT: 'idle' }));
    } catch (err) {
      dispatch(addLog({ message: 'Cortex API unreachable. Processando via Gemini local...', origin: 'SYSTEM', type: 'warning' }));
      dispatch(setAgentStatus({ VOICE_AGENT: 'error' }));
      
      try {
        const localResponse = await processGeneralCommand(command, "Dashboard context");
        dispatch(addLog({ message: localResponse, origin: 'YBY', type: 'info' }));
      } catch (e) {
        dispatch(addLog({ message: `Comando falhou: ${command}`, origin: 'SYSTEM', type: 'error' }));
      } finally {
        setTimeout(() => dispatch(setAgentStatus({ VOICE_AGENT: 'idle' })), 2000);
      }
    }
  }, [dispatch]);

  return {
    isListening,
    handleMicClick,
    handleVisionChange,
    handleTerminalSubmit,
    handleBleClick,
    log
  };
}
