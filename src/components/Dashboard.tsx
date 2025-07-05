import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Clock, 
  Target,
  ExternalLink 
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useNear } from '../hooks/useNear';
import { ArbitrageExecution } from '../utils/near';

export const Dashboard: React.FC = () => {
  const { nearContract, isSignedIn } = useNear();
  const [executions, setExecutions] = useState<ArbitrageExecution[]>([]);
  const [totalProfit, setTotalProfit] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn && nearContract) {
      fetchDashboardData();
    }
  }, [isSignedIn, nearContract]);

  const fetchDashboardData = async () => {
    if (!nearContract) return;

    try {
      setIsLoading(true);
      const [executionHistory, profit] = await Promise.all([
        nearContract.getExecutionHistory(),
        nearContract.getTotalProfit()
      ]);
      setExecutions(executionHistory);
      setTotalProfit(profit);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num);
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp)).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = [
    {
      title: 'Total Profit',
      value: formatCurrency(totalProfit),
      icon: DollarSign,
      color: 'from-green-400 to-emerald-400',
      change: '+12.5%'
    },
    {
      title: 'Total Executions',
      value: executions.length.toString(),
      icon: Activity,
      color: 'from-purple-400 to-pink-400',
      change: '+5'
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      icon: Target,
      color: 'from-cyan-400 to-blue-400',
      change: '+2.1%'
    },
    {
      title: 'Active Intents',
      value: '3',
      icon: Clock,
      color: 'from-yellow-400 to-orange-400',
      change: '+1'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Performance Dashboard
        </h2>
        <p className="text-gray-400 mt-2">
          Track your arbitrage performance and profit analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover glow className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-green-400 mt-1">
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-gradient-to-r ${stat.color} bg-opacity-20`}>
                  <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                </div>
              </div>
              
              {/* Animated Background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-5`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Execution History */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            Recent Executions
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No executions yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Your arbitrage executions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {executions.slice(0, 10).map((execution, index) => (
              <motion.div
                key={execution.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{execution.token_pair}</h4>
                      <p className="text-sm text-gray-400">
                        {formatDate(execution.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">
                      {formatCurrency(execution.profit)}
                    </p>
                    <p className="text-sm text-gray-400">
                      Price diff: {formatCurrency(execution.price_diff)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://explorer.testnet.near.org/transactions/${execution.tx_hash}`, '_blank')}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};