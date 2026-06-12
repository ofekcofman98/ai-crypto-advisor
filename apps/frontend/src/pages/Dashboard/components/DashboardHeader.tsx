import { LogOut, User } from 'lucide-react';

const BitcoinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-7 h-7 shrink-0">
    <rect width="32" height="32" rx="8" fill="#0D0F14" />
    <path
      d="M21.5 13.2c.3-1.9-1.2-3-3.2-3.7l.7-2.6-1.6-.4-.6 2.5-.7-.2.6-2.5-1.6-.4-.7 2.6-1.3-.3-2.2-.6-.4 1.7s1.2.3 1.1.3c.6.2.7.6.7.9l-1.7 6.8c-.1.2-.3.5-.8.4 0 0-1.1-.3-1.1-.3l-.8 1.8 2.1.5.7.2-.7 2.6 1.6.4.7-2.6.7.2-.7 2.6 1.6.4.7-2.6c2.7.5 4.7.3 5.6-2.1.7-1.9-.1-3-1.4-3.7.9-.3 1.6-.9 1.8-2.1Zm-3.2 4.5c-.5 1.9-3.8.9-4.9.6l.9-3.5c1 .3 4.4.8 4 2.9Zm.5-4.5c-.5 1.7-3.3.9-4.2.6l.8-3.2c.9.2 3.9.7 3.4 2.6Z"
      fill="#F7931A"
    />
  </svg>
);

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
          <BitcoinIcon />
          <span className="font-bold text-lg text-text-primary tracking-tight">AI Crypto Advisor</span>
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
