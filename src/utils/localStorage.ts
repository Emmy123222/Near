// Local Storage Manager for ArbitrageAI
export interface StoredIntent {
  id: string;
  user: string;
  token_pair: string;
  min_profit_threshold: string;
  status: 'active' | 'paused' | 'executed';
  created_at: string;
  source: 'contract' | 'demo';
}

export interface StoredExecution {
  id: string;
  intent_id: string;
  user: string;
  token_pair: string;
  price_diff: string;
  profit: string;
  gas_fees: string;
  tx_hash: string;
  timestamp: string;
  near_price: string;
  eth_price: string;
  source: 'contract' | 'demo';
}

class LocalStorageManager {
  private readonly INTENTS_KEY = 'arbitrage_ai_intents';
  private readonly EXECUTIONS_KEY = 'arbitrage_ai_executions';
  private readonly PROFITS_KEY = 'arbitrage_ai_profits';

  // Intent Management
  saveIntent(intent: StoredIntent): void {
    try {
      const intents = this.getIntents();
      const existingIndex = intents.findIndex(i => i.id === intent.id);
      
      if (existingIndex >= 0) {
        intents[existingIndex] = intent;
      } else {
        intents.push(intent);
      }
      
      localStorage.setItem(this.INTENTS_KEY, JSON.stringify(intents));
      console.log('💾 Intent saved to localStorage:', intent);
    } catch (error) {
      console.error('❌ Error saving intent to localStorage:', error);
    }
  }

  getIntents(userId?: string): StoredIntent[] {
    try {
      const stored = localStorage.getItem(this.INTENTS_KEY);
      const intents: StoredIntent[] = stored ? JSON.parse(stored) : [];
      
      if (userId) {
        return intents.filter(intent => intent.user === userId);
      }
      
      return intents;
    } catch (error) {
      console.error('❌ Error loading intents from localStorage:', error);
      return [];
    }
  }

  updateIntentStatus(intentId: string, status: 'active' | 'paused' | 'executed'): void {
    try {
      const intents = this.getIntents();
      const intentIndex = intents.findIndex(i => i.id === intentId);
      
      if (intentIndex >= 0) {
        intents[intentIndex].status = status;
        localStorage.setItem(this.INTENTS_KEY, JSON.stringify(intents));
        console.log('📝 Intent status updated:', intentId, status);
      }
    } catch (error) {
      console.error('❌ Error updating intent status:', error);
    }
  }

  deleteIntent(intentId: string): void {
    try {
      const intents = this.getIntents();
      const filteredIntents = intents.filter(i => i.id !== intentId);
      localStorage.setItem(this.INTENTS_KEY, JSON.stringify(filteredIntents));
      console.log('🗑️ Intent deleted:', intentId);
    } catch (error) {
      console.error('❌ Error deleting intent:', error);
    }
  }

  // Execution Management
  saveExecution(execution: StoredExecution): void {
    try {
      const executions = this.getExecutions();
      const existingIndex = executions.findIndex(e => e.id === execution.id);
      
      if (existingIndex >= 0) {
        executions[existingIndex] = execution;
      } else {
        executions.push(execution);
      }
      
      // Sort by timestamp (newest first)
      executions.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
      
      localStorage.setItem(this.EXECUTIONS_KEY, JSON.stringify(executions));
      console.log('💾 Execution saved to localStorage:', execution);
      
      // Update total profit
      this.updateTotalProfit(execution.user, parseFloat(execution.profit));
    } catch (error) {
      console.error('❌ Error saving execution to localStorage:', error);
    }
  }

  getExecutions(userId?: string): StoredExecution[] {
    try {
      const stored = localStorage.getItem(this.EXECUTIONS_KEY);
      const executions: StoredExecution[] = stored ? JSON.parse(stored) : [];
      
      if (userId) {
        return executions.filter(execution => execution.user === userId);
      }
      
      return executions;
    } catch (error) {
      console.error('❌ Error loading executions from localStorage:', error);
      return [];
    }
  }

