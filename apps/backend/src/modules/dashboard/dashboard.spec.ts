jest.mock('../../shared/database/prismaClient');
jest.mock('./dashboard.service');

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { prisma } from '../../shared/database/prismaClient';
import {
  getCryptoPrices,
  getCryptoNews,
  getAiInsight,
  getDailyMemeFallback,
} from './dashboard.service';
import { MOCK_NEWS, MOCK_INSIGHT, getDailyMeme } from './dashboard.mock';
import type { DeepMockProxy } from 'jest-mock-extended';
import { InvestorType, ContentType, type PrismaClient } from '@prisma/client';
import type { CoinPriceToken, CryptoNewsItem, AiInsightResponse, CryptoMemeResponse } from './dashboard.types';

const JWT_SECRET = 'fallback_secret_key';
const mockUserId = 'user-uuid-dashboard';

const validToken = jwt.sign(
  { userId: mockUserId, email: 'dashboard@moveo.ai' },
  JWT_SECRET,
  { expiresIn: '1h' },
);

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const mockGetCryptoPrices   = jest.mocked(getCryptoPrices);
const mockGetCryptoNews     = jest.mocked(getCryptoNews);
const mockGetAiInsight      = jest.mocked(getAiInsight);
const mockGetDailyMemeFallback = jest.mocked(getDailyMemeFallback);

// ─── Live payloads (simulates what real external APIs return) ─────────────────

const livePrices: CoinPriceToken[] = [
  { id: 'bitcoin',  name: 'Bitcoin',  symbol: 'BTC', currentPrice: 70000, priceChange24h:  2.5 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', currentPrice:  3800, priceChange24h: -1.2 },
];

const liveNews: CryptoNewsItem[] = [
  {
    id: 'live-1',
    title: 'BTC Hits New ATH',
    url: 'https://example.com/btc-ath',
    publishedAt: new Date().toISOString(),
    source: 'CoinDesk',
  },
];

const liveInsight: AiInsightResponse = {
  id: 'daily-insight',
  insight: 'Bullish across major caps — BTC holding key support at 68k.',
};

const liveMeme: CryptoMemeResponse = {
  id: 'meme-live',
  imageUrl: 'https://example.com/meme.jpg',
  caption: 'When you HODL through the dip',
};

const mockPreference = {
  id: 'pref-uuid-dash',
  userId: mockUserId,
  cryptoAssets: ['BTC', 'ETH'],
  investorType: InvestorType.HODLER,
  contentTypes: [ContentType.MARKET_NEWS],
  updatedAt: new Date(),
};

// ─────────────────────────────────────────────────────────────────────────────

describe('Dashboard Module Integration Tests', () => {
  describe('GET /api/dashboard/prices', () => {
    it('Happy Path: should return live prices using assets from user preferences', async () => {
      prismaMock.preference.findUnique.mockResolvedValue(mockPreference as never);
      mockGetCryptoPrices.mockResolvedValue(livePrices);

      const response = await request(app)
        .get('/api/dashboard/prices')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(livePrices);
      expect(mockGetCryptoPrices).toHaveBeenCalledWith(['BTC', 'ETH']);
    });

    it('Resiliency Path: should fall back to default assets when DB is unreachable', async () => {
      prismaMock.preference.findUnique.mockRejectedValue(new Error('DB connection lost'));
      mockGetCryptoPrices.mockResolvedValue(livePrices);

      const response = await request(app)
        .get('/api/dashboard/prices')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(mockGetCryptoPrices).toHaveBeenCalledWith(['BTC', 'ETH']);
    });
  });

  describe('GET /api/dashboard/news', () => {
    it('Happy Path: should return live news from the news service', async () => {
      mockGetCryptoNews.mockResolvedValue(liveNews);

      const response = await request(app)
        .get('/api/dashboard/news')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(liveNews);
    });

    it('Resiliency Path: should serve MOCK_NEWS with 200 when the news service throws', async () => {
      mockGetCryptoNews.mockRejectedValue(new Error('CryptoPanic API unreachable'));

      const response = await request(app)
        .get('/api/dashboard/news')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(MOCK_NEWS);
    });
  });

  describe('GET /api/dashboard/insight', () => {
    it('Happy Path: should return live AI insight using assets from user preferences', async () => {
      prismaMock.preference.findUnique.mockResolvedValue(mockPreference as never);
      mockGetAiInsight.mockResolvedValue(liveInsight);

      const response = await request(app)
        .get('/api/dashboard/insight')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(liveInsight);
      expect(mockGetAiInsight).toHaveBeenCalledWith('HODLER', ['BTC', 'ETH']);
    });

    it('Resiliency Path: should serve MOCK_INSIGHT with 200 when the AI service throws', async () => {
      prismaMock.preference.findUnique.mockResolvedValue(mockPreference as never);
      mockGetAiInsight.mockRejectedValue(new Error('OpenAI quota exceeded'));

      const response = await request(app)
        .get('/api/dashboard/insight')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(MOCK_INSIGHT);
    });
  });

  describe('GET /api/dashboard/meme', () => {
    it('Happy Path: should return the live meme from the meme service', async () => {
      mockGetDailyMemeFallback.mockResolvedValue(liveMeme);

      const response = await request(app)
        .get('/api/dashboard/meme')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(liveMeme);
    });

    it('Resiliency Path: should serve the static daily meme with 200 when the meme service throws', async () => {
      mockGetDailyMemeFallback.mockRejectedValue(new Error('Meme API unavailable'));

      const response = await request(app)
        .get('/api/dashboard/meme')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(getDailyMeme());
    });
  });

  describe('Authentication guard', () => {
    it('should return 401 on all dashboard routes when the token is missing', async () => {
      const routes = ['/api/dashboard/prices', '/api/dashboard/news', '/api/dashboard/insight', '/api/dashboard/meme'];

      for (const route of routes) {
        const response = await request(app).get(route);
        expect(response.status).toBe(401);
      }
    });
  });
});
