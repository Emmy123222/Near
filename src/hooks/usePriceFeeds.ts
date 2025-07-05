import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
}

export interface ArbitrageOpportunity {
  tokenPair: string;
  nearPrice: number;
  ethPrice: number;
  priceDiff: number;
  profitPercentage: number;
  timestamp: number;
}

// Simulate real price feeds
const fetchPrices = async (): Promise<PriceData[]> => {
  // In production, this would fetch from real APIs like CoinGecko, Chainlink, etc.
  const tokens = ['ethereum', 'bitcoin', 'near', 'solana'];
  const prices: PriceData[] = [];
  
  for (const token of tokens) {
    // Simulate price with realistic variations
    const basePrice = {
      ethereum: 3000,
      bitcoin: 45000,
      near: 5,
      solana: 100
    }[token] || 1;
    
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    const price = basePrice * (1 + variation);
    
    prices.push({
      symbol: token,
      price,
      timestamp: Date.now(),
      source: 'coingecko'
    });
  }
  
  return prices;
};

const detectArbitrageOpportunities = (prices: PriceData[]): ArbitrageOpportunity[] => {
  const opportunities: ArbitrageOpportunity[] = [];
  const tokenPairs = ['ETH/USDC', 'BTC/USDC', 'NEAR/USDC', 'SOL/USDC'];
  
  for (const pair of tokenPairs) {
    const token = pair.split('/')[0].toLowerCase();
    const tokenPrice = prices.find(p => p.symbol === token)?.price;
    
    if (tokenPrice) {
      // Simulate cross-chain price differences
      const nearPrice = tokenPrice * (1 + (Math.random() - 0.5) * 0.03); // ±1.5% variation
      const ethPrice = tokenPrice * (1 + (Math.random() - 0.5) * 0.025); // ±1.25% variation
      
      const priceDiff = Math.abs(nearPrice - ethPrice);
      const profitPercentage = (priceDiff / Math.min(nearPrice, ethPrice)) * 100;
      
      // Only include opportunities with >0.5% profit potential
      if (profitPercentage > 0.5) {
        opportunities.push({
          tokenPair: pair,
          nearPrice,
          ethPrice,
          priceDiff,
          profitPercentage,
          timestamp: Date.now()
        });
      }
    }
  }
  
  return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
};

export const usePriceFeeds = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);

  const { data: prices = [], isLoading, error } = useQuery({
    queryKey: ['prices'],
    queryFn: fetchPrices,
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  useEffect(() => {
    if (prices.length > 0) {
      const newOpportunities = detectArbitrageOpportunities(prices);
      setOpportunities(newOpportunities);
    }
  }, [prices]);

  return {
    prices,
    opportunities,
    isLoading,
    error
  };
};