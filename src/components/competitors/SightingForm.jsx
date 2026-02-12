/**
 * Sighting Form Component
 * 
 * Form for logging and editing competitor sightings.
 */

import { useState, useEffect } from 'react';
import { Button, Input, TextArea, Dropdown } from '../ui';
import { useSightingNotes } from '../../hooks/useCompetitors';
import { LOCATION_TYPES } from '../../lib/utils';

// Location type options
const LOCATION_TYPE_OPTIONS = Object.entries(LOCATION_TYPES).map(([value, info]) => ({
  value,
  label: info.name,
}));

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High - Very active/influential' },
  { value: 'medium', label: 'Medium - Regular presence' },
  { value: 'low', label: 'Low - Occasional activity' },
];

export default function SightingForm({
  initialData,
  competitors = [],
  preselectedCompetitor,
  onSubmit,
  onCancel,
  isEdit = false,
}) {
  const { noteOptions } = useSightingNotes();

  const [formData, setFormData] = useState({
    competitor_id: initialData?.competitor_id || preselectedCompetitor?.id || '',
    location_type: initialData?.location_type || 'forum',
    location_name: initialData?.location_name || '',
    location_url: initialData?.location_url || '',
    priority: initialData?.priority || 'medium',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Update competitor if preselected changes
  useEffect(() => {
    if (preselectedCompetitor && !formData.competitor_id) {
      setFormData(prev => ({ ...prev, competitor_id: preselectedCompetitor.id }));
    }
  }, [preselectedCompetitor]);

  // Competitor options
  const competitorOptions = competitors.map(c => ({
    value: c.id,
    label: c.name,
  }));

  // Update field
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Add predefined note
  const addPredefinedNote = (noteText) => {
    const currentNotes = formData.notes;
    const newNotes = currentNotes
      ? `${currentNotes}\n${noteText}`
      : noteText;
    updateField('notes', newNotes);
  };

  // Validate
  const validate = () => {
    const newErrors = {};

    if (!formData.competitor_id) {
      newErrors.competitor_id = 'Please select a competitor';
    }

    if (!formData.location_name.trim()) {
      newErrors.location_name = 'Location name is required';
    }

    if (formData.location_url && !formData.location_url.startsWith('http')) {
      newErrors.location_url = 'URL must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        last_seen_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Competitor selection */}
      {!isEdit && (
        <Dropdown
          label="Competitor"
          placeholder="Select competitor"
          options={competitorOptions}
          value={formData.competitor_id}
          onChange={(value) => updateField('competitor_id', value)}
          error={errors.competitor_id}
          searchable
          required
          disabled={!!preselectedCompetitor}
        />
      )}

      {/* Location type */}
      <Dropdown
        label="Location Type"
        options={LOCATION_TYPE_OPTIONS}
        value={formData.location_type}
        onChange={(value) => updateField('location_type', value)}
        required
      />

      {/* Location name */}
      <Input
        label="Location Name"
        placeholder="e.g., Home Improvement Pros (Facebook Group)"
        value={formData.location_name}
        onChange={(e) => updateField('location_name', e.target.value)}
        error={errors.location_name}
        required
        helper="The name of the group, forum, or community"
      />

      {/* Location URL */}
      <Input
        label="URL"
        placeholder="https://..."
        value={formData.location_url}
        onChange={(e) => updateField('location_url', e.target.value)}
        error={errors.location_url}
        helper="Optional: Link to the location"
      />

      {/* Priority */}
      <Dropdown
        label="Priority"
        options={PRIORITY_OPTIONS}
        value={formData.priority}
        onChange={(value) => updateField('priority', value)}
        helper="How important is this location for engagement?"
      />

      {/* Notes */}
      <div>
        <TextArea
          label="Notes"
          placeholder="Any observations about their activity..."
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
        />

        {/* Predefined notes */}
        {noteOptions.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quick add:</p>
            <div className="flex flex-wrap gap-1">
              {noteOptions.slice(0, 6).map((note, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addPredefinedNote(note.value)}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                >
                  {note.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {isEdit ? 'Save Changes' : 'Log Sighting'}
        </Button>
      </div>
    </form>
  );
}
