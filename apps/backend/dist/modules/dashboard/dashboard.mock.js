"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_INSIGHT = exports.MOCK_NEWS = exports.MOCK_COIN_PRICES = exports.MOCK_PRICE_MAP = void 0;
exports.getDailyMeme = getDailyMeme;
// ─── Internal price map (used by service to build CoinPriceToken[]) ───────────
exports.MOCK_PRICE_MAP = {
    BTC: { price: 68420.50, change24h: 3.45, sparkline: [67100, 67400, 67900, 68420] },
    ETH: { price: 3750.20, change24h: -1.20, sparkline: [3810, 3790, 3760, 3750] },
    SOL: { price: 165.80, change24h: 8.12, sparkline: [152, 155, 160, 165] },
    XRP: { price: 0.62, change24h: -0.45, sparkline: [0.63, 0.63, 0.62, 0.62] },
    ADA: { price: 0.45, change24h: 1.10, sparkline: [0.44, 0.44, 0.45, 0.45] },
    DOGE: { price: 0.17, change24h: 2.30, sparkline: [0.16, 0.16, 0.17, 0.17] },
};
const COIN_NAMES = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    SOL: 'Solana',
    XRP: 'Ripple',
    ADA: 'Cardano',
    DOGE: 'Dogecoin',
};
/** Pre-built fallback for /prices when CoinGecko is unreachable */
exports.MOCK_COIN_PRICES = Object.entries(exports.MOCK_PRICE_MAP).map(([symbol, data]) => ({
    id: symbol.toLowerCase(),
    name: COIN_NAMES[symbol] ?? symbol,
    symbol,
    currentPrice: data.price,
    priceChange24h: data.change24h,
}));
// ─── News fallback ─────────────────────────────────────────────────────────────
exports.MOCK_NEWS = [
    {
        id: 'mock-1',
        title: 'Bitcoin Institutional Inflows Hit Record Highs as Market Rallies',
        url: 'https://cryptopanic.com',
        publishedAt: new Date().toISOString(),
        source: 'CryptoNews',
    },
    {
        id: 'mock-2',
        title: 'Ethereum Developers Confirm Next Major Network Upgrade Timeline',
        url: 'https://cryptopanic.com',
        publishedAt: new Date().toISOString(),
        source: 'EtherFocus',
    },
];
// ─── AI Insight fallback ───────────────────────────────────────────────────────
exports.MOCK_INSIGHT = {
    id: 'daily-insight',
    insight: 'BTC has broken through its 30-day resistance at $67k with strong institutional backing — momentum favors continuation. ETH is consolidating ahead of the next protocol upgrade; accumulation at current levels is historically rewarding. Maintain diversified exposure and avoid over-leveraging during this high-volatility window.',
};
// ─── Meme fallback (single object, rotated by date) ──────────────────────────
const MOCK_MEME_POOL = [
    {
        id: 'meme-1',
        imageUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=500&auto=format&fit=crop',
        caption: 'Buying the Dip vs The Dip Keeps Dipping',
    },
    {
        id: 'meme-2',
        imageUrl: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?q=80&w=500&auto=format&fit=crop',
        caption: 'Me explaining Crypto to my family during dinner',
    },
    {
        id: 'meme-3',
        imageUrl: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?q=80&w=500&auto=format&fit=crop',
        caption: 'Checking portfolio every 45 seconds expecting changes',
    },
];
/** Returns a deterministic daily meme from the pool */
function getDailyMeme() {
    const dayIndex = Math.floor(Date.now() / 86_400_000) % MOCK_MEME_POOL.length;
    return MOCK_MEME_POOL[dayIndex];
}
