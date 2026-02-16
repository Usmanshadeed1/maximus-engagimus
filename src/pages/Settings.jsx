/**
 * Settings Page
 * 
 * Application settings including AI providers, platform prompts, and user profile.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Bot,
  MessageSquare,
  User,
  Building,
  FileText,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAIProviders, useAIChatLinks, usePlatformPrompts } from '../hooks/useAIProviders';
import { getOrganizationMembers, updateUserRole, removeOrganizationMember, getSystemPromptTemplate, saveSystemPromptTemplate } from '../lib/supabase';
import {
  Button,
  Card,
  Input,
  TextArea,
  Spinner,
  Modal,
  Toggle,
  Badge,
} from '../components/ui';
import AIProviderCard from '../components/settings/AIProviderCard';
import AIProviderForm from '../components/settings/AIProviderForm';
import { PLATFORM_PROMPTS } from '../lib/prompts';
import { toast } from '../components/ui/Toast';

// Settings tabs
const TABS = [
  { id: 'ai-providers', label: 'AI Providers', icon: Bot },
  { id: 'platform-prompts', label: 'Platform Prompts', icon: MessageSquare },
  { id: 'system-prompt', label: 'System Prompt', icon: FileText },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'organization', label: 'Organization', icon: Building },
];

export default function Settings() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'ai-providers';

  // Set active tab
  const setActiveTab = (tabId) => {
    navigate(`/settings/${tabId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Manage your AI providers, prompts, and account settings
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 -mb-px">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`
                flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === t.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'ai-providers' && <AIProvidersTab />}
      {activeTab === 'platform-prompts' && <PlatformPromptsTab />}
      {activeTab === 'system-prompt' && <SystemPromptTab />}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'organization' && <OrganizationTab />}
    </div>
  );
}

/**
 * AI Providers Tab
 */
