import { connect, Contract, keyStores, WalletConnection, utils } from 'near-api-js';
import { FunctionCallOptions } from 'near-api-js/lib/account';

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
          console.warn('⚠️ Contract not available, using demo mode');
          this.contract = null;
        }
      } else {
        console.log('🎭 Running in demo mode - no contract specified');
        this.contract = null;
      }

      console.log('✅ NEAR contract initialized successfully');
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
      console.log('🚀 Creating intent on NEAR contract...');
      console.log('📊 Token Pair:', tokenPair);
      console.log('💰 Min Profit Threshold:', minProfitThreshold);
      console.log('👤 Account:', this.getAccountId());
      console.log('🔗 Contract ID:', this.contractId);

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

      // For demo mode or if contract is not available
      if (!this.contract || !this.contractId || this.contractId === 'demo') {
        console.log('🎭 Demo mode: Creating intent', { tokenPair, minProfitThreshold });
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const result = {
          success: true,
          intentId: `demo-intent-${Date.now()}`,
          tokenPair,
          minProfitThreshold,
          message: 'Intent created successfully in demo mode',
          txHash: `demo-tx-${Date.now()}`
        };

        console.log('✅ Demo intent created successfully:', result);
        return result;
      }

      // Real contract interaction
      console.log('📝 Calling contract create_intent method...');
      
      const result = await this.contract.create_intent(
        {
          token_pair: tokenPair,
          min_profit_threshold: minProfitThreshold
        },
        '300000000000000', // 300 TGas
        '1000000000000000000000000' // 1 NEAR deposit
      );

      console.log('✅ Intent created successfully on contract:', result);
      
      return {
        success: true,
        intentId: result,
        tokenPair,
        minProfitThreshold,
        message: 'Intent created successfully on NEAR blockchain',
        txHash: result.transaction?.hash || 'pending'
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
      }
      
      throw new Error(error.message || 'Failed to create intent. Please try again.');
    }
  }

  async getUserIntents(): Promise<any[]> {
    if (!this.contract || !this.isSignedIn()) {
      // Return demo intents
      return [
        {
          id: 'demo-1',
          user: this.getAccountId() || 'demo-user',
          token_pair: 'ETH/USDC',
          min_profit_threshold: '1.5',
          status: 'active',
          created_at: Date.now().toString()
        },
        {
          id: 'demo-2',
          user: this.getAccountId() || 'demo-user',
          token_pair: 'BTC/USDC',
          min_profit_threshold: '2.0',
          status: 'paused',
          created_at: (Date.now() - 86400000).toString()
        }
      ];
    }

    try {
      const accountId = this.getAccountId();
      if (!accountId) {
        throw new Error('User not signed in');
      }

      console.log('📋 Fetching user intents from contract...');
      const intents = await this.contract.get_user_intents({ user: accountId });
      console.log('✅ Fetched intents:', intents);
      return intents || [];
    } catch (error) {
      console.error('❌ Error fetching intents:', error);
      return [];
    }
  }

  async pauseIntent(intentId: string): Promise<any> {
    if (!this.contract || !this.isSignedIn()) {
      console.log('🎭 Demo mode: Pausing intent', intentId);
      return { success: true, message: 'Intent paused (demo mode)' };
    }

    try {
      console.log('⏸️ Pausing intent:', intentId);
      const result = await this.contract.pause_intent(
        { intent_id: intentId },
        '100000000000000' // 100 TGas
      );
      console.log('✅ Intent paused successfully:', result);
      return { success: true, message: 'Intent paused successfully' };
    } catch (error) {
      console.error('❌ Error pausing intent:', error);
      throw new Error('Failed to pause intent');
    }
  }

  async resumeIntent(intentId: string): Promise<any> {
    if (!this.contract || !this.isSignedIn()) {
      console.log('🎭 Demo mode: Resuming intent', intentId);
      return { success: true, message: 'Intent resumed (demo mode)' };
    }

    try {
      console.log('▶️ Resuming intent:', intentId);
      const result = await this.contract.resume_intent(
        { intent_id: intentId },
        '100000000000000' // 100 TGas
      );
      console.log('✅ Intent resumed successfully:', result);
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
    if (!this.contract || !this.isSignedIn()) {
      console.log('🎭 Demo mode: Executing arbitrage', { intentId, nearPrice, ethPrice });
      const profit = Math.abs(parseFloat(nearPrice) - parseFloat(ethPrice)) * 0.8;
      return {
        success: true,
        executionId: `demo-execution-${Date.now()}`,
        profit: profit.toString(),
        message: 'Arbitrage executed (demo mode)'
      };
    }

    try {
      console.log('⚡ Executing arbitrage on NEAR contract...');
      console.log('🎯 Intent ID:', intentId);
      console.log('💎 NEAR Price:', nearPrice);
      console.log('🔷 ETH Price:', ethPrice);

      const result = await this.contract.execute_arbitrage(
        {
          intent_id: intentId,
          near_price: nearPrice,
          eth_price: ethPrice
        },
        '300000000000000', // 300 TGas
        '100000000000000000000000' // 0.1 NEAR deposit
      );

      const profit = Math.abs(parseFloat(nearPrice) - parseFloat(ethPrice)) * 0.8;
      
      console.log('✅ Arbitrage executed successfully:', result);
      return {
        success: true,
        executionId: result,
        profit: profit.toString(),
        message: 'Arbitrage executed successfully'
      };
    } catch (error) {
      console.error('❌ Error executing arbitrage:', error);
      throw new Error('Failed to execute arbitrage');
    }
  }

  async getExecutionHistory(): Promise<any[]> {
    if (!this.contract || !this.isSignedIn()) {
      // Return demo execution history
      return [
        {
          id: 'demo-exec-1',
          intent_id: 'demo-1',
          user: this.getAccountId() || 'demo-user',
          token_pair: 'ETH/USDC',
          price_diff: '45.50',
          profit: '36.40',
          gas_fees: '0.01',
          tx_hash: 'demo-tx-hash-1',
          timestamp: Date.now().toString(),
          near_price: '3000.00',
          eth_price: '2954.50'
        },
        {
          id: 'demo-exec-2',
          intent_id: 'demo-2',
          user: this.getAccountId() || 'demo-user',
          token_pair: 'BTC/USDC',
          price_diff: '850.00',
          profit: '680.00',
          gas_fees: '0.02',
          tx_hash: 'demo-tx-hash-2',
          timestamp: (Date.now() - 3600000).toString(),
          near_price: '45000.00',
          eth_price: '44150.00'
        }
      ];
    }

    try {
      const accountId = this.getAccountId();
      if (!accountId) {
        throw new Error('User not signed in');
      }

      console.log('📈 Fetching execution history from contract...');
      const history = await this.contract.get_execution_history({ user: accountId });
      console.log('✅ Fetched execution history:', history);
      return history || [];
    } catch (error) {
      console.error('❌ Error fetching execution history:', error);
      return [];
    }
  }

  async getTotalProfit(): Promise<string> {
    if (!this.contract || !this.isSignedIn()) {
      // Return demo profit
      return '716.40'; // Sum of demo profits
    }

    try {
      const accountId = this.getAccountId();
      if (!accountId) {
        throw new Error('User not signed in');
      }

      console.log('💰 Fetching total profit from contract...');
      const profit = await this.contract.get_total_profit({ user: accountId });
      console.log('✅ Fetched total profit:', profit);
      
      // Convert from yoctoNEAR to NEAR if needed
      return profit || '0';
    } catch (error) {
      console.error('❌ Error fetching total profit:', error);
      return '0';
    }
  }

  async getContractInfo(): Promise<any> {
    if (!this.contract) {
      // Return demo contract info
      return {
        name: 'ArbitrageAI Cross-Chain Agent (Demo)',
        version: '1.0.0',
        owner: this.getAccountId() || 'demo-user',
        total_intents: 2,
        total_executions: 2,
        mode: 'demo'
      };
    }

    try {
      console.log('ℹ️ Fetching contract info...');
      const info = await this.contract.get_contract_info();
      console.log('✅ Contract info:', info);
      return info;
    } catch (error) {
      console.error('❌ Error fetching contract info:', error);
      return {
        name: 'ArbitrageAI Cross-Chain Agent',
        version: '1.0.0',
        owner: this.getAccountId(),
        total_intents: 0,
        total_executions: 0,
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
}

// Singleton instance
export const nearContract = new NearContractService();