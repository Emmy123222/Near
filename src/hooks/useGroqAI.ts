import { useState, useEffect } from 'react';
import { groqAI, MarketData, ArbitrageOpportunity, AIAnalysis } from '../utils/groqAI';

export const useGroqAI = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiOpportunities, setAiOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<AIAnalysis | null>(null);
  const [priceHistory, setPriceHistory] = useState<Map<string, number[]>>(new Map());

  // Analyze market data with AI
  const analyzeMarket = async (marketData: MarketData[]) => {
    try {
      setIsAnalyzing(true);
      const analysis = await groqAI.analyzeMarketData(marketData);
      setMarketAnalysis(analysis);
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
      const opportunities = await groqAI.detectArbitrageOpportunities(nearPrices, ethPrices);
      setAiOpportunities(opportunities);
      return opportunities;
    } catch (error) {
      console.error('Error detecting opportunities:', error);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
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
      const updatedHistory = [...currentHistory, price].slice(-50); // Keep last 50 prices
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
        volume24h: 0,
        priceChange24h: 0,
        timestamp: Date.now(),
        source: 'near'
      };

      const ethData: MarketData = {
        symbol: tokenPair.split('/')[0].toLowerCase(),
        price: ethPrice,
        volume24h: 0,
        priceChange24h: 0,
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

  return {
    isAnalyzing,
    aiOpportunities,
    marketAnalysis,
    analyzeMarket,
    detectOpportunities,
    predictPrice,
    updatePriceHistory,
    getTradeRecommendation,
    optimizeGas
  };
};