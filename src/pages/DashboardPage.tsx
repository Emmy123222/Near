import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Clock, 
  Target,
  Plus,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNear } from '../hooks/useNear';
import { usePriceFeeds } from '../hooks/usePriceFeeds';
import { CreateIntentModal } from '../components/CreateIntentModal';
import { PriceChart } from '../components/PriceChart';
import { AIAnalysisPanel } from '../components/AIAnalysisPanel';
import { ContractStatus } from '../components/ContractStatus';

export const DashboardPage: React.FC = () => {
  const { getIntents, getExecutionHistory, getTotalProfit, executeArbitrageWithAI } = useNear();
  const { prices, opportunities, isLoading: pricesLoading } = usePriceFeeds();
  const [intents, setIntents] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [totalProfit, setTotalProfit] = useState('0');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Fetching dashboard data...');
      
      const [intentsData, executionsData, profitData] = await Promise.all([
        getIntents(),
        getExecutionHistory(),
        getTotalProfit()
      ]);
      
      setIntents(intentsData);
      setExecutions(executionsData);
      setTotalProfit(profitData);
      
      console.log('✅ Dashboard data loaded:', {
        intents: intentsData.length,
        executions: executionsData.length,
        profit: profitData
      });
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      showNotification('error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateIntentSuccess = () => {
    console.log('🎉 Intent created successfully, refreshing dashboard...');
    fetchDashboardData();
    showNotification('success', 'Intent created successfully!');
  };

  const handleAIRecommendation = async (recommendation: any) => {
    try {
      console.log('🤖 Executing AI recommendation:', recommendation);
      
      // Find matching intent or create a temporary one
      const matchingIntent = intents.find(intent => 
        intent.token_pair === recommendation.tokenPair && 
        intent.status === 'active'
      );
      
      if (matchingIntent) {
        await executeArbitrageWithAI(
          matchingIntent.id,
          recommendation.tokenPair,
          recommendation.nearPrice,
          recommendation.ethPrice,
          parseFloat(matchingIntent.min_profit_threshold)
        );
        
        // Refresh dashboard data
        await fetchDashboardData();
        
        showNotification('success', `AI-powered arbitrage executed successfully for ${recommendation.tokenPair}!`);
      } else {
        showNotification('error', `No active intent found for ${recommendation.tokenPair}. Please create an intent first.`);
      }
    } catch (error: any) {
      console.error('❌ Error executing AI recommendation:', error);
      showNotification('error', `Failed to execute AI recommendation: ${error.message}`);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num);
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
      title: 'Active Intents',
      value: intents.filter(i => i.status === 'active').length.toString(),
      icon: Target,
      color: 'from-purple-400 to-pink-400',
      change: `+${intents.length}`
    },
    {
      title: 'Total Executions',
      value: executions.length.toString(),
      icon: Activity,
      color: 'from-cyan-400 to-blue-400',
      change: '+5'
    },
    {
      title: 'Opportunities',
      value: opportunities.length.toString(),
      icon: Zap,
      color: 'from-yellow-400 to-orange-400',
      change: 'Live'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${
              notification.type === 'success' 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Trading Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Monitor your arbitrage performance and manage trading strategies
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Intent</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-5`} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Contract Status */}
        <div className="xl:col-span-1">
          <ContractStatus />
        </div>
        
        {/* Price Chart */}
        <div className="xl:col-span-1">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Price Monitoring</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-green-400">Live</span>
              </div>
            </div>
            <PriceChart prices={prices} isLoading={pricesLoading} />
          </Card>
        </div>

        {/* AI Analysis Panel */}
        <div className="xl:col-span-2">
          <AIAnalysisPanel 
            marketData={prices} 
            onExecuteRecommendation={handleAIRecommendation}
          />
        </div>
      </div>

      {/* Arbitrage Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Arbitrage Opportunities */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>Live Opportunities</span>
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-sm text-yellow-400">AI Active</span>
            </div>
          </div>

          {opportunities.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No opportunities detected</p>
              <p className="text-sm text-gray-500 mt-1">
                AI is scanning for profitable arbitrage opportunities
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {opportunities.map((opportunity, index) => (
                <motion.div
                  key={`${opportunity.tokenPair}-${opportunity.timestamp}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-yellow-500/50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{opportunity.tokenPair}</h4>
                        <p className="text-sm text-gray-400">
                          NEAR: {formatCurrency(opportunity.nearPrice)} | ETH: {formatCurrency(opportunity.ethPrice)}
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

        {/* Active Intents */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Active Intents</h3>
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
          ) : intents.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No intents created yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Create your first arbitrage intent to start trading
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Intent
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {intents.map((intent, index) => (
                <motion.div
                  key={intent.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        intent.status === 'active' ? 'bg-green-500 animate-pulse' : 
                        intent.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <h4 className="font-medium text-white">{intent.token_pair}</h4>
                        <p className="text-sm text-gray-400">
                          Min Profit: {intent.min_profit_threshold}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        intent.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        intent.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {intent.status}
                      </span>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Create Intent Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateIntentModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateIntentSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};