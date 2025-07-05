import React, { createContext, useContext, useEffect, useState } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupHereWallet } from '@near-wallet-selector/here-wallet';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupModal } from '@near-wallet-selector/modal-ui';
import type { WalletSelector, AccountState } from '@near-wallet-selector/core';
import { nearContract } from '../utils/nearContract';
import { useNavigate } from 'react-router-dom'; // Import React Router's navigate

// Import wallet selector CSS
import '@near-wallet-selector/modal-ui/styles.css';

interface WalletContextType {
  selector: WalletSelector | null;
  modal: any;
  accounts: AccountState[];
  accountId: string | null;
  isSignedIn: boolean;
  signIn: (walletId?: string) => void; // Updated to accept walletId
  signOut: () => void;
  isLoading: boolean;
  wallet: any;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [accounts, setAccounts] = useState<AccountState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); // React Router hook for navigation

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔄 Initializing NEAR Wallet Selector...');
        
        // Initialize NEAR contract first
        await nearContract.initialize();
        
        // Setup wallet selector with multiple wallet options
        const _selector = await setupWalletSelector({
          network: 'testnet',
          modules: [
            setupMyNearWallet({
              walletUrl: 'https://testnet.mynearwallet.com',
            }),
            setupHereWallet(),
            setupMeteorWallet(),
          ],
        });

        // Setup modal for wallet selection
        const _modal = setupModal(_selector, {
          contractId: nearContract.getContractId() !== 'demo-mode' ? nearContract.getContractId() : '',
          description: 'Connect your NEAR wallet to start using ArbitrageAI',
          theme: 'dark',
        });

        // Get initial state
        const state = _selector.store.getState();
        setAccounts(state.accounts);

        setSelector(_selector);
        setModal(_modal);
        
        console.log('✅ NEAR Wallet Selector initialized successfully');
        console.log('🔌 Available wallets:', state.modules.map(m => m.metadata.name));
      } catch (error) {
        console.error('❌ Failed to initialize wallet selector:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!selector) return;

    // Subscribe to wallet state changes
    const subscription = selector.store.observable
      .subscribe((state) => {
        console.log('🔄 Wallet state changed:', state);
        setAccounts(state.accounts);

        // Check if signed in and redirect after successful connection
        if (state.accounts.length > 0 && state.accounts.some(account => account.active)) {
          console.log('✅ Wallet connected, redirecting to dashboard...');
          navigate('/dashboard'); // Redirect to dashboard or desired page
        }
      });

    // Handle callback URL (e.g., after MyNearWallet redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const accountId = urlParams.get('account_id');
    if (accountId && selector.isSignedIn()) {
      console.log('🔄 Processing callback for account:', accountId);
      selector.wallet().then(wallet => wallet.signIn({ contractId: nearContract.getContractId() } as any));
    }

    return () => subscription.unsubscribe();
  }, [selector, navigate]);

  const signIn = (walletId?: string) => {
    if (!selector) {
      console.error('❌ Wallet selector not initialized');
      return;
    }

    console.log('🔐 Initiating sign-in for wallet:', walletId || 'default');
    if (walletId === 'my-near-wallet') {
      // Directly trigger MyNearWallet sign-in with redirect
      selector.wallet('my-near-wallet').then(wallet => {
              wallet.signIn({
                contractId: nearContract.getContractId(),
                successUrl: window.location.origin + '/dashboard', // Redirect after success
                failureUrl: window.location.origin + '/login', // Redirect on failure
              } as any); // Cast to any to avoid type error for browser wallet
            }).catch(error => console.error('❌ Error signing in with MyNearWallet:', error));
    } else {
      // Open modal for other wallets
      if (modal) {
        modal.show();
      } else {
        console.error('❌ Wallet modal not initialized');
      }
    }
  };

  const signOut = async () => {
    try {
      if (selector) {
        console.log('🚪 Signing out from NEAR wallet...');
        const wallet = await selector.wallet();
        await wallet.signOut();
      }
    } catch (error) {
      console.error('❌ Error signing out:', error);
    } finally {
      // Force reload to clear state
      window.location.reload();
    }
  };

  const accountId = accounts.find((account) => account.active)?.accountId || null;
  const isSignedIn = !!accountId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Initializing Wallet Selector
          </h2>
          <p className="text-gray-400">Setting up NEAR wallet connections...</p>
        </div>
      </div>
    );
  }

  return (
    <WalletContext.Provider
      value={{
        selector,
        modal,
        accounts,
        accountId,
        isSignedIn,
        signIn,
        signOut,
        isLoading,
        wallet: selector,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};