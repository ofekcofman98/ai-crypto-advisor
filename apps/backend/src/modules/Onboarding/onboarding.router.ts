import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { onboardingSchema } from './onboarding.schema';
import { prisma } from '../../shared/database/prismaClient';

const router = Router();

router.use(authMiddleware);

router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const data = onboardingSchema.parse(req.body);

  const updatedPreference = await prisma.preference.update({
    where: { userId },
    data: {
      cryptoAssets: data.cryptoAssets,
      investorType: data.investorType,
      contentTypes: data.contentTypes,
      user: {
        update: {
          hasCompletedOnboarding: true,
        },
      },
    },
  });

  res.status(200).json({ preference: updatedPreference });
}));

export default router;
