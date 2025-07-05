import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Target, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const tokenPairs = [
    'ETH/USDC',
    'BTC/USDC',
    'NEAR/USDC',
    'SOL/USDC',
    'AVAX/USDC',
    'MATIC/USDC',
    'DOT/USDC',
    'LINK/USDC'
  ];

  const validateWithAI = async () => {
    try {
      setIsValidating(true);
      setError(null);
      
      console.log('🤖 Validating intent with AI...');
      
      // Generate mock prices for validation
      const nearPrice = 3000 + (Math.random() - 0.5) * 100;
      const ethPrice = nearPrice * (1 + (Math.random() - 0.5) * 0.02);
      
      const recommendation = await getTradeRecommendation(
        formData.tokenPair,
        nearPrice,
        ethPrice,
        parseFloat(formData.minProfitThreshold)
      );
      
      setAiValidation({
        shouldExecute: recommendation.shouldExecute,
        confidence: recommendation.confidence,
        reasoning: recommendation.reasoning,
        riskLevel: recommendation.riskLevel || 'MEDIUM',
        nearPrice,
        ethPrice
      });
      
      console.log('✅ AI validation completed:', recommendation);
    } catch (error) {
      console.error('❌ AI validation failed:', error);
      setError('AI validation failed. You can still create the intent.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🚀 Creating intent...', formData);
      
      const result = await createIntent(formData.tokenPair, formData.minProfitThreshold);
      
      console.log('✅ Intent created successfully:', result);
      
      setSuccess(true);
      
      // Show success for 2 seconds then close
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error creating intent:', error);
      setError(error.message || 'Failed to create intent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setAiValidation(null); // Clear previous validation
    setError(null);
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-2">Intent Created Successfully!</h3>
            <p className="text-gray-400">Your arbitrage intent is now active and monitoring the market.</p>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

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
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
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

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-medium">Error</span>
              </div>
              <p className="text-gray-300 text-sm mt-1">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Token Pair
              </label>
              <select
                value={formData.tokenPair}
                onChange={(e) => handleInputChange('tokenPair', e.target.value)}
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
                  onChange={(e) => handleInputChange('minProfitThreshold', e.target.value)}
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

            {/* AI Validation Section */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">AI Validation</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={validateWithAI}
                  isLoading={isValidating}
                  disabled={!formData.tokenPair || !formData.minProfitThreshold}
                >
                  Validate with AI
                </Button>
              </div>

              {aiValidation ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">AI Recommendation:</span>
                    <span className={`font-medium ${
                      aiValidation.shouldExecute ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {aiValidation.shouldExecute ? 'APPROVED' : 'NOT RECOMMENDED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">AI Confidence:</span>
                    <span className="text-cyan-400 font-medium">{aiValidation.confidence}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Risk Level:</span>
                    <span className={`font-medium ${
                      aiValidation.riskLevel === 'LOW' ? 'text-green-400' :
                      aiValidation.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {aiValidation.riskLevel}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-600">
                    <p className="text-gray-300 text-xs">{aiValidation.reasoning}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  Click "Validate with AI" to get AI analysis of your intent parameters
                </p>
              )}
            </div>

            {/* Intent Summary */}
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
                  <span className="text-purple-400 font-medium">Will be Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Deposit Required:</span>
                  <span className="text-yellow-400 font-medium">1 NEAR</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="submit"
                isLoading={isLoading}
                className="flex-1"
                disabled={!formData.tokenPair || !formData.minProfitThreshold}
              >
                {isLoading ? 'Creating Intent...' : 'Create Intent'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
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