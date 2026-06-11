import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MemeCard from './MemeCard';

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

describe('MemeCard', () => {
  beforeEach(() => {
    vi.mocked(useDashboardSection).mockClear();
  });

  // ── Test Case 1: Loading State ──────────────────────────────────────────────

  describe('Test Case 1 — Loading state', () => {
    beforeEach(() => {
      mockHook({ data: null, isLoading: true, error: null });
    });

    it('renders the loading indicator text from Card', () => {
      render(<MemeCard />);
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('does not render the card title while loading', () => {
      render(<MemeCard />);
      expect(screen.queryByText('Crypto Meme Matrix')).not.toBeInTheDocument();
    });

    it('does not render the VotingButtons while loading', () => {
      render(<MemeCard />);
      expect(screen.queryByTestId('mock-voting-buttons')).not.toBeInTheDocument();
    });
  });

  // ── Test Case 2: Error / Invalid Image State ────────────────────────────────

  describe('Test Case 2 — Error state (error object)', () => {
    beforeEach(() => {
      mockHook({ data: null, isLoading: false, error: new Error('Network failure') });
    });

    it('renders the fallback error message', () => {
      render(<MemeCard />);
      expect(
        screen.getByText('Could not fetch todays meme. Static backup loaded.'),
      ).toBeInTheDocument();
    });

    it('does not render the image or VotingButtons', () => {
      render(<MemeCard />);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-voting-buttons')).not.toBeInTheDocument();
    });
  });

  describe('Test Case 2b — Error state (imageUrl field is not a string)', () => {
    beforeEach(() => {
      mockHook({ data: { imageUrl: 42 }, isLoading: false, error: null });
    });

    it('renders the fallback message when imageUrl is not a string', () => {
      render(<MemeCard />);
      expect(
        screen.getByText('Could not fetch todays meme. Static backup loaded.'),
      ).toBeInTheDocument();
    });
  });

  describe('Test Case 2c — Error state (data is null, no error thrown)', () => {
    beforeEach(() => {
      mockHook({ data: null, isLoading: false, error: null });
    });

    it('renders the fallback message when data is null', () => {
      render(<MemeCard />);
      expect(
        screen.getByText('Could not fetch todays meme. Static backup loaded.'),
      ).toBeInTheDocument();
    });
  });

  // ── Test Case 3: Happy Path ─────────────────────────────────────────────────

  describe('Test Case 3 — Happy path (valid meme data)', () => {
    const IMAGE_URL = 'https://example.com/meme.png';
    const CAPTION = 'When Bitcoin hits 100k';

    beforeEach(() => {
      mockHook({
        data: { id: 'meme-123', imageUrl: IMAGE_URL, caption: CAPTION },
        isLoading: false,
        error: null,
      });
    });

    it('renders the card title', () => {
      render(<MemeCard />);
      expect(screen.getByText('Crypto Meme Matrix')).toBeInTheDocument();
    });

    it('renders an <img> element in the DOM', () => {
      render(<MemeCard />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('sets the correct src attribute on the image', () => {
      render(<MemeCard />);
      expect(screen.getByRole('img')).toHaveAttribute('src', IMAGE_URL);
    });

    it('sets the correct alt attribute on the image', () => {
      render(<MemeCard />);
      expect(screen.getByRole('img')).toHaveAttribute('alt', CAPTION);
    });

    it('renders the mocked VotingButtons sentinel', () => {
      render(<MemeCard />);
      expect(screen.getByTestId('mock-voting-buttons')).toBeInTheDocument();
    });

    it('does not render the loading or error states', () => {
      render(<MemeCard />);
      expect(screen.queryByText('Loading content...')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Could not fetch todays meme. Static backup loaded.'),
      ).not.toBeInTheDocument();
    });
  });
});
