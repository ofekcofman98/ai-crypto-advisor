import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AiInsightCard from './AiInsightCard';

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AiInsightCard', () => {
  beforeEach(() => {
    vi.mocked(useDashboardSection).mockClear();
  });

  // ── Test Case 1: Loading State ──────────────────────────────────────────────

  describe('Test Case 1 — Loading state', () => {
    beforeEach(() => {
      mockHook({ data: undefined, isLoading: true, error: null });
    });

    it('renders the loading indicator text from Card', () => {
      render(<AiInsightCard />);
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('does not render the card title while loading', () => {
      render(<AiInsightCard />);
      expect(screen.queryByText('AI Insight of the Day')).not.toBeInTheDocument();
    });

    it('does not render the VotingButtons while loading', () => {
      render(<AiInsightCard />);
      expect(screen.queryByTestId('mock-voting-buttons')).not.toBeInTheDocument();
    });
  });

  // ── Test Case 2: Error / Invalid Data State ─────────────────────────────────

  describe('Test Case 2 — Error state (error object)', () => {
    beforeEach(() => {
      mockHook({ data: null, isLoading: false, error: new Error('Network failure') });
    });

    it('renders the fallback error message', () => {
      render(<AiInsightCard />);
      expect(
        screen.getByText('AI engine is currently offline. Loaded cached fallback insight.'),
      ).toBeInTheDocument();
    });

    it('does not render insight content or VotingButtons', () => {
      render(<AiInsightCard />);
      expect(screen.queryByTestId('mock-voting-buttons')).not.toBeInTheDocument();
      expect(screen.queryByText('AI Insight of the Day')).not.toBeInTheDocument();
    });
  });

  describe('Test Case 2b — Error state (insight field is not a string)', () => {
    beforeEach(() => {
      mockHook({ data: { insight: 42 }, isLoading: false, error: null });
    });

    it('renders the fallback message when insight is not a string', () => {
      render(<AiInsightCard />);
      expect(
        screen.getByText('AI engine is currently offline. Loaded cached fallback insight.'),
      ).toBeInTheDocument();
    });
  });

  describe('Test Case 2c — Error state (data is null, no error thrown)', () => {
    beforeEach(() => {
      mockHook({ data: null, isLoading: false, error: null });
    });

    it('renders the fallback message when data is null', () => {
      render(<AiInsightCard />);
      expect(
        screen.getByText('AI engine is currently offline. Loaded cached fallback insight.'),
      ).toBeInTheDocument();
    });
  });

  // ── Test Case 3: Happy Path ─────────────────────────────────────────────────

  describe('Test Case 3 — Happy path (valid insight data)', () => {
    const INSIGHT_TEXT = 'Bitcoin is looking bullish today based on moving averages.';

    beforeEach(() => {
      mockHook({
        data: { id: 'insight-99', insight: INSIGHT_TEXT },
        isLoading: false,
        error: null,
      });
    });

    it('renders the card title', () => {
      render(<AiInsightCard />);
      expect(screen.getByText('AI Insight of the Day')).toBeInTheDocument();
    });

    it('renders the insight text', () => {
      render(<AiInsightCard />);
      expect(screen.getByText(INSIGHT_TEXT)).toBeInTheDocument();
    });

    it('renders the mocked VotingButtons sentinel', () => {
      render(<AiInsightCard />);
      expect(screen.getByTestId('mock-voting-buttons')).toBeInTheDocument();
    });

    it('does not render the loading or error states', () => {
      render(<AiInsightCard />);
      expect(screen.queryByText('Loading content...')).not.toBeInTheDocument();
      expect(
        screen.queryByText('AI engine is currently offline. Loaded cached fallback insight.'),
      ).not.toBeInTheDocument();
    });
  });
});
