import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

// Mock useAuth so Header can render without real AuthProvider
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    organization: null,
    signOut: vi.fn(),
  }),
}));

import Header from '../Header';
import { BrowserRouter } from 'react-router-dom';

describe('Header theme toggle', () => {
  it('toggles dark class on documentElement and persists to localStorage', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><Header /></BrowserRouter>);

    const toggle = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggle).toBeTruthy();

    // Ensure starting theme from localStorage is respected
    localStorage.removeItem('theme');

    // Default is dark; first click should switch to light
    await user.click(toggle);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');

    // Clicking again toggles back to dark
    await user.click(toggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
