import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useGroqAI } from './useGroqAI';
import { nearContract } from '../utils/nearContract';

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

export const useNear = () => {
  const { isSignedIn, accountId, wallet } = useWallet();
  const { getTradeRecommendation } = useGroqAI();
  const [isLoading, setIsLoading] = useState(true);
  const [contractInfo, setContractInfo] = useState<any>(null);

  useEffect(() => {
    if (wallet) {
      initializeContract();
    }
  }, [wallet]);

  const initializeContract = async () => {
    try {
      setIsLoading(true);
      
      // Only initialize if wallet is available
      if (wallet) {
        await nearContract.initialize();
      }
      
      // Fetch contract info
      const info = await nearContract.getContractInfo();
      setContractInfo(info);
      
      console.log('🎉 NEAR contract integration ready!');
    } catch (error) {
      console.error('Failed to initialize NEAR contract:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createIntent = async (tokenPair: string, minProfitThreshold: string) => {
    try {
      // Get AI recommendation before creating intent
      console.log('🤖 Getting AI validation for intent...');
      const aiRecommendation = await getTradeRecommendation(
        tokenPair,
        3000, // Mock NEAR price
        2950, // Mock ETH price  
        parseFloat(minProfitThreshold)
      );
      
      console.log('🧠 AI Recommendation:', aiRecommendation);
      
      if (!aiRecommendation.shouldExecute && aiRecommendation.confidence < 50) {
        console.warn('⚠️ AI recommends against creating this intent');
        // Still allow creation but warn user
      }

      // Create intent on NEAR contract
      const result = await nearContract.createIntent(tokenPair, minProfitThreshold);
      
      console.log('✅ Intent created with AI validation:', {
        contractResult: result,
        aiValidated: aiRecommendation.shouldExecute,
        aiConfidence: aiRecommendation.confidence,
        aiReasoning: aiRecommendation.reasoning
      });
      
      return { 
        success: true, 
        intentId: result,
        aiValidated: aiRecommendation.shouldExecute,
        aiConfidence: aiRecommendation.confidence,
        aiReasoning: aiRecommendation.reasoning
      };
    } catch (error) {
      console.error('❌ Error creating intent:', error);
      throw error;
    }
  };

  const executeArbitrageWithAI = async (
    intentId: string, 
    tokenPair: string, 
    nearPrice: number, 
    ethPrice: number,
    minThreshold: number
  ) => {
    try {
      // Get AI recommendation before execution
      console.log('🤖 Getting AI recommendation for execution...');
      const aiRecommendation = await getTradeRecommendation(
        tokenPair,
        nearPrice,
        ethPrice,
        minThreshold
      );
      
      console.log('🧠 AI Execution Analysis:', aiRecommendation);
      
      if (!aiRecommendation.shouldExecute) {
        throw new Error(`AI recommends against execution: ${aiRecommendation.reasoning}`);
      }
      
      if (aiRecommendation.confidence < 70) {
        console.warn('⚠️ Low AI confidence for execution:', aiRecommendation.confidence);
      }
      
      // Execute arbitrage on NEAR contract
      const result = await nearContract.executeArbitrage(
        intentId,
        nearPrice.toString(),
        ethPrice.toString()
      );
      
      console.log('✅ Arbitrage executed with AI approval:', {
        contractResult: result,
        aiConfidence: aiRecommendation.confidence,
        aiReasoning: aiRecommendation.reasoning,
        profitPotential: Math.abs(nearPrice - ethPrice) * 0.8
      });
      
      return {
        success: true,
        executionId: result,
        profit: Math.abs(nearPrice - ethPrice) * 0.8,
        aiValidated: true,
        aiConfidence: aiRecommendation.confidence,
        aiReasoning: aiRecommendation.reasoning
      };
    } catch (error) {
      console.error('❌ Error executing AI-powered arbitrage:', error);
      throw error;
    }
  };

  const pauseIntent = async (intentId: string) => {
    try {
      const result = await nearContract.pauseIntent(intentId);
      console.log('⏸️ Intent paused:', result);
      return result;
    } catch (error) {
      console.error('❌ Error pausing intent:', error);
      throw error;
    }
  };

  const resumeIntent = async (intentId: string) => {
    try {
      const result = await nearContract.resumeIntent(intentId);
      console.log('▶️ Intent resumed:', result);
      return result;
    } catch (error) {
      console.error('❌ Error resuming intent:', error);
      throw error;
    }
  };

  const getIntents = async (): Promise<ArbitrageIntent[]> => {
    try {
      if (!isSignedIn) return [];
      const intents = await nearContract.getUserIntents();
      return intents;
    } catch (error) {
      console.error('❌ Error fetching intents:', error);
      return [];
    }
  };

  const getExecutionHistory = async (): Promise<ArbitrageExecution[]> => {
    try {
      if (!isSignedIn) return [];
      const history = await nearContract.getExecutionHistory();
      return history;
    } catch (error) {
      console.error('❌ Error fetching execution history:', error);
      return [];
    }
  };

  const getTotalProfit = async (): Promise<string> => {
    try {
      if (!isSignedIn) return '0';
      const profit = await nearContract.getTotalProfit();
      return profit;
    } catch (error) {
      console.error('❌ Error fetching total profit:', error);
      return '0';
    }
  };

  const signIn = async () => {
    try {
      await nearContract.signIn();
    } catch (error) {
      console.error('❌ Error signing in:', error);
      throw error;
    }
  };

  const signOut = () => {
    nearContract.signOut();
  };

  return {
    // Contract state
    nearContract,
    contractInfo,
    accountId,
    isSignedIn: isSignedIn && nearContract.isSignedIn(),
    isLoading,
    
    // Contract methods
    createIntent,
    executeArbitrageWithAI,
    pauseIntent,
    resumeIntent,
    getIntents,
    getExecutionHistory,
    getTotalProfit,
    
    // Wallet methods
    signIn,
    signOut,
    
    // Utility methods
    getContractId: () => nearContract.getContractId(),
    getExplorerUrl: (txHash?: string) => nearContract.getExplorerUrl(txHash),
    formatNearAmount: (amount: string) => nearContract.formatNearAmount(amount),
  };
};