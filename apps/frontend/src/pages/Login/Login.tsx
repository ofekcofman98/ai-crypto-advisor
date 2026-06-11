import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import AuthInput from '../../components/ui/AuthInput';
import { getAPIErrorMessage } from '../../utils/errorHandler';
import AuthCard from '../../components/ui/AuthCard';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
        const response = await api.post('/auth/login', { email, password });
        setAuth(response.data.accessToken, response.data.user);
    } 
    catch (err) {
        setError(getAPIErrorMessage(err, 'Invalid credentials'));
    } 
    finally {
        setIsLoading(false);
    }
  };

  return (
    <AuthCard 
      title="Welcome Back" 
      subtitle="Sign in to your AI Crypto Dashboard" 
      error={error}
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <AuthInput
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          icon={<Mail className="w-5 h-5" />}
        />

        <AuthInput
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={<Lock className="w-5 h-5" />}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}
