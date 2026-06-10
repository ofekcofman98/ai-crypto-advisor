import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useDashboardSection } from '../../hooks/useDashboard';
import VotingButtons from '../VotingButtons';

export default function CoinPricesCard() {
  const { data, isLoading, error } = useDashboardSection('/dashboard/prices', 'prices');

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-text-secondary">Fetching live market rates...</p>
      </div>
    );
  }

  if (error || !data || !Array.isArray(data)) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center text-sm text-text-secondary h-64 flex flex-col justify-center">
        Failed to load price feeds. Displaying static data.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-primary/40 transition-all duration-300">
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Live Token Prices
        </h3>
        <div className="space-y-3">
          {data.map((coin: any) => {
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
        </div>
      </div>
      <VotingButtons sectionType="PRICE" contentId="user-selected-coins" />
    </div>
  );
}