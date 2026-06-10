import { useState } from 'react';
import axios from 'axios';
import { Coins, UserCheck, Layout, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

const ASSET_OPTIONS = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA'];
const INVESTOR_TYPES = [
  { id: 'HODLER', name: 'HODLer', desc: 'Long-term believer, strong hands' },
  { id: 'DAY_TRADER', name: 'Day Trader', desc: 'Fast-paced market scalper' },
  { id: 'NFT_COLLECTOR', name: 'NFT Collector', desc: 'Digital art & culture enthusiast' }
];
const CONTENT_OPTIONS = [
  { id: 'MARKET_NEWS', name: 'Market News' },
  { id: 'CHARTS', name: 'Technical Charts' },
  { id: 'SOCIAL', name: 'Social Sentiments' },
  { id: 'FUN', name: 'Memes & Fun' }
];

export default function Onboarding() {
    const [cryptoAssets, setCryptoAssets] = useState<string[]>([]);
    const [investorType, setInvestorType] = useState<string>('');
    const [contentTypes, setContentTypes] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
  
    const updateOnboardingStatus = useAuthStore((state) => state.updateOnboardingStatus);

    const toggleAsset = (asset: string) => {
        setCryptoAssets(prev =>
          prev.includes(asset) ? prev.filter(a => a !== asset) : [...prev, asset]
        );
      };
    
      const toggleContentType = (type: string) => {
        setContentTypes(prev =>
          prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
      };
    
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cryptoAssets.length === 0 || !investorType || contentTypes.length === 0) {
          setError('Please answer all questions before proceeding.');
          return;
        }
    
        setError(null);
        setIsLoading(true);
    
        try {
          await api.post('/onboarding', {
            cryptoAssets,
            investorType,
            contentTypes
          });
    
          updateOnboardingStatus(true);
        } catch (err) {
          if (axios.isAxiosError(err) && err.response) {
            setError(err.response.data.message || 'Failed to save preferences.');
          } else {
            setError('Something went wrong. Please try again.');
          }
        } finally {
          setIsLoading(false);
        }
      };
    
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-void">
          <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-8 shadow-2xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-text-primary mb-2">Set Up Your Persona</h1>
              <p className="text-text-secondary">Help our AI curate your perfect daily dashboard</p>
            </div>
    
            {error && (
              <div className="bg-danger/10 border border-danger/50 text-danger text-sm rounded-lg p-3 mb-6">
                {error}
              </div>
            )}
    
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Question 1: Assets */}
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  1. Which crypto assets are you tracking?
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ASSET_OPTIONS.map((asset) => {
                    const isSelected = cryptoAssets.includes(asset);
                    return (
                      <button
                        type="button"
                        key={asset}
                        onClick={() => toggleAsset(asset)}
                        className={`p-4 rounded-xl border text-left transition-all flex justify-between items-center ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-text-primary'
                            : 'border-border bg-void text-text-secondary hover:border-border/80'
                        }`}
                      >
                        <span className="font-mono font-medium">{asset}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
    
              {/* Question 2: Investor Type */}
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-secondary" />
                  2. What type of investor are you?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {INVESTOR_TYPES.map((type) => {
                    const isSelected = investorType === type.id;
                    return (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setInvestorType(type.id)}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-28 ${
                          isSelected
                            ? 'border-secondary bg-secondary/10 text-text-primary'
                            : 'border-border bg-void text-text-secondary hover:border-border/80'
                        }`}
                      >
                        <div className="w-full flex justify-between items-center mb-1">
                          <span className="font-bold text-sm">{type.name}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-secondary" />}
                        </div>
                        <span className="text-xs text-text-secondary leading-snug">{type.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
    
              {/* Question 3: Content Types */}
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-warning" />
                  3. What content do you want on your feed?
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {CONTENT_OPTIONS.map((content) => {
                    const isSelected = contentTypes.includes(content.id);
                    return (
                      <button
                        type="button"
                        key={content.id}
                        onClick={() => toggleContentType(content.id)}
                        className={`p-4 rounded-xl border text-left transition-all flex justify-between items-center ${
                          isSelected
                            ? 'border-warning bg-warning/10 text-text-primary'
                            : 'border-border bg-void text-text-secondary hover:border-border/80'
                        }`}
                      >
                        <span className="text-sm font-medium">{content.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-warning" />}
                      </button>
                    );
                  })}
                </div>
              </div>
    
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-text-primary text-void hover:bg-text-primary/90 font-bold py-3 rounded-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  'Generate My Custom Dashboard'
                )}
              </button>
            </form>
          </div>
        </div>
      );
    }