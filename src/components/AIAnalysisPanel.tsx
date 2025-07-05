import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Zap,
  Target,
  Clock,
  BarChart3,
  Activity,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useGroqAI } from '../hooks/useGroqAI';
import { AIAnalysis, AIMarketUpdate } from '../utils/groqAI';

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
    marketUpdate,
    aiOpportunities, 
    analysisCount,
    lastUpdateTime,
    forceAnalysis,
    performContinuousAnalysis
  } = useGroqAI();
  
  const [apiKeyAvailable, setApiKeyAvailable] = useState(true);
  const [timeUntilNextUpdate, setTimeUntilNextUpdate] = useState(30);

  useEffect(() => {
    // Check if API key is available
    const hasApiKey = !!import.meta.env.VITE_GROQ_API_KEY;
    setApiKeyAvailable(hasApiKey);
    
    if (!hasApiKey) {
      console.warn('⚠️ Groq API key not found. AI features will be limited.');
    }
  }, []);

  // Countdown timer for next update
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdateTime) {
        const elapsed = Math.floor((Date.now() - lastUpdateTime.getTime()) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        setTimeUntilNextUpdate(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdateTime]);

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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH': return 'text-green-400';
      case 'BEARISH': return 'text-red-400';
      case 'NEUTRAL': return 'text-yellow-400';
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
              animate={{ 
                rotate: isAnalyzing ? 360 : 0,
                scale: isAnalyzing ? [1, 1.1, 1] : 1
              }}
              transition={{ 
                rotate: { duration: 2, repeat: isAnalyzing ? Infinity : 0, ease: "linear" },
                scale: { duration: 1, repeat: isAnalyzing ? Infinity : 0 }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                apiKeyAvailable 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                  : 'bg-gradient-to-r from-gray-500 to-gray-600'
              }`}
            >
              <Brain className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                <span>AI Market Analysis</span>
                {isAnalyzing && <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>
                  {apiKeyAvailable 
                    ? `Powered by Groq Cloud AI • Analysis #${analysisCount}`
                    : 'AI features disabled - API key required'
                  }
                </span>
                {lastUpdateTime && (
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Next update in {timeUntilNextUpdate}s</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={forceAnalysis}
              isLoading={isAnalyzing}
              disabled={!apiKeyAvailable}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Force Analysis
            </Button>
            <Button
              onClick={performContinuousAnalysis}
              isLoading={isAnalyzing}
              disabled={!apiKeyAvailable}
              size="sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyze Now
            </Button>
          </div>
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

        {/* Real-time Analysis Status */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-medium">Real-time AI Monitoring</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
              <span className="text-sm text-gray-300">
                {isAnalyzing ? 'Analyzing...' : 'Active'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Analysis Cycles</p>
              <p className="font-medium text-white">{analysisCount}</p>
            </div>
            <div>
              <p className="text-gray-400">Update Frequency</p>
              <p className="font-medium text-purple-400">30 seconds</p>
            </div>
            <div>
              <p className="text-gray-400">Last Update</p>
              <p className="font-medium text-cyan-400">
                {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : 'Initializing...'}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Next Analysis</p>
              <p className="font-medium text-yellow-400">{timeUntilNextUpdate}s</p>
            </div>
          </div>
        </div>

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

        {/* Market Analysis Results */}
        <AnimatePresence>
          {marketAnalysis && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
                    <span className="text-xs text-gray-400">
                      #{marketAnalysis.analysisId?.split('_')[1]?.slice(-4) || 'N/A'}
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
                    <p className={`font-medium ${getSentimentColor(marketAnalysis.marketSentiment)}`}>
                      {marketAnalysis.marketSentiment}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Market Update Panel */}
        <AnimatePresence>
          {marketUpdate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mt-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <span>Market Update</span>
                </h4>
                <div className="text-right">
                  <p className={`text-sm font-bold ${getSentimentColor(marketUpdate.overallSentiment)}`}>
                    {marketUpdate.overallSentiment}
                  </p>
                  <p className="text-xs text-gray-400">Overall Sentiment</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Volatility Index</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-red-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${marketUpdate.volatilityIndex}%` }}
                      />
                    </div>
                    <span className="text-white font-medium">{marketUpdate.volatilityIndex}</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Opportunities</p>
                  <p className="text-yellow-400 font-bold text-lg">{marketUpdate.opportunities}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">AI Confidence</p>
                  <p className={`font-bold text-lg ${getConfidenceColor(marketUpdate.confidence)}`}>
                    {marketUpdate.confidence}%
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Recommended Action</p>
                  <p className="text-white font-medium">{marketUpdate.recommendedAction}</p>
                </div>

                {marketUpdate.keyInsights && marketUpdate.keyInsights.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Key Insights</p>
                    <ul className="space-y-1">
                      {marketUpdate.keyInsights.map((insight, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-start space-x-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {marketUpdate.riskFactors && marketUpdate.riskFactors.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Risk Factors</p>
                    <ul className="space-y-1">
                      {marketUpdate.riskFactors.map((risk, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-start space-x-2">
                          <span className="text-red-400 mt-1">⚠</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* AI-Detected Opportunities */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>AI-Detected Opportunities</span>
          </h3>
          <div className="text-sm text-gray-400">
            {aiOpportunities.length} opportunities • Updated every 30s
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
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {aiOpportunities.slice(0, 8).map((opportunity, index) => (
                <motion.div
                  key={`${opportunity.tokenPair}-${opportunity.timestamp}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-gray-800/50 rounded-lg p-4 border ${
                    opportunity.executionPriority === 'HIGH' ? 'border-green-500/50 bg-green-500/5' :
                    opportunity.executionPriority === 'MEDIUM' ? 'border-yellow-500/50 bg-yellow-500/5' :
                    'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        opportunity.executionPriority === 'HIGH' ? 'bg-green-400 animate-pulse' :
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
                      <span className="text-gray-400">
                        {new Date(opportunity.timestamp).toLocaleTimeString()}
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
            </AnimatePresence>
          </div>
        )}
      </Card>
    </div>
  );
};