/**
 * Client Form Component
 * 
 * Form for creating and editing client profiles.
 */

import { useState } from 'react';
import { Button, Input, TextArea, Dropdown } from '../ui';

// Common industries
const INDUSTRIES = [
  'Construction',
  'Real Estate',
  'Home Services',
  'Digital Marketing',
  'E-commerce',
  'Healthcare',
  'Finance',
  'Technology',
  'Education',
  'Food & Beverage',
  'Retail',
  'Automotive',
  'Legal Services',
  'Fitness & Wellness',
  'Travel & Hospitality',
  'Entertainment',
  'Non-Profit',
  'Manufacturing',
  'Professional Services',
  'Other',
];

const industryOptions = INDUSTRIES.map(i => ({ value: i, label: i }));

export default function ClientForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    industry: initialData?.industry || '',
    description: initialData?.description || '',
    voice_prompt: initialData?.voice_prompt || '',
    voice_prompt_with_cta: initialData?.voice_prompt_with_cta || '',
    default_cta: initialData?.default_cta || '',
    target_audience: initialData?.target_audience || '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Update field
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }

    if (!formData.voice_prompt.trim()) {
      newErrors.voice_prompt = 'Voice prompt is required';
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
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
          Basic Information
        </h3>

        <Input
          label="Client Name"
          placeholder="e.g., Acme Construction"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          required
        />

        <Dropdown
          label="Industry"
          placeholder="Select an industry"
          options={industryOptions}
          value={formData.industry}
          onChange={(value) => updateField('industry', value)}
          error={errors.industry}
          searchable
          required
        />

        <TextArea
          label="Description"
          placeholder="Brief description of the client and their business..."
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
          helper="Optional: Helps provide context for comment generation"
        />

        <Input
          label="Target Audience"
          placeholder="e.g., Homeowners in the Pacific Northwest"
          value={formData.target_audience}
          onChange={(e) => updateField('target_audience', e.target.value)}
          helper="Optional: Who does this client want to reach?"
        />
      </div>

      {/* Voice & Style Section */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
          Voice & Style
        </h3>

        <TextArea
          label="Voice Prompt"
          placeholder="Describe the client's brand voice, tone, and style. For example:

'Speak as a knowledgeable but approachable construction expert. Use casual, friendly language while demonstrating expertise. Avoid jargon. Be helpful and encouraging. Reference real-world experience when appropriate.'"
          value={formData.voice_prompt}
          onChange={(e) => updateField('voice_prompt', e.target.value)}
          error={errors.voice_prompt}
          rows={5}
          required
          helper="This is the core personality guide for generating comments"
        />

        <TextArea
          label="Voice Prompt (with CTA)"
          placeholder="Same as above, but include guidance for soft promotional content. For example:

'...When appropriate, subtly mention that our team at [Client Name] can help with projects like this. Don't be pushy - focus on being genuinely helpful first.'"
          value={formData.voice_prompt_with_cta}
          onChange={(e) => updateField('voice_prompt_with_cta', e.target.value)}
          rows={4}
          helper="Optional: Used when 'Include CTA' is enabled in the generator"
        />

        <Input
          label="Default Call-to-Action"
          placeholder="e.g., Visit acmeconstruction.com for a free consultation"
          value={formData.default_cta}
          onChange={(e) => updateField('default_cta', e.target.value)}
          helper="Optional: The soft pitch to include when CTA mode is on"
        />
      </div>

      {/* Tips Section */}
      <div className="bg-primary-50 dark:bg-primary-900/10 rounded-lg p-4 text-sm">
        <h4 className="font-medium text-primary-900 dark:text-primary-200 mb-2">Tips for Great Voice Prompts</h4>
        <ul className="text-primary-700 dark:text-primary-300 space-y-1 list-disc list-inside">
          <li>Be specific about tone (casual, professional, witty, etc.)</li>
          <li>Include what to avoid (jargon, hard sells, etc.)</li>
          <li>Reference the type of expertise to convey</li>
          <li>Mention any personality traits or quirks</li>
          <li>Add 2-3 sample comments after creating the client</li>
        </ul>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Save Changes' : 'Create Client'}
        </Button>
      </div>
    </form>
  );
}
