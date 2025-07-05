import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Zap,
  Target,
  Clock,
  BarChart3
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useGroqAI } from '../hooks/useGroqAI';
import { AIAnalysis } from '../utils/groqAI';

interface AIAnalysisPanelProps {
  marketData: any[];
  onExecuteRecommendation?: (recommendation: any) => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ 
  marketData, 
  onExecuteRecommendation 
}) => {
  const { 
    isAnalyzing, 
    marketAnalysis, 
    aiOpportunities, 
    analyzeMarket, 
    detectOpportunities 
  } = useGroqAI();
  
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [apiKeyAvailable, setApiKeyAvailable] = useState(true);

  useEffect(() => {
    // Check if API key is available
    const hasApiKey = !!import.meta.env.VITE_GROQ_API_KEY;
    setApiKeyAvailable(hasApiKey);
    
    if (!hasApiKey) {
      console.warn('⚠️ Groq API key not found. AI features will be limited.');
    }
  }, []);

  useEffect(() => {
    if (marketData.length > 0) {
      performAIAnalysis();
    }
  }, [marketData]);

  const performAIAnalysis = async () => {
    try {
      // Simulate NEAR and ETH market data
      const nearData = marketData.map(data => ({
        ...data,
        source: 'near',
        volume24h: Math.random() * 1000000,
        priceChange24h: (Math.random() - 0.5) * 10
      }));

      const ethData = marketData.map(data => ({
        ...data,
        price: data.price * (1 + (Math.random() - 0.5) * 0.02),
        source: 'ethereum',
        volume24h: Math.random() * 2000000,
        priceChange24h: (Math.random() - 0.5) * 8
      }));

      await Promise.all([
        analyzeMarket(nearData),
        detectOpportunities(nearData, ethData)
      ]);

      setLastAnalysis(new Date());
    } catch (error) {
      console.error('Error performing AI analysis:', error);
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'SELL': return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'HOLD': return <Target className="w-5 h-5 text-blue-400" />;
      default: return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'HIGH': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: isAnalyzing ? 360 : 0 }}
              transition={{ duration: 2, repeat: isAnalyzing ? Infinity : 0, ease: "linear" }}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                apiKeyAvailable 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                  : 'bg-gradient-to-r from-gray-500 to-gray-600'
              }`}
            >
              <Brain className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-semibold text-white">AI Market Analysis</h3>
              <p className="text-sm text-gray-400">
                {apiKeyAvailable 
                  ? `Powered by Groq Cloud AI • ${lastAnalysis ? `Last updated: ${lastAnalysis.toLocaleTimeString()}` : 'Initializing...'}`
                  : 'AI features disabled - API key required'
                }
              </p>
            </div>
          </div>
          <Button
            onClick={performAIAnalysis}
            isLoading={isAnalyzing}
            disabled={!apiKeyAvailable}
            variant="outline"
            size="sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analyze
          </Button>
        </div>

        {!apiKeyAvailable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">AI Features Disabled</span>
            </div>
            <p className="text-gray-300 text-sm mt-2">
              Add your Groq API key to the <code className="bg-gray-800 px-1 rounded">.env.local</code> file to enable AI-powered market analysis.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Get your free API key at <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">console.groq.com</a>
            </p>
          </motion.div>
        )}

        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-8"
          >
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-purple-400 font-medium">AI is analyzing market conditions...</p>
              <p className="text-sm text-gray-400 mt-1">Processing cross-chain arbitrage opportunities</p>
            </div>
          </motion.div>
        )}

        {marketAnalysis && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Overall Recommendation */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getRecommendationIcon(marketAnalysis.recommendation)}
                  <span className="text-lg font-semibold text-white">
                    {marketAnalysis.recommendation}
                  </span>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getConfidenceColor(marketAnalysis.confidence)}`}>
                    {marketAnalysis.confidence}%
                  </p>
                  <p className="text-xs text-gray-400">Confidence</p>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-3">{marketAnalysis.reasoning}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Risk Level</p>
                  <p className={`font-medium ${getRiskColor(marketAnalysis.riskLevel)}`}>
                    {marketAnalysis.riskLevel}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Profit Potential</p>
                  <p className="font-medium text-green-400">{marketAnalysis.profitPotential}%</p>
                </div>
                <div>
                  <p className="text-gray-400">Timeframe</p>
                  <p className="font-medium text-blue-400">{marketAnalysis.timeframe}</p>
                </div>
                <div>
                  <p className="text-gray-400">Sentiment</p>
                  <p className={`font-medium ${
                    marketAnalysis.marketSentiment === 'BULLISH' ? 'text-green-400' :
                    marketAnalysis.marketSentiment === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {marketAnalysis.marketSentiment}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </Card>

      {/* AI-Detected Opportunities */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>AI-Detected Opportunities</span>
          </h3>
          <div className="text-sm text-gray-400">
            {aiOpportunities.length} opportunities found
          </div>
        </div>

        {aiOpportunities.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No AI opportunities detected</p>
            <p className="text-sm text-gray-500 mt-1">
              AI is continuously scanning for profitable arbitrage opportunities
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {aiOpportunities.slice(0, 5).map((opportunity, index) => (
              <motion.div
                key={`${opportunity.tokenPair}-${opportunity.timestamp}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gray-800/50 rounded-lg p-4 border ${
                  opportunity.executionPriority === 'HIGH' ? 'border-green-500/50' :
                  opportunity.executionPriority === 'MEDIUM' ? 'border-yellow-500/50' :
                  'border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      opportunity.executionPriority === 'HIGH' ? 'bg-green-400' :
                      opportunity.executionPriority === 'MEDIUM' ? 'bg-yellow-400' :
                      'bg-gray-400'
                    }`} />
                    <div>
                      <h4 className="font-medium text-white">{opportunity.tokenPair}</h4>
                      <p className="text-sm text-gray-400">
                        NEAR: ${opportunity.nearPrice.toFixed(4)} | ETH: ${opportunity.ethPrice.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">
                      +{opportunity.profitPercentage.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-400">
                      ${opportunity.priceDiff.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* AI Analysis Summary */}
                <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-400">AI Analysis</span>
                    <span className={`text-sm font-medium ${getConfidenceColor(opportunity.aiAnalysis.confidence)}`}>
                      {opportunity.aiAnalysis.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-gray-300">{opportunity.aiAnalysis.reasoning}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      opportunity.executionPriority === 'HIGH' ? 'bg-green-500/20 text-green-400' :
                      opportunity.executionPriority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {opportunity.executionPriority} Priority
                    </span>
                    <span className={`${getRiskColor(opportunity.aiAnalysis.riskLevel)}`}>
                      {opportunity.aiAnalysis.riskLevel} Risk
                    </span>
                  </div>
                  
                  {onExecuteRecommendation && opportunity.aiAnalysis.recommendation === 'BUY' && (
                    <Button
                      size="sm"
                      onClick={() => onExecuteRecommendation(opportunity)}
                      className="text-xs"
                    >
                      Execute Trade
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};