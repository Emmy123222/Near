use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, Vector};
use near_sdk::json_types::{Base64VecU8, U128, U64};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, near_bindgen, AccountId, NearToken, Gas, Promise, PublicKey,
    PanicOnDefault, log,
};

// Gas constants
const GAS_FOR_CROSS_CHAIN_CALL: Gas = Gas::from_tgas(100);
const GAS_FOR_DEX_SWAP: Gas = Gas::from_tgas(150);

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct ArbitrageIntent {
    pub id: String,
    pub user: AccountId,
    pub token_pair: String,
    pub min_profit_threshold: f64,
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
    pub price_diff: f64,
    pub profit: f64,
    pub gas_fees: f64,
    pub tx_hash: String,
    pub timestamp: U64,
    pub near_price: f64,
    pub eth_price: f64,
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
    pub user_profits: LookupMap<AccountId, U128>,
    pub next_intent_id: u64,
    pub next_execution_id: u64,
    pub cross_chain_signatures: LookupMap<String, CrossChainSignature>,
}

#[near_bindgen]
impl ArbitrageContract {
    #[init]
    pub fn new(owner: AccountId) -> Self {
        assert!(!env::state_exists(), "Already initialized");
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

        // Compare deposit (u128 in yoctoNEAR) with 1 NEAR in yoctoNEAR
        assert!(
            deposit >= 1_000_000_000_000_000_000_000_000, // 1 NEAR = 10^24 yoctoNEAR
            "Minimum 1 NEAR deposit required"
        );

        let intent_id = self.next_intent_id.to_string();
        self.next_intent_id += 1;

        let min_threshold: f64 = min_profit_threshold.parse().unwrap_or_else(|_| {
            env::panic_str("Invalid min_profit_threshold: must be a valid number")
        });

        let intent = ArbitrageIntent {
            id: intent_id.clone(),
            user: user.clone(),
            token_pair,
            min_profit_threshold: min_threshold,
            status: IntentStatus::Active,
            created_at: U64(env::block_timestamp()),
        };

        self.intents.insert(&intent_id, &intent);

        let mut user_intent_list = self.user_intents.get(&user).unwrap_or_else(|| {
            Vector::new(format!("user_intents_{}", &user).as_bytes())
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
        assert!(
            matches!(intent.status, IntentStatus::Active),
            "Intent must be active"
        );

        let near_price_f64: f64 = near_price.parse().unwrap_or_else(|_| {
            env::panic_str("Invalid near_price: must be a valid number")
        });
        let eth_price_f64: f64 = eth_price.parse().unwrap_or_else(|_| {
            env::panic_str("Invalid eth_price: must be a valid number")
        });

        let price_diff = (near_price_f64 - eth_price_f64).abs();
        let profit_percentage = (price_diff / near_price_f64.min(eth_price_f64)) * 100.0;

        assert!(
            profit_percentage >= intent.min_profit_threshold,
            "Profit below threshold"
        );

        self.execute_near_dex_swap(intent_id, near_price_f64, eth_price_f64)
    }

    fn execute_near_dex_swap(
        &mut self,
        intent_id: String,
        near_price: f64,
        eth_price: f64,
    ) -> Promise {
        let execution_id = self.next_execution_id.to_string();
        self.next_execution_id += 1;

        let mut intent = self.intents.get(&intent_id).expect("Intent not found");

        let price_diff = (near_price - eth_price).abs();
        let profit = price_diff * 0.8; // 80% of price difference as profit
        let gas_fees = 0.01; // Placeholder gas fee in NEAR

        let tx_hash = hex::encode(env::random_seed()); // Convert Vec<u8> to hex string

        let execution = ArbitrageExecution {
            id: execution_id.clone(),
            intent_id: intent_id.clone(),
            user: intent.user.clone(),
            token_pair: intent.token_pair.clone(),
            price_diff,
            profit,
            gas_fees,
            tx_hash,
            timestamp: U64(env::block_timestamp()),
            near_price,
            eth_price,
        };

        self.executions.insert(&execution_id, &execution);

        let mut user_execution_list = self.user_executions.get(&intent.user).unwrap_or_else(|| {
            Vector::new(format!("user_executions_{}", &intent.user).as_bytes())
        });
        user_execution_list.push(&execution_id);
        self.user_executions.insert(&intent.user, &user_execution_list);

        let current_profit = self.user_profits.get(&intent.user).unwrap_or(U128(0));
        let profit_amount = U128((profit * 1_000_000_000_000_000_000_000_000.0) as u128); // Convert to yoctoNEAR
        self.user_profits.insert(&intent.user, &U128(current_profit.0 + profit_amount.0));

        intent.status = IntentStatus::Executed; // Update intent status
        self.intents.insert(&intent_id, &intent);

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
        if let Some(_) = self.cross_chain_signatures.get(&execution_id) {
            // Placeholder: Implement actual signature verification here
            true
        } else {
            false
        }
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
        self.user_profits.get(&user).unwrap_or(U128(0))
    }

    pub fn get_intent(&self, intent_id: String) -> Option<ArbitrageIntent> {
        self.intents.get(&intent_id)
    }

    pub fn get_execution(&self, execution_id: String) -> Option<ArbitrageExecution> {
        self.executions.get(&execution_id)
    }

    pub fn get_contract_info(&self) -> serde_json::Value {
        serde_json::json!({
            "name": "ArbitrageAI Cross-Chain Agent",
            "version": "1.0.0",
            "owner": self.owner,
            "total_intents": self.next_intent_id - 1,
            "total_executions": self.next_execution_id - 1
        })
    }
}

// Cross-Chain Integration Tests
#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, NearToken};

    fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(predecessor_account_id.clone())
            .predecessor_account_id(predecessor_account_id)
            .attached_deposit(NearToken::from_near(1).as_yoctonear());
        builder
    }

    #[test]
    fn test_create_intent() {
        let mut context = get_context(accounts(1));
        testing_env!(context.build());

        let mut contract = ArbitrageContract::new(accounts(0));
        let intent_id = contract.create_intent("ETH/USDC".to_string(), "1.0".to_string());

        assert_eq!(intent_id, "1");
        let intent = contract.get_intent(intent_id).unwrap();
        assert_eq!(intent.user, accounts(1));
        assert_eq!(intent.token_pair, "ETH/USDC");
        assert_eq!(intent.min_profit_threshold, 1.0);
    }

    #[test]
    fn test_execute_arbitrage() {
        let mut context = get_context(accounts(1));
        testing_env!(context.build());

        let mut contract = ArbitrageContract::new(accounts(0));
        let intent_id = contract.create_intent("ETH/USDC".to_string(), "1.0".to_string());

        context.attached_deposit(NearToken::from_near(0.1).as_yoctonear());
        testing_env!(context.build());

        let promise = contract.execute_arbitrage(intent_id, "3000.0".to_string(), "2950.0".to_string());
        assert!(promise.is_valid());

        let executions = contract.get_execution_history(accounts(1));
        assert_eq!(executions.len(), 1);
        assert_eq!(executions[0].token_pair, "ETH/USDC");
        assert!(executions[0].profit > 0.0);
    }
}