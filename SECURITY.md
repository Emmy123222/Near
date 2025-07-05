# 🔒 Security Guidelines

## Environment Variables Security

### ✅ Secure Practices

1. **Never commit API keys to version control**
   ```bash
   # ❌ NEVER do this
   git add .env.local
   
   # ✅ Always check .gitignore includes
   .env.local
   .env
   ```

2. **Use environment-specific files**
   ```
   .env.local          # Local development (gitignored)
   .env.example        # Template file (committed)
   .env.production     # Production secrets (never committed)
   ```

3. **Rotate API keys regularly**
   - Change Groq API keys every 90 days
   - Use different keys for development/production
   - Monitor API key usage in provider dashboards

### 🔑 API Key Management

#### Groq API Key
```env
# In .env.local only
VITE_GROQ_API_KEY=gsk_your_actual_key_here
```

**Security Notes:**
- Free tier: 30 requests/minute limit
- Keep keys private and secure
- Monitor usage in Groq Console
- Regenerate if compromised

#### NEAR Protocol
```env
# Public configuration (safe to expose)
VITE_NEAR_CONTRACT_ID=your-contract.testnet
VITE_NEAR_NETWORK_ID=testnet
```

**Security Notes:**
- Contract IDs are public by design
- Network configuration is not sensitive
- Wallet private keys are handled by NEAR Wallet

### 🛡️ Smart Contract Security

#### Access Control
```rust
// Only intent owner can modify
assert_eq!(intent.user, user, "Only intent owner can pause");
```

#### Input Validation
```rust
// Validate deposits
assert!(deposit >= 1_000_000_000_000_000_000_000_000, "Minimum 1 NEAR deposit required");

// Validate profit thresholds
assert!(profit_percentage >= min_threshold, "Profit below threshold");
```

#### Gas Limits
```rust
const GAS_FOR_CROSS_CHAIN_CALL: Gas = Gas(100_000_000_000_000);
const GAS_FOR_DEX_SWAP: Gas = Gas(150_000_000_000_000);
```

### 🔍 Frontend Security

#### API Key Validation
```typescript
private isApiKeyAvailable(): boolean {
  return !!import.meta.env.VITE_GROQ_API_KEY;
}
```

#### Input Sanitization
```typescript
// Validate numeric inputs
const profitThreshold = parseFloat(minProfitThreshold);
if (isNaN(profitThreshold) || profitThreshold < 0) {
  throw new Error('Invalid profit threshold');
}
```

#### Error Handling
```typescript
try {
  await contract.createIntent(tokenPair, threshold);
} catch (error) {
  console.error('Contract error:', error);
  // Never expose internal errors to users
  throw new Error('Transaction failed. Please try again.');
}
```

### 🚨 Security Checklist

#### Before Deployment
- [ ] All API keys in environment variables
- [ ] `.env.local` in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] Input validation on all user inputs
- [ ] Error messages don't expose internals
- [ ] Contract access controls tested
- [ ] Gas limits properly set

#### Production Security
- [ ] Use production API keys
- [ ] Enable rate limiting
- [ ] Monitor API usage
- [ ] Set up error tracking
- [ ] Regular security audits
- [ ] Backup wallet seed phrases securely

### 🔧 Security Tools

#### Code Scanning
```bash
# Check for exposed secrets
npm audit
git secrets --scan

# Lint for security issues
npm run lint
```

#### Environment Validation
```typescript
// Validate required environment variables
const requiredEnvVars = [
  'VITE_NEAR_CONTRACT_ID',
  'VITE_GROQ_API_KEY'
];

requiredEnvVars.forEach(envVar => {
  if (!import.meta.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
});
```

### 📞 Incident Response

#### If API Key Compromised
1. **Immediately revoke** the compromised key
2. **Generate new key** in provider console
3. **Update environment variables**
4. **Monitor for unauthorized usage**
5. **Review access logs**

#### If Contract Compromised
1. **Pause all intents** if possible
2. **Contact NEAR support**
3. **Analyze transaction history**
4. **Deploy patched contract**
5. **Migrate user data safely**

### 📚 Security Resources

- [NEAR Security Best Practices](https://docs.near.org/develop/contracts/security)
- [Groq API Security](https://console.groq.com/docs/security)
- [OWASP Web Security](https://owasp.org/www-project-top-ten/)
- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)

---

**Remember: Security is everyone's responsibility. When in doubt, choose the more secure option.**