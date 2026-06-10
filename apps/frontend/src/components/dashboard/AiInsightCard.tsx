import { Sparkles, Loader2 } from 'lucide-react';
import { useDashboardSection } from '../../hooks/useDashboard';
import VotingButtons from '../VotingButtons';

export default function AiInsightCard() {
  const { data, isLoading, error } = useDashboardSection('/dashboard/insight', 'insight');

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-secondary mb-2" />
        <p className="text-sm text-text-secondary">AI is analyzing the markets...</p>
      </div>
    );
  }

  if (error || !data || typeof data.insight !== 'string') {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center text-sm text-text-secondary h-64 flex flex-col justify-center">
        AI engine is currently offline. Loaded cached fallback insight.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-secondary/40 transition-all duration-300 min-h-[256px]">
      <div className="absolute -right-16 -top-16 w-32 h-32 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-all duration-500"></div>
      
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-secondary" />
          AI Insight of the Day
        </h3>
        <div className="bg-void border border-border/50 rounded-xl p-4 text-sm text-text-secondary leading-relaxed max-h-[140px] overflow-y-auto custom-scrollbar">
          <p className="whitespace-pre-line text-text-primary/90">{data.insight}</p>
        </div>
      </div>
      
      <VotingButtons sectionType="AI_INSIGHT" contentId={data.id || 'daily-insight'} />
    </div>
  );
}