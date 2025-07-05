import Groq from 'groq-sdk';

// Initialize Groq client with environment variable
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  priceChange24h: number;
  timestamp: number;
  source: string;
}

export interface AIAnalysis {
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  confidence: number;
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  profitPotential: number;
  timeframe: string;
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface ArbitrageOpportunity {
  tokenPair: string;
  nearPrice: number;
  ethPrice: number;
  priceDiff: number;
  profitPercentage: number;
  timestamp: number;
  aiAnalysis: AIAnalysis;
  executionPriority: 'HIGH' | 'MEDIUM' | 'LOW';
}

class GroqAIService {
  private readonly MODEL = 'llama3-8b-8192';
  
  constructor() {
    // Validate API key on initialization
    if (!import.meta.env.VITE_GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY not found in environment variables');
      console.warn('⚠️ AI features will be disabled. Please add VITE_GROQ_API_KEY to your .env.local file');
    }
  }
  
  private isApiKeyAvailable(): boolean {
    return !!import.meta.env.VITE_GROQ_API_KEY;
  }

  async analyzeMarketData(marketData: MarketData[]): Promise<AIAnalysis> {
    if (!this.isApiKeyAvailable()) {
      console.warn('⚠️ Groq API key not available, returning fallback analysis');
      return this.getFallbackAnalysis();
    }
    
    const maxRetries = 5;
    let retryCount = 0;
    let backoff = 1000; // Initial backoff time in milliseconds (1 second)
    
    while (retryCount < maxRetries) {
      try {
        const prompt = this.buildMarketAnalysisPrompt(marketData);
        
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an expert cryptocurrency arbitrage AI analyst. Analyze market data and provide actionable trading recommendations. Always respond in valid JSON format with the following structure:
              {
                "recommendation": "BUY|SELL|HOLD|WAIT",
                "confidence": 0-100,
                "reasoning": "detailed explanation",
                "riskLevel": "LOW|MEDIUM|HIGH",
                "profitPotential": 0-100,
                "timeframe": "immediate|short|medium|long",
                "marketSentiment": "BULLISH|BEARISH|NEUTRAL"
              }`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: this.MODEL,
          temperature: 0.3,
          max_tokens: 1024,
          timeout: 30000 // 30 seconds timeout
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('No response from AI');
        }

        return JSON.parse(response);
      } catch (error: any) {
        if (error.response?.status === 429 && retryCount < maxRetries - 1) {
          console.warn(`Rate limit exceeded in analyzeMarketData. Retrying in ${backoff / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          backoff *= 2; // Double the backoff time for the next retry
          retryCount++;
        } else {
          console.error('Error analyzing market data:', error);
          return this.getFallbackAnalysis();
        }
      }
    }

    console.error('Max retries reached for market data analysis.');
    return this.getFallbackAnalysis();
  }

