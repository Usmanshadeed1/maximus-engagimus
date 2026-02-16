/**
 * Generator Form Component
 * 
 * Input form for comment generation with all configuration options.
 */

import { useState } from 'react';
import {
  Sparkles,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button, Input, TextArea, Dropdown, Toggle } from '../ui';
import { PLATFORMS } from '../../lib/utils';

// Platform options for dropdown
const PLATFORM_OPTIONS = Object.entries(PLATFORMS).map(([value, info]) => ({
  value,
  label: info.name,
}));

// Number of options
const NUM_OPTIONS = [
  { value: 1, label: '1 option' },
  { value: 2, label: '2 options' },
  { value: 3, label: '3 options' },
  { value: 4, label: '4 options' },
  { value: 5, label: '5 options' },
];

export default function GeneratorForm({
  formData,
  onChange,
  clientOptions,
  providers,
  onGenerate,
  loading,
  hasProvider,
  chatLinks,
  onNoApiGenerate,
  onOpenPromptEditor,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Check if form is valid
  const isValid = formData.clientId && formData.platform && formData.content?.trim();

  // Handle field change
  const handleChange = (field) => (valueOrEvent) => {
    const value = valueOrEvent?.target ? valueOrEvent.target.value : valueOrEvent;
    onChange(field, value);
  };

  // Provider options for dropdown
  const providerOptions = providers
    ?.filter(p => p.is_active && p.api_key_encrypted)
    .map(p => ({
      value: p.id,
      label: `${p.provider_name} - ${p.model_name}${p.is_default ? ' (Default)' : ''}`,
      isDefault: p.is_default,
    })) || [];

  return (
    <div className="space-y-4">
      {/* Client selection */}
      <Dropdown
        label="Client"
        placeholder="Select a client"
        options={clientOptions}
        value={formData.clientId}
        onChange={handleChange('clientId')}
        searchable
        required
        renderOption={(option) => (
          <div>
            <div className="font-medium">{option.label}</div>
            <div className="text-xs text-gray-500">{option.industry}</div>
          </div>
        )}
      />

      {/* Platform selection */}
      <Dropdown
        label="Platform"
        placeholder="Select a platform"
        options={PLATFORM_OPTIONS}
        value={formData.platform}
        onChange={handleChange('platform')}
        required
      />

      {/* Content to respond to */}
      <TextArea
        label="Content to Respond To"
        placeholder="Paste the post, article, or content you want to comment on..."
        value={formData.content}
        onChange={handleChange('content')}
        rows={5}
        required
        helper="This is the content you're responding to (not your comment)"
      />

      {/* Number of options */}
      <Dropdown
        label="Number of Options"
        options={NUM_OPTIONS}
        value={formData.numOptions}
        onChange={handleChange('numOptions')}
      />

      {/* Include CTA toggle */}
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-gray-700">Include Call-to-Action</p>
          <p className="text-xs text-gray-500">Add a soft promotional pitch</p>
        </div>
        <Toggle
          checked={formData.includeCta}
          onChange={handleChange('includeCta')}
        />
      </div>

      {/* AI Provider selection */}
      {hasProvider && providerOptions.length > 0 && (
        <Dropdown
          label="AI Provider"
          placeholder="Select AI provider"
          options={providerOptions}
          value={formData.providerId}
          onChange={handleChange('providerId')}
          helper="Choose which AI provider to use for generation"
        />
      )}

      {/* Advanced options toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        Advanced Options
      </button>

      {/* Advanced options */}
      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          {/* Existing comments */}
          <TextArea
            label="Existing Comments"
            placeholder="Paste any existing comments to avoid repetition..."
            value={formData.existingComments}
            onChange={handleChange('existingComments')}
            rows={3}
            helper="Optional: AI will avoid similar phrasing"
          />

          {/* Poster info */}
          <Input
            label="Poster Information"
            placeholder="e.g., John Smith, CEO of TechCorp"
            value={formData.posterInfo}
            onChange={handleChange('posterInfo')}
            helper="Optional: Context about who posted the content"
          />

          {/* Hashtags */}
          <Input
            label="Hashtags"
            placeholder="e.g., #marketing #digital #growth"
            value={formData.hashtags}
            onChange={handleChange('hashtags')}
            helper="Optional: Hashtags used in the original post"
          />
        </div>
      )}

      {/* Generate button */}
      <div className="pt-4 border-t border-gray-200">
        {hasProvider ? (
          <Button
            onClick={onGenerate}
            loading={loading}
            disabled={!isValid}
            fullWidth
            leftIcon={Sparkles}
          >
            Generate Comments
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              No API configured. Use "No API" mode:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {chatLinks.slice(0, 4).map((link) => (
                <Button
                  key={link.id}
                  variant="secondary"
                  onClick={() => onNoApiGenerate(link)}
                  disabled={!isValid}
                  size="sm"
                  rightIcon={ExternalLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-warning-300 rounded-md text-sm font-medium text-warning-700 hover:bg-warning-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm dark:bg-[var(--card-soft)] dark:border-gray-700 dark:text-gray-200 dark:hover:bg-[var(--card)] dark:disabled:opacity-100 dark:disabled:bg-[var(--card-soft)] dark:disabled:border-gray-700"
                >
                  {link.name}
                </Button>
              ))}
            </div>

            {/* Single copy button for No-API mode */}
            <div className="pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNoApiGenerate(null)}
                disabled={!isValid}
                leftIcon={Copy}
                className="w-full shadow-sm dark:bg-[var(--card-soft)] dark:border-gray-700 dark:text-gray-200 dark:disabled:opacity-100 dark:disabled:bg-[var(--card-soft)] dark:disabled:border-gray-700"
              >
                Copy Prompt Only
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Copies prompt to clipboard and opens AI chat (choose a chat provider above to open)
            </p>
          </div>
        )}
      </div>

      {/* Quick copy prompt button (even with API) */}
      {hasProvider && (
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenPromptEditor}
            disabled={!isValid}
            leftIcon={Copy}
            className="w-full"
          >
            Preview & Edit Prompt
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNoApiGenerate(null)}
            disabled={!isValid}
            leftIcon={Copy}
            className="w-full"
          >
            Copy Prompt Only
          </Button>
        </>
      )}
    </div>
  );
}
