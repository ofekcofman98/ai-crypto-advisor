import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VotingButtons from './VotingButtons';
import type { VotePayload } from '../../hooks/useDashboard';

// ─── Module Mock ─────────────────────────────────────────────────────────────
// The factory runs at hoist-time; vi.fn() placeholders are replaced per-test.

vi.mock('../../hooks/useDashboard', () => ({
  useUserVotes: vi.fn(),
  useSubmitFeedback: vi.fn(),
}));

import { useUserVotes, useSubmitFeedback } from '../../hooks/useDashboard';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SECTION_TYPE: VotePayload['sectionType'] = 'AI_INSIGHT';
const CONTENT_ID = 'test-content-123';

interface VoteRecord {
  sectionType: string;
  contentId: string;
  vote: 'UP' | 'DOWN';
}

const upVote: VoteRecord   = { sectionType: SECTION_TYPE, contentId: CONTENT_ID, vote: 'UP' };
const downVote: VoteRecord = { sectionType: SECTION_TYPE, contentId: CONTENT_ID, vote: 'DOWN' };

// ─── Setup ────────────────────────────────────────────────────────────────────

const mutateSpy = vi.fn();

beforeEach(() => {
  mutateSpy.mockClear();

  vi.mocked(useSubmitFeedback).mockReturnValue(
    { mutate: mutateSpy } as unknown as ReturnType<typeof useSubmitFeedback>,
  );
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VotingButtons', () => {
  describe('Test Case 1 — No active vote (empty votes array)', () => {
    beforeEach(() => {
      vi.mocked(useUserVotes).mockReturnValue(
        { data: [] } as unknown as ReturnType<typeof useUserVotes>,
      );
    });

    it('renders both action buttons', () => {
      render(<VotingButtons sectionType={SECTION_TYPE} contentId={CONTENT_ID} />);

      expect(screen.getByText('Useful')).toBeInTheDocument();
      expect(screen.getByText('Not for me')).toBeInTheDocument();
    });

    it('applies inactive border styles to both buttons', () => {
      render(<VotingButtons sectionType={SECTION_TYPE} contentId={CONTENT_ID} />);

      const usefulBtn   = screen.getByText('Useful').closest('button');
      const notForMeBtn = screen.getByText('Not for me').closest('button');

      expect(usefulBtn?.className).toContain('border-border');
      expect(notForMeBtn?.className).toContain('border-border');
    });

    it('calls mutate with UP payload when "Useful" is clicked', () => {
      render(<VotingButtons sectionType={SECTION_TYPE} contentId={CONTENT_ID} />);

      fireEvent.click(screen.getByText('Useful'));

      expect(mutateSpy).toHaveBeenCalledOnce();
      expect(mutateSpy).toHaveBeenCalledWith({
        sectionType: SECTION_TYPE,
        contentId: CONTENT_ID,
        vote: 'UP',
      });
    });

    it('calls mutate with DOWN payload when "Not for me" is clicked', () => {
      render(<VotingButtons sectionType={SECTION_TYPE} contentId={CONTENT_ID} />);

      fireEvent.click(screen.getByText('Not for me'));

      expect(mutateSpy).toHaveBeenCalledOnce();
      expect(mutateSpy).toHaveBeenCalledWith({
        sectionType: SECTION_TYPE,
        contentId: CONTENT_ID,
        vote: 'DOWN',
      });
    });
  });

  describe('Test Case 2 — Active UP vote', () => {
    beforeEach(() => {
      vi.mocked(useUserVotes).mockReturnValue(
        { data: [upVote] } as unknown as ReturnType<typeof useUserVotes>,
      );
    });

    it('"Useful" button receives success styles', () => {
      render(<VotingButtons sectionType={SECTION_TYPE} contentId={CONTENT_ID} />);

      const usefulBtn = screen.getByText('Useful').closest('button');
      expect(usefulBtn?.className).toContain('border-success');
      expect(usefulBtn?.className).toContain('bg-success/10');
      expect(usefulBtn?.className).toContain('text-success');
    });

    it('"Not for me" button stays inactive', () => {
      render(<VotingButtons sectionType={SECTION_TYPE} contentId={CONTENT_ID} />);

      const notForMeBtn = screen.getByText('Not for me').closest('button');
      expect(notForMeBtn?.className).toContain('border-border');
      expect(notForMeBtn?.className).not.toContain('border-danger');
    });

    it('does not activate the UP style for a different contentId', () => {
      vi.mocked(useUserVotes).mockReturnValue(
        { data: [{ ...upVote, contentId: 'other-id' }] } as unknown as ReturnType<typeof useUserVotes>,
      );

      render(<VotingButtons sectionType={SECTION_TYPE} contentId={CONTENT_ID} />);

      const usefulBtn = screen.getByText('Useful').closest('button');
      expect(usefulBtn?.className).toContain('border-border');
      expect(usefulBtn?.className).not.toContain('border-success');
    });
  });

  describe('Test Case 3 — Active DOWN vote', () => {
    beforeEach(() => {
      vi.mocked(useUserVotes).mockReturnValue(
        { data: [downVote] } as unknown as ReturnType<typeof useUserVotes>,
      );
    });

    it('"Not for me" button receives danger styles', () => {
      render(<VotingButtons sectionType={SECTION_TYPE} contentId={CONTENT_ID} />);

      const notForMeBtn = screen.getByText('Not for me').closest('button');
      expect(notForMeBtn?.className).toContain('border-danger');
      expect(notForMeBtn?.className).toContain('bg-danger/10');
      expect(notForMeBtn?.className).toContain('text-danger');
    });

    it('"Useful" button stays inactive', () => {
      render(<VotingButtons sectionType={SECTION_TYPE} contentId={CONTENT_ID} />);

      const usefulBtn = screen.getByText('Useful').closest('button');
      expect(usefulBtn?.className).toContain('border-border');
      expect(usefulBtn?.className).not.toContain('border-success');
    });
  });
});
