import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
}

interface PriceChartProps {
  prices: PriceData[];
  isLoading: boolean;
}

export const PriceChart: React.FC<PriceChartProps> = ({ prices, isLoading }) => {
  // Generate mock historical data for demonstration
  const generateChartData = () => {
    const data = [];
    const now = Date.now();
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = now - (i * 60 * 60 * 1000); // 1 hour intervals
      const ethPrice = 3000 + Math.sin(i * 0.5) * 100 + Math.random() * 50;
      const btcPrice = 45000 + Math.sin(i * 0.3) * 2000 + Math.random() * 500;
      
      data.push({
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        ETH: ethPrice,
        BTC: btcPrice / 15, // Scale down for better visualization
        NEAR: 5 + Math.sin(i * 0.7) * 1 + Math.random() * 0.5,
      });
    }
    
    return data;
  };

  const chartData = generateChartData();

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            stroke="#9CA3AF"
            fontSize={12}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
          />
          <Line
            type="monotone"
            dataKey="ETH"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#8B5CF6' }}
          />
          <Line
            type="monotone"
            dataKey="BTC"
            stroke="#06B6D4"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#06B6D4' }}
          />
          <Line
            type="monotone"
            dataKey="NEAR"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#10B981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};