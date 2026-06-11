import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Raise per-file timeout to absorb sequential boot overhead on Windows paths.
vi.setConfig({ testTimeout: 15_000 });

// ─── Hoisted Mocks ────────────────────────────────────────────────────────────

const { mockUpdateOnboardingStatus, mockApiPost } = vi.hoisted(() => ({
  mockUpdateOnboardingStatus: vi.fn(),
  mockApiPost: vi.fn(),
}));

// ─── Module Mocks ─────────────────────────────────────────────────────────────

vi.mock('../../utils/api', () => ({
  default: { post: mockApiPost },
}));

// useAuthStore is called as a selector hook:
//   useAuthStore((state) => state.updateOnboardingStatus)
// The factory receives the selector and calls it against a minimal state stub.
// Avoid <T> generic syntax in .tsx — OXC parses it as JSX.
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(
    (selector: (s: { updateOnboardingStatus: typeof mockUpdateOnboardingStatus }) => unknown) =>
      selector({ updateOnboardingStatus: mockUpdateOnboardingStatus }),
  ),
}));

import Onboarding from './Onboarding';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderOnboarding() {
  return render(
    <MemoryRouter>
      <Onboarding />
    </MemoryRouter>,
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockUpdateOnboardingStatus.mockClear();
  mockApiPost.mockClear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Onboarding', () => {

  // ── Test Case 1: Client-Side Validation Lock ─────────────────────────────────

  describe('Test Case 1 — Client-side validation lock', () => {
    it('blocks submission and shows an error when no selections have been made', async () => {
      renderOnboarding();
      const user = userEvent.setup();

      // Submit immediately without touching any selection grid
      await user.click(screen.getByRole('button', { name: /generate my custom dashboard/i }));

      expect(mockApiPost).not.toHaveBeenCalled();
      expect(
        screen.getByText('Please answer all questions before proceeding.'),
      ).toBeInTheDocument();
    });
  });

  // ── Test Case 2: Dynamic State Toggling ──────────────────────────────────────

  describe('Test Case 2 — Dynamic state toggling', () => {
    it('deselects an asset when it is clicked a second time, leaving only the remaining selection', async () => {
      mockApiPost.mockResolvedValueOnce({});
      const user = userEvent.setup();
      renderOnboarding();

      // Add BTC → ETH → remove BTC: only ETH should remain in cryptoAssets
      await user.click(screen.getByText('BTC'));
      await user.click(screen.getByText('ETH'));
      await user.click(screen.getByText('BTC')); // toggle off

      // Complete required selections to unlock submission
      await user.click(screen.getByText('HODLer'));
      await user.click(screen.getByText('Market News'));
      await user.click(screen.getByRole('button', { name: /generate my custom dashboard/i }));

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledOnce();
      });

      // Payload must contain only ETH — confirms the deselection filter worked
      expect(mockApiPost).toHaveBeenCalledWith('/onboarding', {
        cryptoAssets: ['ETH'],
        investorType: 'HODLER',
        contentTypes: ['MARKET_NEWS'],
      });
    });
  });

  // ── Test Case 3: Happy Path Submission ───────────────────────────────────────

  describe('Test Case 3 — Happy path submission', () => {
    it('posts the correct payload to /onboarding and calls updateOnboardingStatus(true)', async () => {
      mockApiPost.mockResolvedValueOnce({});
      const user = userEvent.setup();
      renderOnboarding();

      await user.click(screen.getByText('ETH'));
      await user.click(screen.getByText('HODLer'));
      await user.click(screen.getByText('Market News'));
      await user.click(screen.getByRole('button', { name: /generate my custom dashboard/i }));

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledOnce();
      });

      expect(mockApiPost).toHaveBeenCalledWith('/onboarding', {
        cryptoAssets: ['ETH'],
        investorType: 'HODLER',
        contentTypes: ['MARKET_NEWS'],
      });

      expect(mockUpdateOnboardingStatus).toHaveBeenCalledOnce();
      expect(mockUpdateOnboardingStatus).toHaveBeenCalledWith(true);
    });
  });
});
