import { Laugh, Loader2 } from 'lucide-react';
import { useDashboardSection } from '../../hooks/useDashboard';
import VotingButtons from '../VotingButtons';

export default function MemeCard() {
  const { data, isLoading, error } = useDashboardSection('/dashboard/meme', 'meme');

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-warning mb-2" />
        <p className="text-sm text-text-secondary">Loading fresh crypto meme...</p>
      </div>
    );
  }

  if (error || !data || typeof data.imageUrl !== 'string') {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center text-sm text-text-secondary h-64 flex flex-col justify-center">
        Could not fetch todays meme. Static backup loaded.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-warning/40 transition-all duration-300">
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
          <Laugh className="w-5 h-5 text-warning" />
          Crypto Meme Matrix
        </h3>
        <div className="bg-void rounded-xl border border-border/50 p-2 flex items-center justify-center h-[140px] overflow-hidden">
          <img
            src={data.imageUrl}
            alt={data.caption || 'Crypto Meme'}
            className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>
      <VotingButtons sectionType="MEME" contentId={data.id || 'daily-meme'} />
    </div>
  );
}