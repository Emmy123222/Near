import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Polyfill Buffer for NEAR API JS
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Polyfill process for browser
if (typeof global === 'undefined') {
  (window as any).global = globalThis;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);