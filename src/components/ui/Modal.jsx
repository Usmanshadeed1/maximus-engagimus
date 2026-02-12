/**
 * Modal Component
 * 
 * Accessible modal dialog with backdrop, animations, and size options.
 */

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Modal sizes
const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  ariaLabel,
  children,
  size = 'md',
  showClose = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
  className = '',
}) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  // Helper: get focusable elements within modal
  const getFocusableElements = (root) => {
    if (!root) return [];
    const selectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex="-1"])',
    ];
    // Don't rely on layout-related properties (offsetParent) since jsdom doesn't implement layout.
    return Array.from(root.querySelectorAll(selectors.join(',')));
  };

  // Combined keydown handler: Escape to close + Tab focus trap
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusableElements(modalRef.current);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const idx = focusable.indexOf(document.activeElement);

        // Programmatically move focus because jsdom doesn't perform native tabbing
        if (e.shiftKey) {
          e.preventDefault();
          if (idx === -1 || idx === 0) {
            last.focus();
          } else {
            focusable[idx - 1].focus();
          }
        } else {
          e.preventDefault();
          if (idx === -1 || idx === focusable.length - 1) {
            first.focus();
          } else {
            focusable[idx + 1].focus();
          }
        }
      }
    },
    [closeOnEscape, onClose]
  );

  // Respect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Focus management and event listeners
  useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previousActiveElement.current = document.activeElement;

      // Focus the modal container for screen readers
      modalRef.current?.focus();

      // Add keydown listener for escape and tab trapping
      document.addEventListener('keydown', handleKeyDown);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';

        // Restore focus
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, handleKeyDown]);

  // Don't render if not open
  if (!isOpen) return null;

  // Render modal in portal
  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div
        className="flex min-h-full items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        {/* Modal content */}
        <div
          ref={modalRef}
          tabIndex={-1}
          {...(title ? { 'aria-labelledby': 'modal-title' } : { 'aria-label': ariaLabel || description || 'Dialog' })}
          className={`
            relative w-full ${sizes[size]}
            bg-white dark:bg-[var(--card)] rounded-lg shadow-xl
            transform transition-all
            ${!prefersReducedMotion ? 'animate-in fade-in zoom-in-95 duration-200' : ''}
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showClose) && (
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{description}</p>
                )}
              </div>
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-4 sm:p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-soft)] rounded-b-lg">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Confirm modal helper component
Modal.Confirm = function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const variantClasses = {
    danger: 'bg-error-500 hover:bg-error-600 focus:ring-error-500',
    primary: 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500',
    warning: 'bg-warning-500 hover:bg-warning-600 focus:ring-warning-500',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[var(--card)] border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${variantClasses[variant]}`}
          >
            {loading ? 'Loading...' : confirmText}
          </button>
        </>
      }
    >
      <p className="text-gray-600 dark:text-gray-300">{message}</p>
    </Modal>
  );
};
