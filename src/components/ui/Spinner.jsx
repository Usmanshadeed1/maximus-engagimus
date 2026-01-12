/**
 * Spinner Component
 * 
 * Loading spinner with size and color variants.
 */

import { forwardRef } from 'react';

// Size variants
const sizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

// Pixel fallback sizes (width/height) when utility classes aren't applied
const pxSizes = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

// Color variants
const colors = {
  primary: 'text-primary-500',
  white: 'text-white',
  gray: 'text-gray-400',
  current: 'text-current',
};

const Spinner = forwardRef(function Spinner(
  {
    size = 'md',
    color = 'primary',
    className = '',
    label = 'Loading',
    ...props
  },
  ref
) {
  return (
    <svg
      ref={ref}
      className={`animate-spin spinner-fallback ${sizes[size]} ${colors[color]} ${className}`}
      width={pxSizes[size]}
      height={pxSizes[size]}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label={label}
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
});

// Full page spinner
Spinner.FullPage = function FullPageSpinner({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-black/60 backdrop-blur-sm z-50">
      <div className="text-center">
        {/* Primary spinner (uses classes) */}
        <Spinner size="xl" aria-hidden="true" />

        {message && (
          <p className="mt-4 text-gray-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
};

// Inline spinner with text
Spinner.Inline = function InlineSpinner({
  size = 'sm',
  color = 'current',
  text,
  className = '',
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Spinner size={size} color={color} />
      {text && <span>{text}</span>}
    </span>
  );
};

// Overlay spinner for containers
Spinner.Overlay = function OverlaySpinner({ message }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/60 backdrop-blur-sm rounded-lg z-10">
      <div className="text-center">
        <Spinner size="lg" />
        {message && (
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
};

export default Spinner;
