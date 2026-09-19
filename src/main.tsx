import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {registerSW} from 'virtual:pwa-register';

// Automatically register service worker for full offline capability
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New offline cache available');
  },
  onOfflineReady() {
    console.log('DocLocker is ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
