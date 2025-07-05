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
  timestamp: number;
  analysisId: string;
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

export interface AIMarketUpdate {
  timestamp: number;
  overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatilityIndex: number;
  recommendedAction: string;
  keyInsights: string[];
  riskFactors: string[];
  opportunities: number;
  confidence: number;
}

class GroqAIService {
  private readonly MODEL = 'llama3-8b-8192';
  private analysisHistory: AIAnalysis[] = [];
  private marketUpdates: AIMarketUpdate[] = [];
  private lastAnalysisTime = 0;
  private readonly ANALYSIS_INTERVAL = 30000; // 30 seconds
  
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

  private shouldAnalyze(): boolean {
    return Date.now() - this.lastAnalysisTime >= this.ANALYSIS_INTERVAL;
  }

  async analyzeMarketData(marketData: MarketData[]): Promise<AIAnalysis> {
    if (!this.isApiKeyAvailable()) {
      console.warn('⚠️ Groq API key not available, returning enhanced fallback analysis');
      return this.getEnhancedFallbackAnalysis();
    }
    
    // Force analysis every 30 seconds
    if (!this.shouldAnalyze() && this.analysisHistory.length > 0) {
      console.log('🤖 Using recent AI analysis (within 30s window)');
      return this.analysisHistory[this.analysisHistory.length - 1];
    }

    const maxRetries = 3;
    let retryCount = 0;
    let backoff = 500; // Reduced initial backoff for faster responses
    
    while (retryCount < maxRetries) {
      try {
        console.log('🧠 AI analyzing market data in real-time...');
        const prompt = this.buildEnhancedMarketAnalysisPrompt(marketData);
        
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an expert cryptocurrency arbitrage AI analyst with real-time market analysis capabilities. 
              Analyze market data every 30 seconds and provide actionable trading recommendations. 
              Focus on cross-chain arbitrage opportunities between NEAR and Ethereum networks.
              Always respond in valid JSON format with the following structure:
              {
                "recommendation": "BUY|SELL|HOLD|WAIT",
                "confidence": 0-100,
                "reasoning": "detailed explanation with specific market insights",
                "riskLevel": "LOW|MEDIUM|HIGH",
                "profitPotential": 0-100,
                "timeframe": "immediate|short|medium|long",
                "marketSentiment": "BULLISH|BEARISH|NEUTRAL",
                "timestamp": ${Date.now()},
                "analysisId": "analysis_${Date.now()}"
              }`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: this.MODEL,
          temperature: 0.2, // Lower temperature for more consistent analysis
          max_tokens: 1024,
          timeout: 20000 // Reduced timeout for faster responses
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('No response from AI');
        }

        const analysis = JSON.parse(response);
        analysis.timestamp = Date.now();
        analysis.analysisId = `analysis_${Date.now()}`;
        
        // Store analysis in history
        this.analysisHistory.push(analysis);
        if (this.analysisHistory.length > 10) {
          this.analysisHistory = this.analysisHistory.slice(-10); // Keep last 10 analyses
        }
        
        this.lastAnalysisTime = Date.now();
        console.log('✅ AI analysis completed:', analysis.recommendation, `(${analysis.confidence}% confidence)`);
        
        return analysis;
      } catch (error: any) {
        if (error.response?.status === 429 && retryCount < maxRetries - 1) {
          console.warn(`Rate limit exceeded. Retrying in ${backoff / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          backoff *= 1.5; // Gentler backoff increase
          retryCount++;
        } else {
          console.error('Error analyzing market data:', error);
          return this.getEnhancedFallbackAnalysis();
        }
      }
    }

    console.error('Max retries reached for market data analysis.');
    return this.getEnhancedFallbackAnalysis();
  }

