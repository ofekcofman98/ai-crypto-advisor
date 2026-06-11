import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MarketNewsCard from './MarketNewsCard';

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

// ─── Fixture ──────────────────────────────────────────────────────────────────

const NEWS_ITEM = {
  id: 'news-1',
  url: 'https://crypto-news.com/btc',
  title: 'Bitcoin Breaches All-Time High',
  source: { title: 'CoinDesk' },
  sentiment: 'Bullish',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MarketNewsCard', () => {
  beforeEach(() => {
    vi.mocked(useDashboardSection).mockClear();
  });

  // ── Test Case 1: Loading State ──────────────────────────────────────────────

  describe('Test Case 1 — Loading state', () => {
    beforeEach(() => {
      mockHook({ data: null, isLoading: true, error: null });
    });

    it('renders the loading indicator text from Card', () => {
      render(<MarketNewsCard />);
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('does not render the card title while loading', () => {
      render(<MarketNewsCard />);
      expect(screen.queryByText('Curated Market News')).not.toBeInTheDocument();
    });

    it('does not render the VotingButtons while loading', () => {
      render(<MarketNewsCard />);
      expect(screen.queryByTestId('mock-voting-buttons')).not.toBeInTheDocument();
    });
  });

  // ── Test Case 2: Error State ────────────────────────────────────────────────

  describe('Test Case 2 — Error state (error object)', () => {
    beforeEach(() => {
      mockHook({ data: null, isLoading: false, error: new Error('Network failure') });
    });

    it('renders the fallback error message', () => {
      render(<MarketNewsCard />);
      expect(
        screen.getByText('Market news currently unavailable. Displaying static fallback feed.'),
      ).toBeInTheDocument();
    });

    it('does not render news list or VotingButtons', () => {
      render(<MarketNewsCard />);
      expect(screen.queryByTestId('mock-voting-buttons')).not.toBeInTheDocument();
      expect(screen.queryByText('Curated Market News')).not.toBeInTheDocument();
    });
  });

  describe('Test Case 2b — Error state (data is null, no error thrown)', () => {
    beforeEach(() => {
      mockHook({ data: null, isLoading: false, error: null });
    });

    it('renders the fallback message when data is null', () => {
      render(<MarketNewsCard />);
      expect(
        screen.getByText('Market news currently unavailable. Displaying static fallback feed.'),
      ).toBeInTheDocument();
    });
  });

  describe('Test Case 2c — Error state (data is not an array)', () => {
    beforeEach(() => {
      mockHook({ data: { wrongShape: true }, isLoading: false, error: null });
    });

    it('renders the fallback message when data is not an array', () => {
      render(<MarketNewsCard />);
      expect(
        screen.getByText('Market news currently unavailable. Displaying static fallback feed.'),
      ).toBeInTheDocument();
    });
  });

  // ── Test Case 3: Happy Path ─────────────────────────────────────────────────

  describe('Test Case 3 — Happy path (news stream)', () => {
    beforeEach(() => {
      mockHook({ data: [NEWS_ITEM], isLoading: false, error: null });
    });

    it('renders the card title', () => {
      render(<MarketNewsCard />);
      expect(screen.getByText('Curated Market News')).toBeInTheDocument();
    });

    it('renders the article headline', () => {
      render(<MarketNewsCard />);
      expect(screen.getByText('Bitcoin Breaches All-Time High')).toBeInTheDocument();
    });

    it('wraps the headline in an <a> with the correct href', () => {
      render(<MarketNewsCard />);
      const link = screen.getByRole('link', { name: /Bitcoin Breaches All-Time High/i });
      expect(link).toHaveAttribute('href', 'https://crypto-news.com/btc');
    });

    it('sets target="_blank" on the anchor for new-tab navigation', () => {
      render(<MarketNewsCard />);
      const link = screen.getByRole('link', { name: /Bitcoin Breaches All-Time High/i });
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('sets rel="noopener noreferrer" on the anchor for security', () => {
      render(<MarketNewsCard />);
      const link = screen.getByRole('link', { name: /Bitcoin Breaches All-Time High/i });
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders the source title "CoinDesk"', () => {
      render(<MarketNewsCard />);
      expect(screen.getByText('CoinDesk')).toBeInTheDocument();
    });

    it('renders the sentiment badge "Bullish"', () => {
      render(<MarketNewsCard />);
      expect(screen.getByText('Bullish')).toBeInTheDocument();
    });

    it('renders the mocked VotingButtons sentinel', () => {
      render(<MarketNewsCard />);
      expect(screen.getByTestId('mock-voting-buttons')).toBeInTheDocument();
    });

    it('does not render loading or error states', () => {
      render(<MarketNewsCard />);
      expect(screen.queryByText('Loading content...')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Market news currently unavailable. Displaying static fallback feed.'),
      ).not.toBeInTheDocument();
    });
  });
});
