export const ASSET_OPTIONS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA'] as const;

export interface InvestorType {
  id: string;
  name: string;
  desc: string;
}

export interface ContentOption {
  id: string;
  name: string;
}

export const INVESTOR_TYPES: InvestorType[] = [
  { id: 'HODLER',        name: 'HODLer',        desc: 'Long-term believer, strong hands' },
  { id: 'DAY_TRADER',    name: 'Day Trader',     desc: 'Fast-paced market scalper' },
  { id: 'NFT_COLLECTOR', name: 'NFT Collector',  desc: 'Digital art & culture enthusiast' },
];

export const CONTENT_OPTIONS: ContentOption[] = [
  { id: 'MARKET_NEWS', name: 'Market News' },
  { id: 'CHARTS',      name: 'Technical Charts' },
  { id: 'SOCIAL',      name: 'Social Sentiments' },
  { id: 'FUN',         name: 'Memes & Fun' },
];
