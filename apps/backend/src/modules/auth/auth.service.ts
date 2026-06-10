import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/database/prismaClient';
import type { RegisterDTO, LoginDTO } from './auth.types';
import { AppError } from '../../shared/errors/AppError';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_secret_key';
const BCRYPT_SALT_ROUNDS = 10;

export async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email }
  });
}

export async function registerUser(data: RegisterDTO) {
  const existingUser = await findUserByEmail(data.email);
  if (existingUser) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

  const newUser = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: hashedPassword,
      hasCompletedOnboarding: false,
      preference: {
        create: {
          cryptoAssets: [],
          contentTypes: [],
        },
      },
    },
  });

  const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });

  return {
    accessToken: token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      hasCompletedOnboarding: newUser.hasCompletedOnboarding,
    },
  };
}

export async function loginUser(data: LoginDTO) {
  const user = await findUserByEmail(data.email);
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

  return {
    accessToken: token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    },
  };
}