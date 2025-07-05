import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AnimatedBackground } from './components/ui/AnimatedBackground';
import { Navigation } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { WalletProvider } from './contexts/WalletContext';
import { useWallet } from './contexts/WalletContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15000, // Reduced to 15 seconds for more frequent updates
      refetchInterval: 15000, // Refetch every 15 seconds
    },
  },
});

function AppContent() {
  const { isSignedIn, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Initializing Cross-Chain Agent
          </h2>
          <p className="text-gray-400">Connecting to NEAR Protocol...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <AnimatedBackground />
      <div className="relative z-10">
        {isSignedIn && <Navigation />}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={isSignedIn ? <DashboardPage /> : <Navigate to="/" />}
          />
          <Route
            path="/history"
            element={isSignedIn ? <HistoryPage /> : <Navigate to="/" />}
          />
          <Route
            path="/settings"
            element={isSignedIn ? <SettingsPage /> : <Navigate to="/" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <AppContent />
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;