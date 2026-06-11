import { Newspaper, ExternalLink } from 'lucide-react';
import { useDashboardSection } from '../../../hooks/useDashboard';
import VotingButtons from '../../VotingButtons';
import Card from '../Card';

export default function MarketNewsCard() {
    const { data, isLoading, error } = useDashboardSection('/dashboard/news', 'news');
    
    return (
        <Card
            title="Curated Market News"
            icon={<Newspaper className="w-5 h-5 text-primary" />}
            isLoading={isLoading}
            isError={!!error || !data || !Array.isArray(data)}
            errorFallbackMessage="Market news currently unavailable. Displaying static fallback feed."
            hoverAccentColor="primary"
        >
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
            {Array.isArray(data) && data.map((item: { id?: string; url?: string; title: string; source?: { title: string }; sentiment?: string }, index: number) => (
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
            <VotingButtons sectionType="NEWS" contentId="daily-news-feed" />
        </Card> 
    );
}
