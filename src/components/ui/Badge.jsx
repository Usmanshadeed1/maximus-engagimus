/**
 * Badge Component
 * 
 * Small status indicator with multiple variants and sizes.
 */

import { forwardRef } from 'react';

// Badge variants
const variants = {
  primary: 'bg-primary-100 text-primary-800',
  secondary: 'bg-gray-100 text-gray-800',
  success: 'bg-success-100 text-success-800',
  warning: 'bg-warning-100 text-warning-800',
  error: 'bg-error-100 text-error-800',
  info: 'bg-blue-100 text-blue-800',
  outline: 'bg-transparent border border-gray-300 text-gray-700',
  'outline-primary': 'bg-transparent border border-primary-300 text-primary-700',
};

// Badge sizes
const sizes = {
  xs: 'px-1.5 py-0.5 text-xs',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-sm',
};

const Badge = forwardRef(function Badge(
  {
    children,
    variant = 'secondary',
    size = 'md',
    rounded = 'full',
    dot = false,
    removable = false,
    onRemove,
    className = '',
    ...props
  },
  ref
) {
  // Rounded options
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <span
      ref={ref}
      className={`
        inline-flex items-center font-medium
        ${variants[variant]}
        ${sizes[size]}
        ${roundedClasses[rounded]}
        ${className}
      `}
      {...props}
    >
      {/* Dot indicator */}
      {dot && (
        <span
          className={`
            w-1.5 h-1.5 rounded-full mr-1.5
            ${variant === 'success' ? 'bg-success-500' : ''}
            ${variant === 'warning' ? 'bg-warning-500' : ''}
            ${variant === 'error' ? 'bg-error-500' : ''}
            ${variant === 'primary' ? 'bg-primary-500' : ''}
            ${variant === 'secondary' || variant === 'outline' ? 'bg-gray-500' : ''}
            ${variant === 'info' ? 'bg-blue-500' : ''}
          `}
        />
      )}

      {children}

      {/* Remove button */}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 -mr-0.5 h-4 w-4 inline-flex items-center justify-center rounded-full hover:bg-black/10 focus:outline-none"
          aria-label="Remove"
        >
          <svg
            className="h-3 w-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
});

// Priority badge helper
Badge.Priority = function PriorityBadge({ priority, ...props }) {
  const priorityConfig = {
    high: { variant: 'error', label: 'High' },
    medium: { variant: 'warning', label: 'Medium' },
    low: { variant: 'secondary', label: 'Low' },
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <Badge variant={config.variant} dot {...props}>
      {config.label}
    </Badge>
  );
};

// Status badge helper
Badge.Status = function StatusBadge({ active, activeLabel = 'Active', inactiveLabel = 'Inactive', ...props }) {
  return (
    <Badge variant={active ? 'success' : 'secondary'} dot {...props}>
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
};

// Relevance badge helper
Badge.Relevance = function RelevanceBadge({ level, className = '', ...rest }) {
  const relevanceConfig = {
    high: { variant: 'success', label: 'High Match' },
    medium: { variant: 'warning', label: 'Medium Match' },
    low: { variant: 'secondary', label: 'Low Match' },
  };

  const config = relevanceConfig[level] || relevanceConfig.medium;

  // Use more muted light-mode backgrounds and slightly less-saturated text for readability
  const customClass = level === 'medium'
    ? '!bg-black !text-white dark:bg-[var(--card-soft)] dark:text-gray-200 border border-gray-200 dark:border-gray-700 h-8 px-3 flex items-center'
    : level === 'high'
    ? 'bg-green-100 text-green-700 dark:bg-[var(--card-soft)] dark:text-gray-200 border border-gray-200 dark:border-gray-700 h-8 px-3 flex items-center'
    : level === 'low'
    ? 'bg-orange-100 text-orange-700 dark:bg-[var(--card-soft)] dark:text-gray-200 border border-gray-200 dark:border-gray-700 h-8 px-3 flex items-center'
    : '';

  const finalClass = `${customClass} leading-tight ${className}`.trim();

  return (
    <Badge variant={config.variant} className={finalClass} {...rest}>
      {config.label}
    </Badge>
  );
};

export default Badge;
