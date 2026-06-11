import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Card from './Card';

// ─── Shared props ─────────────────────────────────────────────────────────────

const BASE_PROPS = {
  title: 'Test Card Title',
  icon: <span data-testid="mock-icon">★</span>,
  errorFallbackMessage: 'Something went wrong.',
  children: <div data-testid="child">Hello</div>,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Card', () => {

  // ── Test Case 1: Loading State ──────────────────────────────────────────────

  describe('Test Case 1 — Loading state', () => {
    it('renders the "Loading content..." text', () => {
      render(<Card {...BASE_PROPS} isLoading={true} isError={false} />);
      expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('renders the Lucide spinner with animate-spin class', () => {
      const { container } = render(
        <Card {...BASE_PROPS} isLoading={true} isError={false} />,
      );
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeNull();
    });

    it('does not render the card title while loading', () => {
      render(<Card {...BASE_PROPS} isLoading={true} isError={false} />);
      expect(screen.queryByText('Test Card Title')).not.toBeInTheDocument();
    });

    it('does not render children while loading', () => {
      render(<Card {...BASE_PROPS} isLoading={true} isError={false} />);
      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    });

    it('applies text-primary spinner colour by default (primary accent)', () => {
      const { container } = render(
        <Card {...BASE_PROPS} isLoading={true} isError={false} />,
      );
      // Loader2 is an SVG; use getAttribute('class') — SVG className is an
      // SVGAnimatedString, not a plain string, so .className would not work.
      const spinner = container.querySelector('.animate-spin');
      expect(spinner?.getAttribute('class')).toContain('text-primary');
    });

    it('applies text-secondary spinner colour for secondary accent', () => {
      const { container } = render(
        <Card {...BASE_PROPS} isLoading={true} isError={false} hoverAccentColor="secondary" />,
      );
      const spinner = container.querySelector('.animate-spin');
      expect(spinner?.getAttribute('class')).toContain('text-secondary');
    });

    it('applies text-warning spinner colour for warning accent', () => {
      const { container } = render(
        <Card {...BASE_PROPS} isLoading={true} isError={false} hoverAccentColor="warning" />,
      );
      const spinner = container.querySelector('.animate-spin');
      expect(spinner?.getAttribute('class')).toContain('text-warning');
    });
  });

  // ── Test Case 2: Error State ────────────────────────────────────────────────

  describe('Test Case 2 — Error state', () => {
    it('renders the custom errorFallbackMessage', () => {
      render(
        <Card {...BASE_PROPS} isLoading={false} isError={true} errorFallbackMessage="Custom Error" />,
      );
      expect(screen.getByText('Custom Error')).toBeInTheDocument();
    });

    it('does NOT render the card title in error state', () => {
      render(
        <Card {...BASE_PROPS} isLoading={false} isError={true} errorFallbackMessage="Custom Error" />,
      );
      expect(screen.queryByText('Test Card Title')).not.toBeInTheDocument();
    });

    it('does NOT render children in error state', () => {
      render(
        <Card {...BASE_PROPS} isLoading={false} isError={true} errorFallbackMessage="Custom Error" />,
      );
      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    });

    it('does NOT render the loading indicator in error state', () => {
      render(
        <Card {...BASE_PROPS} isLoading={false} isError={true} errorFallbackMessage="Custom Error" />,
      );
      expect(screen.queryByText('Loading content...')).not.toBeInTheDocument();
    });
  });

  // ── Test Case 3: Happy Path ─────────────────────────────────────────────────

  describe('Test Case 3 — Happy path', () => {
    it('renders the card title', () => {
      render(<Card {...BASE_PROPS} isLoading={false} isError={false} />);
      expect(screen.getByText('Test Card Title')).toBeInTheDocument();
    });

    it('renders the icon slot', () => {
      render(<Card {...BASE_PROPS} isLoading={false} isError={false} />);
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('renders the children', () => {
      render(<Card {...BASE_PROPS} isLoading={false} isError={false} />);
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('applies hover:border-warning/40 when hoverAccentColor="warning"', () => {
      const { container } = render(
        <Card {...BASE_PROPS} isLoading={false} isError={false} hoverAccentColor="warning" />,
      );
      // The outermost div carries the hover class in the happy-path render.
      const card = container.firstElementChild;
      expect(card?.className).toContain('hover:border-warning/40');
    });

    it('applies hover:border-secondary/40 when hoverAccentColor="secondary"', () => {
      const { container } = render(
        <Card {...BASE_PROPS} isLoading={false} isError={false} hoverAccentColor="secondary" />,
      );
      const card = container.firstElementChild;
      expect(card?.className).toContain('hover:border-secondary/40');
    });

    it('defaults to hover:border-primary/40 when hoverAccentColor is omitted', () => {
      const { container } = render(
        <Card {...BASE_PROPS} isLoading={false} isError={false} />,
      );
      const card = container.firstElementChild;
      expect(card?.className).toContain('hover:border-primary/40');
    });
  });
});
