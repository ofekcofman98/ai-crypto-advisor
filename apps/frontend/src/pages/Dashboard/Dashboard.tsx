import { useAuthStore } from '../../store/authStore';
import CardGrid from '../../components/dashboard/CardGrid';
import CoinPricesCard from '../../components/dashboard/CoinPricesCard';
import MarketNewsCard from '../../components/dashboard/MarketNewsCard';
import AiInsightCard from '../../components/dashboard/AiInsightCard';
import MemeCard from '../../components/dashboard/MemeCard';
import DashboardHeader from './components/DashboardHeader';

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-void flex flex-col">
      <DashboardHeader userName={user?.name} onLogout={logout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Your Daily Alpha</h1>
          <p className="text-text-secondary text-sm">AI-curated insights and market indicators calibrated to your strategy.</p>
        </div>

        <CardGrid>
          <CoinPricesCard />
          <MarketNewsCard />
          <AiInsightCard />
          <MemeCard />
        </CardGrid>
      </main>
    </div>
  );
}
