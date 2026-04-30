import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

if (import.meta.env.PROD) {
  const updateSW = registerSW({
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('yby:update-ready', {
        detail: { update: () => updateSW(true) },
      }));
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
