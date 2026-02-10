/**
 * Dropdown Component
 * 
 * Custom select dropdown with search and multi-select support.
 */

import { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

const Dropdown = forwardRef(function Dropdown(
  {
    label,
    options = [],
    value,
    onChange,
    placeholder = 'Select an option',
    searchable = false,
    multiple = false,
    disabled = false,
    error,
    helper,
    className = '',
    containerClassName = '',
    fullWidth = true,
    required = false,
    renderOption,
    getOptionLabel = (option) => option.label || option,
    getOptionValue = (option) => option.value ?? option,
  },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const hasError = !!error;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Filter options based on search
  const filteredOptions = searchQuery
    ? options.filter((option) =>
        getOptionLabel(option).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Get display value
  const getDisplayValue = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      const labels = value.map((v) => {
        const option = options.find((o) => getOptionValue(o) === v);
        return option ? getOptionLabel(option) : v;
      });
      return labels.join(', ');
    }

    if (value !== undefined && value !== null && value !== '') {
      const option = options.find((o) => getOptionValue(o) === value);
      return option ? getOptionLabel(option) : value;
    }

    return placeholder;
  };

  // Handle option selection
  const handleSelect = (option) => {
    const optionValue = getOptionValue(option);

    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Check if option is selected
  const isSelected = (option) => {
    const optionValue = getOptionValue(option);
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  // Clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  };

  const hasValue = multiple
    ? Array.isArray(value) && value.length > 0
    : value !== undefined && value !== null && value !== '';

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? 'w-full' : ''} ${containerClassName}`}
    >
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        ref={ref}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full px-3 py-2 text-left
          bg-white dark:bg-[var(--card-soft)] border rounded-md shadow-sm dark:border-gray-700
          focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:bg-gray-100 disabled:cursor-not-allowed
          transition-colors duration-200
          ${hasError
            ? 'border-error-300 focus:ring-error-500 focus:border-error-500'
            : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
          }
          ${className}
        `}
      >
        <span
          className={`block truncate pr-8 text-sm ${
            hasValue ? 'text-gray-900' : 'text-gray-400'
          }`}
        >
          {getDisplayValue()}
        </span>

        {/* Clear button */}
        {hasValue && !disabled && (
          <span
            onClick={handleClear}
            className="absolute inset-y-0 right-8 flex items-center cursor-pointer"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </span>
        )}

        {/* Chevron */}
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[var(--card)] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          {/* Search input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-[#3b4cca52] text-gray-900 dark:text-gray-100"
                  placeholder="Search..."
                />
              </div>
            </div>
          )}

          {/* Options list */}
          <ul className="max-h-60 overflow-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                No options found
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const selected = isSelected(option);
                return (
                  <li
                    key={getOptionValue(option) || index}
                    onClick={() => handleSelect(option)}
                    className={`
                      flex items-center justify-between px-3 py-2 cursor-pointer
                      ${selected ? 'bg-primary-100 dark:bg-primary-900 text-gray-900 dark:text-gray-100' : 'text-gray-900 dark:text-gray-100 hover:bg-primary-50 dark:hover:bg-primary-900/50 hover:text-gray-900 dark:hover:text-gray-100'}
                    `}
                  >
                    {renderOption ? (
                      renderOption(option, selected)
                    ) : (
                      <>
                        <span className="text-sm">{getOptionLabel(option)}</span>
                        {selected && <Check className="h-4 w-4 text-primary-500" />}
                      </>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {/* Error message */}
      {hasError && (
        <p className="mt-1 text-sm text-error-500">{error}</p>
      )}

      {/* Helper text */}
      {!hasError && helper && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
});

export default Dropdown;
