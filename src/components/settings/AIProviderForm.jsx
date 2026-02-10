/**
 * AI Provider Form Component
 * 
 * Form for adding and editing AI provider configurations.
 */

import { useState } from 'react';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Button, Input, TextArea, Toggle, Dropdown } from '../ui';
import { DEFAULT_PROVIDERS } from '../../lib/ai';

// Provider templates for quick setup
const PROVIDER_TEMPLATES = DEFAULT_PROVIDERS.map(p => ({
  value: p.provider_name,
  label: p.provider_name,
  ...p,
}));

export default function AIProviderForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}) {
  const [formData, setFormData] = useState({
    provider_name: initialData?.provider_name || '',
    api_base_url: initialData?.api_base_url || '',
    api_key_encrypted: '', // Never pre-fill API key for security
    model_name: initialData?.model_name || '',
    is_free: initialData?.is_free ?? false,
    is_active: initialData?.is_active ?? true,
    fallback_order: initialData?.fallback_order || 999,
    notes: initialData?.notes || '',
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Update field
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Apply template
  const applyTemplate = (templateName) => {
    const template = PROVIDER_TEMPLATES.find(t => t.value === templateName);
    if (template) {
      setFormData(prev => ({
        ...prev,
        provider_name: template.provider_name,
        api_base_url: template.api_base_url,
        model_name: template.model_name,
        is_free: template.is_free,
        notes: template.notes,
      }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.provider_name.trim()) {
      newErrors.provider_name = 'Provider name is required';
    }

    if (!formData.api_base_url.trim()) {
      newErrors.api_base_url = 'API base URL is required';
    } else if (!formData.api_base_url.startsWith('http')) {
      newErrors.api_base_url = 'API base URL must start with http:// or https://';
    }

    if (!formData.model_name.trim()) {
      newErrors.model_name = 'Model name is required';
    }

    // API key required for new providers
    if (!isEdit && !formData.api_key_encrypted.trim()) {
      newErrors.api_key_encrypted = 'API key is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      // Only include API key if it was changed
      const submitData = { ...formData };
      if (!submitData.api_key_encrypted) {
        delete submitData.api_key_encrypted;
      }
      await onSubmit(submitData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template selector (only for new providers) */}
      {!isEdit && (
        <div className="bg-gray-50 dark:bg-[#3b4cca52] rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Quick Setup
          </label>
          <Dropdown
            placeholder="Select a provider template..."
            options={PROVIDER_TEMPLATES}
            value=""
            onChange={applyTemplate}
            helper="Select a template to auto-fill provider details"
          />
        </div>
      )}

      {/* Provider Details */}
      <div className="space-y-4">
        <Input
          label="Provider Name"
          placeholder="e.g., Groq, OpenAI, Anthropic"
          value={formData.provider_name}
          onChange={(e) => updateField('provider_name', e.target.value)}
          error={errors.provider_name}
          required
        />

        <Input
          label="API Base URL"
          placeholder="e.g., https://api.groq.com/openai/v1"
          value={formData.api_base_url}
          onChange={(e) => updateField('api_base_url', e.target.value)}
          error={errors.api_base_url}
          helper="The base URL for the API (without /chat/completions)"
          required
        />

        <div>
          <Input
            label="API Key"
            type={showApiKey ? 'text' : 'password'}
            placeholder={isEdit ? '••••••••••••••••' : 'Enter your API key'}
            value={formData.api_key_encrypted}
            onChange={(e) => updateField('api_key_encrypted', e.target.value)}
            error={errors.api_key_encrypted}
            rightIcon={showApiKey ? EyeOff : Eye}
            onRightIconClick={() => setShowApiKey(!showApiKey)}
            helper={isEdit ? 'Leave blank to keep existing key' : 'Your API key will be encrypted'}
            required={!isEdit}
          />
        </div>

        <Input
          label="Model Name"
          placeholder="e.g., llama-3.3-70b-versatile"
          value={formData.model_name}
          onChange={(e) => updateField('model_name', e.target.value)}
          error={errors.model_name}
          helper="The specific model to use for completions"
          required
        />
      </div>

      {/* Options */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Options</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Active</p>
            <p className="text-xs text-gray-500">Enable this provider for comment generation</p>
          </div>
          <Toggle
            checked={formData.is_active}
            onChange={(checked) => updateField('is_active', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Free Tier</p>
            <p className="text-xs text-gray-500">Mark this provider as having a free tier</p>
          </div>
          <Toggle
            checked={formData.is_free}
            onChange={(checked) => updateField('is_free', checked)}
          />
        </div>

        <Input
          label="Fallback Order"
          type="number"
          min="1"
          value={formData.fallback_order}
          onChange={(e) => updateField('fallback_order', parseInt(e.target.value) || 999)}
          helper="Lower numbers are tried first when the default provider fails"
        />

        <TextArea
          label="Notes"
          placeholder="e.g., Rate limits, pricing info, etc."
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={2}
        />
      </div>

      {/* API Key Sources */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-100 dark:border-primary-800">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-primary-900 dark:text-primary-100">Where to get API keys</h4>
            <ul className="mt-2 text-sm text-primary-800 dark:text-primary-200 space-y-1">
              <li>• <strong>Groq:</strong> console.groq.com/keys (free)</li>
              <li>• <strong>Cerebras:</strong> cloud.cerebras.ai (free)</li>
              <li>• <strong>Google:</strong> makersuite.google.com/app/apikey (free)</li>
              <li>• <strong>OpenRouter:</strong> openrouter.ai/keys (free tier)</li>
              <li>• <strong>Mistral:</strong> console.mistral.ai/api-keys (free)</li>
              <li>• <strong>DeepSeek:</strong> platform.deepseek.com/api_keys</li>
              <li>• <strong>OpenAI:</strong> platform.openai.com/api-keys</li>
              <li>• <strong>Anthropic:</strong> console.anthropic.com</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Save Changes' : 'Add Provider'}
        </Button>
      </div>
    </form>
  );
}
