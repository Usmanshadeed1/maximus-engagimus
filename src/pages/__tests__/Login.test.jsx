import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

// Mock useAuth from AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
    resetPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    error: null,
    clearError: vi.fn(),
  }),
}));

import Login from '../Login';

describe('Login', () => {
  it('renders and submits sign in', async () => {
    const user = userEvent.setup();
    render(<Login />);
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn).toBeTruthy();

    await user.click(btn);
    // signIn is mocked; ensure no errors are thrown and UI remains stable
    expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
  });

  it('has expected content and links', () => {
    localStorage.setItem('theme', 'light');
    render(<Login />);
    // There may be multiple headings due to portal renders; ensure at least one exists
    expect(screen.getAllByRole('heading', { level: 1 }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByPlaceholderText('you@example.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /sign in/i }).length).toBeGreaterThanOrEqual(1);
    localStorage.removeItem('theme');
  });
});
