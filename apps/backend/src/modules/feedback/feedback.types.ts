import { SectionType, VoteType } from '@prisma/client';

export interface VoteDTO {
    contentId: string;
    sectionType: SectionType;
    vote: VoteType;
    contentSnippet?: string;
}
