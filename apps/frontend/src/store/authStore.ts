import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  hasCompletedOnboarding: boolean;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  setAuth: (token: string, user: UserProfile) => void;
  updateOnboardingStatus: (status: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateOnboardingStatus: (status) =>
        set((state) => ({
          user: state.user ? { ...state.user, hasCompletedOnboarding: status } : null,
        })),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'moveo-crypto-auth',
    }
  )
);