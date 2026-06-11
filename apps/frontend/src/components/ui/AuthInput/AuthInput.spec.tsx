import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AuthInput from './AuthInput';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthInput', () => {

  // ── Test Case 1: Basic Rendering ────────────────────────────────────────────

  describe('Test Case 1 — Basic rendering', () => {
    it('renders the label text', () => {
      render(
        <AuthInput
          label="Email Address"
          icon={<span data-testid="input-icon" />}
        />,
      );
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('renders the icon element inside its container', () => {
      render(
        <AuthInput
          label="Email Address"
          icon={<span data-testid="input-icon" />}
        />,
      );
      const icon = screen.getByTestId('input-icon');
      expect(icon).toBeInTheDocument();
      // The icon lives inside the absolute-positioned container
      const iconWrapper = icon.parentElement;
      expect(iconWrapper).toHaveClass('absolute');
    });

    it('renders an input element', () => {
      render(
        <AuthInput
          label="Email Address"
          icon={<span data-testid="input-icon" />}
        />,
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  // ── Test Case 2: HTML Attribute Spreading ───────────────────────────────────

  describe('Test Case 2 — HTML attribute spreading', () => {
    it('forwards the type attribute to the underlying input', () => {
      render(
        <AuthInput
          label="Email Address"
          icon={<span />}
          type="email"
          placeholder="enter your email"
        />,
      );
      // email inputs are not exposed as "textbox" role; query by placeholder instead
      const input = screen.getByPlaceholderText('enter your email');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('forwards the placeholder attribute to the underlying input', () => {
      render(
        <AuthInput
          label="Email Address"
          icon={<span />}
          type="email"
          placeholder="enter your email"
        />,
      );
      expect(screen.getByPlaceholderText('enter your email')).toBeInTheDocument();
    });

    it('forwards the disabled attribute and marks the input as disabled', () => {
      render(
        <AuthInput
          label="Email Address"
          icon={<span />}
          type="email"
          placeholder="enter your email"
          disabled={true}
        />,
      );
      expect(screen.getByPlaceholderText('enter your email')).toBeDisabled();
    });
  });

  // ── Test Case 3: User Interaction / Typing ──────────────────────────────────

  describe('Test Case 3 — User interaction (typing)', () => {
    it('reflects typed value in the input element', async () => {
      render(
        <AuthInput
          label="Password"
          icon={<span />}
          type="text"
          placeholder="enter password"
        />,
      );
      const input = screen.getByPlaceholderText('enter password');
      await userEvent.click(input);
      await userEvent.type(input, 'crypto');
      expect(input).toHaveValue('crypto');
    });

    it('fires the onChange handler for each keystroke', async () => {
      const handleChange = vi.fn();
      render(
        <AuthInput
          label="Password"
          icon={<span />}
          type="text"
          placeholder="enter password"
          onChange={handleChange}
        />,
      );
      const input = screen.getByPlaceholderText('enter password');
      await userEvent.click(input);
      await userEvent.type(input, 'crypto');
      // one call per character: c-r-y-p-t-o = 6 keystrokes
      expect(handleChange).toHaveBeenCalledTimes(6);
    });

    it('does not fire onChange when the input is disabled', async () => {
      const handleChange = vi.fn();
      render(
        <AuthInput
          label="Password"
          icon={<span />}
          type="text"
          placeholder="enter password"
          disabled={true}
          onChange={handleChange}
        />,
      );
      const input = screen.getByPlaceholderText('enter password');
      await userEvent.type(input, 'crypto');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});
