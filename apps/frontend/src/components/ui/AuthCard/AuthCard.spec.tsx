import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AuthCard from './AuthCard';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthCard', () => {

  // ── Test Case 1: Basic Rendering & Props ────────────────────────────────────

  describe('Test Case 1 — Basic rendering & props', () => {
    it('renders the title inside a heading element', () => {
      render(
        <AuthCard title="Welcome Back" subtitle="Log in to continue" error={null}>
          <div />
        </AuthCard>,
      );
      expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    });

    it('renders the subtitle text', () => {
      render(
        <AuthCard title="Welcome Back" subtitle="Log in to continue" error={null}>
          <div />
        </AuthCard>,
      );
      expect(screen.getByText('Log in to continue')).toBeInTheDocument();
    });

    it('does not render an error block when error is null', () => {
      render(
        <AuthCard title="Welcome Back" subtitle="Log in to continue" error={null}>
          <div />
        </AuthCard>,
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      // The error container is only mounted when error is truthy; confirm no danger text exists
      const dangerEl = document.querySelector('.text-danger');
      expect(dangerEl).not.toBeInTheDocument();
    });
  });

  // ── Test Case 2: Error State Rendering ─────────────────────────────────────

  describe('Test Case 2 — Error state rendering', () => {
    it('renders the error text when an error string is provided', () => {
      render(
        <AuthCard title="Welcome Back" subtitle="Log in to continue" error="Invalid credentials provided.">
          <div />
        </AuthCard>,
      );
      expect(screen.getByText('Invalid credentials provided.')).toBeInTheDocument();
    });

    it('applies text-danger class to the error container', () => {
      render(
        <AuthCard title="Welcome Back" subtitle="Log in to continue" error="Invalid credentials provided.">
          <div />
        </AuthCard>,
      );
      const errorEl = screen.getByText('Invalid credentials provided.');
      expect(errorEl).toHaveClass('text-danger');
    });

    it('applies bg-danger/10 class to the error container', () => {
      render(
        <AuthCard title="Welcome Back" subtitle="Log in to continue" error="Invalid credentials provided.">
          <div />
        </AuthCard>,
      );
      const errorEl = screen.getByText('Invalid credentials provided.');
      expect(errorEl).toHaveClass('bg-danger/10');
    });
  });

  // ── Test Case 3: Children Composition ──────────────────────────────────────

  describe('Test Case 3 — Children composition', () => {
    it('renders the child element inside the card wrapper', () => {
      render(
        <AuthCard title="Welcome Back" subtitle="Log in to continue" error={null}>
          <form data-testid="login-form">
            <input />
          </form>
        </AuthCard>,
      );
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('nests the child form inside the card surface div', () => {
      render(
        <AuthCard title="Welcome Back" subtitle="Log in to continue" error={null}>
          <form data-testid="login-form">
            <input />
          </form>
        </AuthCard>,
      );
      const form = screen.getByTestId('login-form');
      // The form must be a descendant of the surface container (bg-surface class)
      const surfaceContainer = document.querySelector('.bg-surface');
      expect(surfaceContainer).toContainElement(form);
    });

    it('applies a custom maxWidthClassName to the surface container', () => {
      render(
        <AuthCard title="Welcome Back" subtitle="Log in to continue" error={null} maxWidthClassName="max-w-lg">
          <div />
        </AuthCard>,
      );
      const surfaceContainer = document.querySelector('.max-w-lg');
      expect(surfaceContainer).toBeInTheDocument();
    });

    it('defaults to max-w-md when maxWidthClassName is omitted', () => {
      render(
        <AuthCard title="Welcome Back" subtitle="Log in to continue" error={null}>
          <div />
        </AuthCard>,
      );
      const surfaceContainer = document.querySelector('.max-w-md');
      expect(surfaceContainer).toBeInTheDocument();
    });
  });
});
