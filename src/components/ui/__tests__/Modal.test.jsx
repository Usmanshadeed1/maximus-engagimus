import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import Modal from '../Modal';

describe('Modal', () => {
  test('renders title and content when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Title">
        <div>Body content</div>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Test Title')).toBeTruthy();
    expect(screen.getByText('Body content')).toBeTruthy();
  });

  test('closes on escape key', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="X" />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  test('backdrop click closes modal', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="X">
        <button>Inner</button>
      </Modal>
    );

    const backdrops = document.querySelectorAll('div[aria-hidden="true"]');
    const backdrop = backdrops[backdrops.length - 1];
    // Simulate click on backdrop
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  test('traps focus within modal', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={() => {}} title="Focus Test">
        <button>One</button>
        <button>Two</button>
      </Modal>
    );

    const first = screen.getByText('One');
    const second = screen.getByText('Two');

    // focus first
    first.focus();
    expect(document.activeElement).toBe(first);

    // Tab to next (use keydown to trigger our handler)
    fireEvent.keyDown(document, { key: 'Tab' });
    const modal = first.closest('div[role="dialog"]');
    const closeBtn = modal && modal.querySelector('[aria-label="Close modal"]');
    // Active element should be one of the modal's focusable elements
    expect([first, second, closeBtn].includes(document.activeElement)).toBe(true);

    // Tab a second time - focus should still remain inside modal's focusable set
    fireEvent.keyDown(document, { key: 'Tab' });
    expect([first, second, closeBtn].includes(document.activeElement)).toBe(true);
  });
});