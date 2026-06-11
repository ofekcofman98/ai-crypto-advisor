import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Raise the per-file timeout: when the full suite runs sequentially under
// maxWorkers: 1 on Windows paths with spaces, environment boot + ARIA tree
// traversal can push simple queries past the default 5 s threshold.
vi.setConfig({ testTimeout: 15_000 });

// ─── Hoisted Mocks ────────────────────────────────────────────────────────────
// vi.hoisted runs before module evaluation so the refs are available inside the
// vi.mock factory closures below.

const { mockSetAuth, mockApiPost } = vi.hoisted(() => ({
  mockSetAuth: vi.fn(),
  mockApiPost: vi.fn(),
}));

// ─── Module Mocks ─────────────────────────────────────────────────────────────

vi.mock('../../utils/api', () => ({
  default: { post: mockApiPost },
}));

// useAuthStore is called as a selector hook: useAuthStore((state) => state.setAuth)
// The factory receives the selector and calls it with a minimal state stub.
// Avoid <T> generic syntax in .tsx — OXC parses it as JSX; plain unknown return is sufficient.
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(
    (selector: (s: { setAuth: typeof mockSetAuth }) => unknown) =>
      selector({ setAuth: mockSetAuth }),
  ),
}));

import Login from './Login';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_CREDENTIALS = {
  email: 'john@example.com',
  password: 'password123',
};

const SUCCESS_RESPONSE = {
  data: {
    accessToken: 'fake-jwt',
    user: { id: '1', name: 'John Doe', email: 'john@example.com' },
  },
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockSetAuth.mockClear();
  mockApiPost.mockClear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Login', () => {

  // ── Test Case 1: Initial Render ──────────────────────────────────────────────

  describe('Test Case 1 — Initial render', () => {
    it('renders the Email input', () => {
      renderLogin();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    it('renders the Password input', () => {
      renderLogin();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('renders the submit button labelled "Sign In"', () => {
      renderLogin();
      // getByRole('button') is unambiguous and avoids expensive ARIA
      // accessible-name tree traversal for SVG children (Lucide icons).
      const btn = screen.getByRole('button');
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent('Sign In');
    });
  });

  // ── Test Case 2: Successful Login Flow ───────────────────────────────────────

  describe('Test Case 2 — Successful login flow', () => {
    it('posts to /auth/login with the entered payload and triggers setAuth', async () => {
      mockApiPost.mockResolvedValueOnce(SUCCESS_RESPONSE);
      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByPlaceholderText('you@example.com'), VALID_CREDENTIALS.email);
      await user.type(screen.getByPlaceholderText('••••••••'), VALID_CREDENTIALS.password);
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledOnce();
      });

      expect(mockApiPost).toHaveBeenCalledWith('/auth/login', {
        email: VALID_CREDENTIALS.email,
        password: VALID_CREDENTIALS.password,
      });

      expect(mockSetAuth).toHaveBeenCalledOnce();
      expect(mockSetAuth).toHaveBeenCalledWith(
        SUCCESS_RESPONSE.data.accessToken,
        SUCCESS_RESPONSE.data.user,
      );
    });
  });

  // ── Test Case 3: Login Failure Handling ──────────────────────────────────────

  describe('Test Case 3 — Login failure handling', () => {
    it('displays the API error message when the server rejects the request', async () => {
      // Simulate an Axios error with a structured response body.
      // axios.isAxiosError() trusts the isAxiosError flag on the thrown value.
      const axiosError = Object.assign(new Error('Invalid credentials'), {
        isAxiosError: true,
        response: {
          data: { message: 'Invalid credentials' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: {},
        },
      });
      mockApiPost.mockRejectedValueOnce(axiosError);
      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByPlaceholderText('you@example.com'), VALID_CREDENTIALS.email);
      await user.type(screen.getByPlaceholderText('••••••••'), VALID_CREDENTIALS.password);
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });
});
