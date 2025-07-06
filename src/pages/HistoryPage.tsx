import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  TrendingUp, 
  ExternalLink, 
  Filter,
  Search,
  Calendar,
  DollarSign,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNear } from '../hooks/useNear';
import { localStorageManager } from '../utils/localStorage';

export const HistoryPage: React.FC = () => {
  const { getExecutionHistory, getTotalProfit } = useNear();
  const [executions, setExecutions] = useState([]);
  const [filteredExecutions, setFilteredExecutions] = useState([]);
  const [totalProfit, setTotalProfit] = useState('0');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchExecutionHistory();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchExecutionHistory(true); // Silent refresh
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAndSortExecutions();
  }, [executions, searchTerm, filterStatus, sortBy, sortOrder]);

  const fetchExecutionHistory = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      console.log('📈 Fetching execution history...');
      
      const [history, profit] = await Promise.all([
        getExecutionHistory(),
        getTotalProfit()
      ]);
      
      setExecutions(history);
      setTotalProfit(profit);
      
      console.log('✅ Execution history loaded:', {
        executions: history.length,
        totalProfit: profit
      });
    } catch (error) {
      console.error('❌ Error fetching execution history:', error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchExecutionHistory();
    setIsRefreshing(false);
  };

  const filterAndSortExecutions = () => {
    let filtered = [...executions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(execution =>
        execution.token_pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execution.tx_hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        execution.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'success') {
        filtered = filtered.filter(execution => parseFloat(execution.profit) > 0);
      } else if (filterStatus === 'failed') {
        filtered = filtered.filter(execution => parseFloat(execution.profit) <= 0);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'timestamp':
          aValue = parseInt(a.timestamp);
          bValue = parseInt(b.timestamp);
          break;
        case 'profit':
          aValue = parseFloat(a.profit);
          bValue = parseFloat(b.profit);
          break;
        case 'token_pair':
          aValue = a.token_pair;
          bValue = b.token_pair;
          break;
        case 'price_diff':
          aValue = parseFloat(a.price_diff);
          bValue = parseFloat(b.price_diff);
          break;
        default:
          aValue = parseInt(a.timestamp);
          bValue = parseInt(b.timestamp);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredExecutions(filtered);
  };

  const exportData = () => {
    try {
      const dataToExport = {
        executions: filteredExecutions,
        totalProfit,
        exportedAt: new Date().toISOString(),
        filters: {
          searchTerm,
          filterStatus,
          sortBy,
          sortOrder
        }
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `arbitrage-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      console.log('📥 Execution history exported successfully');
    } catch (error) {
      console.error('❌ Error exporting data:', error);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalTrades = filteredExecutions.length;
  const successfulTrades = filteredExecutions.filter(e => parseFloat(e.profit) > 0).length;
  const successRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;
  const avgProfit = totalTrades > 0 
    ? filteredExecutions.reduce((sum, e) => sum + parseFloat(e.profit), 0) / totalTrades 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Trade History
          </h1>
          <p className="text-gray-400 mt-2">
            Complete history of your arbitrage executions and performance analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={exportData}
            variant="outline"
            size="sm"
            disabled={filteredExecutions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleRefresh}
            isLoading={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <p className="text-xs text-gray-400 mt-1">{successfulTrades} successful</p>
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
                <p className="text-2xl font-bold text-cyan-400 mt-1">{successRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 bg-opacity-20">
                <History className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 to-blue-400/5" />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card hover glow className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Avg Profit</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">
                  {formatCurrency(avgProfit)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 bg-opacity-20">
                <DollarSign className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-orange-400/5" />
          </Card>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by token pair, transaction hash, or execution ID..."
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
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="timestamp">Sort by Date</option>
              <option value="profit">Sort by Profit</option>
              <option value="token_pair">Sort by Token</option>
              <option value="price_diff">Sort by Price Diff</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredExecutions.length} of {executions.length} executions
        </div>
      </Card>

      {/* Execution History Table */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Execution History</h3>
          <div className="text-sm text-gray-400">
            {filteredExecutions.length} executions
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">
              {executions.length === 0 ? 'No execution history found' : 'No executions match your filters'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {executions.length === 0 
                ? 'Your arbitrage executions will appear here' 
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Token Pair</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Prices</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Price Diff</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Profit</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Gas Fees</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Source</th>
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
                      <div className="text-xs">
                        <div className="text-cyan-400">NEAR: {formatCurrency(execution.near_price)}</div>
                        <div className="text-blue-400">ETH: {formatCurrency(execution.eth_price)}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-cyan-400">
                        {formatCurrency(execution.price_diff)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-medium ${
                        parseFloat(execution.profit) > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(execution.profit)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-400">
                        {formatCurrency(execution.gas_fees)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        execution.source === 'contract' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {execution.source === 'contract' ? 'Contract' : 'Demo'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (execution.source === 'contract') {
                            window.open(`https://explorer.testnet.near.org/transactions/${execution.tx_hash}`, '_blank');
                          } else {
                            console.log('Demo transaction:', execution.tx_hash);
                          }
                        }}
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