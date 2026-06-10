import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface CardProps {
  title: string;
  icon: ReactNode;
  isLoading: boolean;
  isError: boolean;
  errorFallbackMessage: string;
  children: ReactNode;
  hoverAccentColor?: 'primary' | 'secondary' | 'warning';
}

export default function Card({
  title,
  icon,
  isLoading,
  isError,
  errorFallbackMessage,
  children,
  hoverAccentColor = 'primary',
}: CardProps) {
  const hoverColors = {
    primary: 'hover:border-primary/40',
    secondary: 'hover:border-secondary/40',
    warning: 'hover:border-warning/40',
  };

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-center items-center h-64 shadow-lg animate-pulse">
        <Loader2 className={`w-8 h-8 animate-spin mb-2 ${
          hoverAccentColor === 'secondary' ? 'text-secondary' : hoverAccentColor === 'warning' ? 'text-warning' : 'text-primary'
        }`} />
        <p className="text-sm text-text-secondary">Loading content...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center text-sm text-text-secondary h-64 flex flex-col justify-center shadow-lg border-dashed">
        <p>{errorFallbackMessage}</p>
      </div>
    );
  }

  return (
    <div className={`bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between shadow-lg transition-all duration-300 ${hoverColors[hoverAccentColor]}`}>
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}