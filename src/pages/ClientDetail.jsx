/**
 * Client Detail Page
 * 
 * View and edit a single client's profile, keywords, sample comments, and more.
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  X,
  Tag,
  MessageSquare,
  Globe,
  Users,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useClient } from '../hooks/useClients';
import {
  Button,
  Card,
  Badge,
  Modal,
  Input,
  TextArea,
  Dropdown,
  Spinner,
  Toggle,
} from '../components/ui';
import { toast } from '../components/ui/Toast';
import ClientForm from '../components/clients/ClientForm';
import { copyToClipboard, getPlatformInfo } from '../lib/utils';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    client,
    loading,
    error,
    update,
    remove,
    addKeywords,
    removeKeyword,
    addSampleComment,
    removeSampleComment,
    addIndustrySite,
    removeIndustrySite,
    refetch,
  } = useClient(id);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);

  // Form states
  const [newKeywords, setNewKeywords] = useState('');
  const [newSample, setNewSample] = useState({ platform: '', comment_text: '', notes: '' });
  const [newSite, setNewSite] = useState({ site_name: '', site_url: '', site_type: 'forum', notes: '' });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !client) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600 mb-4">Failed to load client</p>
        <Button onClick={refetch}>Try Again</Button>
      </div>
    );
  }

  // Handle client update
  const handleUpdate = async (data) => {
    const { error } = await update(data);
    if (!error) {
      setShowEditModal(false);
    }
  };

  // Handle client deletion
  const handleDelete = async () => {
    const { error } = await remove();
    if (!error) {
      navigate('/clients');
    }
  };

  // Handle adding keywords
  const handleAddKeywords = async () => {
    const keywords = newKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    if (keywords.length === 0) {
      toast.error('Please enter at least one keyword');
      return;
    }

    const { error } = await addKeywords(keywords);
    if (!error) {
      setNewKeywords('');
      setShowKeywordModal(false);
    }
  };

  // Handle adding sample comment
  const handleAddSample = async () => {
    if (!newSample.comment_text.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    const { error } = await addSampleComment(newSample);
    if (!error) {
      setNewSample({ platform: '', comment_text: '', notes: '' });
      setShowSampleModal(false);
    }
  };

  // Handle adding industry site
  const handleAddSite = async () => {
    if (!newSite.site_name.trim()) {
      toast.error('Please enter a site name');
      return;
    }

    const { error } = await addIndustrySite(newSite);
    if (!error) {
      setNewSite({ site_name: '', site_url: '', site_type: 'forum', notes: '' });
      setShowSiteModal(false);
    }
  };

  // Copy voice prompt
  const handleCopyPrompt = async (withCta = false) => {
    const prompt = withCta ? client.voice_prompt_with_cta : client.voice_prompt;
    const success = await copyToClipboard(prompt);
    if (success) {
      toast.success('Voice prompt copied to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/clients"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <Badge.Status active={client.is_active} />
            </div>
            <p className="text-gray-600">{client.industry}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leftIcon={Edit}
            onClick={() => setShowEditModal(true)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            leftIcon={Trash2}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Status toggle */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Active Status</p>
            <p className="text-sm text-gray-500">
              {client.is_active
                ? 'This client appears in the generator and analyzer'
                : 'This client is hidden from active tools'}
            </p>
          </div>
          <Toggle
            checked={client.is_active}
            onChange={(checked) => update({ is_active: checked })}
          />
        </div>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Description */}
          <Card>
            <Card.Header>
              <Card.Title>Description</Card.Title>
            </Card.Header>
            <p className="text-gray-600">
              {client.description || 'No description provided.'}
            </p>
          </Card>

          {/* Voice Prompt */}
          <Card>
            <Card.Header
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Copy}
                  onClick={() => handleCopyPrompt(false)}
                >
                  Copy
                </Button>
              }
            >
              <Card.Title>Voice Prompt</Card.Title>
              <Card.Description>The base personality and style guide</Card.Description>
            </Card.Header>
            <div className="bg-gray-50 dark:bg-[var(--bg)] rounded-md p-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
              {client.voice_prompt || 'No voice prompt set.'}
            </div>
          </Card>

          {/* Voice Prompt with CTA */}
          {client.voice_prompt_with_cta && (
            <Card>
              <Card.Header
                actions={
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={Copy}
                    onClick={() => handleCopyPrompt(true)}
                  >
                    Copy
                  </Button>
                }
              >
                <Card.Title>Voice Prompt (with CTA)</Card.Title>
                <Card.Description>Used when "Include CTA" is enabled</Card.Description>
              </Card.Header>
              <div className="bg-gray-50 dark:bg-[var(--bg)] rounded-md p-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                {client.voice_prompt_with_cta}
              </div>
            </Card>
          )}

          {/* Default CTA */}
          {client.default_cta && (
            <Card>
              <Card.Header>
                <Card.Title>Default Call-to-Action</Card.Title>
              </Card.Header>
              <p className="text-gray-600">{client.default_cta}</p>
            </Card>
          )}

          {/* Target Audience */}
          {client.target_audience && (
            <Card>
              <Card.Header>
                <Card.Title>Target Audience</Card.Title>
              </Card.Header>
              <p className="text-gray-600">{client.target_audience}</p>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Keywords */}
          <Card>
            <Card.Header
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Plus}
                  onClick={() => setShowKeywordModal(true)}
                >
                  Add
                </Button>
              }
            >
              <Card.Title className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Keywords
              </Card.Title>
              <Card.Description>Topics this client is associated with</Card.Description>
            </Card.Header>
            {client.keywords?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {client.keywords.map((keyword) => (
                  <Badge
                    key={keyword.id}
                    variant="secondary"
                    removable
                    onRemove={() => removeKeyword(keyword.id)}
                  >
                    {keyword.keyword}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No keywords added yet.</p>
            )}
          </Card>

          {/* Sample Comments */}
          <Card>
            <Card.Header
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Plus}
                  onClick={() => setShowSampleModal(true)}
                >
                  Add
                </Button>
              }
            >
              <Card.Title className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Sample Comments
              </Card.Title>
              <Card.Description>Examples to match the client's voice</Card.Description>
            </Card.Header>
            {client.sample_comments?.length > 0 ? (
              <div className="space-y-3">
                {client.sample_comments.map((sample) => (
                  <div
                    key={sample.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-[var(--bg)] rounded-md"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">"{sample.comment_text}"</p>
                      {sample.platform && (
                        <p className="text-xs text-gray-500 mt-1">
                          Platform: {getPlatformInfo(sample.platform).name}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeSampleComment(sample.id)}
                      className="p-1 text-gray-400 hover:text-error-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No sample comments added yet.</p>
            )}
          </Card>

          {/* Industry Sites */}
          <Card>
            <Card.Header
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Plus}
                  onClick={() => setShowSiteModal(true)}
                >
                  Add
                </Button>
              }
            >
              <Card.Title className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Industry Sites
              </Card.Title>
              <Card.Description>Relevant platforms for engagement</Card.Description>
            </Card.Header>
            {client.industry_sites?.length > 0 ? (
              <div className="space-y-2">
                {client.industry_sites.map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[var(--bg)] rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{site.site_name}</span>
                      {site.site_url && (
                        <a
                          href={site.site_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 hover:text-primary-600"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" size="xs">
                        {site.site_type}
                      </Badge>
                      <button
                        onClick={() => removeIndustrySite(site.id)}
                        className="p-1 text-gray-400 hover:text-error-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No industry sites added yet.</p>
            )}
          </Card>

          {/* Competitors quick view */}
          <Card>
            <Card.Header
              actions={
                <Link to={`/competitors?client=${id}`}>
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              }
            >
              <Card.Title className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Competitors
              </Card.Title>
            </Card.Header>
            {client.competitors?.length > 0 ? (
              <div className="space-y-2">
                {client.competitors.slice(0, 5).map((competitor) => (
                  <div
                    key={competitor.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{competitor.name}</span>
                    <Badge.Status active={competitor.is_active} />
                  </div>
                ))}
                {client.competitors.length > 5 && (
                  <p className="text-xs text-gray-500">
                    +{client.competitors.length - 5} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No competitors tracked yet.</p>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Client"
        size="lg"
      >
        <ClientForm
          initialData={client}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
          isEdit
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal.Confirm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${client.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Add Keywords Modal */}
      <Modal
        isOpen={showKeywordModal}
        onClose={() => setShowKeywordModal(false)}
        title="Add Keywords"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowKeywordModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddKeywords}>Add Keywords</Button>
          </>
        }
      >
        <Input
          label="Keywords"
          placeholder="keyword1, keyword2, keyword3"
          value={newKeywords}
          onChange={(e) => setNewKeywords(e.target.value)}
          helper="Separate multiple keywords with commas"
        />
      </Modal>

      {/* Add Sample Comment Modal */}
      <Modal
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
        title="Add Sample Comment"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSampleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSample}>Add Sample</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Dropdown
            label="Platform (optional)"
            placeholder="Select platform"
            options={[
              { value: '', label: 'Any platform' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'facebook', label: 'Facebook' },
              { value: 'linkedin', label: 'LinkedIn' },
              { value: 'x', label: 'X (Twitter)' },
              { value: 'tiktok', label: 'TikTok' },
              { value: 'reddit', label: 'Reddit' },
              { value: 'forum', label: 'Forum' },
            ]}
            value={newSample.platform}
            onChange={(value) => setNewSample(s => ({ ...s, platform: value }))}
          />
          <TextArea
            label="Comment Text"
            placeholder="Enter a sample comment that represents this client's voice..."
            value={newSample.comment_text}
            onChange={(e) => setNewSample(s => ({ ...s, comment_text: e.target.value }))}
            rows={3}
            required
          />
          <Input
            label="Notes (optional)"
            placeholder="Any notes about this sample"
            value={newSample.notes}
            onChange={(e) => setNewSample(s => ({ ...s, notes: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Add Industry Site Modal */}
      <Modal
        isOpen={showSiteModal}
        onClose={() => setShowSiteModal(false)}
        title="Add Industry Site"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSiteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSite}>Add Site</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Site Name"
            placeholder="e.g., r/HomeImprovement"
            value={newSite.site_name}
            onChange={(e) => setNewSite(s => ({ ...s, site_name: e.target.value }))}
            required
          />
          <Input
            label="URL (optional)"
            placeholder="https://..."
            value={newSite.site_url}
            onChange={(e) => setNewSite(s => ({ ...s, site_url: e.target.value }))}
          />
          <Dropdown
            label="Site Type"
            options={[
              { value: 'forum', label: 'Forum' },
              { value: 'community', label: 'Community' },
              { value: 'social_platform', label: 'Social Platform' },
              { value: 'review_site', label: 'Review Site' },
              { value: 'directory', label: 'Directory' },
              { value: 'news_site', label: 'News Site' },
              { value: 'other', label: 'Other' },
            ]}
            value={newSite.site_type}
            onChange={(value) => setNewSite(s => ({ ...s, site_type: value }))}
          />
          <Input
            label="Notes (optional)"
            placeholder="Any notes about this site"
            value={newSite.notes}
            onChange={(e) => setNewSite(s => ({ ...s, notes: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
