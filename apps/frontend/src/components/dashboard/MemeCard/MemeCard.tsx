import { Laugh } from 'lucide-react';
import { useDashboardSection } from '../../../hooks/useDashboard';
import VotingButtons from '../../VotingButtons';
import Card from '../Card';

export default function MemeCard() {
  const { data, isLoading, error } = useDashboardSection('/dashboard/meme', 'meme');

  return (
    <Card
      title="Crypto Meme Matrix"
      icon={<Laugh className="w-5 h-5 text-warning" />}
      isLoading={isLoading}
      isError={!!error || !data || typeof data.imageUrl !== 'string'}
      errorFallbackMessage="Could not fetch todays meme. Static backup loaded."
      hoverAccentColor="warning"
    >
      <div className="bg-void rounded-xl border border-border/50 p-2 flex items-center justify-center h-[140px] overflow-hidden">
        {data?.imageUrl && (
          <img
            src={data.imageUrl}
            alt={data.caption || 'Crypto Meme'}
            className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        )}
      </div>
      <VotingButtons sectionType="MEME" contentId={data?.id || 'daily-meme'} />
    </Card>  
    );
}
