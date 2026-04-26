import { configureStore } from '@reduxjs/toolkit';
import swarmReducer from './slices/swarmSlice';

export const store = configureStore({
  reducer: {
    swarm: swarmReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
