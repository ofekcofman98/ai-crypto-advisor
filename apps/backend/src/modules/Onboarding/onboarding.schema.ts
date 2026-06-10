import { z } from 'zod';
import { InvestorType, ContentType } from '@prisma/client';

export const onboardingSchema = z.object({
  cryptoAssets: z
    .array(
      z.string()
      .trim()
      .min(1)
      .toUpperCase()
    )
    .min(1, { message: 'Please select at least one crypto asset.' }),

  investorType: z.nativeEnum(InvestorType, {
    message: 'Please select a valid investor type.',
  }),

  contentTypes: z
    .array(z.nativeEnum(ContentType))
    .min(1, { message: 'Please select at least one content type.' }),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
