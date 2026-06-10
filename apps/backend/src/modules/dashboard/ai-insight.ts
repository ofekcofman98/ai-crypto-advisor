import { generateCryptoInsight } from './ai.service';
import { getCryptoPrices } from './dashboard.service';

export async function getCryptoInsight(
  investorType: string,
  assets: string[],
): Promise<string> {
  const prices = await getCryptoPrices(assets);
  return generateCryptoInsight(investorType, assets, prices);
}
