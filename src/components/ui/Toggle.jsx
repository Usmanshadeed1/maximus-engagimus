/**
 * Toggle Component
 * 
 * Accessible toggle switch for boolean values.
 */

import { forwardRef } from 'react';

const Toggle = forwardRef(function Toggle(
  {
    checked = false,
    onChange,
    disabled = false,
    size = 'md',
    label,
    description,
    className = '',
    id,
    ...props
  },
  ref
) {
  // Size variants
  const sizes = {
    sm: {
      track: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 'translate-x-4',
    },
    md: {
      track: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'h-7 w-14',
      thumb: 'h-6 w-6',
      translate: 'translate-x-7',
    },
  };

  const sizeConfig = sizes[size];

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  const toggleElement = (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative inline-flex flex-shrink-0 cursor-pointer
        rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeConfig.track}
        ${checked ? 'bg-primary-500' : 'bg-white dark:bg-[var(--card-soft)] border border-gray-300 dark:border-gray-700'}
        ${className}
      `}
      {...props}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block rounded-full
          bg-white shadow ring-0
          transition-transform duration-200 ease-in-out
          ${sizeConfig.thumb}
          ${checked ? sizeConfig.translate : 'translate-x-0'}
        `}
      />
    </button>
  );

  // If no label, return just the toggle
  if (!label) {
    return toggleElement;
  }

  // With label wrapper
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">{toggleElement}</div>
      <div className="ml-3">
        <label
          htmlFor={id}
          className={`text-sm font-medium ${
            disabled ? 'text-gray-400' : 'text-gray-900'
          } cursor-pointer`}
          onClick={handleClick}
        >
          {label}
        </label>
        {description && (
          <p className={`text-sm ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
});

export default Toggle;
