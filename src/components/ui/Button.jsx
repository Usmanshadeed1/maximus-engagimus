/**
 * Button Component
 * 
 * Reusable button with multiple variants, sizes, and states.
 */

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

// Button variants
const variants = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary-500',
  danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-primary-500',
  link: 'bg-transparent text-primary-500 hover:text-primary-600 hover:underline p-0 focus:ring-0',
};

// Button sizes
const sizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
  xl: 'px-6 py-3 text-base',
};

// Icon sizes to match button sizes
const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-5 w-5',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-md shadow-sm
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    transform-gpu motion-safe:transition-transform motion-safe:transition-shadow duration-150
    active:scale-95 active:shadow-sm hover:shadow-md
    motion-reduce:transition-none
  `; 

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading ? 'true' : 'false'}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <>
          <Loader2
            className={`${iconSizes[size]} animate-spin motion-reduce:animate-none mr-2`}
            aria-hidden="true"
          />
          <span className="sr-only">Loading</span>
        </>
      )}

      {/* Left icon */}
      {!loading && LeftIcon && (
        <LeftIcon className={`${iconSizes[size]} mr-2`} aria-hidden="true" />
      )}

      {/* Button text */}
      <span className="flex items-center gap-2">
        {children}
      </span>

      {/* Right icon */}
      {RightIcon && (
        <RightIcon className={`${iconSizes[size]} ml-2`} aria-hidden="true" />
      )}
    </button>
  );
});

export default Button;
