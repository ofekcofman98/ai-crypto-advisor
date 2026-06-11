import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../utils/api';

export interface VotePayload {
    sectionType: 'NEWS' | 'PRICE' | 'AI_INSIGHT' | 'MEME'; 
    contentId: string; 
    vote: 'UP' | 'DOWN'; 
}

export interface HistoricVote extends VotePayload {
  id?: string;
  userId?: string;
}

export function useDashboardSection(endpoint: string, queryKey: string) {
    return useQuery({
        queryKey: [queryKey],
        queryFn: async () => {
        const response = await api.get(endpoint);
        return response.data;
        },
        staleTime: 1000 * 60 * 2, 
    });
}

export function useSubmitFeedback() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: async (payload: VotePayload) => {
        const response = await api.post('/feedback', payload);
        return response.data;
      },
      onMutate: async (newVote) => {
        await queryClient.cancelQueries({ queryKey: ['my-votes'] });
  
        const previousVotes = queryClient.getQueryData<HistoricVote[]>(['my-votes']);
  
        queryClient.setQueryData<HistoricVote[]>(['my-votes'], (old) => {
          const existingVotes = old || [];
          const filtered = existingVotes.filter(
            (v: HistoricVote) => !(v.sectionType === newVote.sectionType && v.contentId === newVote.contentId)
          );
          return [...filtered, newVote];
        });

        toast.success('Feedback registered');
        
        return { previousVotes };
      },
      onError: (_err, _newVote, context) => {
        if (context?.previousVotes) {
          queryClient.setQueryData(['my-votes'], context.previousVotes);
        }

        toast.error('Failed to sync feedback with server.');
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['my-votes'] });
      },
    });
}

export function useUserVotes() {
    return useQuery<HistoricVote[]>({
      queryKey: ['my-votes'],
      queryFn: async () => {
        const response = await api.get('/feedback/my-votes');
        return response.data;
      },
    });
}