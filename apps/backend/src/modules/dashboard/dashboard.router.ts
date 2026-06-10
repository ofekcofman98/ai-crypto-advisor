import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { prisma } from '../../shared/database/prismaClient';
import { getCryptoPrices, getCryptoNews, getAiInsight, getDailyMemeFallback } from './dashboard.service';
import { MOCK_COIN_PRICES, MOCK_NEWS, MOCK_INSIGHT, getDailyMeme } from './dashboard.mock';

const router = Router();

router.use(authMiddleware);

// ─── GET /api/dashboard/prices ─────────────────────────────────────────────────

router.get('/prices', asyncHandler(async (req: Request, res: Response) => {
  let assetsToFetch: string[] = ['BTC', 'ETH'];

  try {
    const prefs = await prisma.preference.findUnique({ where: { userId: req.user!.id } });
    if (prefs?.cryptoAssets?.length) {
      assetsToFetch = prefs.cryptoAssets;
    }
  } catch {
    console.warn('[dashboard.router] DB unreachable for preferences — using default assets.');
  }

  const prices = await getCryptoPrices(assetsToFetch);
  res.status(200).json(prices);
}));

// ─── GET /api/dashboard/news ───────────────────────────────────────────────────

router.get('/news', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const news = await getCryptoNews();
    res.status(200).json(news);
  } catch {
    res.status(200).json(MOCK_NEWS);
  }
}));

// ─── GET /api/dashboard/insight ───────────────────────────────────────────────

router.get('/insight', asyncHandler(async (req: Request, res: Response) => {
  let investorType = 'HODLER';
  let assets: string[] = ['BTC', 'ETH'];

  try {
    const prefs = await prisma.preference.findUnique({ where: { userId: req.user!.id } });
    if (prefs?.investorType) investorType = prefs.investorType;
    if (prefs?.cryptoAssets?.length) assets = prefs.cryptoAssets;
  } catch {
    console.warn('[dashboard.router] DB unreachable for preferences — using defaults for insight.');
  }

  try {
    const insight = await getAiInsight(investorType, assets);
    res.status(200).json(insight);
  } catch {
    res.status(200).json(MOCK_INSIGHT);
  }
}));

// ─── GET /api/dashboard/meme ──────────────────────────────────────────────────

router.get('/meme', asyncHandler(async (_req: Request, res: Response) => {
  try {
    const meme = await getDailyMemeFallback();
    res.status(200).json(meme);
  } catch {
    res.status(200).json(getDailyMeme());
  }
}));

export default router;