  // Profit Management
  updateTotalProfit(userId: string, additionalProfit: number): void {
    try {
      const profits = this.getProfits();
      const currentProfit = profits[userId] || 0;
      profits[userId] = currentProfit + additionalProfit;
      
      localStorage.setItem(this.PROFITS_KEY, JSON.stringify(profits));
      console.log('💰 Total profit updated for', userId, ':', profits[userId]);
    } catch (error) {
      console.error('❌ Error updating total profit:', error);
    }
  }

  getTotalProfit(userId: string): number {
    try {
      const profits = this.getProfits();
      return profits[userId] || 0;
    } catch (error) {
      console.error('❌ Error getting total profit:', error);
      return 0;
    }
  }

  private getProfits(): Record<string, number> {
    try {
      const stored = localStorage.getItem(this.PROFITS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ Error loading profits from localStorage:', error);
      return {};
    }
  }

  // Utility Methods
  clearAllData(): void {
    try {
      localStorage.removeItem(this.INTENTS_KEY);
      localStorage.removeItem(this.EXECUTIONS_KEY);
      localStorage.removeItem(this.PROFITS_KEY);
      console.log('🧹 All ArbitrageAI data cleared from localStorage');
    } catch (error) {
      console.error('❌ Error clearing localStorage:', error);
    }
  }

  exportData(): string {
    try {
      const data = {
        intents: this.getIntents(),
        executions: this.getExecutions(),
        profits: this.getProfits(),
        exportedAt: new Date().toISOString()
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      return '{}';
    }
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.intents) {
        localStorage.setItem(this.INTENTS_KEY, JSON.stringify(data.intents));
      }
      
      if (data.executions) {
        localStorage.setItem(this.EXECUTIONS_KEY, JSON.stringify(data.executions));
      }
      
      if (data.profits) {
        localStorage.setItem(this.PROFITS_KEY, JSON.stringify(data.profits));
      }
      
      console.log('📥 Data imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Error importing data:', error);
      return false;
    }
  }

  // Generate demo data for new users
  generateDemoData(userId: string): void {
    if (this.getIntents(userId).length === 0) {
      console.log('🎭 Generating demo data for new user:', userId);
      
      // Create demo intents
      const demoIntents: StoredIntent[] = [
        {
          id: `demo-intent-1-${Date.now()}`,
          user: userId,
          token_pair: 'ETH/USDC',
          min_profit_threshold: '1.5',
          status: 'active',
          created_at: Date.now().toString(),
          source: 'demo'
        },
        {
          id: `demo-intent-2-${Date.now() + 1}`,
          user: userId,
          token_pair: 'BTC/USDC',
          min_profit_threshold: '2.0',
          status: 'paused',
          created_at: (Date.now() - 86400000).toString(),
          source: 'demo'
        }
      ];

      // Create demo executions
      const demoExecutions: StoredExecution[] = [
        {
          id: `demo-exec-1-${Date.now()}`,
          intent_id: demoIntents[0].id,
          user: userId,
          token_pair: 'ETH/USDC',
          price_diff: '45.50',
          profit: '36.40',
          gas_fees: '0.01',
          tx_hash: `demo-tx-hash-1-${Date.now()}`,
          timestamp: Date.now().toString(),
          near_price: '3000.00',
          eth_price: '2954.50',
          source: 'demo'
        },
        {
          id: `demo-exec-2-${Date.now() + 1}`,
          intent_id: demoIntents[1].id,
          user: userId,
          token_pair: 'BTC/USDC',
          price_diff: '850.00',
          profit: '680.00',
          gas_fees: '0.02',
          tx_hash: `demo-tx-hash-2-${Date.now() + 1}`,
          timestamp: (Date.now() - 3600000).toString(),
          near_price: '45000.00',
          eth_price: '44150.00',
          source: 'demo'
        }
      ];

      // Save demo data
      demoIntents.forEach(intent => this.saveIntent(intent));
      demoExecutions.forEach(execution => this.saveExecution(execution));
      
      console.log('✅ Demo data generated successfully');
    }
  }
}

export const localStorageManager = new LocalStorageManager();