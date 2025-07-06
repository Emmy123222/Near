import { connect, Contract, keyStores, WalletConnection, utils } from 'near-api-js';
import { FunctionCallOptions } from 'near-api-js/lib/account';
import { localStorageManager, StoredIntent, StoredExecution } from './localStorage';

// NEAR configuration
const nearConfig = {
  networkId: 'testnet',
  keyStore: new keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org',
  helperUrl: 'https://helper.testnet.near.org',
  explorerUrl: 'https://explorer.testnet.near.org',
};

// Contract interface
export interface ContractMethods {
  // View methods (read-only)
  get_user_intents: (args: { user: string }) => Promise<any[]>;
  get_execution_history: (args: { user: string }) => Promise<any[]>;
  get_total_profit: (args: { user: string }) => Promise<string>;
  get_intent: (args: { intent_id: string }) => Promise<any>;
  get_execution: (args: { execution_id: string }) => Promise<any>;
  get_contract_info: () => Promise<any>;
  
  // Change methods (require transaction)
  create_intent: (args: { token_pair: string; min_profit_threshold: string }, gas?: string, deposit?: string) => Promise<any>;
  pause_intent: (args: { intent_id: string }, gas?: string) => Promise<any>;
  resume_intent: (args: { intent_id: string }, gas?: string) => Promise<any>;
  execute_arbitrage: (args: { intent_id: string; near_price: string; eth_price: string }, gas?: string, deposit?: string) => Promise<any>;
  store_cross_chain_signature: (args: any, gas?: string) => Promise<any>;
}

export class NearContractService {
  private near: any;
  private wallet: WalletConnection;
  private contract: Contract & ContractMethods;
  private contractId: string;

