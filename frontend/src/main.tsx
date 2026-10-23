import '@fontsource-variable/archivo/wdth.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { listenForInstallPrompt, registerServiceWorker } from './lib/install';
import './styles/tokens.css';
import './styles/base.css';

listenForInstallPrompt();
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
