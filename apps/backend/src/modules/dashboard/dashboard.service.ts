import axios from 'axios';
import { MOCK_PRICES, MOCK_NEWS, MOCK_MEMES } from './dashboard.mock';
import { CryptoPricesResponse, CryptoNewsItem, CryptoMemeItem, CryptoPanicRawPost } from './dashboard.types';

export async function getCryptoPrices(assets: string[]): Promise<CryptoPricesResponse> {
    if (!assets || assets.length === 0) return {};
    
    try {
      const idsMap: Record<string, string> = 
      { 
        BTC: 'bitcoin', 
        ETH: 'ethereum', 
        SOL: 'solana',
        XRP: 'ripple',
        ADA: 'cardano',
        DOGE: 'dogecoin',
      }; // TODO: To shared enum

      const selectedIds = assets.map(a => idsMap[a]).filter(Boolean).join(',');
  
      if (!selectedIds) return MOCK_PRICES;
  
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids: selectedIds,
          vs_currencies: 'usd',
          include_24hr_change: 'true',
        },
        timeout: 5000,
      });

      const result: CryptoPricesResponse = {};  

      assets.forEach(asset => {
        const id = idsMap[asset];
        if (response.data[id]) {
            result[asset] = {
              price: response.data[id].usd,
              change24h: response.data[id].usd_24h_change || 0,
              sparkline: MOCK_PRICES[asset as keyof typeof MOCK_PRICES]?.sparkline || [0, 0, 0, 0]
            };
        } else {
            result[asset] = MOCK_PRICES[asset as keyof typeof MOCK_PRICES];
        }
    });
    return result;
  } catch (error) {
    console.warn('CoinGecko API failed, serving backup fallback prices.');
    const fallbackResult: CryptoPricesResponse = {};
    assets.forEach(asset => {
      fallbackResult[asset] = MOCK_PRICES[asset as keyof typeof MOCK_PRICES] || { price: 0, change24h: 0, sparkline: [] };
    });
    return fallbackResult;
  }
}

export async function getCryptoNews(): Promise<CryptoNewsItem[]> {
    const apiKey = process.env.CRYPTOPANIC_API_KEY;
    
    if (!apiKey) {
      return MOCK_NEWS;
    }
  
    try {
      const response = await axios.get(`https://cryptopanic.com/api/v1/posts/`, {
        params: {
          auth_token: apiKey,
          filter: 'hot',
          kind: 'news',
          public: 'true'
        },
        timeout: 5000
      });
  
      return (response.data.results || []).slice(0, 5).map((post: CryptoPanicRawPost) => ({
        id: String(post.id),
        title: post.title,
        url: post.url,
        publishedAt: post.created_at,
        source: post.source?.title || 'CryptoPanic'
      }));
    } catch (error) {
      console.warn('CryptoPanic API failed, serving backup news data.');
      return MOCK_NEWS;
    }
  }


  export async function getCryptoMemes(): Promise<CryptoMemeItem[]> {
    return MOCK_MEMES;
  }