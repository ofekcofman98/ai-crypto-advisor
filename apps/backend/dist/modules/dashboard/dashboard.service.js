"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCryptoPrices = getCryptoPrices;
exports.getCryptoNews = getCryptoNews;
exports.getAiInsight = getAiInsight;
exports.getDailyMemeFallback = getDailyMemeFallback;
const axios_1 = __importDefault(require("axios"));
const ai_service_1 = require("./ai.service");
const dashboard_mock_1 = require("./dashboard.mock");
const dashboard_constants_1 = require("./dashboard.constants");
const coinGeckoClient = axios_1.default.create({
    baseURL: 'https://api.coingecko.com/api/v3',
    timeout: 5000,
});
const cryptoPanicClient = axios_1.default.create({
    baseURL: 'https://cryptopanic.com/api/v1',
    timeout: 5000,
});
async function getCryptoPrices(assets) {
    if (!assets || assets.length === 0)
        return dashboard_mock_1.MOCK_COIN_PRICES;
    const selectedIds = assets.map(a => dashboard_constants_1.COINGECKO_IDS[a]).filter(Boolean).join(',');
    if (!selectedIds)
        return dashboard_mock_1.MOCK_COIN_PRICES;
    try {
        const response = await coinGeckoClient.get('/simple/price', {
            params: {
                ids: selectedIds,
                vs_currencies: 'usd',
                include_24hr_change: 'true',
            },
            timeout: 5000,
        });
        return assets
            .filter(a => dashboard_constants_1.COINGECKO_IDS[a])
            .map(symbol => {
            const geckoId = dashboard_constants_1.COINGECKO_IDS[symbol];
            const live = response.data[geckoId];
            const mock = dashboard_mock_1.MOCK_PRICE_MAP[symbol];
            return {
                id: geckoId,
                name: dashboard_constants_1.COIN_NAMES[symbol] ?? symbol,
                symbol,
                currentPrice: live?.usd ?? mock?.price ?? 0,
                priceChange24h: live?.usd_24h_change ?? mock?.change24h ?? 0,
                isFallback: false,
            };
        });
    }
    catch {
        console.warn('[dashboard.service] CoinGecko failed — serving mock prices.');
        return assets
            .filter(a => dashboard_mock_1.MOCK_PRICE_MAP[a])
            .map(symbol => {
            const mock = dashboard_mock_1.MOCK_PRICE_MAP[symbol];
            return {
                id: dashboard_constants_1.COINGECKO_IDS[symbol] ?? symbol.toLowerCase(),
                name: dashboard_constants_1.COIN_NAMES[symbol] ?? symbol,
                symbol,
                currentPrice: mock.price,
                priceChange24h: mock.change24h,
                isFallback: true,
            };
        });
    }
}
async function getCryptoNews() {
    const apiKey = process.env.CRYPTOPANIC_API_KEY;
    if (!apiKey)
        return dashboard_mock_1.MOCK_NEWS;
    try {
        const response = await cryptoPanicClient.get('/posts/', {
            params: { auth_token: apiKey, filter: 'hot', kind: 'news', public: 'true' },
            timeout: 5000,
        });
        return (response.data.results || []).slice(0, 5).map((post) => ({
            id: String(post.id),
            title: post.title,
            url: post.url,
            publishedAt: post.created_at,
            source: post.source?.title ?? 'CryptoPanic',
        }));
    }
    catch {
        console.warn('[dashboard.service] CryptoPanic failed — serving mock news.');
        return dashboard_mock_1.MOCK_NEWS;
    }
}
async function getAiInsight(investorType, assets) {
    try {
        const prices = await getCryptoPrices(assets);
        const insight = await (0, ai_service_1.generateCryptoInsight)(investorType, assets, prices);
        return { id: 'daily-insight', insight };
    }
    catch {
        console.warn('[dashboard.service] AI insight generation failed — serving mock insight.');
        return dashboard_mock_1.MOCK_INSIGHT;
    }
}
async function getDailyMemeFallback() {
    return (0, dashboard_mock_1.getDailyMeme)();
}
