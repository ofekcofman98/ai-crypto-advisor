import { prisma } from '../../shared/database/prismaClient';
import type { OnboardingDTO } from './onboarding.types';

export async function saveUserOnboarding(userId: string, data: OnboardingDTO) {
  return await prisma.preference.update({
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
}