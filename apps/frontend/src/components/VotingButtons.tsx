import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useSubmitFeedback, useUserVotes, type VotePayload } from '../hooks/useDashboard';

interface VotingButtonsProps {
    sectionType: VotePayload['sectionType'];
    contentId: string;
}

interface UserVoteItem {
    sectionType: string;
    contentId: string;
    vote: 'UP' | 'DOWN';
  }

export default function VotingButtons({ sectionType, contentId }: VotingButtonsProps) {
    const { data: votes } = useUserVotes();
    const { mutate: submitVote } = useSubmitFeedback();
  
    const currentVote = votes?.find(
      (v: UserVoteItem) => v.sectionType === sectionType && v.contentId === contentId
    )?.vote;
  
    const handleVote = (voteType: 'UP' | 'DOWN') => {
      submitVote({ sectionType, contentId, vote: voteType });
    };
  
    return (
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
        <button
          onClick={() => handleVote('UP')}
          className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-medium ${
            currentVote === 'UP'
              ? 'bg-success/10 border-success text-success'
              : 'border-border bg-void text-text-secondary hover:text-text-primary hover:border-border/80'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Useful</span>
        </button>
  
        <button
          onClick={() => handleVote('DOWN')}
          className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-medium ${
            currentVote === 'DOWN'
              ? 'bg-danger/10 border-danger text-danger'
              : 'border-border bg-void text-text-secondary hover:text-text-primary hover:border-border/80'
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span>Not for me</span>
        </button>
      </div>
    );
}