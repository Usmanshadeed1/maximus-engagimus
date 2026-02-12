/**
 * Generator Page
 * 
 * Main interface for generating social media comments.
 */

import { useState, useEffect } from 'react';
import { Sparkles, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { useGenerator } from '../hooks/useGenerator';
import { addClientSampleComment } from '../lib/supabase';
import { useClientSelect } from '../hooks/useClients';
import { useAIProviders, useAIChatLinks } from '../hooks/useAIProviders';
import { Card, Button, Spinner, Badge, Modal, toast } from '../components/ui';
import GeneratorForm from '../components/generator/GeneratorForm';
import CommentOption from '../components/generator/CommentOption';

export default function Generator() {
  const {
    loading,
    error,
    options,
    generationMeta,
    generate,
    markAsUsed,
    copyOption,
    generatePromptForClipboard,
    clear,
    markOptionSaved,
  } = useGenerator();

  const { clients, clientOptions, loading: clientsLoading, getClientById } = useClientSelect();
  const { providers, defaultProvider, hasConfiguredProvider, loading: providersLoading } = useAIProviders();
  const { chatLinks } = useAIChatLinks();

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    platform: '',
    content: '',
    existingComments: '',
    posterInfo: '',
    hashtags: '',
    numOptions: 3,
    includeCta: false,
    providerId: '',
  });

  // Set default provider when available
  useEffect(() => {
    if (defaultProvider && !formData.providerId) {
      setFormData(prev => ({ ...prev, providerId: defaultProvider.id }));
    }
  }, [defaultProvider, formData.providerId]);

  // Handle form change
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle generate
  const handleGenerate = async () => {
    const client = getClientById(formData.clientId);
    await generate({
      client,
      platform: formData.platform,
      content: formData.content,
      existingComments: formData.existingComments,
      posterInfo: formData.posterInfo,
      hashtags: formData.hashtags,
      numOptions: formData.numOptions,
      includeCta: formData.includeCta,
      providerId: formData.providerId || undefined,
    });
  };

  // Handle "No API" mode
  const handleNoApiGenerate = async (chatLink) => {
    const client = getClientById(formData.clientId);
    const prompt = await generatePromptForClipboard({
      client,
      platform: formData.platform,
      content: formData.content,
      existingComments: formData.existingComments,
      posterInfo: formData.posterInfo,
      hashtags: formData.hashtags,
      numOptions: formData.numOptions,
      includeCta: formData.includeCta,
    });

    if (!prompt) return;

    // Prompt is copied by generatePromptForClipboard; open chat if provided.
    if (chatLink) {
      toast.info('Opening chat — prompt is on your clipboard (paste with Ctrl/⌘+V)');
      window.open(chatLink.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle copy option
  const handleCopy = async (option) => {
    await copyOption(option.text);
  };

  // Handle mark as used
  const handleMarkUsed = async (option, index) => {
    await markAsUsed(index, option.style);
    await copyOption(option.text);
  };

  // Save modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveText, setSaveText] = useState('');
  const [saveIndex, setSaveIndex] = useState(null);
  const [saving, setSaving] = useState(false);

  // Open save modal
  const handleOpenSaveModal = (option, index) => {
    setSaveText(option.text || '');
    setSaveIndex(index);
    setSaveModalOpen(true);
  };

  // Confirm save to client sample comments
  const handleConfirmSave = async () => {
    if (!formData.clientId) {
      toast.error('Please select a client to save this comment to');
      return;
    }

    try {
      setSaving(true);
      await addClientSampleComment(formData.clientId, {
        platform: formData.platform || null,
        comment_text: saveText,
        notes: '',
      });

      // Mark locally
      markOptionSaved(saveIndex);
      toast.success('Saved comment to client samples');
      setSaveModalOpen(false);
    } catch (err) {
      console.error('Failed to save sample comment:', err);
      toast.error('Failed to save comment');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (clientsLoading || providersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // No clients state
  if (clients.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Clients Yet</h2>
          <p className="text-gray-600 mb-6">
            You need to add at least one client before generating comments.
          </p>
          <Button onClick={() => window.location.href = '/clients'}>
            Add Your First Client
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comment Generator</h1>
        <p className="text-gray-600 mt-1">
          Generate authentic, client-specific comments for social media posts
        </p>
      </div>

      {/* No API warning */}
      {!hasConfiguredProvider && (
        <Card className="bg-warning-50 border-warning-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-warning-800">No AI Provider Configured</h3>
              <p className="text-sm text-warning-700 mt-1">
                You can still use "No API" mode to copy prompts and paste them in AI chat interfaces.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {chatLinks.slice(0, 4).map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleNoApiGenerate(link)}
                    disabled={!formData.clientId || !formData.platform || !formData.content}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-warning-300 rounded-md text-sm font-medium text-warning-700 hover:bg-warning-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {link.name}
                    <ExternalLink className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Form */}
        <div>
          <Card>
            <Card.Header>
              <Card.Title>Input</Card.Title>
              <Card.Description>Configure your comment generation</Card.Description>
            </Card.Header>
            
            <GeneratorForm
              formData={formData}
              onChange={handleFormChange}
              clientOptions={clientOptions}
              providers={providers}
              onGenerate={handleGenerate}
              loading={loading}
              hasProvider={hasConfiguredProvider}
              chatLinks={chatLinks}
              onNoApiGenerate={handleNoApiGenerate}
            />
          </Card>
        </div>

        {/* Right column: Results */}
        <div className="space-y-4">
          {/* Results header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Generated Comments
              {options.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({options.length} options)
                </span>
              )}
            </h2>
            {options.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear
              </Button>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <Card className="py-12">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-600">Generating comments...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
              </div>
            </Card>
          )}

          {/* Error state */}
          {error && !loading && (
            <Card className="bg-error-50 border-error-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-error-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-error-800">Generation Failed</h3>
                  <p className="text-sm text-error-700 mt-1">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Empty state */}
          {!loading && !error && options.length === 0 && (
            <Card className="py-12">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Ready to Generate</h3>
                <p className="text-sm text-gray-500">
                  Fill in the form and click "Generate" to create comment options
                </p>
              </div>
            </Card>
          )}

          {/* Results */}
          {!loading && options.length > 0 && (
            <>
              {/* Generation meta */}
              {generationMeta && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Badge variant="outline" size="xs">
                    {generationMeta.provider}
                  </Badge>
                  <span>•</span>
                  <span>{generationMeta.generationTime}ms</span>
                </div>
              )}

              {/* Comment options */}
              <div className="space-y-3">
                {options.map((option, index) => (
                  <CommentOption
                    key={index}
                    option={option}
                    index={index}
                    onCopy={() => handleCopy(option)}
                    onMarkUsed={() => handleMarkUsed(option, index)}
                    onSave={() => handleOpenSaveModal(option, index)}
                  />
                ))}
              </div>

              <Modal
                isOpen={saveModalOpen}
                onClose={() => setSaveModalOpen(false)}
                title="Save Comment to Client"
                description="Edit the comment before saving it to the selected client profile."
                footer={
                  <>
                    <button
                      type="button"
                      onClick={() => setSaveModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-[var(--card-soft)] dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-[var(--card-soft)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmSave}
                      disabled={saving}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 bg-primary-500 hover:bg-primary-600`}
                    >
                      {saving ? 'Saving...' : 'Save to Client'}
                    </button>
                  </>
                }
                >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                  <textarea
                    rows={5}
                    value={saveText}
                    onChange={(e) => setSaveText(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 dark:bg-[var(--card-soft)] dark:text-gray-200 dark:border-gray-700"
                  />
                </div>
              </Modal>

              {/* Tips */}
              <Card padding="sm" className="bg-gray-50 dark:bg-[var(--bg)]">
                <p className="text-xs text-gray-600">
                  <strong>Tip:</strong> Click "Use & Copy" to mark a comment as used and copy it to your clipboard.
                  This helps track which comments you've actually posted.
                </p>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
