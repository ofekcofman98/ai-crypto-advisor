import { z } from 'zod';
import { VoteType, SectionType } from '@prisma/client';

export const voteSchema = z.object({
    contentId: z.string().trim().min(1, { message: 'Content ID is required.' }),
    
    sectionType: z.nativeEnum(SectionType, {
      message: 'Invalid section type. Must be NEWS, PRICE, AI_INSIGHT, or MEME.',
    }),
    
    vote: z.nativeEnum(VoteType, {
      message: 'Vote must be either UP or DOWN.',
    }),
  
    contentSnippet: z.string().default('No snippet provided'), 
  });