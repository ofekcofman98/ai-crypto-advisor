import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { voteSchema } from './feedback.schema';
import { registerFeedback, getUserVotes } from './feedback.service';

const router = Router();

router.use(authMiddleware);

// ─── POST /api/feedback ────────────────────────────────────────────────────────

router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const data   = voteSchema.parse(req.body);

    const feedback = await registerFeedback(userId, data);

    res.status(200).json({ message: 'Feedback registered successfully.', feedback });
}));

// ─── GET /api/feedback/my-votes ───────────────────────────────────────────────

router.get('/my-votes', asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const votes  = await getUserVotes(userId);
    res.status(200).json(votes);
}));

export default router;
