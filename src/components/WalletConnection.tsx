import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, LogOut, Chrome, Globe, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useWallet } from '../contexts/WalletContext';

export const WalletConnection: React.FC = () => {
  const { isSignedIn, accountId, signIn, signOut, isLoading } = useWallet();

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen"
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Initializing wallet connections...</p>
        </div>
      </motion.div>
    );
  }

  if (!isSignedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-screen"
      >
        <Card className="max-w-md w-full mx-4">
          <div className="text-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Wallet className="w-8 h-8 text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              Connect Your NEAR Wallet
            </h2>
            
            <p className="text-gray-400 mb-6">
              Choose your preferred NEAR wallet to start using ArbitrageAI
            </p>

            {/* Wallet Options Info */}
            <div className="space-y-3 mb-6 text-left">
              <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                <Chrome className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-white">HERE Wallet</p>
                  <p className="text-xs text-gray-400">Chrome extension (Recommended)</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                <Zap className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-white">Meteor Wallet</p>
                  <p className="text-xs text-gray-400">Chrome extension with advanced features</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                <Globe className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-white">MyNEAR Wallet</p>
                  <p className="text-xs text-gray-400">Web-based wallet</p>
                </div>
              </div>
            </div>

            <Button onClick={signIn} className="w-full">
              <Wallet className="w-5 h-5 mr-2" />
              Connect NEAR Wallet
            </Button>

            <p className="text-xs text-gray-500 mt-4">
              Don't have a NEAR wallet? Install HERE Wallet or Meteor Wallet from the Chrome Web Store
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center space-x-4 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl px-4 py-2"
    >
      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
        <Wallet className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">
          {accountId?.length > 20 ? `${accountId.slice(0, 8)}...${accountId.slice(-8)}` : accountId}
        </p>
        <p className="text-xs text-gray-400">Connected</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={signOut}
        className="text-gray-400 hover:text-red-400"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};