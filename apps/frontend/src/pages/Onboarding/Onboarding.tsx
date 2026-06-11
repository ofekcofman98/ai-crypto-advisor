import { useState } from 'react';
import axios from 'axios';
import { Coins, UserCheck, Layout, Loader2 } from 'lucide-react';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import SelectionGrid from '../../components/ui/SelectionGrid';
import AuthCard from '../../components/ui/AuthCard';

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
        <AuthCard 
          title="Set Up Your Persona" 
          subtitle="Help our AI curate your perfect daily dashboard" 
          error={error}
          maxWidthClassName="max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Question 1: Assets */}
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                1. Which crypto assets are you tracking?
              </h2>
              <SelectionGrid
                  options={ASSET_OPTIONS}
                  selectedValues={cryptoAssets}
                  onSelect={toggleAsset}
                  accentColor="primary"
                />
            </div>
  
            {/* Question 2: Investor Type */}
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-secondary" />
                2. What type of investor are you?
              </h2>
              <SelectionGrid
                  options={INVESTOR_TYPES}
                  selectedValues={investorType}
                  onSelect={setInvestorType}
                  accentColor="secondary"
              />
            </div>
  
            {/* Question 3: Content Types */}
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Layout className="w-5 h-5 text-warning" />
                3. What content do you want on your feed?
              </h2>
              <SelectionGrid
                  options={CONTENT_OPTIONS}
                  selectedValues={contentTypes}
                  onSelect={toggleContentType}
                  accentColor="warning"
              />
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
        </AuthCard>
      );
    }
