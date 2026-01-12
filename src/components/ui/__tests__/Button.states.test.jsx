import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from '../Button';

describe('Button - states & classes', () => {
  it('includes active and focus classes for micro-interactions', () => {
    render(<Button variant="primary">Hello</Button>);
    const btn = screen.getByRole('button', { name: /hello/i });

    // Tailwind utility classes for interaction states should be present in the className
    expect(btn.className).toContain('active:scale-95');
    expect(btn.className).toContain('hover:shadow-md');
    expect(btn.className).toContain('focus-visible:ring-2');
  });

  it('snapshot contains state classes', () => {
    const { container } = render(<Button variant="primary">Snapshot</Button>);
    expect(container).toMatchSnapshot();
  });
});
