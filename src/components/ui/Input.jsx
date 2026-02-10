/**
 * Input Component
 * 
 * Text input with label, helper text, error state, and icon support.
 */

import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helper,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    onRightIconClick,
    className = '',
    containerClassName = '',
    size = 'md',
    fullWidth = true,
    required = false,
    ...props
  },
  ref
) {
  // Size variants
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-5 w-5',
  };

  const hasError = !!error;

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

      {/* Input wrapper */}
      <div className="relative">
        {/* Left icon */}
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className={`${iconSizes[size]} text-gray-400`} />
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          className={`
            block border rounded-md shadow-sm
            placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors duration-200
            dark:bg-[var(--card-soft)] dark:border-gray-700 dark:text-gray-200
            shadow-sm
            ${sizes[size]}
            ${fullWidth ? 'w-full' : ''}
            ${LeftIcon ? 'pl-10' : ''}
            ${RightIcon ? 'pr-10' : ''}
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

        {/* Right icon */}
        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {onRightIconClick ? (
              <button
                type="button"
                onClick={onRightIconClick}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                <RightIcon className={iconSizes[size]} />
              </button>
            ) : (
              <RightIcon className={`${iconSizes[size]} text-gray-400`} />
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p id={`${props.id}-error`} className="mt-1 text-sm text-error-500">
          {error}
        </p>
      )}

      {/* Helper text */}
      {!hasError && helper && (
        <p id={`${props.id}-helper`} className="mt-1 text-sm text-gray-500">
          {helper}
        </p>
      )}
    </div>
  );
});

export default Input;
