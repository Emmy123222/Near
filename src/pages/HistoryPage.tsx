import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  TrendingUp, 
  ExternalLink, 
  Filter,
  Search,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNear } from '../hooks/useNear';

export const HistoryPage: React.FC = () => {
  const { getExecutionHistory } = useNear();
  const [executions, setExecutions] = useState([]);
  const [filteredExecutions, setFilteredExecutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchExecutionHistory();
  }, []);

  useEffect(() => {
    filterExecutions();
  }, [executions, searchTerm, filterStatus]);

  const fetchExecutionHistory = async () => {
    try {
      setIsLoading(true);
      const history = await getExecutionHistory();
      setExecutions(history);
    } catch (error) {
      console.error('Error fetching execution history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterExecutions = () => {
    let filtered = executions;

    if (searchTerm) {
      filtered = filtered.filter(execution =>
        execution.token_pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execution.tx_hash.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExecutions(filtered);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalProfit = filteredExecutions.reduce((sum, execution) => 
    sum + parseFloat(execution.profit), 0
  );

  const totalTrades = filteredExecutions.length;
  const successRate = totalTrades > 0 ? 100 : 0; // Assuming all shown trades are successful

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Trade History
          </h1>
          <p className="text-gray-400 mt-2">
            Complete history of your arbitrage executions and performance
          </p>
        </div>
        <Button
          onClick={fetchExecutionHistory}
          isLoading={isLoading}
          variant="outline"
        >
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Profit</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 bg-opacity-20">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-emerald-400/5" />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Trades</p>
                <p className="text-2xl font-bold text-white mt-1">{totalTrades}</p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 bg-opacity-20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-pink-400/5" />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{successRate}%</p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 bg-opacity-20">
                <History className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 to-blue-400/5" />
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by token pair or transaction hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Trades</option>
              <option value="success">Successful</option>
              <option value="failed">Failed</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Execution History */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Execution History</h3>
          <div className="text-sm text-gray-400">
            {filteredExecutions.length} of {executions.length} trades
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No execution history found</p>
            <p className="text-sm text-gray-500 mt-1">
              Your arbitrage executions will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Token Pair</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Price Diff</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Profit</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Gas Fees</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {filteredExecutions.map((execution, index) => (
                  <motion.tr
                    key={execution.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-white text-sm">
                          {formatDate(execution.timestamp)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-white">
                        {execution.token_pair}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-cyan-400">
                        {formatCurrency(execution.price_diff)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-green-400 font-medium">
                        {formatCurrency(execution.profit)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-400">
                        {formatCurrency(execution.gas_fees)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://explorer.testnet.near.org/transactions/${execution.tx_hash}`, '_blank')}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};