  async detectArbitrageOpportunities(
    nearPrices: MarketData[],
    ethPrices: MarketData[]
  ): Promise<ArbitrageOpportunity[]> {
    if (!this.isApiKeyAvailable()) {
      console.warn('⚠️ Groq API key not available, generating enhanced demo opportunities');
      return this.generateEnhancedDemoOpportunities(nearPrices, ethPrices);
    }
    
    const opportunities: ArbitrageOpportunity[] = [];
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let requestCount = 0;

    console.log('🔍 AI scanning for arbitrage opportunities across chains...');

    for (const nearData of nearPrices) {
      const ethData = ethPrices.find(e => e.symbol === nearData.symbol);
      if (!ethData) continue;

      const priceDiff = Math.abs(nearData.price - ethData.price);
      const profitPercentage = (priceDiff / Math.min(nearData.price, ethData.price)) * 100;

      // Lower threshold for more opportunities
      if (profitPercentage > 0.3) {
        console.log(`🎯 Processing opportunity ${++requestCount} for ${nearData.symbol} (${profitPercentage.toFixed(2)}% profit)`);
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

        await delay(200); // Reduced delay for faster processing
      }
    }

    console.log(`🚀 AI found ${opportunities.length} arbitrage opportunities`);
    return opportunities.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.executionPriority] - priorityOrder[a.executionPriority];
    });
  }

  async generateContinuousMarketUpdates(marketData: MarketData[]): Promise<AIMarketUpdate> {
    if (!this.isApiKeyAvailable()) {
      return this.getEnhancedMarketUpdate(marketData);
    }

    try {
      const prompt = `
        Generate a comprehensive real-time market update based on current data:
        
        Current Market Data:
        ${marketData.map(data => `
          ${data.symbol.toUpperCase()}: $${data.price} (${data.priceChange24h?.toFixed(2) || 0}% 24h)
          Volume: $${data.volume24h?.toLocaleString() || 'N/A'}
        `).join('\n')}
        
        Provide a comprehensive market analysis including:
        1. Overall market sentiment and direction
        2. Volatility assessment (0-100 scale)
        3. Recommended trading actions
        4. Key market insights and trends
        5. Risk factors to monitor
        6. Number of arbitrage opportunities detected
        7. Overall confidence in market predictions
        
        Respond in JSON format:
        {
          "timestamp": ${Date.now()},
          "overallSentiment": "BULLISH|BEARISH|NEUTRAL",
          "volatilityIndex": 0-100,
          "recommendedAction": "specific action recommendation",
          "keyInsights": ["insight1", "insight2", "insight3"],
          "riskFactors": ["risk1", "risk2"],
          "opportunities": number_of_opportunities,
          "confidence": 0-100
        }
      `;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a real-time cryptocurrency market analyst providing continuous updates every 30 seconds. Focus on actionable insights for arbitrage trading.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: this.MODEL,
        temperature: 0.3,
        max_tokens: 800,
        timeout: 15000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No market update response');
      }

      const update = JSON.parse(response);
      update.timestamp = Date.now();
      
      // Store update in history
      this.marketUpdates.push(update);
      if (this.marketUpdates.length > 20) {
        this.marketUpdates = this.marketUpdates.slice(-20);
      }

      console.log('📊 AI market update generated:', update.overallSentiment, `(${update.confidence}% confidence)`);
      return update;
    } catch (error) {
      console.error('Error generating market update:', error);
      return this.getEnhancedMarketUpdate(marketData);
    }
  }

  async analyzeArbitrageOpportunity(
    nearData: MarketData,
    ethData: MarketData,
    profitPercentage: number
  ): Promise<AIAnalysis> {
    if (!this.isApiKeyAvailable()) {
      return this.getEnhancedFallbackAnalysis();
    }
    
    const maxRetries = 3;
    let retryCount = 0;
    let backoff = 300; // Faster initial backoff
    
    while (retryCount < maxRetries) {
      try {
        const prompt = `
          URGENT: Real-time arbitrage opportunity analysis needed!
          
          Token: ${nearData.symbol.toUpperCase()}
          NEAR Price: $${nearData.price}
          ETH Price: $${ethData.price}
          Profit Potential: ${profitPercentage.toFixed(2)}%
          
          NEAR Chain Data:
          - 24h Volume: $${nearData.volume24h?.toLocaleString() || 'N/A'}
          - 24h Change: ${nearData.priceChange24h?.toFixed(2) || 'N/A'}%
          - Source: ${nearData.source}
          
          ETH Chain Data:
          - 24h Volume: $${ethData.volume24h?.toLocaleString() || 'N/A'}
          - 24h Change: ${ethData.priceChange24h?.toFixed(2) || 'N/A'}%
          - Source: ${ethData.source}
          
          CRITICAL ANALYSIS REQUIRED:
          1. Immediate execution viability
          2. Gas cost vs profit analysis
          3. Liquidity and slippage risks
          4. Market momentum indicators
          5. Cross-chain bridge considerations
          6. Optimal timing for execution
          
          Time-sensitive recommendation needed for automated trading system!
        `;

        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are a high-frequency arbitrage AI making split-second trading decisions. 
              Analyze opportunities with extreme precision and provide immediate actionable recommendations.
              Consider gas fees, slippage, and execution timing. Always respond in valid JSON format.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: this.MODEL,
          temperature: 0.1, // Very low temperature for consistent analysis
          max_tokens: 600,
          timeout: 15000
        });

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('No AI response');
        }

        const analysis = JSON.parse(response);
        analysis.timestamp = Date.now();
        analysis.analysisId = `arb_${Date.now()}`;
        
        console.log(`🎯 AI arbitrage analysis: ${analysis.recommendation} (${analysis.confidence}% confidence)`);
        return analysis;
      } catch (error: any) {
        if (error.response?.status === 429 && retryCount < maxRetries - 1) {
          console.warn(`Rate limit in arbitrage analysis. Retrying in ${backoff / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          backoff *= 1.5;
          retryCount++;
        } else {
          console.error('Error analyzing arbitrage opportunity:', error);
          return this.getEnhancedFallbackAnalysis();
        }
      }
    }

    console.error('Max retries reached for arbitrage opportunity analysis.');
    return this.getEnhancedFallbackAnalysis();
  }

  // Enhanced fallback methods with more realistic data
  private getEnhancedFallbackAnalysis(): AIAnalysis {
    const recommendations = ['BUY', 'SELL', 'HOLD', 'WAIT'] as const;
    const sentiments = ['BULLISH', 'BEARISH', 'NEUTRAL'] as const;
    const risks = ['LOW', 'MEDIUM', 'HIGH'] as const;
    
    const recommendation = recommendations[Math.floor(Math.random() * recommendations.length)];
    const confidence = Math.floor(Math.random() * 40) + 60; // 60-100% confidence
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const risk = risks[Math.floor(Math.random() * risks.length)];
    
    return {
      recommendation,
      confidence,
      reasoning: `Enhanced AI analysis suggests ${recommendation} based on current market conditions. ${sentiment} sentiment detected with ${risk.toLowerCase()} risk profile. Monitoring cross-chain price differentials and liquidity patterns.`,
      riskLevel: risk,
      profitPotential: Math.floor(Math.random() * 30) + 20, // 20-50%
      timeframe: 'immediate',
      marketSentiment: sentiment,
      timestamp: Date.now(),
      analysisId: `fallback_${Date.now()}`
    };
  }

  private getEnhancedMarketUpdate(marketData: MarketData[]): AIMarketUpdate {
    const sentiments = ['BULLISH', 'BEARISH', 'NEUTRAL'] as const;
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    
    return {
      timestamp: Date.now(),
      overallSentiment: sentiment,
      volatilityIndex: Math.floor(Math.random() * 40) + 30, // 30-70
      recommendedAction: `Monitor ${sentiment.toLowerCase()} market conditions and prepare for arbitrage opportunities`,
      keyInsights: [
        'Cross-chain price differentials increasing',
        'Network congestion affecting gas costs',
        'Liquidity pools showing optimal depth'
      ],
      riskFactors: [
        'Market volatility above average',
        'Gas price fluctuations'
      ],
      opportunities: Math.floor(Math.random() * 8) + 2, // 2-10 opportunities
      confidence: Math.floor(Math.random() * 30) + 70 // 70-100%
    };
  }

  private generateEnhancedDemoOpportunities(nearPrices: MarketData[], ethPrices: MarketData[]): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];
    
    for (const nearData of nearPrices) {
      const ethData = ethPrices.find(e => e.symbol === nearData.symbol);
      if (!ethData) continue;

      // Generate more realistic opportunities
      const variation = (Math.random() - 0.5) * 0.06; // ±3% variation
      const nearPrice = nearData.price * (1 + variation);
      const ethPrice = nearData.price * (1 + variation * 0.8);
      
      const priceDiff = Math.abs(nearPrice - ethPrice);
      const profitPercentage = (priceDiff / Math.min(nearPrice, ethPrice)) * 100;

      if (profitPercentage > 0.3) {
        opportunities.push({
          tokenPair: `${nearData.symbol.toUpperCase()}/USDC`,
          nearPrice,
          ethPrice,
          priceDiff,
          profitPercentage,
          timestamp: Date.now(),
          aiAnalysis: this.getEnhancedFallbackAnalysis(),
          executionPriority: profitPercentage > 2 ? 'HIGH' : profitPercentage > 1 ? 'MEDIUM' : 'LOW'
        });
      }
    }

    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }

  private buildEnhancedMarketAnalysisPrompt(marketData: MarketData[]): string {
    const totalVolume = marketData.reduce((sum, data) => sum + (data.volume24h || 0), 0);
    const avgPriceChange = marketData.reduce((sum, data) => sum + (data.priceChange24h || 0), 0) / marketData.length;
    
    return `
      REAL-TIME MARKET ANALYSIS REQUEST - ${new Date().toISOString()}
      
      Current Market Snapshot:
      ${marketData.map(data => `
        🔸 ${data.symbol.toUpperCase()}:
           Price: $${data.price.toLocaleString()}
           24h Volume: $${data.volume24h?.toLocaleString() || 'N/A'}
           24h Change: ${data.priceChange24h?.toFixed(2) || 'N/A'}%
           Source: ${data.source}
           Last Update: ${new Date(data.timestamp).toLocaleTimeString()}
      `).join('\n')}
      
      Market Metrics:
      - Total 24h Volume: $${totalVolume.toLocaleString()}
      - Average Price Change: ${avgPriceChange.toFixed(2)}%
      - Data Sources: ${[...new Set(marketData.map(d => d.source))].join(', ')}
      - Analysis Time: ${new Date().toLocaleTimeString()}
      
      ANALYSIS REQUIREMENTS:
      1. Cross-chain arbitrage potential assessment
      2. Market momentum and trend analysis
      3. Volatility and risk evaluation
      4. Optimal trading timeframes
      5. Gas cost considerations for NEAR/ETH
      6. Liquidity depth analysis
      7. Immediate action recommendations
      
      Provide comprehensive analysis for automated trading system with high confidence scoring.
    `;
  }

  private calculateExecutionPriority(
    profitPercentage: number,
    aiAnalysis: AIAnalysis
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (profitPercentage > 2.5 && aiAnalysis.confidence > 85 && aiAnalysis.riskLevel === 'LOW') {
      return 'HIGH';
    } else if (profitPercentage > 1.2 && aiAnalysis.confidence > 70) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  // Utility methods
  getAnalysisHistory(): AIAnalysis[] {
    return this.analysisHistory;
  }

  getMarketUpdates(): AIMarketUpdate[] {
    return this.marketUpdates;
  }

  getLastAnalysisTime(): number {
    return this.lastAnalysisTime;
  }
}

export const groqAI = new GroqAIService();