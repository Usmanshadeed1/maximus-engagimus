/**
 * TextArea Component
 * 
 * Multi-line text input with label, error state, and character count.
 */

import { forwardRef } from 'react';

const TextArea = forwardRef(function TextArea(
  {
    label,
    error,
    helper,
    className = '',
    containerClassName = '',
    fullWidth = true,
    required = false,
    maxLength,
    showCount = false,
    rows = 4,
    resize = 'vertical',
    value = '',
    ...props
  },
  ref
) {
  const hasError = !!error;
  const currentLength = typeof value === 'string' ? value.length : 0;

  // Resize options
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* TextArea */}
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        maxLength={maxLength}
        className={`
          block px-3 py-2 border rounded-md shadow-sm
          placeholder-gray-400 text-sm
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-gray-100 disabled:cursor-not-allowed
          transition-colors duration-200
          dark:bg-[var(--card-soft)] dark:border-gray-700 dark:text-gray-200
          shadow-sm
          ${fullWidth ? 'w-full' : ''}
          ${resizeClasses[resize]}
          ${hasError
            ? 'border-error-300 text-error-900 focus:ring-error-500 focus:border-error-500'
            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
          }
          ${className}
        `}
        aria-invalid={hasError}
        aria-describedby={
          hasError ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined
        }
        {...props}
      />

      {/* Bottom row: error/helper and character count */}
      <div className="flex justify-between items-start mt-1">
        <div className="flex-1">
          {/* Error message */}
          {hasError && (
            <p id={`${props.id}-error`} className="text-sm text-error-500">
              {error}
            </p>
          )}

          {/* Helper text */}
          {!hasError && helper && (
            <p id={`${props.id}-helper`} className="text-sm text-gray-500">
              {helper}
            </p>
          )}
        </div>

        {/* Character count */}
        {showCount && maxLength && (
          <p
            className={`text-xs ml-2 ${
              currentLength >= maxLength ? 'text-error-500' : 'text-gray-400'
            }`}
          >
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

export default TextArea;
