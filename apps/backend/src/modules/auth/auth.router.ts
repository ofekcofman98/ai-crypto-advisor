import { Router, Request, Response } from 'express';
import { registerSchema, loginSchema } from './auth.schema';
import { registerUser, loginUser } from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.post('/register', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validatedData = registerSchema.parse(req.body);
  
  const result = await registerUser(validatedData);
  
  res.status(201).json(result);
}));

router.post('/login', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const validatedData = loginSchema.parse(req.body);
  
  const result = await loginUser(validatedData);
  
  res.status(200).json(result);
}));

export default router;