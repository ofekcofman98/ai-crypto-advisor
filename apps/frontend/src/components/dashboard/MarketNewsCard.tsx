import { Newspaper, ExternalLink, Loader2 } from 'lucide-react';
import { useDashboardSection } from '../../hooks/useDashboard';
import VotingButtons from '../VotingButtons';

export default function MarketNewsCard() {
    const { data, isLoading, error } = useDashboardSection('/dashboard/news', 'news');
  
    if (isLoading) {
      return (
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-text-secondary">Loading curated news...</p>
        </div>
      );
    }
  
    if (error || !data || data.length === 0) {
      return (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center text-sm text-text-secondary h-64 flex flex-col justify-center">
          Market news currently unavailable. Displaying static fallback feed.
        </div>
      );
    }
  
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-primary/40 transition-all duration-300">
        <div>
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            Curated Market News
          </h3>
          <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
            {data.map((item: any, index: number) => (
              <div key={item.id || index} className="p-2.5 bg-void rounded-xl border border-border/50 hover:border-border transition-colors">
                <a
                  href={item.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-text-primary hover:text-primary transition-colors flex items-start justify-between gap-2"
                >
                  <span className="line-clamp-2 leading-snug">{item.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-text-secondary shrink-0 mt-0.5" />
                </a>
                <div className="text-[10px] text-text-secondary mt-1 flex items-center gap-2">
                  <span className="text-primary/80 font-semibold">{item.source?.title || 'Crypto Feed'}</span>
                  <span>•</span>
                  <span>{item.sentiment || 'Neutral'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <VotingButtons sectionType="NEWS" contentId="daily-news-feed" />
      </div>
    );
}