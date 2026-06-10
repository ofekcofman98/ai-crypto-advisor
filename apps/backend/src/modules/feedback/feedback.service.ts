import { prisma } from '../../shared/database/prismaClient';
import { VoteDTO } from './feedback.types';

export async function registerFeedback(userId: string, data: VoteDTO) {
    return prisma.feedback.upsert({
      where: {
        userId_sectionType_contentId: {
          userId,
          sectionType: data.sectionType,
          contentId: data.contentId,
        },
      },
      update: {
        vote: data.vote,
      },
      create: {
        userId,
        sectionType: data.sectionType,
        contentId: data.contentId,
        contentSnippet: data.contentSnippet || 'No snippet provided',
        vote: data.vote,
      },
    });
  }