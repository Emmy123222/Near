import { connect, Contract, keyStores, WalletConnection } from 'near-api-js';
import { FunctionCallOptions } from 'near-api-js/lib/account';

const nearConfig = {
  networkId: 'testnet',
  keyStore: new keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org',
  helperUrl: 'https://helper.testnet.near.org',
  explorerUrl: 'https://explorer.testnet.near.org',
};

export const CONTRACT_NAME = 'arbitrage-agent.testnet';

export interface ArbitrageIntent {
  id: string;
  user: string;
  token_pair: string;
  min_profit_threshold: string;
  status: 'active' | 'paused' | 'executed';
  created_at: string;
}

export interface ArbitrageExecution {
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
}

export class NearArbitrageContract {
  private contract: Contract;
  private wallet: WalletConnection;
  private currentUser: any;

  constructor(contract: Contract, wallet: WalletConnection) {
    this.contract = contract;
    this.wallet = wallet;
    this.currentUser = wallet.getAccountId();
  }

  // Intent Management
  async createIntent(tokenPair: string, minProfitThreshold: string): Promise<any> {
    const result = await this.contract.account.functionCall({
      contractId: CONTRACT_NAME,
      methodName: 'create_intent',
      args: {
        token_pair: tokenPair,
        min_profit_threshold: minProfitThreshold,
      },
      gas: '300000000000000',
      attachedDeposit: '1000000000000000000000000', // 1 NEAR
    });
    return result;
  }

  async getIntents(): Promise<ArbitrageIntent[]> {
    try {
      const intents = await this.contract.account.viewFunction({
        contractId: CONTRACT_NAME,
        methodName: 'get_user_intents',
        args: { user: this.currentUser },
      });
      return intents || [];
    } catch (error) {
      console.error('Error fetching intents:', error);
      return [];
    }
  }

  async pauseIntent(intentId: string): Promise<any> {
    return await this.contract.account.functionCall({
      contractId: CONTRACT_NAME,
      methodName: 'pause_intent',
      args: { intent_id: intentId },
      gas: '100000000000000',
    });
  }

  async resumeIntent(intentId: string): Promise<any> {
    return await this.contract.account.functionCall({
      contractId: CONTRACT_NAME,
      methodName: 'resume_intent',
      args: { intent_id: intentId },
      gas: '100000000000000',
    });
  }

  // Arbitrage Execution
  async executeArbitrage(intentId: string, nearPrice: string, ethPrice: string): Promise<any> {
    return await this.contract.account.functionCall({
      contractId: CONTRACT_NAME,
      methodName: 'execute_arbitrage',
      args: {
        intent_id: intentId,
        near_price: nearPrice,
        eth_price: ethPrice,
      },
      gas: '300000000000000',
      attachedDeposit: '100000000000000000000000', // 0.1 NEAR
    });
  }

  // History and Analytics
  async getExecutionHistory(): Promise<ArbitrageExecution[]> {
    try {
      const history = await this.contract.account.viewFunction({
        contractId: CONTRACT_NAME,
        methodName: 'get_execution_history',
        args: { user: this.currentUser },
      });
      return history || [];
    } catch (error) {
      console.error('Error fetching execution history:', error);
      return [];
    }
  }

  async getTotalProfit(): Promise<string> {
    try {
      const profit = await this.contract.account.viewFunction({
        contractId: CONTRACT_NAME,
        methodName: 'get_total_profit',
        args: { user: this.currentUser },
      });
      return profit || '0';
    } catch (error) {
      console.error('Error fetching total profit:', error);
      return '0';
    }
  }

  // Utility Methods
  isSignedIn(): boolean {
    return this.wallet.isSignedIn();
  }

  getAccountId(): string {
    return this.wallet.getAccountId();
  }

  signIn(): void {
    this.wallet.requestSignIn({
      contractId: CONTRACT_NAME,
      methodNames: ['create_intent', 'pause_intent', 'resume_intent', 'execute_arbitrage'],
    });
  }

  signOut(): void {
    this.wallet.signOut();
    window.location.reload();
  }
}

export async function initNear() {
  const near = await connect(nearConfig);
  const wallet = new WalletConnection(near, 'arbitrage-agent');
  const contract = new Contract(
    wallet.account(),
    CONTRACT_NAME,
    {
      viewMethods: ['get_user_intents', 'get_execution_history', 'get_total_profit'],
      changeMethods: ['create_intent', 'pause_intent', 'resume_intent', 'execute_arbitrage'],
    }
  );

  return new NearArbitrageContract(contract, wallet);
}