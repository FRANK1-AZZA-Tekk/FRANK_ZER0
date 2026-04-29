import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setDailyImprovements, addLog } from '../store/slices/swarmSlice';

export function useDashboardEvolution() {
  const dispatch = useDispatch();
  const evolution = useSelector((state: RootState) => state.swarm.evolution);
  const dailyImprovements = useSelector((state: RootState) => state.swarm.dailyImprovements);

  const log = useCallback((msg: string, origin = 'SYSTEM', type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    dispatch(addLog({ message: msg, origin, type }));
  }, [dispatch]);

  useEffect(() => {
    const hasSeenImprovements = sessionStorage.getItem('frank_seen_improvements');
    const lastSweep = evolution ? new Date(evolution.lastSweep) : new Date();
    const now = new Date();
    const shouldSweep = now.getHours() === 5 && now.getDate() !== lastSweep.getDate();

    if (!hasSeenImprovements || shouldSweep) {
      const fetchOptimizations = async () => {
        try {
          const { generateOptimizations } = await import('../utils/gemini');
          const results = await generateOptimizations();
          
          dispatch(setDailyImprovements({
            improvements: results.map((opt, i) => ({
              id: `opt-${i}`,
              title: `Otimização ${i + 1}`,
              description: opt,
              impact: i === 0 ? 'Critical' : 'High',
              category: 'optimization' as const
            }))
          }));
          sessionStorage.setItem('frank_seen_improvements', 'true');
          log("[SYSTEM] Varredura das 5 AM completa. Novas melhorias disponíveis.");
        } catch (e) {
          console.error("Failed to fetch daily improvements", e);
        }
      };
      
      fetchOptimizations();
    }
  }, [dispatch, evolution?.lastSweep, log]);

  return { dailyImprovements };
}
