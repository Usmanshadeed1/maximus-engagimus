/**
 * AI Provider Card Component
 * 
 * Displays an AI provider with status, actions, and quick controls.
 */

import { useState } from 'react';
import {
  MoreVertical,
  Edit,
  Trash2,
  Star,
  StarOff,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { Badge, Toggle } from '../ui';

export default function AIProviderCard({
  provider,
  onEdit,
  onDelete,
  onSetDefault,
  onToggleActive,
  onTest,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Handle test
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest();
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  // Check if provider has API key configured
  const hasApiKey = !!provider.api_key_encrypted;

  return (
    <div
      className={`
        bg-white dark:bg-[var(--card)] rounded-lg border p-4 shadow-sm
        ${provider.is_default ? 'border-primary-300 ring-1 ring-primary-100 dark:ring-primary-500/20' : 'border-gray-200 dark:border-gray-700'}
        ${!provider.is_active ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        {/* Left side: Provider info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{provider.provider_name}</h3>
            {provider.is_default && (
              <Badge variant="primary" size="xs">
                <Star className="h-3 w-3 mr-1" />
                Default
              </Badge>
            )}
            {provider.is_free && (
              <Badge variant="success" size="xs">Free</Badge>
            )}
            {!hasApiKey && (
              <Badge variant="warning" size="xs">No API Key</Badge>
            )}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
            {provider.model_name}
          </p>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
            {provider.api_base_url}
          </p>

          {provider.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
              {provider.notes}
            </p>
          )}

          {/* Test result */}
          {testResult && (
            <div
              className={`
                flex items-center gap-2 mt-2 text-sm
                ${testResult.success ? 'text-success-600' : 'text-error-600'}
              `}
            >
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {testResult.message}
            </div>
          )}
        </div>

        {/* Right side: Controls */}
        <div className="flex items-center gap-3 ml-4">
          {/* Test button */}
          <button
            onClick={handleTest}
            disabled={testing || !hasApiKey}
            className={`
              p-2 rounded-md transition-colors
              ${testing ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={hasApiKey ? 'Test connection' : 'Add API key to test'}
          >
            {testing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>

          {/* Active toggle */}
          <Toggle
            checked={provider.is_active}
            onChange={onToggleActive}
            size="sm"
          />

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {menuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                {/* Menu */}
                <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-[var(--card)] rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>

                  {!provider.is_default && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onSetDefault();
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                    >
                      <Star className="h-4 w-4" />
                      Set as Default
                    </button>
                  )}

                  <hr className="my-1 border-gray-200" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fallback order indicator */}
      {!provider.is_default && provider.is_active && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Zap className="h-3 w-3" />
            Fallback order: {provider.fallback_order}
          </div>
        </div>
      )}
    </div>
  );
}
