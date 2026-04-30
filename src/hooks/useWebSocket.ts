import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setWsStatus, setAgentStatus, setPushNotification, addLog, setDailyImprovements } from '../store/slices/swarmSlice';
import { getWsUrl } from '../utils/api';

export const useWebSocket = () => {
  const dispatch = useDispatch();
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const shouldReconnect = useRef(true);
  const maxRetries = 10;

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) return;

    dispatch(setWsStatus('connecting'));
    const socket = new WebSocket(getWsUrl());

    socket.onopen = () => {
      console.log('WebSocket Connected');
      dispatch(setWsStatus('connected'));
      dispatch(addLog({ message: 'Conexão neural restabelecida com o Córtex Central.', origin: 'SYSTEM', type: 'success' }));
      retryCount.current = 0;
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'agent_status') {
          dispatch(setAgentStatus(message.data));
        } else if (message.type === 'push_notification') {
          dispatch(setPushNotification(message.data));
          dispatch(addLog({ message: `[PUSH] ${message.data}`, origin: 'SYSTEM', type: 'info' }));
        } else if (message.type === 'vision_progress') {
          dispatch(addLog({ message: `[VISION] ${message.data.step}`, origin: 'VISION', type: 'info' }));
        } else if (message.type === 'swarm_log') {
          dispatch(addLog({ message: `[SWARM] ${message.data}`, origin: 'SWARM', type: 'info' }));
        } else if (message.type === 'daily_improvements') {
          dispatch(setDailyImprovements(message.data));
          dispatch(addLog({ message: 'Pacote de Melhorias Diárias Disponível.', origin: 'SYSTEM', type: 'info' }));
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket Disconnected', event.reason);
      dispatch(setWsStatus('disconnected'));
      
      if (shouldReconnect.current && retryCount.current < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000); // Exponential backoff
        dispatch(addLog({ message: `Conexão perdida. Tentando reconexão em ${delay/1000}s...`, origin: 'SYSTEM', type: 'warning' }));
        
        reconnectTimeout.current = setTimeout(() => {
          retryCount.current++;
          connect();
        }, delay);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error', error);
      socket.close();
    };

    ws.current = socket;
  }, [dispatch]);

  useEffect(() => {
    shouldReconnect.current = true;
    connect();
    return () => {
      shouldReconnect.current = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnect on unmount
        ws.current.close();
      }
    };
  }, [connect]);

  return { 
    status: ws.current?.readyState, 
    reconnect: connect 
  };
};
