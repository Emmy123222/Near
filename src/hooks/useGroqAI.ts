import { useState, useEffect, useCallback } from 'react';
import { groqAI, MarketData, ArbitrageOpportunity, AIAnalysis, AIMarketUpdate } from '../utils/groqAI';

export const useGroqAI = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiOpportunities, setAiOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<AIAnalysis | null>(null);
  const [marketUpdate, setMarketUpdate] = useState<AIMarketUpdate | null>(null);
  const [priceHistory, setPriceHistory] = useState<Map<string, number[]>>(new Map());
  const [analysisCount, setAnalysisCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Auto-refresh AI analysis every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (priceHistory.size > 0) {
        console.log('🔄 Auto-refreshing AI analysis (30s interval)...');
        performContinuousAnalysis();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [priceHistory]);

  // Perform continuous AI analysis
  const performContinuousAnalysis = useCallback(async () => {
    if (isAnalyzing) {
      console.log('⏳ AI analysis already in progress, skipping...');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisCount(prev => prev + 1);
      
      console.log(`🧠 Starting AI analysis cycle #${analysisCount + 1}...`);
      
      // Generate mock market data for continuous analysis
      const mockMarketData = generateMockMarketData();
      
      // Run parallel AI analysis
      const [analysis, update, opportunities] = await Promise.all([
        groqAI.analyzeMarketData(mockMarketData),
        groqAI.generateContinuousMarketUpdates(mockMarketData),
        groqAI.detectArbitrageOpportunities(mockMarketData, mockMarketData)
      ]);

      setMarketAnalysis(analysis);
      setMarketUpdate(update);
      setAiOpportunities(opportunities);
      setLastUpdateTime(new Date());
      
      console.log(`✅ AI analysis cycle #${analysisCount + 1} completed:`, {
        recommendation: analysis.recommendation,
        confidence: analysis.confidence,
        opportunities: opportunities.length,
        sentiment: update.overallSentiment
      });
      
    } catch (error) {
      console.error('❌ Error in continuous AI analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, analysisCount]);

  // Generate realistic mock market data
  const generateMockMarketData = (): MarketData[] => {
    const tokens = ['ethereum', 'bitcoin', 'near', 'solana'];
    const basePrices = { ethereum: 3000, bitcoin: 45000, near: 5, solana: 100 };
    
    return tokens.map(token => {
      const basePrice = basePrices[token as keyof typeof basePrices];
      const variation = (Math.random() - 0.5) * 0.04; // ±2% variation
      const priceChange = (Math.random() - 0.5) * 10; // ±5% daily change
      
      return {
        symbol: token,
        price: basePrice * (1 + variation),
        volume24h: Math.random() * 1000000 + 500000,
        priceChange24h: priceChange,
        timestamp: Date.now(),
        source: Math.random() > 0.5 ? 'near-dex' : 'eth-dex'
      };
    });
  };

  // Analyze market data with AI
  const analyzeMarket = async (marketData: MarketData[]) => {
    try {
      setIsAnalyzing(true);
      console.log('🔍 Analyzing market data with AI...');
      const analysis = await groqAI.analyzeMarketData(marketData);
      setMarketAnalysis(analysis);
      setLastUpdateTime(new Date());
      return analysis;
    } catch (error) {
      console.error('Error analyzing market:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Detect AI-powered arbitrage opportunities
  const detectOpportunities = async (nearPrices: MarketData[], ethPrices: MarketData[]) => {
    try {
      setIsAnalyzing(true);
      console.log('🎯 Detecting arbitrage opportunities with AI...');
      const opportunities = await groqAI.detectArbitrageOpportunities(nearPrices, ethPrices);
      setAiOpportunities(opportunities);
      setLastUpdateTime(new Date());
      return opportunities;
    } catch (error) {
      console.error('Error detecting opportunities:', error);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Force immediate AI analysis
  const forceAnalysis = async () => {
    console.log('🚀 Forcing immediate AI analysis...');
    await performContinuousAnalysis();
  };

  // Predict price movements
  const predictPrice = async (symbol: string, timeframe: '1h' | '4h' | '24h' = '1h') => {
    try {
      const history = priceHistory.get(symbol) || [];
      if (history.length < 5) {
        console.warn(`Insufficient price history for ${symbol}`);
        return null;
      }

      const prediction = await groqAI.predictPriceMovement(symbol, history, timeframe);
      return prediction;
    } catch (error) {
      console.error('Error predicting price:', error);
      return null;
    }
  };

  // Update price history for AI analysis
  const updatePriceHistory = (symbol: string, price: number) => {
    setPriceHistory(prev => {
      const newHistory = new Map(prev);
      const currentHistory = newHistory.get(symbol) || [];
      const updatedHistory = [...currentHistory, price].slice(-100); // Keep last 100 prices
      newHistory.set(symbol, updatedHistory);
      return newHistory;
    });
  };

  // Get AI-powered trading recommendation
  const getTradeRecommendation = async (
    tokenPair: string,
    nearPrice: number,
    ethPrice: number,
    userThreshold: number
  ) => {
    try {
      const profitPercentage = Math.abs(nearPrice - ethPrice) / Math.min(nearPrice, ethPrice) * 100;
      
      if (profitPercentage < userThreshold) {
        return {
          shouldExecute: false,
          reasoning: `Profit ${profitPercentage.toFixed(2)}% below threshold ${userThreshold}%`,
          confidence: 0
        };
      }

      const nearData: MarketData = {
        symbol: tokenPair.split('/')[0].toLowerCase(),
        price: nearPrice,
        volume24h: Math.random() * 1000000,
        priceChange24h: (Math.random() - 0.5) * 10,
        timestamp: Date.now(),
        source: 'near'
      };

      const ethData: MarketData = {
        symbol: tokenPair.split('/')[0].toLowerCase(),
        price: ethPrice,
        volume24h: Math.random() * 1000000,
        priceChange24h: (Math.random() - 0.5) * 10,
        timestamp: Date.now(),
        source: 'ethereum'
      };

      const analysis = await groqAI.analyzeArbitrageOpportunity(nearData, ethData, profitPercentage);
      
      return {
        shouldExecute: analysis.recommendation === 'BUY' && analysis.confidence > 70,
        reasoning: analysis.reasoning,
        confidence: analysis.confidence,
        riskLevel: analysis.riskLevel,
        aiAnalysis: analysis
      };
    } catch (error) {
      console.error('Error getting trade recommendation:', error);
      return {
        shouldExecute: false,
        reasoning: 'AI analysis failed, using conservative approach',
        confidence: 0
      };
    }
  };

  // Optimize gas strategy
  const optimizeGas = async (tradeValue: number) => {
    try {
      const networkConditions = {
        nearGasPrice: 1, // TGas
        ethGasPrice: 20, // Gwei (simulated)
        networkCongestion: 'MEDIUM' as const
      };

      const gasStrategy = await groqAI.optimizeGasStrategy(networkConditions, tradeValue);
      return gasStrategy;
    } catch (error) {
      console.error('Error optimizing gas:', error);
      return null;
    }
  };

  // Start continuous monitoring
  const startContinuousMonitoring = () => {
    console.log('🔄 Starting continuous AI monitoring...');
    performContinuousAnalysis();
  };

  // Initialize with first analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      startContinuousMonitoring();
    }, 2000); // Start after 2 seconds

    return () => clearTimeout(timer);
  }, []);

  return {
    // State
    isAnalyzing,
    aiOpportunities,
    marketAnalysis,
    marketUpdate,
    analysisCount,
    lastUpdateTime,
    
    // Methods
    analyzeMarket,
    detectOpportunities,
    predictPrice,
    updatePriceHistory,
    getTradeRecommendation,
    optimizeGas,
    forceAnalysis,
    startContinuousMonitoring,
    performContinuousAnalysis,
    
    // Utility
    getAnalysisHistory: () => groqAI.getAnalysisHistory(),
    getMarketUpdates: () => groqAI.getMarketUpdates(),
  };
};