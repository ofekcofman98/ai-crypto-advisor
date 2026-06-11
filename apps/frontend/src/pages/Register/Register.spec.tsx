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

import Register from './Register';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_CREDENTIALS = {
  name: 'John Doe',
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

describe('Register', () => {

  // ── Test Case 1: Initial Form Setup ─────────────────────────────────────────

  describe('Test Case 1 — Initial form setup', () => {
    it('renders the Full Name input', () => {
      renderRegister();
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    });

    it('renders the Email input', () => {
      renderRegister();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    it('renders the Password input', () => {
      renderRegister();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('renders the submit button labelled "Create Account"', () => {
      renderRegister();
      // The AuthCard title is also "Create Account", so getByText would match
      // both the <h1> and the button.  getByRole('button') is unambiguous and
      // avoids expensive ARIA accessible-name tree traversal for SVG children.
      const btn = screen.getByRole('button');
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent('Create Account');
    });
  });

  // ── Test Case 2: Successful Registration Flow ────────────────────────────────

  describe('Test Case 2 — Successful registration flow', () => {
    it('posts to /auth/register with the entered payload and triggers setAuth', async () => {
      mockApiPost.mockResolvedValueOnce(SUCCESS_RESPONSE);
      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByPlaceholderText('John Doe'), VALID_CREDENTIALS.name);
      await user.type(screen.getByPlaceholderText('you@example.com'), VALID_CREDENTIALS.email);
      await user.type(screen.getByPlaceholderText('••••••••'), VALID_CREDENTIALS.password);
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledOnce();
      });

      expect(mockApiPost).toHaveBeenCalledWith('/auth/register', {
        name: VALID_CREDENTIALS.name,
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

  // ── Test Case 3: Registration Failure Handling ───────────────────────────────

  describe('Test Case 3 — Registration failure handling', () => {
    it('displays the API error message when the server rejects the request', async () => {
      // Simulate an Axios error with a structured response body.
      // axios.isAxiosError() trusts the isAxiosError flag on the thrown value.
      const axiosError = Object.assign(new Error('Email already in use'), {
        isAxiosError: true,
        response: {
          data: { message: 'Email already in use' },
          status: 409,
          statusText: 'Conflict',
          headers: {},
          config: {},
        },
      });
      mockApiPost.mockRejectedValueOnce(axiosError);
      const user = userEvent.setup();
      renderRegister();

      await user.type(screen.getByPlaceholderText('John Doe'), VALID_CREDENTIALS.name);
      await user.type(screen.getByPlaceholderText('you@example.com'), VALID_CREDENTIALS.email);
      await user.type(screen.getByPlaceholderText('••••••••'), VALID_CREDENTIALS.password);
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Email already in use')).toBeInTheDocument();
      });
    });
  });
});
