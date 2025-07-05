import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Pause, Trash2, TrendingUp } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useNear } from '../hooks/useNear';
import { ArbitrageIntent } from '../utils/near';

export const IntentManager: React.FC = () => {
  const { nearContract, isSignedIn } = useNear();
  const [intents, setIntents] = useState<ArbitrageIntent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newIntent, setNewIntent] = useState({
    tokenPair: 'ETH/USDC',
    minProfitThreshold: '1.0'
  });

  useEffect(() => {
    if (isSignedIn && nearContract) {
      fetchIntents();
    }
  }, [isSignedIn, nearContract]);

  const fetchIntents = async () => {
    try {
      setIsLoading(true);
      const fetchedIntents = await nearContract.getIntents();
      setIntents(fetchedIntents);
    } catch (error) {
      console.error('Error fetching intents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateIntent = async () => {
    if (!nearContract) return;

    try {
      setIsLoading(true);
      await nearContract.createIntent(
        newIntent.tokenPair,
        newIntent.minProfitThreshold
      );
      setShowCreateForm(false);
      setNewIntent({ tokenPair: 'ETH/USDC', minProfitThreshold: '1.0' });
      await fetchIntents();
    } catch (error) {
      console.error('Error creating intent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseIntent = async (intentId: string) => {
    if (!nearContract) return;

    try {
      setIsLoading(true);
      await nearContract.pauseIntent(intentId);
      await fetchIntents();
    } catch (error) {
      console.error('Error pausing intent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeIntent = async (intentId: string) => {
    if (!nearContract) return;

    try {
      setIsLoading(true);
      await nearContract.resumeIntent(intentId);
      await fetchIntents();
    } catch (error) {
      console.error('Error resuming intent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tokenPairs = [
    'ETH/USDC',
    'BTC/USDC',
    'NEAR/USDC',
    'SOL/USDC',
    'AVAX/USDC'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Arbitrage Intents
          </h2>
          <p className="text-gray-400 mt-2">
            Manage your automated cross-chain arbitrage strategies
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Intent</span>
        </Button>
      </div>

      {/* Create Intent Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <Card className="w-full max-w-md">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Create New Intent</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Pair
                </label>
                <select
                  value={newIntent.tokenPair}
                  onChange={(e) => setNewIntent({ ...newIntent, tokenPair: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {tokenPairs.map(pair => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Profit Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newIntent.minProfitThreshold}
                  onChange={(e) => setNewIntent({ ...newIntent, minProfitThreshold: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="1.0"
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleCreateIntent}
                  isLoading={isLoading}
                  className="flex-1"
                >
                  Create Intent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Intents List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : intents.length === 0 ? (
          <Card className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No Intents Yet</h3>
            <p className="text-gray-500">Create your first arbitrage intent to get started</p>
          </Card>
        ) : (
          intents.map((intent) => (
            <motion.div
              key={intent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full ${
                    intent.status === 'active' ? 'bg-green-500' : 
                    intent.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <h3 className="font-semibold text-white">{intent.token_pair}</h3>
                    <p className="text-sm text-gray-400">
                      Min Profit: {intent.min_profit_threshold}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    intent.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    intent.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {intent.status}
                  </span>
                  
                  {intent.status === 'active' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePauseIntent(intent.id)}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      <Pause className="w-4 h-4" />
                    </Button>
                  ) : intent.status === 'paused' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResumeIntent(intent.id)}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};