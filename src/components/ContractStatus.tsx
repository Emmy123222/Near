import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw,
  Info,
  Zap
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useNear } from '../hooks/useNear';

export const ContractStatus: React.FC = () => {
  const { 
    contractInfo, 
    isSignedIn, 
    accountId, 
    getContractId, 
    getExplorerUrl,
    isLoading 
  } = useNear();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshContractInfo = async () => {
    setIsRefreshing(true);
    // Force re-fetch contract info
    window.location.reload();
  };

  if (isLoading) {
    return (
      <Card className="border-blue-500/20">
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
          <span className="text-blue-400">Connecting to NEAR contract...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-green-500/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold text-white">Contract Status</h3>
              <p className="text-sm text-green-400">Connected to NEAR Protocol</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshContractInfo}
            isLoading={isRefreshing}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Contract Details */}
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Contract ID:</span>
            <div className="flex items-center space-x-2">
              <code className="text-green-400 font-mono text-sm">
                {getContractId() === 'demo-mode' ? 'Demo Mode' : getContractId()}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(getExplorerUrl(), '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Network:</span>
            <span className="text-cyan-400 font-medium">NEAR Testnet</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Status:</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-medium">
                {getContractId() === 'demo-mode' ? 'Demo Mode' : 'Active'}
              </span>
            </div>
          </div>

          {isSignedIn && accountId && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Connected Account:</span>
              <code className="text-purple-400 font-mono text-sm">{accountId}</code>
            </div>
          )}
        </div>

        {/* Contract Info */}
        {contractInfo && (
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-medium">Contract Information</span>
              {contractInfo.mode && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                  {contractInfo.mode.toUpperCase()}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Name:</p>
                <p className="text-white font-medium">{contractInfo.name || 'ArbitrageAI'}</p>
              </div>
              <div>
                <p className="text-gray-400">Version:</p>
                <p className="text-white font-medium">{contractInfo.version || '1.0.0'}</p>
              </div>
              <div>
                <p className="text-gray-400">Total Intents:</p>
                <p className="text-purple-400 font-medium">{contractInfo.total_intents || 0}</p>
              </div>
              <div>
                <p className="text-gray-400">Total Executions:</p>
                <p className="text-green-400 font-medium">{contractInfo.total_executions || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Demo Mode Notice */}
        {getContractId() === 'demo-mode' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Demo Mode Active</span>
            </div>
            <p className="text-gray-300 text-sm mt-2">
              The app is running in demo mode. All transactions are simulated for demonstration purposes.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Deploy your own contract to enable real trading functionality.
            </p>
          </div>
        )}

        {/* Features Status */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Available Features</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Intent Management</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Arbitrage Execution</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Cross-Chain Signatures</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">AI Integration</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Profit Tracking</span>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </div>
          </div>
        </div>

        {!isSignedIn && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Wallet Not Connected</span>
            </div>
            <p className="text-gray-300 text-sm mt-2">
              Connect your NEAR wallet to interact with the smart contract and start trading.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};