  async detectArbitrageOpportunities(
    nearPrices: MarketData[],
    ethPrices: MarketData[]
  ): Promise<ArbitrageOpportunity[]> {
    if (!this.isApiKeyAvailable()) {
      console.warn('⚠️ Groq API key not available, returning empty opportunities');
      return [];
    }
    
    const opportunities: ArbitrageOpportunity[] = [];
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let requestCount = 0;

    for (const nearData of nearPrices) {
      const ethData = ethPrices.find(e => e.symbol === nearData.symbol);
      if (!ethData) continue;

      const priceDiff = Math.abs(nearData.price - ethData.price);
      const profitPercentage = (priceDiff / Math.min(nearData.price, ethData.price)) * 100;

      if (profitPercentage > 0.5) {
        console.log(`Processing request ${++requestCount} for ${nearData.symbol}`);
        const aiAnalysis = await this.analyzeArbitrageOpportunity(nearData, ethData, profitPercentage);
        
        opportunities.push({
          tokenPair: `${nearData.symbol.toUpperCase()}/USDC`,
          nearPrice: nearData.price,
          ethPrice: ethData.price,
          priceDiff,
          profitPercentage,
          timestamp: Date.now(),
          aiAnalysis,
          executionPriority: this.calculateExecutionPriority(profitPercentage, aiAnalysis)
        });

        await delay(1000); // 1-second delay between API calls
      }
    }

    console.log(`Total API requests made: ${requestCount}`);
    return opportunities.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.executionPriority] - priorityOrder[a.executionPriority];
    });
  }

  async analyzeArbitrageOpportunity(
    nearData: MarketData,
    ethData: MarketData,
    profitPercentage: number
  ): Promise<AIAnalysis> {
    if (!this.isApiKeyAvailable()) {
      return this.getFallbackAnalysis();
    }
    
    const maxRetries = 5;
    let retryCount = 0;
    let backoff = 1000; // Initial backoff time in milliseconds (1 second)
    
    while (retryCount < maxRetries) {
      try {
        const prompt = `
          Analyze this cross-chain arbitrage opportunity:
          
          Token: ${nearData.symbol.toUpperCase()}
          NEAR Price: $${nearData.price}
          ETH Price: $${ethData.price}
          Profit Potential: ${profitPercentage.toFixed(2)}%
          
          NEAR Data:
          - 24h Volume: $${nearData.volume24h?.toLocaleString() || 'N/A'}
          - 24h Change: ${nearData.priceChange24h?.toFixed(2) || 'N/A'}%
          
          ETH Data:
          - 24h Volume: $${ethData.volume24h?.toLocaleString() || 'N/A'}
          - 24h Change: ${ethData.priceChange24h?.toFixed(2) || 'N/A'}%
          
          Consider:
          1. Price volatility and stability
          2. Trading volume and liquidity
          3. Gas fees and transaction costs
          4. Market momentum and trends
          5. Risk factors and timing
          
          Provide a comprehensive analysis for this arbitrage opportunity.
        `;

        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an expert DeFi arbitrage analyst. Analyze cross-chain arbitrage opportunities and provide detailed recommendations. Always respond in valid JSON format.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: this.MODEL,
          temperature: 0.2,
          max_tokens: 512,
          timeout: 30000 // 30 seconds timeout
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('No AI response');
        }

        return JSON.parse(response);
      } catch (error: any) {
        if (error.response?.status === 429 && retryCount < maxRetries - 1) {
          console.warn(`Rate limit exceeded in analyzeArbitrageOpportunity. Retrying in ${backoff / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          backoff *= 2; // Double the backoff time for the next retry
          retryCount++;
        } else {
          console.error('Error analyzing arbitrage opportunity:', error);
          return this.getFallbackAnalysis();
        }
      }
    }

    console.error('Max retries reached for arbitrage opportunity analysis.');
    return this.getFallbackAnalysis();
  }

  async predictPriceMovement(
    symbol: string,
    historicalPrices: number[],
    timeframe: '1h' | '4h' | '24h' = '1h'
  ): Promise<{
    prediction: number;
    confidence: number;
    direction: 'UP' | 'DOWN' | 'STABLE';
    reasoning: string;
  }> {
    if (!this.isApiKeyAvailable()) {
      const currentPrice = historicalPrices[historicalPrices.length - 1];
      return {
        prediction: currentPrice,
        confidence: 50,
        direction: 'STABLE',
        reasoning: 'API key not available, using fallback prediction'
      };
    }
    
    const maxRetries = 5;
    let retryCount = 0;
    let backoff = 1000; // Initial backoff time in milliseconds (1 second)
    
    while (retryCount < maxRetries) {
      try {
        const prompt = `
          Predict the price movement for ${symbol.toUpperCase()} based on this historical data:
          
          Recent Prices: [${historicalPrices.slice(-10).join(', ')}]
          Timeframe: ${timeframe}
          Current Price: $${historicalPrices[historicalPrices.length - 1]}
          
          Analyze:
          1. Price trends and patterns
          2. Volatility indicators
          3. Support and resistance levels
          4. Market momentum
          
          Provide a price prediction with confidence level and reasoning.
          
          Respond in JSON format:
          {
            "prediction": predicted_price_number,
            "confidence": 0-100,
            "direction": "UP|DOWN|STABLE",
            "reasoning": "detailed explanation"
          }
        `;

        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a cryptocurrency price prediction AI. Analyze historical data and provide accurate predictions with confidence levels.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: this.MODEL,
          temperature: 0.1,
          max_tokens: 512,
          timeout: 30000 // 30 seconds timeout
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('No prediction response');
        }

        return JSON.parse(response);
      } catch (error: any) {
        if (error.response?.status === 429 && retryCount < maxRetries - 1) {
          console.warn(`Rate limit exceeded in predictPriceMovement. Retrying in ${backoff / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          backoff *= 2; // Double the backoff time for the next retry
          retryCount++;
        } else {
          console.error('Error predicting price movement:', error);
          const currentPrice = historicalPrices[historicalPrices.length - 1];
          return {
            prediction: currentPrice,
            confidence: 50,
            direction: 'STABLE',
            reasoning: 'Fallback prediction due to AI service error'
          };
        }
      }
    }

    console.error('Max retries reached for price movement prediction.');
    const currentPrice = historicalPrices[historicalPrices.length - 1];
    return {
      prediction: currentPrice,
      confidence: 50,
      direction: 'STABLE',
      reasoning: 'Fallback prediction due to max retries exceeded'
    };
  }

  async optimizeGasStrategy(
    networkConditions: {
      nearGasPrice: number;
      ethGasPrice: number;
      networkCongestion: 'LOW' | 'MEDIUM' | 'HIGH';
    },
    tradeValue: number
  ): Promise<{
    recommendation: string;
    optimalTiming: string;
    gasSavings: number;
    reasoning: string;
  }> {
    if (!this.isApiKeyAvailable()) {
      return {
        recommendation: 'Execute during low network congestion periods',
        optimalTiming: 'Wait for lower gas prices',
        gasSavings: 15,
        reasoning: 'API key not available, using fallback gas optimization'
      };
    }
    
    const maxRetries = 5;
    let retryCount = 0;
    let backoff = 1000; // Initial backoff time in milliseconds (1 second)
    
    while (retryCount < maxRetries) {
      try {
        const prompt = `
          Optimize gas strategy for cross-chain arbitrage:
          
          Network Conditions:
          - NEAR Gas Price: ${networkConditions.nearGasPrice} TGas
          - ETH Gas Price: ${networkConditions.ethGasPrice} Gwei
          - Network Congestion: ${networkConditions.networkCongestion}
          
          Trade Value: $${tradeValue}
          
          Provide gas optimization strategy including:
          1. Optimal execution timing
          2. Gas fee minimization tactics
          3. Cost-benefit analysis
          4. Risk considerations
          
          Respond in JSON format:
          {
            "recommendation": "detailed strategy",
            "optimalTiming": "timing recommendation",
            "gasSavings": estimated_savings_percentage,
            "reasoning": "explanation"
          }
        `;

        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a blockchain gas optimization expert. Provide strategies to minimize transaction costs while maximizing arbitrage profits.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: this.MODEL,
          temperature: 0.2,
          max_tokens: 512,
          timeout: 30000 // 30 seconds timeout
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('No gas optimization response');
        }

        return JSON.parse(response);
      } catch (error: any) {
        if (error.response?.status === 429 && retryCount < maxRetries - 1) {
          console.warn(`Rate limit exceeded in optimizeGasStrategy. Retrying in ${backoff / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          backoff *= 2; // Double the backoff time for the next retry
          retryCount++;
        } else {
          console.error('Error optimizing gas strategy:', error);
          return {
            recommendation: 'Execute during low network congestion periods',
            optimalTiming: 'Wait for lower gas prices',
            gasSavings: 15,
            reasoning: 'Fallback recommendation due to AI service error'
          };
        }
      }
    }

    console.error('Max retries reached for gas strategy optimization.');
    return {
      recommendation: 'Execute during low network congestion periods',
      optimalTiming: 'Wait for lower gas prices',
      gasSavings: 15,
      reasoning: 'Fallback recommendation due to max retries exceeded'
    };
  }

  private buildMarketAnalysisPrompt(marketData: MarketData[]): string {
    return `
      Analyze the following cryptocurrency market data for arbitrage opportunities:
      
      ${marketData.map(data => `
        ${data.symbol.toUpperCase()}:
        - Price: $${data.price}
        - 24h Volume: $${data.volume24h?.toLocaleString() || 'N/A'}
        - 24h Change: ${data.priceChange24h?.toFixed(2) || 'N/A'}%
        - Source: ${data.source}
        - Timestamp: ${new Date(data.timestamp).toISOString()}
      `).join('\n')}
      
      Consider:
      1. Price volatility and trends
      2. Trading volume and liquidity
      3. Market sentiment indicators
      4. Cross-chain arbitrage potential
      5. Risk factors and timing
      
      Provide a comprehensive market analysis with actionable recommendations.
    `;
  }

  private calculateExecutionPriority(
    profitPercentage: number,
    aiAnalysis: AIAnalysis
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (profitPercentage > 3 && aiAnalysis.confidence > 80 && aiAnalysis.riskLevel === 'LOW') {
      return 'HIGH';
    } else if (profitPercentage > 1.5 && aiAnalysis.confidence > 60) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  private getFallbackAnalysis(): AIAnalysis {
    return {
      recommendation: 'WAIT',
      confidence: 50,
      reasoning: 'AI analysis unavailable, using conservative approach',
      riskLevel: 'MEDIUM',
      profitPotential: 25,
      timeframe: 'medium',
      marketSentiment: 'NEUTRAL'
    };
  }
}

export const groqAI = new GroqAIService();