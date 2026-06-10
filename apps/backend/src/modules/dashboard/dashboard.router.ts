import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { prisma } from '../../shared/database/prismaClient';
import { getCryptoPrices, getCryptoNews, getCryptoMemes } from './dashboard.service';

const router = Router();

router.use(authMiddleware);

router.get('/prices', asyncHandler(async (req: Request, res: Response) => {
    const userPreferences = await prisma.preference.findUnique({
      where: { userId: req.user!.id }
    });
  
    const assetsToFetch = userPreferences?.cryptoAssets?.length 
      ? userPreferences.cryptoAssets 
      : ['BTC', 'ETH']; // TODO: dynamic?
  
    const prices = await getCryptoPrices(assetsToFetch);
    res.status(200).json(prices);
  }));

  router.get('/news', asyncHandler(async (req: Request, res: Response) => {
    const news = await getCryptoNews();
    res.status(200).json(news);
  }));


  router.get('/memes', asyncHandler(async (req: Request, res: Response) => {
    const memes = await getCryptoMemes();
    res.status(200).json(memes);
  }));

  export default router;