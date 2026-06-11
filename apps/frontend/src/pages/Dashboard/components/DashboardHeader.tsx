import { LogOut, LayoutDashboard, User } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string | undefined;
  onLogout: () => void;
}

export default function DashboardHeader({ userName, onLogout }: DashboardHeaderProps) {
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      onLogout();
    }
  };

  return (
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
            <span className="font-bold text-text-primary font-mono">{userName}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg border border-border bg-void text-text-secondary hover:text-danger hover:border-danger/30 transition-all flex items-center gap-2 text-sm font-medium"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
