/**
 * Prompt Editor Modal
 * 
 * Allows users to preview and edit the full rendered prompt before generation.
 * Edits are one-time use only and don't affect the saved system prompt.
 */

import { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Button, TextArea, toast, Spinner } from '../ui';

export default function PromptEditorModal({
  isOpen,
  fullClient,
  formData,
  onSave,
  onClose,
  generatePromptForClipboard,
}) {
  const [editedPrompt, setEditedPrompt] = useState('');
  const [copiedRecently, setCopiedRecently] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize modal with fresh prompt on open
  useEffect(() => {
    if (isOpen && !isInitialized && fullClient && formData) {
      const initializePrompt = async () => {
        setIsLoading(true);
        const freshPrompt = await generatePromptForClipboard({
          client: fullClient,
          platform: formData.platform,
          content: formData.content,
          existingComments: formData.existingComments,
          posterInfo: formData.posterInfo,
          hashtags: formData.hashtags,
          numOptions: formData.numOptions,
          includeCta: formData.includeCta,
        });
        if (freshPrompt) {
          setEditedPrompt(freshPrompt);
          setIsInitialized(true);
        }
        setIsLoading(false);
      };
      initializePrompt();
    }
  }, [isOpen, isInitialized, fullClient, formData, generatePromptForClipboard]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedPrompt);
      setCopiedRecently(true);
      toast.success('Prompt copied to clipboard');
      setTimeout(() => setCopiedRecently(false), 2000);
    } catch (err) {
      toast.error('Failed to copy prompt');
    }
  };

  const handleSave = () => {
    onSave(editedPrompt);
    setEditedPrompt(''); // Reset for next modal open
    setIsInitialized(false);
  };

  const handleClose = () => {
    setEditedPrompt(''); // Reset edited content
    setIsInitialized(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-lg bg-white dark:bg-gray-900 shadow-lg">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Preview & Edit Prompt
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Edit the prompt below before generation. Your edits are one-time use only and won't affect the saved system prompt.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Spinner size="lg" className="mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading prompt...</p>
              </div>
            </div>
          ) : (
            <TextArea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              placeholder="Prompt content will appear here..."
              rows={15}
              className="mb-4 font-mono text-sm"
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            Close
          </Button>

          <Button
            variant="secondary"
            onClick={handleCopyToClipboard}
            icon={copiedRecently ? Check : Copy}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {copiedRecently ? 'Copied' : 'Copy'}
          </Button>

          <Button
            onClick={handleSave}
            icon="sparkles"
            disabled={isLoading}
            className="min-w-[100px]"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
