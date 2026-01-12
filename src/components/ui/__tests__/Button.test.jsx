import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Button from '../Button';

describe('Button', () => {
  it('renders primary variant and supports loading and aria attributes', async () => {
    const { rerender } = render(<Button variant="primary">Click</Button>);
    const btn = screen.getByRole('button', { name: /click/i });
    expect(btn).toBeTruthy();
    expect(btn.className).toContain('bg-primary-500');

    // loading state
    rerender(<Button variant="primary" loading>Saving...</Button>);
    const loading = screen.getByText(/saving/i);
    expect(loading).toBeTruthy();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    const btn = screen.getByRole('button', { name: /go/i });
    await user.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { container } = render(<Button variant="primary">Snapshot</Button>);
    expect(container).toMatchSnapshot();
  });
});
