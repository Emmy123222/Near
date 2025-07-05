import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Target, DollarSign } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useNear } from '../hooks/useNear';
import { useGroqAI } from '../hooks/useGroqAI';

interface CreateIntentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateIntentModal: React.FC<CreateIntentModalProps> = ({ onClose, onSuccess }) => {
  const { createIntent } = useNear();
  const { getTradeRecommendation } = useGroqAI();
  const [formData, setFormData] = useState({
    tokenPair: 'ETH/USDC',
    minProfitThreshold: '1.0'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [aiValidation, setAiValidation] = useState<any>(null);

  const tokenPairs = [
    'ETH/USDC',
    'BTC/USDC',
    'NEAR/USDC',
    'SOL/USDC',
    'AVAX/USDC',
    'MATIC/USDC'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const result = await createIntent(formData.tokenPair, formData.minProfitThreshold);
      
      // Set AI validation from the result
      if (result.aiValidated !== undefined) {
        setAiValidation({
          shouldExecute: result.aiValidated,
          confidence: result.aiConfidence,
          reasoning: result.aiReasoning
        });
      }
      
      console.log('✅ Intent created successfully:', result);
      onSuccess();
    } catch (error) {
      console.error('Error creating intent:', error);
      alert(`Failed to create intent: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Create Arbitrage Intent</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Pair
              </label>
              <select
                value={formData.tokenPair}
                onChange={(e) => setFormData({ ...formData, tokenPair: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                {tokenPairs.map(pair => (
                  <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Select the token pair you want to monitor for arbitrage opportunities
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Profit Threshold (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="50"
                  value={formData.minProfitThreshold}
                  onChange={(e) => setFormData({ ...formData, minProfitThreshold: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-10 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="1.0"
                  required
                />
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Minimum profit percentage required to trigger an arbitrage trade
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-medium text-white mb-2">Intent Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Token Pair:</span>
                  <span className="text-white font-medium">{formData.tokenPair}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Min Profit:</span>
                  <span className="text-green-400 font-medium">{formData.minProfitThreshold}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-purple-400 font-medium">Active</span>
                </div>
              </div>
              
              {aiValidation && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <h5 className="text-xs font-medium text-purple-400 mb-2">AI Validation</h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Recommendation:</span>
                      <span className={`font-medium ${
                        aiValidation.shouldExecute ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {aiValidation.shouldExecute ? 'APPROVED' : 'NOT RECOMMENDED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">AI Confidence:</span>
                      <span className="text-cyan-400 font-medium">{aiValidation.confidence}%</span>
                    </div>
                    <p className="text-gray-300 text-xs mt-2">{aiValidation.reasoning}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                type="submit"
                isLoading={isLoading}
                className="flex-1"
              >
                Create Intent
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
};