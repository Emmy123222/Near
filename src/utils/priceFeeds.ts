import axios from 'axios';

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
}

export interface ArbitrageOpportunity {
  tokenPair: string;
  nearPrice: number;
  ethPrice: number;
  priceDiff: number;
  profitPercentage: number;
  timestamp: number;
}

class PriceFeedManager {
  private priceCache: Map<string, PriceData> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  // Fetch prices from multiple sources
  async fetchPrices(tokens: string[]): Promise<PriceData[]> {
    const prices: PriceData[] = [];
    
    for (const token of tokens) {
      try {
        // Check cache first
        const cached = this.priceCache.get(token);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
          prices.push(cached);
          continue;
        }

        // Fetch from CoinGecko API
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`
        );
        
        const price: PriceData = {
          symbol: token,
          price: response.data[token]?.usd || 0,
          timestamp: Date.now(),
          source: 'coingecko'
        };
        
        this.priceCache.set(token, price);
        prices.push(price);
      } catch (error) {
        console.error(`Error fetching price for ${token}:`, error);
        // Use cached price if available
        const cached = this.priceCache.get(token);
        if (cached) {
          prices.push(cached);
        }
      }
    }

    return prices;
  }

  // Simulate NEAR DEX prices (in production, this would connect to actual DEX)
  async fetchNearDexPrices(tokens: string[]): Promise<PriceData[]> {
    const prices: PriceData[] = [];
    
    for (const token of tokens) {
      try {
        // Simulate DEX price with slight variation
        const basePrice = await this.fetchPrices([token]);
        if (basePrice.length > 0) {
          const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
          const dexPrice: PriceData = {
            symbol: token,
            price: basePrice[0].price * (1 + variation),
            timestamp: Date.now(),
            source: 'near-dex'
          };
          prices.push(dexPrice);
        }
      } catch (error) {
        console.error(`Error fetching NEAR DEX price for ${token}:`, error);
      }
    }

    return prices;
  }

  // Simulate Ethereum DEX prices
  async fetchEthDexPrices(tokens: string[]): Promise<PriceData[]> {
    const prices: PriceData[] = [];
    
    for (const token of tokens) {
      try {
        // Simulate DEX price with slight variation
        const basePrice = await this.fetchPrices([token]);
        if (basePrice.length > 0) {
          const variation = (Math.random() - 0.5) * 0.025; // ±1.25% variation
          const dexPrice: PriceData = {
            symbol: token,
            price: basePrice[0].price * (1 + variation),
            timestamp: Date.now(),
            source: 'eth-dex'
          };
          prices.push(dexPrice);
        }
      } catch (error) {
        console.error(`Error fetching ETH DEX price for ${token}:`, error);
      }
    }

    return prices;
  }

  // AI-powered arbitrage detection
  async detectArbitrageOpportunities(tokenPairs: string[]): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];
    
    for (const pair of tokenPairs) {
      try {
        const token = pair.split('/')[0].toLowerCase();
        
        // Fetch prices from both chains
        const [nearPrices, ethPrices] = await Promise.all([
          this.fetchNearDexPrices([token]),
          this.fetchEthDexPrices([token])
        ]);

        if (nearPrices.length > 0 && ethPrices.length > 0) {
          const nearPrice = nearPrices[0].price;
          const ethPrice = ethPrices[0].price;
          const priceDiff = Math.abs(nearPrice - ethPrice);
          const profitPercentage = (priceDiff / Math.min(nearPrice, ethPrice)) * 100;

          // Only consider opportunities with >0.5% profit potential
          if (profitPercentage > 0.5) {
            opportunities.push({
              tokenPair: pair,
              nearPrice,
              ethPrice,
              priceDiff,
              profitPercentage,
              timestamp: Date.now()
            });
          }
        }
      } catch (error) {
        console.error(`Error detecting arbitrage for ${pair}:`, error);
      }
    }

    // Sort by profit potential
    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }

  // Real-time price monitoring
  startPriceMonitoring(tokens: string[], callback: (prices: PriceData[]) => void): NodeJS.Timeout {
    const fetchPricesInterval = setInterval(async () => {
      try {
        const prices = await this.fetchPrices(tokens);
        callback(prices);
      } catch (error) {
        console.error('Error in price monitoring:', error);
      }
    }, 15000); // Update every 15 seconds

    return fetchPricesInterval;
  }

  stopPriceMonitoring(interval: NodeJS.Timeout): void {
    clearInterval(interval);
  }
}

export const priceFeedManager = new PriceFeedManager();