import { TrendingUp, TrendingDown, Inbox } from 'lucide-react';
import { useDashboardSection } from '../../hooks/useDashboard';
import VotingButtons from '../VotingButtons';
import Card from './Card';

export default function CoinPricesCard() {
  const { data, isLoading, error } = useDashboardSection('/dashboard/prices', 'prices');
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <Card
      title="Live Token Prices"
      icon={<span className="w-2 h-2 rounded-full bg-primary"></span>}
      isLoading={isLoading}
      isError={!!error || !data || !Array.isArray(data)}
      errorFallbackMessage="Live prices temporarily unavailable. Displaying data fallback."
      hoverAccentColor="primary"
    >
    {!hasData ? (
        <div className="flex flex-col items-center justify-center py-6 text-center text-text-secondary">
          <Inbox className="w-8 h-8 mb-2 stroke-[1.5] text-text-secondary/40" />
          <p className="text-sm">No assets selected.</p>
          <p className="text-xs text-text-secondary/60 mt-0.5">Complete your profile to track live tokens.</p>
        </div>
      ) :(<div className="space-y-3">
        {Array.isArray(data) && data.map((coin: any) => {
          const isPositive = coin.priceChange24h >= 0;
          return (
            <div key={coin.id} className="flex items-center justify-between p-2.5 bg-void rounded-xl border border-border/50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-text-primary font-mono">{coin.symbol.toUpperCase()}</span>
                <span className="text-xs text-text-secondary hidden sm:inline">{coin.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-text-primary">${coin.currentPrice.toLocaleString()}</div>
                <div className={`text-xs font-mono font-medium flex items-center justify-end gap-0.5 ${isPositive ? 'text-success' : 'text-danger'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {coin.priceChange24h.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>)}
      <VotingButtons sectionType="PRICE" contentId="user-selected-coins" />
    </Card>
  );
}