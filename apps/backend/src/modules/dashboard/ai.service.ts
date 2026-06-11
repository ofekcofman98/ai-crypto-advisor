import axios from 'axios';

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  insight: string;
  expiresAt: number;
}

const insightCache = new Map<string, CacheEntry>();
let rateLimitCooldownUntil = 0;

function getCacheKey(investorType: string, assets: string[]): string {
  return `${investorType}:${[...assets].sort().join(',')}`;
}

function getFallbackInsight(investorType: string, assets: string[], prices: any): string {
    const assetList = assets.join(', ');
    
    if (investorType === 'HODLER') {
      return `[Fallback Insight] As a HODLER tracking ${assetList}, the current market volatility is noise. Accumulate during dips and maintain a long-term horizon. Focus on security and cold storage rather than 24h price action.`;
    }
    
    return `[Fallback Insight] As a DAY_TRADER monitoring ${assetList}, short-term technical indicators are key. Watch the 24h volume closely and set strict stop-losses. The current price action suggests tight ranges.`;
}


export async function generateCryptoInsight(
    investorType: string, 
    assets: string[], 
    currentPrices: any
): Promise<string> {

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.warn('OPENROUTER_API_KEY missing. Using fallback AI insights.');
      return getFallbackInsight(investorType, assets, currentPrices);
    }

    const cacheKey = getCacheKey(investorType, assets);
    const cached = insightCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.insight;
    }

    if (Date.now() < rateLimitCooldownUntil) {
      return getFallbackInsight(investorType, assets, currentPrices);
    }
  
    try {
      const prompt = `
        You are an expert crypto financial AI advisor. Analyze this user portfolio:
        - Investor Type: ${investorType}
        - Watched Assets: ${assets.join(', ')}
        - Current Market Prices & 24h Changes: ${JSON.stringify(currentPrices)}
  
        Provide a concise, 3-sentence action plan/insight tailored specifically to their investor profile. 
        Do not include disclaimers, greetings, or intro text. Get straight to the analysis.
      `;
  
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:4000',
          },
          timeout: 25000,
        }
      );
  
      const insightText = response?.data?.choices?.[0]?.message?.content;

      if (!insightText) {
        console.warn('OpenRouter returned an empty response — serving fallback.');
        return getFallbackInsight(investorType, assets, currentPrices);
      }

      const result = insightText.trim();
      insightCache.set(cacheKey, { insight: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    } 
    catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const retryAfter: number = error.response.data?.error?.metadata?.retry_after_seconds ?? 60;
        rateLimitCooldownUntil = Date.now() + (retryAfter + 5) * 1000;
        console.warn(`OpenRouter rate-limited. Cooling down for ${retryAfter + 5}s.`);
      } else {
        const message = axios.isAxiosError(error)
          ? `${error.response?.status} — ${JSON.stringify(error.response?.data)}`
          : String(error);
        console.warn(`OpenRouter API failed (${message}), serving backup AI insight.`);
      }
      return getFallbackInsight(investorType, assets, currentPrices);
    }
}