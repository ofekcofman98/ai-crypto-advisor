import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CoinPricesCard from './CoinPricesCard';

// ─── Module Mocks ─────────────────────────────────────────────────────────────

vi.mock('../../../hooks/useDashboard', () => ({
  useDashboardSection: vi.fn(),
}));

// Isolate VotingButtons — it has its own suite; here it is a known sentinel.
vi.mock('../../VotingButtons', () => ({
  default: () => <div data-testid="mock-voting-buttons" />,
}));

import { useDashboardSection } from '../../../hooks/useDashboard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type HookReturn = ReturnType<typeof useDashboardSection>;

function mockHook(overrides: Partial<HookReturn>) {
  vi.mocked(useDashboardSection).mockReturnValue(
    overrides as unknown as HookReturn,
  );
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BTC = {
  id: 'btc',
  symbol: 'btc',
  name: 'Bitcoin',
  currentPrice: 65250.45,
  priceChange24h: 4.25,
};

const ETH = {
  id: 'eth',
  symbol: 'eth',
  name: 'Ethereum',
  currentPrice: 3420.10,
  priceChange24h: -1.85,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CoinPricesCard', () => {
  beforeEach(() => {
    vi.mocked(useDashboardSection).mockClear();
  });

  // ── Test Case 1: Loading State ──────────────────────────────────────────────

  describe('Test Case 1 — Loading state', () => {
    beforeEach(() => {
      mockHook({ data: null, isLoading: true, error: null });
    });

    it('renders the loading indicator text from Card', () => {
      render(<CoinPricesCard />);
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('does not render the card title while loading', () => {
      render(<CoinPricesCard />);
      expect(screen.queryByText('Live Token Prices')).not.toBeInTheDocument();
    });

    it('does not render the VotingButtons while loading', () => {
      render(<CoinPricesCard />);
      expect(screen.queryByTestId('mock-voting-buttons')).not.toBeInTheDocument();
    });
  });

  // ── Test Case 2: Error State ────────────────────────────────────────────────

  describe('Test Case 2 — Error state (error object)', () => {
    beforeEach(() => {
      mockHook({ data: null, isLoading: false, error: new Error('Network failure') });
    });

    it('renders the fallback error message', () => {
      render(<CoinPricesCard />);
      expect(
        screen.getByText('Live prices temporarily unavailable. Displaying data fallback.'),
      ).toBeInTheDocument();
    });

    it('does not render coin list or VotingButtons', () => {
      render(<CoinPricesCard />);
      expect(screen.queryByTestId('mock-voting-buttons')).not.toBeInTheDocument();
      expect(screen.queryByText('Live Token Prices')).not.toBeInTheDocument();
    });
  });

  describe('Test Case 2b — Error state (data is null, no error thrown)', () => {
    beforeEach(() => {
      mockHook({ data: null, isLoading: false, error: null });
    });

    it('renders the fallback message when data is null', () => {
      render(<CoinPricesCard />);
      expect(
        screen.getByText('Live prices temporarily unavailable. Displaying data fallback.'),
      ).toBeInTheDocument();
    });
  });

  describe('Test Case 2c — Error state (data is not an array)', () => {
    beforeEach(() => {
      mockHook({ data: { wrongShape: true }, isLoading: false, error: null });
    });

    it('renders the fallback message when data is not an array', () => {
      render(<CoinPricesCard />);
      expect(
        screen.getByText('Live prices temporarily unavailable. Displaying data fallback.'),
      ).toBeInTheDocument();
    });
  });

  // ── Test Case 3: Empty State ────────────────────────────────────────────────

  describe('Test Case 3 — Empty state (empty array)', () => {
    beforeEach(() => {
      mockHook({ data: [], isLoading: false, error: null });
    });

    it('renders the "No assets selected." message', () => {
      render(<CoinPricesCard />);
      expect(screen.getByText('No assets selected.')).toBeInTheDocument();
    });

    it('renders the profile completion hint', () => {
      render(<CoinPricesCard />);
      expect(
        screen.getByText('Complete your profile to track live tokens.'),
      ).toBeInTheDocument();
    });

    it('renders the card title', () => {
      render(<CoinPricesCard />);
      expect(screen.getByText('Live Token Prices')).toBeInTheDocument();
    });

    it('renders the VotingButtons sentinel', () => {
      render(<CoinPricesCard />);
      expect(screen.getByTestId('mock-voting-buttons')).toBeInTheDocument();
    });
  });

  // ── Test Case 4: Happy Path ─────────────────────────────────────────────────

  describe('Test Case 4 — Happy path (multi-token render)', () => {
    beforeEach(() => {
      mockHook({ data: [BTC, ETH], isLoading: false, error: null });
    });

    it('renders the card title', () => {
      render(<CoinPricesCard />);
      expect(screen.getByText('Live Token Prices')).toBeInTheDocument();
    });

    it('renders symbols in uppercase', () => {
      render(<CoinPricesCard />);
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });

    it('renders correctly formatted prices using toLocaleString', () => {
      render(<CoinPricesCard />);
      expect(
        screen.getByText(`$${BTC.currentPrice.toLocaleString()}`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`$${ETH.currentPrice.toLocaleString()}`),
      ).toBeInTheDocument();
    });

    it('applies text-success class on the positive change element', () => {
      render(<CoinPricesCard />);
      // The div wrapping the icon + percentage text carries the colour class
      const btcChangeEl = screen.getByText(`${BTC.priceChange24h.toFixed(2)}%`);
      expect(btcChangeEl).toHaveClass('text-success');
    });

    it('applies text-danger class on the negative change element', () => {
      render(<CoinPricesCard />);
      const ethChangeEl = screen.getByText(`${ETH.priceChange24h.toFixed(2)}%`);
      expect(ethChangeEl).toHaveClass('text-danger');
    });

    it('renders the mocked VotingButtons sentinel', () => {
      render(<CoinPricesCard />);
      expect(screen.getByTestId('mock-voting-buttons')).toBeInTheDocument();
    });

    it('does not render loading or error states', () => {
      render(<CoinPricesCard />);
      expect(screen.queryByText('Loading content...')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Live prices temporarily unavailable. Displaying data fallback.'),
      ).not.toBeInTheDocument();
    });
  });
});
