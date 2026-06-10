import { generateCryptoInsight } from './ai.service';
import { getCryptoPrices } from './dashboard.service';

export async function getCryptoInsight(assets: string[]): Promise<string> {
  const prices = await getCryptoPrices(assets);
  return generateCryptoInsight(assets, prices);
}