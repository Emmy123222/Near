import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { Card } from './ui/Card';
import { priceFeedManager, PriceData, ArbitrageOpportunity } from '../utils/priceFeeds';

export const PriceMonitor: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const tokenPairs = ['ETH/USDC', 'BTC/USDC', 'NEAR/USDC', 'SOL/USDC'];
  const tokens = ['ethereum', 'bitcoin', 'near', 'solana'];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [priceData, opportunities] = await Promise.all([
          priceFeedManager.fetchPrices(tokens),
          priceFeedManager.detectArbitrageOpportunities(tokenPairs)
        ]);
        setPrices(priceData);
        setOpportunities(opportunities);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Set up real-time monitoring
    const interval = priceFeedManager.startPriceMonitoring(tokens, async (newPrices) => {
      setPrices(newPrices);
      // Detect new opportunities
      const newOpportunities = await priceFeedManager.detectArbitrageOpportunities(tokenPairs);
      setOpportunities(newOpportunities);
    });

    return () => {
      priceFeedManager.stopPriceMonitoring(interval);
    };
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  };

  const getTokenSymbol = (token: string) => {
    const symbolMap: Record<string, string> = {
      'ethereum': 'ETH',
      'bitcoin': 'BTC',
      'near': 'NEAR',
      'solana': 'SOL'
    };
    return symbolMap[token] || token.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Price Monitor
        </h2>
        <p className="text-gray-400 mt-2">
          Real-time cross-chain price tracking and arbitrage detection
        </p>
      </div>

      {/* Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-20 bg-gray-800 rounded"></div>
            </Card>
          ))
        ) : (
          prices.map((price, index) => (
            <motion.div
              key={price.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover glow className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">
                      {getTokenSymbol(price.symbol)}
                    </h3>
                    <p className="text-2xl font-bold text-white">
                      {formatPrice(price.price)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {price.source}
                    </p>
                  </div>
                  <div className="text-right">
                    <Activity className="w-6 h-6 text-cyan-400 mb-2" />
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-green-400">Live</span>
                    </div>
                  </div>
                </div>
                
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-50" />
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Arbitrage Opportunities */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>Arbitrage Opportunities</span>
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-sm text-yellow-400">AI Detection Active</span>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No arbitrage opportunities detected</p>
            <p className="text-sm text-gray-500 mt-1">
              The AI is continuously monitoring for profitable opportunities
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opportunity, index) => (
              <motion.div
                key={`${opportunity.tokenPair}-${opportunity.timestamp}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                      {opportunity.profitPercentage > 2 ? (
                        <TrendingUp className="w-4 h-4 text-white" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{opportunity.tokenPair}</h4>
                      <p className="text-sm text-gray-400">
                        NEAR: {formatPrice(opportunity.nearPrice)} | ETH: {formatPrice(opportunity.ethPrice)}
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
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};