import { InvestorType, ContentType } from '@prisma/client';

export interface OnboardingDTO {
    cryptoAssets: string[];
    investorType: InvestorType;
    contentTypes: ContentType[];
  }