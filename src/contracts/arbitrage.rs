use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, Vector};
use near_sdk::json_types::{Base64VecU8, U128, U64};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, near_bindgen, AccountId, Balance, Gas, Promise, PromiseResult, PublicKey, Timestamp,
    PanicOnDefault, log,
};
use std::collections::HashMap;

// Gas constants
const GAS_FOR_CROSS_CHAIN_CALL: Gas = Gas(100_000_000_000_000);
const GAS_FOR_DEX_SWAP: Gas = Gas(150_000_000_000_000);

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct ArbitrageIntent {
    pub id: String,
    pub user: AccountId,
    pub token_pair: String,
    pub min_profit_threshold: String,
    pub status: IntentStatus,
    pub created_at: U64,
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub enum IntentStatus {
    Active,
    Paused,
    Executed,
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct ArbitrageExecution {
    pub id: String,
    pub intent_id: String,
    pub user: AccountId,
    pub token_pair: String,
    pub price_diff: String,
    pub profit: String,
    pub gas_fees: String,
    pub tx_hash: String,
    pub timestamp: U64,
    pub near_price: String,
    pub eth_price: String,
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct CrossChainSignature {
    pub signature: Base64VecU8,
    pub public_key: PublicKey,
    pub chain_id: u64,
    pub nonce: u64,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct ArbitrageContract {
    pub owner: AccountId,
    pub intents: LookupMap<String, ArbitrageIntent>,
    pub user_intents: LookupMap<AccountId, Vector<String>>,
    pub executions: LookupMap<String, ArbitrageExecution>,
    pub user_executions: LookupMap<AccountId, Vector<String>>,
    pub user_profits: LookupMap<AccountId, Balance>,
    pub next_intent_id: u64,
    pub next_execution_id: u64,
    pub cross_chain_signatures: LookupMap<String, CrossChainSignature>,
}

#[near_bindgen]
impl ArbitrageContract {
    #[init]
    pub fn new(owner: AccountId) -> Self {
        Self {
            owner,
            intents: LookupMap::new(b"intents".to_vec()),
            user_intents: LookupMap::new(b"user_intents".to_vec()),
            executions: LookupMap::new(b"executions".to_vec()),
            user_executions: LookupMap::new(b"user_executions".to_vec()),
            user_profits: LookupMap::new(b"user_profits".to_vec()),
            next_intent_id: 1,
            next_execution_id: 1,
            cross_chain_signatures: LookupMap::new(b"cross_chain_sigs".to_vec()),
        }
    }

    // Intent Management
    #[payable]
    pub fn create_intent(
        &mut self,
        token_pair: String,
        min_profit_threshold: String,
    ) -> String {
        let user = env::predecessor_account_id();
        let deposit = env::attached_deposit();
        
        // Require minimum deposit for intent creation
        assert!(deposit >= 1_000_000_000_000_000_000_000_000, "Minimum 1 NEAR deposit required");

        let intent_id = self.next_intent_id.to_string();
        self.next_intent_id += 1;

        let intent = ArbitrageIntent {
            id: intent_id.clone(),
            user: user.clone(),
            token_pair,
            min_profit_threshold,
            status: IntentStatus::Active,
            created_at: U64(env::block_timestamp()),
        };

        self.intents.insert(&intent_id, &intent);

        // Add to user's intent list
        let mut user_intent_list = self.user_intents.get(&user).unwrap_or_else(|| {
            Vector::new(format!("user_intents_{}", user).as_bytes().to_vec())
        });
        user_intent_list.push(&intent_id);
        self.user_intents.insert(&user, &user_intent_list);

        log!("Created intent {} for user {}", intent_id, user);
        intent_id
    }

    pub fn pause_intent(&mut self, intent_id: String) {
        let user = env::predecessor_account_id();
        let mut intent = self.intents.get(&intent_id).expect("Intent not found");
        
        assert_eq!(intent.user, user, "Only intent owner can pause");
        intent.status = IntentStatus::Paused;
        
        self.intents.insert(&intent_id, &intent);
        log!("Paused intent {}", intent_id);
    }

    pub fn resume_intent(&mut self, intent_id: String) {
        let user = env::predecessor_account_id();
        let mut intent = self.intents.get(&intent_id).expect("Intent not found");
        
        assert_eq!(intent.user, user, "Only intent owner can resume");
        intent.status = IntentStatus::Active;
        
        self.intents.insert(&intent_id, &intent);
        log!("Resumed intent {}", intent_id);
    }

    // Arbitrage Execution
    #[payable]
    pub fn execute_arbitrage(
        &mut self,
        intent_id: String,
        near_price: String,
        eth_price: String,
    ) -> Promise {
        let user = env::predecessor_account_id();
        let intent = self.intents.get(&intent_id).expect("Intent not found");
        
        assert_eq!(intent.user, user, "Only intent owner can execute");
        assert!(matches!(intent.status, IntentStatus::Active), "Intent must be active");

        // Calculate profit potential
        let near_price_f64: f64 = near_price.parse().expect("Invalid near price");
        let eth_price_f64: f64 = eth_price.parse().expect("Invalid eth price");
        let min_threshold: f64 = intent.min_profit_threshold.parse().expect("Invalid threshold");
        
        let price_diff = (near_price_f64 - eth_price_f64).abs();
        let profit_percentage = (price_diff / near_price_f64.min(eth_price_f64)) * 100.0;
        
        assert!(profit_percentage >= min_threshold, "Profit below threshold");

        // Execute DEX swap on NEAR
        self.execute_near_dex_swap(intent_id.clone(), near_price, eth_price)
    }

    fn execute_near_dex_swap(
        &mut self,
        intent_id: String,
        near_price: String,
        eth_price: String,
    ) -> Promise {
        let execution_id = self.next_execution_id.to_string();
        self.next_execution_id += 1;

        // In a real implementation, this would call actual DEX contracts
        // For now, we simulate the execution
        let intent = self.intents.get(&intent_id).unwrap();
        
        let price_diff = (near_price.parse::<f64>().unwrap() - eth_price.parse::<f64>().unwrap()).abs();
        let profit = price_diff * 0.8; // 80% of price difference as profit (accounting for fees)
        
        let execution = ArbitrageExecution {
            id: execution_id.clone(),
            intent_id: intent_id.clone(),
            user: intent.user.clone(),
            token_pair: intent.token_pair.clone(),
            price_diff: price_diff.to_string(),
            profit: profit.to_string(),
            gas_fees: "0.01".to_string(),
            tx_hash: env::current_account_id().to_string(), // Placeholder
            timestamp: U64(env::block_timestamp()),
            near_price,
            eth_price,
        };

        self.executions.insert(&execution_id, &execution);

        // Add to user's execution list
        let mut user_execution_list = self.user_executions.get(&intent.user).unwrap_or_else(|| {
            Vector::new(format!("user_executions_{}", intent.user).as_bytes().to_vec())
        });
        user_execution_list.push(&execution_id);
        self.user_executions.insert(&intent.user, &user_execution_list);

        // Update user profits
        let current_profit = self.user_profits.get(&intent.user).unwrap_or(0);
        let profit_amount = (profit * 1_000_000_000_000_000_000_000_000.0) as u128; // Convert to yoctoNEAR
        self.user_profits.insert(&intent.user, &(current_profit + profit_amount));

        log!("Executed arbitrage {} with profit {}", execution_id, profit);
        
        Promise::new(env::current_account_id())
    }

    // Cross-Chain Signature Management
    pub fn store_cross_chain_signature(
        &mut self,
        execution_id: String,
        signature: Base64VecU8,
        public_key: PublicKey,
        chain_id: u64,
        nonce: u64,
    ) {
        let cross_chain_sig = CrossChainSignature {
            signature,
            public_key,
            chain_id,
            nonce,
        };
        
        self.cross_chain_signatures.insert(&execution_id, &cross_chain_sig);
        log!("Stored cross-chain signature for execution {}", execution_id);
    }

    pub fn verify_cross_chain_signature(&self, execution_id: String) -> bool {
        // In a real implementation, this would verify the signature against the execution
        // For now, we return true if signature exists
        self.cross_chain_signatures.contains_key(&execution_id)
    }

    // View Methods
    pub fn get_user_intents(&self, user: AccountId) -> Vec<ArbitrageIntent> {
        let mut intents = Vec::new();
        
        if let Some(user_intent_list) = self.user_intents.get(&user) {
            for i in 0..user_intent_list.len() {
                if let Some(intent_id) = user_intent_list.get(i) {
                    if let Some(intent) = self.intents.get(&intent_id) {
                        intents.push(intent);
                    }
                }
            }
        }
        
        intents
    }

    pub fn get_execution_history(&self, user: AccountId) -> Vec<ArbitrageExecution> {
        let mut executions = Vec::new();
        
        if let Some(user_execution_list) = self.user_executions.get(&user) {
            for i in 0..user_execution_list.len() {
                if let Some(execution_id) = user_execution_list.get(i) {
                    if let Some(execution) = self.executions.get(&execution_id) {
                        executions.push(execution);
                    }
                }
            }
        }
        
        executions
    }

    pub fn get_total_profit(&self, user: AccountId) -> U128 {
        U128(self.user_profits.get(&user).unwrap_or(0))
    }

    pub fn get_intent(&self, intent_id: String) -> Option<ArbitrageIntent> {
        self.intents.get(&intent_id)
    }

    pub fn get_execution(&self, execution_id: String) -> Option<ArbitrageExecution> {
        self.executions.get(&execution_id)
    }
}

// Cross-Chain Integration Tests
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, Balance};

    fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(predecessor_account_id.clone())
            .predecessor_account_id(predecessor_account_id);
        builder
    }

    #[test]
    fn test_create_intent() {
        let mut context = get_context(accounts(1));
        context.attached_deposit(1_000_000_000_000_000_000_000_000);
        testing_env!(context.build());
        
        let mut contract = ArbitrageContract::new(accounts(0));
        let intent_id = contract.create_intent("ETH/USDC".to_string(), "1.0".to_string());
        
        assert_eq!(intent_id, "1");
        let intent = contract.get_intent(intent_id).unwrap();
        assert_eq!(intent.user, accounts(1));
        assert_eq!(intent.token_pair, "ETH/USDC");
    }

    #[test]
    fn test_execute_arbitrage() {
        let mut context = get_context(accounts(1));
        context.attached_deposit(1_000_000_000_000_000_000_000_000);
        testing_env!(context.build());
        
        let mut contract = ArbitrageContract::new(accounts(0));
        let intent_id = contract.create_intent("ETH/USDC".to_string(), "1.0".to_string());
        
        context.attached_deposit(100_000_000_000_000_000_000_000);
        testing_env!(context.build());
        
        contract.execute_arbitrage(intent_id, "3000.0".to_string(), "2950.0".to_string());
        
        let executions = contract.get_execution_history(accounts(1));
        assert_eq!(executions.len(), 1);
        assert_eq!(executions[0].token_pair, "ETH/USDC");
    }
}