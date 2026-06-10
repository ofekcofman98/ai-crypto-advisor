import axios from 'axios';
import { generateCryptoInsight } from './ai.service';
import { MOCK_PRICE_MAP, MOCK_COIN_PRICES, MOCK_NEWS, MOCK_INSIGHT, getDailyMeme } from './dashboard.mock';
import {
  CoinPriceToken,
  CryptoNewsItem,
  CryptoMemeResponse,
  AiInsightResponse,
  CryptoPanicRawPost,
} from './dashboard.types';

const COINGECKO_IDS: Record<string, string> = {
  BTC:  'bitcoin',
  ETH:  'ethereum',
  SOL:  'solana',
  XRP:  'ripple',
  ADA:  'cardano',
  DOGE: 'dogecoin',
};

const COIN_NAMES: Record<string, string> = {
  BTC:  'Bitcoin',
  ETH:  'Ethereum',
  SOL:  'Solana',
  XRP:  'Ripple',
  ADA:  'Cardano',
  DOGE: 'Dogecoin',
};

export async function getCryptoPrices(assets: string[]): Promise<CoinPriceToken[]> {
  if (!assets || assets.length === 0) return MOCK_COIN_PRICES;

  const selectedIds = assets.map(a => COINGECKO_IDS[a]).filter(Boolean).join(',');
  if (!selectedIds) return MOCK_COIN_PRICES;

  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: selectedIds,
        vs_currencies: 'usd',
        include_24hr_change: 'true',
      },
      timeout: 5000,
    });

    return assets
      .filter(a => COINGECKO_IDS[a])
      .map(symbol => {
        const geckoId = COINGECKO_IDS[symbol];
        const live    = response.data[geckoId];
        const mock    = MOCK_PRICE_MAP[symbol as keyof typeof MOCK_PRICE_MAP];

        return {
          id:            geckoId,
          name:          COIN_NAMES[symbol] ?? symbol,
          symbol,
          currentPrice:  live?.usd          ?? mock?.price    ?? 0,
          priceChange24h: live?.usd_24h_change ?? mock?.change24h ?? 0,
        };
      });
  } catch {
    console.warn('[dashboard.service] CoinGecko failed — serving mock prices.');
    return assets
      .filter(a => MOCK_PRICE_MAP[a as keyof typeof MOCK_PRICE_MAP])
      .map(symbol => {
        const mock = MOCK_PRICE_MAP[symbol as keyof typeof MOCK_PRICE_MAP];
        return {
          id:            COINGECKO_IDS[symbol] ?? symbol.toLowerCase(),
          name:          COIN_NAMES[symbol]    ?? symbol,
          symbol,
          currentPrice:  mock.price,
          priceChange24h: mock.change24h,
        };
      });
  }
}

export async function getCryptoNews(): Promise<CryptoNewsItem[]> {
  const apiKey = process.env.CRYPTOPANIC_API_KEY;

  if (!apiKey) return MOCK_NEWS;

  try {
    const response = await axios.get('https://cryptopanic.com/api/v1/posts/', {
      params: { auth_token: apiKey, filter: 'hot', kind: 'news', public: 'true' },
      timeout: 5000,
    });

    return (response.data.results || []).slice(0, 5).map((post: CryptoPanicRawPost) => ({
      id:          String(post.id),
      title:       post.title,
      url:         post.url,
      publishedAt: post.created_at,
      source:      post.source?.title ?? 'CryptoPanic',
    }));
  } catch {
    console.warn('[dashboard.service] CryptoPanic failed — serving mock news.');
    return MOCK_NEWS;
  }
}

export async function getAiInsight(
  investorType: string,
  assets: string[],
): Promise<AiInsightResponse> {
  try {
    const prices  = await getCryptoPrices(assets);
    const insight = await generateCryptoInsight(investorType, assets, prices);
    return { id: 'daily-insight', insight };
  } catch {
    console.warn('[dashboard.service] AI insight generation failed — serving mock insight.');
    return MOCK_INSIGHT;
  }
}

export async function getDailyMemeFallback(): Promise<CryptoMemeResponse> {
  return getDailyMeme();
}
