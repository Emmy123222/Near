# 🚀 NEAR Contract Deployment Guide

This guide walks you through deploying the ArbitrageAI smart contract to NEAR Protocol.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **NEAR CLI installed**:
   ```bash
   npm install -g near-cli
   ```

2. **NEAR Testnet Account**:
   - Visit [NEAR Wallet](https://wallet.testnet.near.org)
   - Create a new account
   - Save your account ID and seed phrase

3. **Rust Toolchain** (for contract compilation):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

## 🔐 Authentication Setup

1. **Login to NEAR CLI**:
   ```bash
   near login
   ```
   This opens a browser window to authorize NEAR CLI with your account.

2. **Verify Login**:
   ```bash
   near state YOUR_ACCOUNT.testnet
   ```

## 📦 Contract Deployment Methods

### Method 1: Automated Deployment (Recommended)

Use our deployment script for a streamlined process:

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The script will:
- Create a unique contract account
- Deploy the contract
- Initialize with your account as owner
- Update environment variables

### Method 2: Manual Deployment

#### Step 1: Create Contract Account
```bash
# Replace with your desired contract name
CONTRACT_NAME="arbitrage-ai-$(date +%s).testnet"
MASTER_ACCOUNT="your-account.testnet"

near create-account $CONTRACT_NAME \
  --masterAccount $MASTER_ACCOUNT \
  --initialBalance 10
```

#### Step 2: Build Contract (if using Rust)
```bash
# If you have Rust contract source
cd contract
cargo build --target wasm32-unknown-unknown --release
cd ..
```

#### Step 3: Deploy Contract
```bash
# For Rust contract
near deploy \
  --contractName $CONTRACT_NAME \
  --wasmFile contract/target/wasm32-unknown-unknown/release/arbitrage_contract.wasm

# For JavaScript simulation (current setup)
# The contract logic is handled in the frontend
```

#### Step 4: Initialize Contract
```bash
near call $CONTRACT_NAME new \
  '{"owner": "'$MASTER_ACCOUNT'"}' \
  --accountId $CONTRACT_NAME
```

## ⚙️ Environment Configuration

After deployment, update your `.env.local` file:

```env
VITE_NEAR_CONTRACT_ID=your-deployed-contract.testnet
VITE_NEAR_NETWORK_ID=testnet
VITE_NEAR_NODE_URL=https://rpc.testnet.near.org
VITE_NEAR_WALLET_URL=https://wallet.testnet.near.org
VITE_NEAR_HELPER_URL=https://helper.testnet.near.org
VITE_NEAR_EXPLORER_URL=https://explorer.testnet.near.org
```

## 🧪 Testing Deployment

### 1. Verify Contract State
```bash
near state $CONTRACT_NAME
```

### 2. Test Contract Methods
```bash
# Test view method
near view $CONTRACT_NAME get_user_intents \
  '{"user": "your-account.testnet"}'

# Test change method
near call $CONTRACT_NAME create_intent \
  '{"token_pair": "ETH/USDC", "min_profit_threshold": "1.0"}' \
  --accountId your-account.testnet \
  --deposit 1
```

### 3. Check Transaction History
Visit the NEAR Explorer:
```
https://explorer.testnet.near.org/accounts/$CONTRACT_NAME
```

## 🔄 Contract Updates

To update an existing contract:

```bash
# Build new version
cargo build --target wasm32-unknown-unknown --release

# Deploy update
near deploy \
  --contractName $CONTRACT_NAME \
  --wasmFile contract/target/wasm32-unknown-unknown/release/arbitrage_contract.wasm
```

## 🌐 Mainnet Deployment

For production deployment to NEAR Mainnet:

1. **Change Network Configuration**:
   ```bash
   export NEAR_ENV=mainnet
   ```

2. **Update URLs**:
   ```env
   VITE_NEAR_NETWORK_ID=mainnet
   VITE_NEAR_NODE_URL=https://rpc.mainnet.near.org
   VITE_NEAR_WALLET_URL=https://wallet.near.org
   VITE_NEAR_HELPER_URL=https://helper.mainnet.near.org
   VITE_NEAR_EXPLORER_URL=https://explorer.near.org
   ```

3. **Deploy with Mainnet Account**:
   ```bash
   near login --networkId mainnet
   ./deploy.sh
   ```

## 💰 Cost Estimation

Typical deployment costs on NEAR:

- **Account Creation**: ~0.1 NEAR
- **Contract Deployment**: ~0.01 NEAR
- **Storage Costs**: ~0.0001 NEAR per KB
- **Function Calls**: ~0.0001-0.001 NEAR per call

## 🐛 Troubleshooting

### Common Issues

1. **"Account not found" Error**:
   ```bash
   # Ensure you're logged in
   near login
   
   # Check account exists
   near state your-account.testnet
   ```

2. **"Insufficient Balance" Error**:
   ```bash
   # Check account balance
   near state your-account.testnet
   
   # Get testnet tokens from faucet
   # Visit: https://near-faucet.io/
   ```

3. **"Contract not found" Error**:
   ```bash
   # Verify contract deployment
   near state $CONTRACT_NAME
   
   # Check transaction status
   near tx-status TRANSACTION_HASH --accountId your-account.testnet
   ```

4. **"Method not found" Error**:
   ```bash
   # List available methods
   near view $CONTRACT_NAME --help
   
   # Check contract ABI
   near view $CONTRACT_NAME get_contract_info '{}'
   ```

### Debug Commands

```bash
# View contract state
near state $CONTRACT_NAME

# Check recent transactions
near tx-status TRANSACTION_HASH --accountId $CONTRACT_NAME

# View contract storage
near view-state $CONTRACT_NAME --finality final

# Check account access keys
near keys $CONTRACT_NAME
```

## 📊 Monitoring

After deployment, monitor your contract:

1. **NEAR Explorer**: Track transactions and state changes
2. **Contract Logs**: Monitor function call results
3. **Account Balance**: Ensure sufficient funds for operations
4. **Storage Usage**: Monitor on-chain storage consumption

## 🔒 Security Considerations

1. **Access Control**: Ensure only authorized accounts can call sensitive methods
2. **Input Validation**: Validate all user inputs in contract methods
3. **Reentrancy Protection**: Implement proper state management
4. **Upgrade Strategy**: Plan for contract updates and migrations

## 📚 Additional Resources

- [NEAR Documentation](https://docs.near.org/)
- [NEAR CLI Reference](https://docs.near.org/tools/near-cli)
- [Smart Contract Best Practices](https://docs.near.org/develop/contracts/introduction)
- [NEAR Explorer](https://explorer.near.org/)

---

Need help? Join our [Discord community](https://discord.gg/arbitrageai) or check the [troubleshooting guide](TROUBLESHOOTING.md).