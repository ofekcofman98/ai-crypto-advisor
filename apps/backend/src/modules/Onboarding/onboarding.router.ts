import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { onboardingSchema } from './onboarding.schema';
import { saveUserOnboarding } from './onboarding.service';

const router = Router();

router.use(authMiddleware);

router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const data = onboardingSchema.parse(req.body);

  const updatedPreference = await saveUserOnboarding(userId, data);

  res.status(200).json({ preference: updatedPreference });
}));

export default router;
