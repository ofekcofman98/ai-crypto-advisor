import { Sparkles } from 'lucide-react';
import { useDashboardSection } from '../../hooks/useDashboard';
import VotingButtons from '../VotingButtons';
import Card from './Card';

export default function AiInsightCard() {
  const { data, isLoading, error } = useDashboardSection('/dashboard/insight', 'insight');

    return (
        <Card
        title="AI Insight of the Day"
        icon={<Sparkles className="w-5 h-5 text-secondary" />}
        isLoading={isLoading}
        isError={!!error || !data || typeof data.insight !== 'string'}
        errorFallbackMessage="AI engine is currently offline. Loaded cached fallback insight."
        hoverAccentColor="secondary"
        >
            <div className="bg-void border border-border/50 rounded-xl p-4 text-sm text-text-secondary leading-relaxed max-h-[140px] overflow-y-auto custom-scrollbar">
                <p className="whitespace-pre-line text-text-primary/90">{data?.insight}</p>
            </div>
            <VotingButtons sectionType="AI_INSIGHT" contentId={data?.id || 'daily-insight'} />
        </Card>  
    );
}