  constructor() {
    // Use environment variable or null for demo mode
    this.contractId = import.meta.env.VITE_NEAR_CONTRACT_ID || null;
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing NEAR contract service...');
      
      // Initialize NEAR connection
      this.near = await connect(nearConfig);
      
      // Initialize wallet connection
      this.wallet = new WalletConnection(this.near, 'arbitrage-ai');
      
      // Only initialize contract if contractId is provided and valid
      if (this.contractId && this.contractId !== 'demo') {
        try {
          this.contract = new Contract(
            this.wallet.account(),
            this.contractId,
            {
              viewMethods: [
                'get_user_intents',
                'get_execution_history', 
                'get_total_profit',
                'get_intent',
                'get_execution',
                'get_contract_info'
              ],
              changeMethods: [
                'create_intent',
                'pause_intent',
                'resume_intent', 
                'execute_arbitrage',
                'store_cross_chain_signature'
              ],
            }
          ) as Contract & ContractMethods;
          console.log('✅ Contract initialized:', this.contractId);
        } catch (contractError) {
          console.warn('⚠️ Contract not available, using demo mode:', contractError);
          this.contract = null;
        }
      } else {
        console.log('🎭 Running in demo mode - no contract specified');
        this.contract = null;
      }

      // Generate demo data for new users
      if (this.isSignedIn()) {
        const userId = this.getAccountId();
        if (userId) {
          localStorageManager.generateDemoData(userId);
        }
      }

      console.log('✅ NEAR contract service initialized successfully');
      console.log('📋 Contract ID:', this.contractId || 'Demo Mode');
      console.log('🔗 Network:', nearConfig.networkId);
      
    } catch (error) {
      console.error('❌ Failed to initialize NEAR contract:', error);
      // Don't throw error, allow app to continue in demo mode
      console.warn('⚠️ Continuing in demo mode without contract');
    }
  }

  // Wallet methods
  isSignedIn(): boolean {
    return this.wallet?.isSignedIn() || false;
  }

  getAccountId(): string | null {
    return this.wallet?.getAccountId() || null;
  }

  async signIn(): Promise<void> {
    // This method is not used anymore - wallet sign in is handled by WalletContext
    console.warn('⚠️ signIn called on nearContract - use WalletContext instead');
  }

  signOut(): void {
    if (this.wallet) {
      this.wallet.signOut();
      // Redirect to home page
      window.location.href = '/';
    }
  }

  // Contract interaction methods
  async createIntent(tokenPair: string, minProfitThreshold: string): Promise<any> {
    try {
      console.log('🚀 Creating intent...');
      console.log('📊 Token Pair:', tokenPair);
      console.log('💰 Min Profit Threshold:', minProfitThreshold);
      console.log('👤 Account:', this.getAccountId());

      if (!this.isSignedIn()) {
        throw new Error('Please connect your NEAR wallet first');
      }

      // Validate inputs
      if (!tokenPair || !minProfitThreshold) {
        throw new Error('Token pair and profit threshold are required');
      }

      const threshold = parseFloat(minProfitThreshold);
      if (isNaN(threshold) || threshold <= 0 || threshold > 100) {
        throw new Error('Profit threshold must be between 0.1% and 100%');
      }

      const userId = this.getAccountId()!;
      const intentId = `intent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create intent object
      const newIntent: StoredIntent = {
        id: intentId,
        user: userId,
        token_pair: tokenPair,
        min_profit_threshold: minProfitThreshold,
        status: 'active',
        created_at: Date.now().toString(),
        source: this.contract ? 'contract' : 'demo'
      };

      // Try contract interaction first, fall back to demo mode
      let contractResult = null;
      if (this.contract && this.contractId && this.contractId !== 'demo') {
        try {
          console.log('📝 Calling NEAR contract...');
          
          // Use the wallet account directly for function calls
          const account = this.wallet.account();
          
          contractResult = await account.functionCall({
            contractId: this.contractId,
            methodName: 'create_intent',
            args: {
              token_pair: tokenPair,
              min_profit_threshold: minProfitThreshold
            },
            gas: '300000000000000', // 300 TGas
            attachedDeposit: '1000000000000000000000000' // 1 NEAR deposit
          });

          console.log('✅ Contract call successful:', contractResult);
          newIntent.source = 'contract';
          
        } catch (contractError: any) {
          console.warn('⚠️ Contract call failed, using demo mode:', contractError);
          newIntent.source = 'demo';
        }
      }

      // Save to localStorage immediately
      localStorageManager.saveIntent(newIntent);
      
      console.log('✅ Intent created and saved:', newIntent);
      
      return {
        success: true,
        intentId: newIntent.id,
        tokenPair,
        minProfitThreshold,
        message: newIntent.source === 'contract' 
          ? 'Intent created successfully on NEAR blockchain' 
          : 'Intent created successfully (demo mode)',
        txHash: contractResult?.transaction?.hash || `demo-tx-${Date.now()}`,
        intent: newIntent
      };

    } catch (error: any) {
      console.error('❌ Error creating intent:', error);
      
      // Handle specific NEAR errors
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient NEAR balance. You need at least 1 NEAR to create an intent.');
      } else if (error.message?.includes('User rejected')) {
        throw new Error('Transaction was rejected. Please try again.');
      } else if (error.message?.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.message?.includes('Buffer') || error.message?.includes('require')) {
        throw new Error('Browser compatibility issue. Please refresh the page and try again.');
      }
      
      throw new Error(error.message || 'Failed to create intent. Please try again.');
    }
  }

  async getUserIntents(): Promise<any[]> {
    const userId = this.getAccountId();
    if (!userId) {
      return [];
    }

    try {
      // Always get from localStorage first for immediate display
      const localIntents = localStorageManager.getIntents(userId);
      console.log('📋 Local intents loaded:', localIntents.length);

      // Try to sync with contract if available
      if (this.contract && this.isSignedIn()) {
        try {
          console.log('🔄 Syncing with contract...');
          const account = this.wallet.account();
          const contractIntents = await account.viewFunction({
            contractId: this.contractId,
            methodName: 'get_user_intents',
            args: { user: userId },
          });
          
          // Merge contract intents with local ones
          if (contractIntents && contractIntents.length > 0) {
            contractIntents.forEach((contractIntent: any) => {
              const existingLocal = localIntents.find(local => 
                local.token_pair === contractIntent.token_pair && 
                local.min_profit_threshold === contractIntent.min_profit_threshold
              );
              
              if (!existingLocal) {
                const syncedIntent: StoredIntent = {
                  id: contractIntent.id,
                  user: contractIntent.user,
                  token_pair: contractIntent.token_pair,
                  min_profit_threshold: contractIntent.min_profit_threshold,
                  status: contractIntent.status,
                  created_at: contractIntent.created_at,
                  source: 'contract'
                };
                localStorageManager.saveIntent(syncedIntent);
                localIntents.push(syncedIntent);
              }
            });
          }
          
          console.log('✅ Contract sync completed');
        } catch (syncError) {
          console.warn('⚠️ Contract sync failed, using local data:', syncError);
        }
      }

      return localIntents.sort((a, b) => parseInt(b.created_at) - parseInt(a.created_at));
    } catch (error) {
      console.error('❌ Error fetching intents:', error);
      return localStorageManager.getIntents(userId);
    }
  }

  async pauseIntent(intentId: string): Promise<any> {
    try {
      // Update localStorage immediately
      localStorageManager.updateIntentStatus(intentId, 'paused');
      
      if (this.contract && this.isSignedIn()) {
        try {
          console.log('⏸️ Pausing intent on contract:', intentId);
          const account = this.wallet.account();
          const result = await account.functionCall({
            contractId: this.contractId,
            methodName: 'pause_intent',
            args: { intent_id: intentId },
            gas: '100000000000000' // 100 TGas
          });
          console.log('✅ Intent paused on contract:', result);
        } catch (contractError) {
          console.warn('⚠️ Contract pause failed, local update applied:', contractError);
        }
      }
      
      return { success: true, message: 'Intent paused successfully' };
    } catch (error) {
      console.error('❌ Error pausing intent:', error);
      throw new Error('Failed to pause intent');
    }
  }

  async resumeIntent(intentId: string): Promise<any> {
    try {
      // Update localStorage immediately
      localStorageManager.updateIntentStatus(intentId, 'active');
      
      if (this.contract && this.isSignedIn()) {
        try {
          console.log('▶️ Resuming intent on contract:', intentId);
          const account = this.wallet.account();
          const result = await account.functionCall({
            contractId: this.contractId,
            methodName: 'resume_intent',
            args: { intent_id: intentId },
            gas: '100000000000000' // 100 TGas
          });
          console.log('✅ Intent resumed on contract:', result);
        } catch (contractError) {
          console.warn('⚠️ Contract resume failed, local update applied:', contractError);
        }
      }
      
      return { success: true, message: 'Intent resumed successfully' };
    } catch (error) {
      console.error('❌ Error resuming intent:', error);
      throw new Error('Failed to resume intent');
    }
  }

  async executeArbitrage(
    intentId: string, 
    nearPrice: string, 
    ethPrice: string
  ): Promise<any> {
    try {
      const userId = this.getAccountId();
      if (!userId) {
        throw new Error('User not signed in');
      }

      console.log('⚡ Executing arbitrage...');
      console.log('🎯 Intent ID:', intentId);
      console.log('💎 NEAR Price:', nearPrice);
      console.log('🔷 ETH Price:', ethPrice);

      const profit = Math.abs(parseFloat(nearPrice) - parseFloat(ethPrice)) * 0.8;
      const executionId = `execution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create execution object
      const newExecution: StoredExecution = {
        id: executionId,
        intent_id: intentId,
        user: userId,
        token_pair: 'ETH/USDC', // Get from intent
        price_diff: Math.abs(parseFloat(nearPrice) - parseFloat(ethPrice)).toString(),
        profit: profit.toString(),
        gas_fees: '0.01',
        tx_hash: `tx-${Date.now()}`,
        timestamp: Date.now().toString(),
        near_price: nearPrice,
        eth_price: ethPrice,
        source: this.contract ? 'contract' : 'demo'
      };

      // Try contract execution
      if (this.contract && this.isSignedIn()) {
        try {
          const account = this.wallet.account();
          const result = await account.functionCall({
            contractId: this.contractId,
            methodName: 'execute_arbitrage',
            args: {
              intent_id: intentId,
              near_price: nearPrice,
              eth_price: ethPrice
            },
            gas: '300000000000000', // 300 TGas
            attachedDeposit: '100000000000000000000000' // 0.1 NEAR deposit
          });

          newExecution.tx_hash = result.transaction?.hash || newExecution.tx_hash;
          newExecution.source = 'contract';
          console.log('✅ Contract execution successful:', result);
        } catch (contractError) {
          console.warn('⚠️ Contract execution failed, using demo mode:', contractError);
          newExecution.source = 'demo';
        }
      }

      // Save execution to localStorage
      localStorageManager.saveExecution(newExecution);
      
      // Update intent status to executed
      localStorageManager.updateIntentStatus(intentId, 'executed');
      
      console.log('✅ Arbitrage executed and saved:', newExecution);
      
      return {
        success: true,
        executionId: newExecution.id,
        profit: profit.toString(),
        message: newExecution.source === 'contract' 
          ? 'Arbitrage executed successfully on NEAR blockchain'
          : 'Arbitrage executed successfully (demo mode)',
        execution: newExecution
      };
    } catch (error) {
      console.error('❌ Error executing arbitrage:', error);
      throw new Error('Failed to execute arbitrage');
    }
  }

  async getExecutionHistory(): Promise<any[]> {
    const userId = this.getAccountId();
    if (!userId) {
      return [];
    }

    try {
      // Get from localStorage first
      const localExecutions = localStorageManager.getExecutions(userId);
      console.log('📈 Local executions loaded:', localExecutions.length);

      // Try to sync with contract if available
      if (this.contract && this.isSignedIn()) {
        try {
          console.log('🔄 Syncing execution history with contract...');
          const account = this.wallet.account();
          const contractExecutions = await account.viewFunction({
            contractId: this.contractId,
            methodName: 'get_execution_history',
            args: { user: userId },
          });
          
          // Merge contract executions with local ones
          if (contractExecutions && contractExecutions.length > 0) {
            contractExecutions.forEach((contractExecution: any) => {
              const existingLocal = localExecutions.find(local => 
                local.tx_hash === contractExecution.tx_hash
              );
              
              if (!existingLocal) {
                const syncedExecution: StoredExecution = {
                  id: contractExecution.id,
                  intent_id: contractExecution.intent_id,
                  user: contractExecution.user,
                  token_pair: contractExecution.token_pair,
                  price_diff: contractExecution.price_diff,
                  profit: contractExecution.profit,
                  gas_fees: contractExecution.gas_fees,
                  tx_hash: contractExecution.tx_hash,
                  timestamp: contractExecution.timestamp,
                  near_price: contractExecution.near_price,
                  eth_price: contractExecution.eth_price,
                  source: 'contract'
                };
                localStorageManager.saveExecution(syncedExecution);
                localExecutions.push(syncedExecution);
              }
            });
          }
          
          console.log('✅ Execution history sync completed');
        } catch (syncError) {
          console.warn('⚠️ Execution history sync failed, using local data:', syncError);
        }
      }

      return localExecutions.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    } catch (error) {
      console.error('❌ Error fetching execution history:', error);
      return localStorageManager.getExecutions(userId);
    }
  }

  async getTotalProfit(): Promise<string> {
    const userId = this.getAccountId();
    if (!userId) {
      return '0';
    }

    try {
      // Get from localStorage first
      const localProfit = localStorageManager.getTotalProfit(userId);
      console.log('💰 Local total profit:', localProfit);

      // Try to sync with contract if available
      if (this.contract && this.isSignedIn()) {
        try {
          console.log('🔄 Syncing profit with contract...');
          const account = this.wallet.account();
          const contractProfit = await account.viewFunction({
            contractId: this.contractId,
            methodName: 'get_total_profit',
            args: { user: userId },
          });
          
          if (contractProfit && parseFloat(contractProfit) > 0) {
            console.log('✅ Contract profit sync completed:', contractProfit);
            return contractProfit;
          }
        } catch (syncError) {
          console.warn('⚠️ Profit sync failed, using local data:', syncError);
        }
      }

      return localProfit.toString();
    } catch (error) {
      console.error('❌ Error fetching total profit:', error);
      return localStorageManager.getTotalProfit(userId).toString();
    }
  }

  async getContractInfo(): Promise<any> {
    if (!this.contract) {
      // Return demo contract info
      return {
        name: 'ArbitrageAI Cross-Chain Agent (Demo)',
        version: '1.0.0',
        owner: this.getAccountId() || 'demo-user',
        total_intents: localStorageManager.getIntents().length,
        total_executions: localStorageManager.getExecutions().length,
        mode: 'demo'
      };
    }

    try {
      console.log('ℹ️ Fetching contract info...');
      const account = this.wallet.account();
      const info = await account.viewFunction({
        contractId: this.contractId,
        methodName: 'get_contract_info',
        args: {},
      });
      console.log('✅ Contract info:', info);
      return info;
    } catch (error) {
      console.error('❌ Error fetching contract info:', error);
      return {
        name: 'ArbitrageAI Cross-Chain Agent',
        version: '1.0.0',
        owner: this.getAccountId(),
        total_intents: localStorageManager.getIntents().length,
        total_executions: localStorageManager.getExecutions().length,
        mode: 'fallback'
      };
    }
  }

  // Utility methods
  getContractId(): string {
    return this.contractId || 'demo-mode';
  }

  getExplorerUrl(txHash?: string): string {
    const baseUrl = nearConfig.explorerUrl;
    if (txHash) {
      return `${baseUrl}/transactions/${txHash}`;
    }
    return `${baseUrl}/accounts/${this.contractId}`;
  }

  formatNearAmount(amount: string): string {
    return amount; // Simplified for demo
  }

  parseNearAmount(amount: string): string {
    return amount; // Simplified for demo
  }

  // Local storage management
  clearLocalData(): void {
    localStorageManager.clearAllData();
  }

  exportData(): string {
    return localStorageManager.exportData();
  }

  importData(jsonData: string): boolean {
    return localStorageManager.importData(jsonData);
  }
}

// Singleton instance
export const nearContract = new NearContractService();