// Internal CoinGecko response shape (used inside service layer only)
export interface CryptoPriceInfo {
    price: number;
    change24h: number;
    sparkline: number[];
}

export type CryptoPricesResponse = Record<string, CryptoPriceInfo>;

// ─── API Contract Types (must match frontend expectations) ─────────────────────

/** Shape returned by GET /api/dashboard/prices  */
export interface CoinPriceToken {
    id: string;
    name: string;
    symbol: string;
    currentPrice: number;
    priceChange24h: number;
}

/** Shape returned by GET /api/dashboard/insight */
export interface AiInsightResponse {
    id: string;
    insight: string;
}

/** Shape returned by GET /api/dashboard/meme */
export interface CryptoMemeResponse {
    id: string;
    imageUrl: string;
    caption?: string;
}

// ─── External API Raw Types ────────────────────────────────────────────────────

export interface CryptoNewsItem {
    id: string;
    title: string;
    url: string;
    publishedAt: string;
    source: string;
}

export interface CryptoPanicRawPost {
    id: number | string;
    title: string;
    url: string;
    created_at: string;
    source?: {
      title?: string;
    };
}
