import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import App from './App.tsx';
import './index.css';
import { WalletProvider } from './contexts/WalletContext'; // Adjust the import path as needed

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <WalletProvider> {/* Wrap WalletProvider here if not in App.tsx */}
        <App />
      </WalletProvider>
    </BrowserRouter>
  </StrictMode>
);