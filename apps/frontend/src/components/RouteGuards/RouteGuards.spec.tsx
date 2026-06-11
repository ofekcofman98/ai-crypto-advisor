import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../store/authStore';
import { ProtectedRoute, PublicRoute, OnboardingGuard, DashboardGuard } from './RouteGuards';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ONBOARDED_USER = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  hasCompletedOnboarding: true,
};

const FRESH_USER = {
  id: '2',
  email: 'fresh@example.com',
  name: 'Fresh User',
  hasCompletedOnboarding: false,
};

// ─── Test Utilities ───────────────────────────────────────────────────────────

/**
 * Renders a guard Route inside a MemoryRouter with named sentinel routes for
 * all redirect targets so we can assert navigation outcomes via text content.
 */
function renderGuard(
  guardRoute: React.ReactElement,
  initialPath: string,
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {guardRoute}
        <Route path="/login"       element={<div>Login Page</div>} />
        <Route path="/onboarding"  element={<div>Onboarding Page</div>} />
        <Route path="/dashboard"   element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset Zustand in-memory state and clear the persist layer between tests.
  useAuthStore.setState({ token: null, user: null });
  localStorage.clear();
});

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  it('redirects unauthenticated user (no token/user) to /login', () => {
    renderGuard(
      <Route element={<ProtectedRoute />}>
        <Route path="/secret" element={<div>Secret Content</div>} />
      </Route>,
      '/secret',
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders the outlet when token and user are present', () => {
    useAuthStore.setState({ token: 'valid-token', user: ONBOARDED_USER });

    renderGuard(
      <Route element={<ProtectedRoute />}>
        <Route path="/secret" element={<div>Secret Content</div>} />
      </Route>,
      '/secret',
    );

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('redirects when token is present but user is null', () => {
    useAuthStore.setState({ token: 'orphan-token', user: null });

    renderGuard(
      <Route element={<ProtectedRoute />}>
        <Route path="/secret" element={<div>Secret Content</div>} />
      </Route>,
      '/secret',
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});

// ─── PublicRoute ──────────────────────────────────────────────────────────────

describe('PublicRoute', () => {
  it('renders the outlet when user is not authenticated', () => {
    renderGuard(
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<div>Login Page</div>} />
      </Route>,
      '/login',
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects onboarded user to /dashboard', () => {
    useAuthStore.setState({ token: 'tok', user: ONBOARDED_USER });

    renderGuard(
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<div>Login Page</div>} />
      </Route>,
      '/login',
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects authenticated-but-not-onboarded user to /onboarding', () => {
    useAuthStore.setState({ token: 'tok', user: FRESH_USER });

    renderGuard(
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<div>Login Page</div>} />
      </Route>,
      '/login',
    );

    expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
  });
});

// ─── OnboardingGuard ──────────────────────────────────────────────────────────

describe('OnboardingGuard', () => {
  it('renders the outlet when onboarding is not yet complete', () => {
    useAuthStore.setState({ token: 'tok', user: FRESH_USER });

    renderGuard(
      <Route element={<OnboardingGuard />}>
        <Route path="/onboarding" element={<div>Onboarding Page</div>} />
      </Route>,
      '/onboarding',
    );

    expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
  });

  it('redirects already-onboarded user to /dashboard', () => {
    useAuthStore.setState({ token: 'tok', user: ONBOARDED_USER });

    renderGuard(
      <Route element={<OnboardingGuard />}>
        <Route path="/onboarding" element={<div>Onboarding Page</div>} />
      </Route>,
      '/onboarding',
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Onboarding Page')).not.toBeInTheDocument();
  });
});

// ─── DashboardGuard ───────────────────────────────────────────────────────────

describe('DashboardGuard', () => {
  it('renders the outlet when user has completed onboarding', () => {
    useAuthStore.setState({ token: 'tok', user: ONBOARDED_USER });

    renderGuard(
      <Route element={<DashboardGuard />}>
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Route>,
      '/dashboard',
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('redirects user who has not completed onboarding to /onboarding', () => {
    useAuthStore.setState({ token: 'tok', user: FRESH_USER });

    renderGuard(
      <Route element={<DashboardGuard />}>
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Route>,
      '/dashboard',
    );

    expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
  });

  it('renders the outlet when user is null (no redirect when unauthenticated)', () => {
    // DashboardGuard only redirects when user exists but onboarding is incomplete.
    // If user is null, it falls through to the outlet (ProtectedRoute handles auth).
    renderGuard(
      <Route element={<DashboardGuard />}>
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Route>,
      '/dashboard',
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });
});
