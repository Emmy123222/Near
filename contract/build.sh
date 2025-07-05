#!/bin/bash

# Build script for NEAR smart contract

set -e

echo "🔨 Building NEAR smart contract..."

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust is not installed. Please install it first:"
    echo "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# Check if wasm32 target is installed
if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo "📦 Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# Build the contract
echo "🏗️  Compiling contract..."
cargo build --target wasm32-unknown-unknown --release

# Check if build was successful
if [ -f "target/wasm32-unknown-unknown/release/arbitrage_contract.wasm" ]; then
    echo "✅ Contract built successfully!"
    echo "📁 WASM file location: target/wasm32-unknown-unknown/release/arbitrage_contract.wasm"
    
    # Show file size
    SIZE=$(wc -c < target/wasm32-unknown-unknown/release/arbitrage_contract.wasm)
    echo "📊 Contract size: $SIZE bytes"
    
    if [ $SIZE -gt 4194304 ]; then
        echo "⚠️  Warning: Contract size exceeds 4MB limit"
    fi
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 Build complete!"