export interface CryptoPriceInfo {
    price: number;
    change24h: number;
    sparkline: number[];
}

export type CryptoPricesResponse = Record<string, CryptoPriceInfo>;

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

export interface CryptoMemeItem {
    id: string;
    title: string;
    imageUrl: string;
    upvotes: number;
    downvotes: number;
}