import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.setConfig({ testTimeout: 15_000 });

// ─── Hoisted Mocks ────────────────────────────────────────────────────────────

const { mockLogout } = vi.hoisted(() => ({
  mockLogout: vi.fn(),
}));

// ─── Module Mocks ─────────────────────────────────────────────────────────────

// Dashboard calls useAuthStore() without a selector — destructures { user, logout }
// directly — so the mock returns the state object rather than invoking a selector.
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { name: 'Ofek Developer' },
    logout: mockLogout,
  })),
}));

// Stub the layout shell so children (the card mocks below) are still rendered.
vi.mock('../../components/dashboard/CardGrid', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Stub all smart child cards to eliminate network/API surface and heavy renders.
vi.mock('../../components/dashboard/CoinPricesCard', () => ({
  default: () => <div data-testid="mock-prices" />,
}));
vi.mock('../../components/dashboard/MarketNewsCard', () => ({
  default: () => <div data-testid="mock-news" />,
}));
vi.mock('../../components/dashboard/AiInsightCard', () => ({
  default: () => <div data-testid="mock-insight" />,
}));
vi.mock('../../components/dashboard/MemeCard', () => ({
  default: () => <div data-testid="mock-meme" />,
}));

import Dashboard from './Dashboard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockLogout.mockClear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Dashboard', () => {

  // ── Test Case 1: User Session Binding ────────────────────────────────────────

  describe('Test Case 1 — User session binding', () => {
    it('renders the investor name from the auth store in the profile banner', () => {
      renderDashboard();
      expect(screen.getByText('Ofek Developer')).toBeInTheDocument();
    });

    it('renders the main page heading "Your Daily Alpha"', () => {
      renderDashboard();
      expect(screen.getByRole('heading', { name: 'Your Daily Alpha' })).toBeInTheDocument();
    });
  });

  // ── Test Case 2: Sub-Component Mounting ──────────────────────────────────────

  describe('Test Case 2 — Sub-component mounting', () => {
    it('mounts all four card placeholders concurrently in the layout tree', () => {
      renderDashboard();
      expect(screen.getByTestId('mock-prices')).toBeInTheDocument();
      expect(screen.getByTestId('mock-news')).toBeInTheDocument();
      expect(screen.getByTestId('mock-insight')).toBeInTheDocument();
      expect(screen.getByTestId('mock-meme')).toBeInTheDocument();
    });
  });

  // ── Test Case 3: Session Exit Flow ───────────────────────────────────────────

  describe('Test Case 3 — Session exit flow', () => {
    it('calls logout exactly once when the logout button is clicked', async () => {
      renderDashboard();
      const user = userEvent.setup();

      // The button has title="Sign Out" and visible text "Logout" (jsdom renders
      // the span regardless of the hidden sm:inline Tailwind class). Either
      // selector works; title is the more precise DOM anchor here.
      await user.click(screen.getByTitle('Sign Out'));

      expect(mockLogout).toHaveBeenCalledOnce();
    });
  });
});