function AIProvidersTab() {
  const {
    providers,
    loading,
    hasConfiguredProvider,
    create,
    update,
    remove,
    setDefault,
    toggleActive,
    test,
    seedDefaults,
  } = useAIProviders();
  const { chatLinks } = useAIChatLinks();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Handle create
  const handleCreate = async (data) => {
    const { error } = await create(data);
    if (!error) {
      setShowAddModal(false);
    }
  };

  // Handle update
  const handleUpdate = async (data) => {
    const { error } = await update(editingProvider.id, data);
    if (!error) {
      setEditingProvider(null);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (deleteConfirm) {
      await remove(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {!hasConfiguredProvider && (
        <Card className="bg-warning-50 border-warning-200">
          <div className="flex items-start gap-3">
            <Bot className="h-5 w-5 text-warning-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-warning-800">No AI Provider Configured</h3>
              <p className="text-sm text-warning-700 mt-1">
                Add an API key to enable AI-powered comment generation. You can use free providers like Groq or Cerebras to get started.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI Providers</h2>
        <div className="flex gap-2">
          {providers.length === 0 && (
            <Button variant="secondary" onClick={seedDefaults} leftIcon={RefreshCw}>
              Add Default Providers
            </Button>
          )}
          <Button onClick={() => setShowAddModal(true)} leftIcon={Plus}>
            Add Provider
          </Button>
        </div>
      </div>

      {/* Provider list */}
      {providers.length === 0 ? (
        <Card className="text-center py-8">
          <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-1">No providers configured</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add an AI provider to start generating comments
          </p>
          <Button onClick={seedDefaults}>Add Default Providers</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {providers.map((provider) => (
            <AIProviderCard
              key={provider.id}
              provider={provider}
              onEdit={() => setEditingProvider(provider)}
              onDelete={() => setDeleteConfirm(provider.id)}
              onSetDefault={() => setDefault(provider.id)}
              onToggleActive={(active) => toggleActive(provider.id, active)}
              onTest={() => test(provider)}
            />
          ))}
        </div>
      )}

      {/* No API Mode section */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-2">No API Mode</h3>
        <p className="text-sm text-gray-600 mb-4">
          If you prefer not to use API keys, you can copy prompts and use these AI chat interfaces directly:
        </p>
        <div className="flex flex-wrap gap-2">
          {chatLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 dark:bg-[var(--card-soft)] dark:hover:bg-[var(--card)] dark:text-gray-200 transition-colors"
            >
              {link.name}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add AI Provider"
        size="lg"
      >
        <AIProviderForm
          onSubmit={handleCreate}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingProvider}
        onClose={() => setEditingProvider(null)}
        title="Edit AI Provider"
        size="lg"
      >
        <AIProviderForm
          initialData={editingProvider}
          onSubmit={handleUpdate}
          onCancel={() => setEditingProvider(null)}
          isEdit
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal.Confirm
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Remove AI Provider"
        message="Are you sure you want to remove this AI provider? This action cannot be undone."
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}

/**
 * Platform Prompts Tab
 */
function PlatformPromptsTab() {
  const { prompts, loading, updatePrompt, getPromptForPlatform } = usePlatformPrompts();
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [editForm, setEditForm] = useState({ style_prompt: '', max_length: '' });

  const platforms = Object.keys(PLATFORM_PROMPTS);

  // Start editing a platform
  const startEdit = (platform) => {
    const current = getPromptForPlatform(platform);
    setEditForm({
      style_prompt: current?.style_prompt || PLATFORM_PROMPTS[platform].style_prompt,
      max_length: current?.max_length || PLATFORM_PROMPTS[platform].max_length || '',
    });
    setEditingPlatform(platform);
  };

  // Save changes
  const handleSave = async () => {
    const { error } = await updatePrompt(editingPlatform, {
      style_prompt: editForm.style_prompt,
      max_length: editForm.max_length ? parseInt(editForm.max_length) : null,
    });
    if (!error) {
      setEditingPlatform(null);
    }
  };

  // Reset to default
  const resetToDefault = () => {
    const defaults = PLATFORM_PROMPTS[editingPlatform];
    setEditForm({
      style_prompt: defaults.style_prompt,
      max_length: defaults.max_length || '',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Platform-Specific Prompts</h2>
        <p className="text-sm text-gray-600 mt-1">
          Customize the style guidelines for each social media platform
        </p>
      </div>

      <div className="grid gap-4">
        {platforms.map((platform) => {
          const prompt = getPromptForPlatform(platform);
          const isCustom = prompt && !prompt.is_system;
          const defaults = PLATFORM_PROMPTS[platform];

          return (
            <Card key={platform} padding="sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 capitalize">
                      {platform === 'x' ? 'X (Twitter)' : platform}
                    </h3>
                    {isCustom && (
                      <Badge variant="primary" size="xs">Custom</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {prompt?.style_prompt || defaults.style_prompt}
                  </p>
                  {(prompt?.max_length || defaults.max_length) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Max length: {prompt?.max_length || defaults.max_length} characters
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(platform)}
                >
                  Edit
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingPlatform}
        onClose={() => setEditingPlatform(null)}
        title={`Edit ${editingPlatform === 'x' ? 'X (Twitter)' : editingPlatform} Prompt`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={resetToDefault}>
              Reset to Default
            </Button>
            <div className="flex-1" />
            <Button variant="secondary" onClick={() => setEditingPlatform(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextArea
            label="Style Prompt"
            value={editForm.style_prompt}
            onChange={(e) => setEditForm(f => ({ ...f, style_prompt: e.target.value }))}
            rows={5}
            helper="Instructions for how comments should be written on this platform"
          />
          <Input
            label="Max Character Length"
            type="number"
            value={editForm.max_length}
            onChange={(e) => setEditForm(f => ({ ...f, max_length: e.target.value }))}
            placeholder="e.g., 150"
            helper="Optional: Maximum recommended character count"
          />
        </div>
      </Modal>
    </div>
  );
}

/**
 * Profile Tab
 */
function ProfileTab() {
  const { user, profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);

  // Update when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: user?.email || '',
      });
    }
  }, [profile, user]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await updateProfile({ full_name: formData.full_name });
    setLoading(false);
    if (!error) {
      toast.success('Profile updated');
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Your Profile</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your personal information
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData(f => ({ ...f, full_name: e.target.value }))}
          />
          <Input
            label="Email"
            value={formData.email}
            disabled
            helper="Email cannot be changed"
          />
          <Input
            label="Role"
            value={profile?.role || 'owner'}
            disabled
            className="capitalize"
          />
        </div>
        <Card.Footer>
          <Button onClick={handleSave} loading={loading}>
            Save Changes
          </Button>
        </Card.Footer>
      </Card>

      {/* Password change section */}
      <Card>
        <Card.Header>
          <Card.Title>Password</Card.Title>
          <Card.Description>Change your password</Card.Description>
        </Card.Header>
        <p className="text-sm text-gray-600">
          To change your password, use the "Forgot Password" option on the login page.
        </p>
      </Card>
    </div>
  );
}

/**
 * System Prompt Tab
 */
function SystemPromptTab() {
  const { organization } = useAuth();
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default template with ALL sections - split by --- between system and user prompts
  const defaultTemplate = `You are a social media engagement specialist writing comments for \${client.name}.

## CLIENT PROFILE
- Industry: \${client.industry}
- Description: \${client.description}
- Target Audience: \${client.target_audience}
- Keywords: \${keywords}

## VOICE & STYLE
\${voicePrompt}

## CALL TO ACTION (use subtly when appropriate)
\${client.default_cta}

## SAMPLE COMMENTS (match this style)
\${sampleComments}

## PLATFORM-SPECIFIC GUIDELINES (\${platform.toUpperCase()})
\${platformPrompt.style_prompt}
Maximum length: \${platformPrompt.max_length} characters

## RULES
1. Sound human and authentic - never robotic or generic
2. Match the platform's typical tone and length
3. Add value to the conversation
4. Avoid hashtags unless specifically requested
5. Never repeat phrases from existing comments
6. Each option should have a distinctly different approach
7. Keep comments concise and impactful

---

## CONTENT TO RESPOND TO
\${content}

## POSTER INFORMATION
\${posterInfo}

## HASHTAGS USED
\${hashtags}

## EXISTING COMMENTS (avoid similar phrasing)
\${existingComments}

## YOUR TASK
Generate exactly \${numOptions} unique comment options. Each should take a different approach:

1. **Conversational** - Friendly and casual, like chatting with a friend
2. **Professional** - Polished and knowledgeable, establishes expertise  
3. **Question-Based** - Asks an engaging question to spark discussion
4. **Value-Add** - Provides a helpful tip, insight, or resource
5. **Brief** - Short and punchy, gets straight to the point

\${ctaOption}

## RESPONSE FORMAT
Respond with a JSON array. Each object should have:
- "style": The approach name (conversational, professional, question, value-add, or brief)
- "text": The comment text

Example:
[
  {"style": "conversational", "text": "This is so relatable! I've been..."},
  {"style": "professional", "text": "Great insights on..."},
  {"style": "question", "text": "Have you considered..."}
]

Generate \${numOptions} options now:`;

  const loadTemplate = async () => {
    if (!organization?.id) {
      setTemplate(defaultTemplate);
      setLoading(false);
      return;
    }
    try {
      const customTemplate = await getSystemPromptTemplate(organization.id);
      setTemplate(customTemplate || defaultTemplate);
    } catch (err) {
      console.error('Error loading template:', err);
      setTemplate(defaultTemplate);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate();
  }, [organization?.id]);

  const handleSave = async () => {
    if (!organization?.id) {
      toast.error('Organization ID not found');
      return;
    }
    
    if (!template || typeof template !== 'string' || !template.trim()) {
      toast.error('Template cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const result = await saveSystemPromptTemplate(organization.id, template);
      toast.success('✅ System prompt template saved successfully');
    } catch (err) {
      console.error('Error saving template:', err);
      toast.error(`Failed to save: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset to default template?')) {
      setTemplate(defaultTemplate);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Prompt Template</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Edit the COMPLETE master prompt template used for AI comment generation. Use placeholders that auto-fill during generation. Split template with "---" between system instructions (top) and user task (bottom). Keep all placeholders intact!
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Complete Master Prompt Template (system --- user)
            </label>
            <TextArea
              value={template || ''}
              onChange={(e) => setTemplate(typeof e === 'string' ? e : (e.target?.value || e || ''))}
              rows={40}
              placeholder="Edit your complete system + user prompt template..."
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              System Placeholders (before ---): \${'${client.name}'}, \${'${client.industry}'}, \${'${client.description}'}, \${'${client.target_audience}'}, \${'${keywords}'}, \${'${voicePrompt}'}, \${'${client.default_cta}'}, \${'${sampleComments}'}, \${'${platform.toUpperCase()}'}, \${'${platformPrompt.style_prompt}'}, \${'${platformPrompt.max_length}'}<br/>
              User Placeholders (after ---): \${'${content}'}, \${'${posterInfo}'}, \${'${hashtags}'}, \${'${existingComments}'}, \${'${numOptions}'}, \${'${ctaOption}'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
            >
              Reset to Default
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !template || typeof template !== 'string' || !template.trim()}
            >
              {saving ? <Spinner size="sm" /> : 'Save Template'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Organization Tab
 */
function OrganizationTab() {
  const { organization, profile } = useAuth();
  const [orgData, setOrgData] = useState(organization);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If organization is missing but profile exists, try to fetch it
    if (!organization && profile?.organization_id) {
      setLoading(true);
      (async () => {
        try {
          const { getUserProfile } = await import('../lib/supabase');
          const profileData = await getUserProfile();
          setOrgData(profileData?.organization || null);
        } catch (err) {
          console.error('Error fetching organization:', err);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setOrgData(organization);
    }
  }, [organization, profile?.organization_id]);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Organization</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your organization settings
        </p>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="space-y-4">
            <Input
              label="Organization Name"
              value={orgData?.name || ''}
              disabled
              helper="Contact support to change your organization name"
            />
            <Input
              label="Organization ID"
              value={orgData?.id || ''}
              disabled
              className="font-mono text-sm"
            />
          </div>
        </Card>
      )}
    </div>
  );
}
