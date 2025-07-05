#!/bin/bash

# NEAR Contract Deployment Script
# This script deploys the ArbitrageAI smart contract to NEAR Protocol

set -e

echo "🚀 Starting NEAR Contract Deployment..."

# Check if NEAR CLI is installed
if ! command -v near &> /dev/null; then
    echo "❌ NEAR CLI is not installed. Please install it first:"
    echo "npm install -g near-cli"
    exit 1
fi

# Configuration
CONTRACT_NAME="arbitrage-ai-$(date +%s).testnet"
NETWORK="testnet"
INITIAL_BALANCE="10"

echo "📋 Deployment Configuration:"
echo "   Contract Name: $CONTRACT_NAME"
echo "   Network: $NETWORK"
echo "   Initial Balance: $INITIAL_BALANCE NEAR"

# Login to NEAR (if not already logged in)
echo "🔐 Checking NEAR CLI login status..."
if ! near state $CONTRACT_NAME --networkId $NETWORK &> /dev/null; then
    echo "Please login to NEAR CLI:"
    near login --networkId $NETWORK
fi

# Create account for the contract
echo "🏗️  Creating contract account..."
near create-account $CONTRACT_NAME --masterAccount $(near state | grep "Account ID" | cut -d: -f2 | tr -d ' ') --initialBalance $INITIAL_BALANCE --networkId $NETWORK

# Build the contract (if Rust files exist)
if [ -d "contract" ]; then
    echo "🔨 Building Rust contract..."
    cd contract
    cargo build --target wasm32-unknown-unknown --release
    cd ..
    
    # Deploy the contract
    echo "📦 Deploying contract..."
    near deploy --contractName $CONTRACT_NAME --wasmFile contract/target/wasm32-unknown-unknown/release/arbitrage_contract.wasm --networkId $NETWORK
else
    echo "⚠️  No Rust contract found. Using JavaScript contract simulation."
fi

# Initialize the contract
echo "⚙️  Initializing contract..."
near call $CONTRACT_NAME new '{"owner": "'$(near state | grep "Account ID" | cut -d: -f2 | tr -d ' ')'"}' --accountId $CONTRACT_NAME --networkId $NETWORK

echo "✅ Contract deployed successfully!"
echo "📝 Contract Details:"
echo "   Contract ID: $CONTRACT_NAME"
echo "   Network: $NETWORK"
echo "   Explorer: https://explorer.testnet.near.org/accounts/$CONTRACT_NAME"

# Update environment variables
echo "🔧 Updating environment variables..."
cat > .env.local << EOF
VITE_NEAR_CONTRACT_ID=$CONTRACT_NAME
VITE_NEAR_NETWORK_ID=$NETWORK
VITE_NEAR_NODE_URL=https://rpc.testnet.near.org
VITE_NEAR_WALLET_URL=https://wallet.testnet.near.org
VITE_NEAR_HELPER_URL=https://helper.testnet.near.org
VITE_NEAR_EXPLORER_URL=https://explorer.testnet.near.org
EOF

echo "🎉 Deployment complete! Your contract is ready to use."
echo "💡 Next steps:"
echo "   1. Update your frontend to use contract ID: $CONTRACT_NAME"
echo "   2. Test the contract functions"
echo "   3. Deploy your frontend to production"