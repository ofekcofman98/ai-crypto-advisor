"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../../shared/database/prismaClient');
jest.mock('./dashboard.service');
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = __importDefault(require("../../app"));
const prismaClient_1 = require("../../shared/database/prismaClient");
const dashboard_service_1 = require("./dashboard.service");
const dashboard_mock_1 = require("./dashboard.mock");
const client_1 = require("@prisma/client");
const JWT_SECRET = 'fallback_secret_key';
const mockUserId = 'user-uuid-dashboard';
const validToken = jsonwebtoken_1.default.sign({ userId: mockUserId, email: 'dashboard@moveo.ai' }, JWT_SECRET, { expiresIn: '1h' });
const prismaMock = prismaClient_1.prisma;
const mockGetCryptoPrices = jest.mocked(dashboard_service_1.getCryptoPrices);
const mockGetCryptoNews = jest.mocked(dashboard_service_1.getCryptoNews);
const mockGetAiInsight = jest.mocked(dashboard_service_1.getAiInsight);
const mockGetDailyMemeFallback = jest.mocked(dashboard_service_1.getDailyMemeFallback);
// ─── Live payloads (simulates what real external APIs return) ─────────────────
const livePrices = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', currentPrice: 70000, priceChange24h: 2.5 },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', currentPrice: 3800, priceChange24h: -1.2 },
];
const liveNews = [
    {
        id: 'live-1',
        title: 'BTC Hits New ATH',
        url: 'https://example.com/btc-ath',
        publishedAt: new Date().toISOString(),
        source: 'CoinDesk',
    },
];
const liveInsight = {
    id: 'daily-insight',
    insight: 'Bullish across major caps — BTC holding key support at 68k.',
};
const liveMeme = {
    id: 'meme-live',
    imageUrl: 'https://example.com/meme.jpg',
    caption: 'When you HODL through the dip',
};
const mockPreference = {
    id: 'pref-uuid-dash',
    userId: mockUserId,
    cryptoAssets: ['BTC', 'ETH'],
    investorType: client_1.InvestorType.HODLER,
    contentTypes: [client_1.ContentType.MARKET_NEWS],
    updatedAt: new Date(),
};
// ─────────────────────────────────────────────────────────────────────────────
describe('Dashboard Module Integration Tests', () => {
    describe('GET /api/dashboard/prices', () => {
        it('Happy Path: should return live prices using assets from user preferences', async () => {
            prismaMock.preference.findUnique.mockResolvedValue(mockPreference);
            mockGetCryptoPrices.mockResolvedValue(livePrices);
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard/prices')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(livePrices);
            expect(mockGetCryptoPrices).toHaveBeenCalledWith(['BTC', 'ETH']);
        });
        it('Resiliency Path: should fall back to default assets when DB is unreachable', async () => {
            prismaMock.preference.findUnique.mockRejectedValue(new Error('DB connection lost'));
            mockGetCryptoPrices.mockResolvedValue(livePrices);
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard/prices')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(mockGetCryptoPrices).toHaveBeenCalledWith(['BTC', 'ETH']);
        });
    });
    describe('GET /api/dashboard/news', () => {
        it('Happy Path: should return live news from the news service', async () => {
            mockGetCryptoNews.mockResolvedValue(liveNews);
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard/news')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(liveNews);
        });
        it('Resiliency Path: should serve MOCK_NEWS with 200 when the news service throws', async () => {
            mockGetCryptoNews.mockRejectedValue(new Error('CryptoPanic API unreachable'));
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard/news')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(dashboard_mock_1.MOCK_NEWS);
        });
    });
    describe('GET /api/dashboard/insight', () => {
        it('Happy Path: should return live AI insight using assets from user preferences', async () => {
            prismaMock.preference.findUnique.mockResolvedValue(mockPreference);
            mockGetAiInsight.mockResolvedValue(liveInsight);
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard/insight')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(liveInsight);
            expect(mockGetAiInsight).toHaveBeenCalledWith('HODLER', ['BTC', 'ETH']);
        });
        it('Resiliency Path: should serve MOCK_INSIGHT with 200 when the AI service throws', async () => {
            prismaMock.preference.findUnique.mockResolvedValue(mockPreference);
            mockGetAiInsight.mockRejectedValue(new Error('OpenAI quota exceeded'));
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard/insight')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(dashboard_mock_1.MOCK_INSIGHT);
        });
    });
    describe('GET /api/dashboard/meme', () => {
        it('Happy Path: should return the live meme from the meme service', async () => {
            mockGetDailyMemeFallback.mockResolvedValue(liveMeme);
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard/meme')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual(liveMeme);
        });
        it('Resiliency Path: should serve the static daily meme with 200 when the meme service throws', async () => {
            mockGetDailyMemeFallback.mockRejectedValue(new Error('Meme API unavailable'));
            const response = await (0, supertest_1.default)(app_1.default)
                .get('/api/dashboard/meme')
                .set('Authorization', `Bearer ${validToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toEqual((0, dashboard_mock_1.getDailyMeme)());
        });
    });
    describe('Authentication guard', () => {
        it('should return 401 on all dashboard routes when the token is missing', async () => {
            const routes = ['/api/dashboard/prices', '/api/dashboard/news', '/api/dashboard/insight', '/api/dashboard/meme'];
            for (const route of routes) {
                const response = await (0, supertest_1.default)(app_1.default).get(route);
                expect(response.status).toBe(401);
            }
        });
    });
});
