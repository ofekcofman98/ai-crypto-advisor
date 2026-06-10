import { LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import CardGrid from '../components/dashboard/CardGrid';
import CoinPricesCard from '../components/dashboard/CoinPricesCard';
import MarketNewsCard from '../components/dashboard/MarketNewsCard';
import AiInsightCard from '../components/dashboard/AiInsightCard';
import MemeCard from '../components/dashboard/MemeCard';

export default function Dashboard() {
    const { user, logout } = useAuthStore();
  
    return (
      <div className="min-h-screen bg-void flex flex-col">
        <header className="border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg text-text-primary tracking-tight">Moveo Crypto Advisor</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-void border border-border px-3 py-1.5 rounded-lg text-xs">
                <User className="w-3.5 h-3.5 text-text-secondary" />
                <span className="text-text-secondary">Investor:</span>
                <span className="font-bold text-text-primary font-mono">{user?.name}</span>
              </div>
              
              <button
                onClick={logout}
                className="p-2 rounded-lg border border-border bg-void text-text-secondary hover:text-danger hover:border-danger/30 transition-all flex items-center gap-2 text-sm font-medium"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
  
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Your Daily Alpha</h1>
            <p className="text-text-secondary text-sm">AI-curated insights and market indicators calibrated to your strategy.</p>
          </div>
  
          {/* The Responsive Grid Shell */}
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