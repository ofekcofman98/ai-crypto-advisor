import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  subtitle: string;
  error: string | null;
  children: ReactNode;
  maxWidthClassName?: string;
}

export default function AuthCard({ 
    title,
    subtitle, 
    error, 
    children, 
    maxWidthClassName = 'max-w-md'
}: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-void">
      <div className={`w-full ${maxWidthClassName} bg-surface border border-border rounded-2xl p-8 shadow-xl`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">{title}</h1>
          <p className="text-text-secondary">{subtitle}</p>
        </div>
        {error && (
          <div className="bg-danger/10 border border-danger/50 text-danger text-sm rounded-lg p-3 mb-6">
            {error}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}