import type { InputHTMLAttributes, ReactNode } from 'react';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: ReactNode;
}

export default function AuthInput({ label, icon, ...props }: AuthInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary flex items-center justify-center">
          {icon}
        </div>
        <input
          {...props}
          className="w-full bg-void border border-border rounded-lg py-2.5 pl-10 pr-4 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-text-secondary/40"
        />
      </div>
    </div>
  );
}