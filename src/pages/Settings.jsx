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
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAIProviders, useAIChatLinks, usePlatformPrompts } from '../hooks/useAIProviders';
import { getOrganizationMembers, updateUserRole, removeOrganizationMember } from '../lib/supabase';
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
            value={profile?.role || 'member'}
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
 * Organization Tab
 */
function OrganizationTab() {
  const { organization } = useAuth();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Organization</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your organization settings
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <Input
            label="Organization Name"
            value={organization?.name || ''}
            disabled
            helper="Contact support to change your organization name"
          />
          <Input
            label="Organization ID"
            value={organization?.id || ''}
            disabled
            className="font-mono text-sm"
          />
        </div>
      </Card>

      {/* Team members */}
      <Card>
        <Card.Header>
          <Card.Title>Team Members</Card.Title>
          <Card.Description>Manage who has access to your organization</Card.Description>
        </Card.Header>

        <TeamMembers />
      </Card>
    </div>
  );
}

/**
 * Team Members component
 */
function TeamMembers() {
  const { profile, isOwner, refreshProfile } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [pendingChange, setPendingChange] = useState({ userId: null, newRole: null });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getOrganizationMembers();
        if (mounted) setMembers(data || []);
      } catch (err) {
        console.error('Failed to load members', err);
        toast.error('Failed to load team members');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const ownerCount = members.filter(m => m.role === 'owner').length;

  const handleChangeRole = (userId, role) => {
    const member = members.find(m => m.id === userId);
    if (!member) return;

    // Prevent demoting the last owner
    if (member.role === 'owner' && ownerCount <= 1 && role !== 'owner') {
      toast.error('Cannot remove the last owner of the organization');
      return;
    }

    // Prevent changing your own role via the UI
    if (userId === profile?.id) {
      toast.error('To change your own role, contact support or use the database');
      return;
    }

    setPendingChange({ userId, newRole: role });
    setConfirmOpen(true);
    setRemoveConfirm(null); // Clear remove state
  };

  const confirmChange = async () => {
    setConfirmOpen(false);
    const { userId, newRole } = pendingChange;
    if (!userId || !newRole) return;

    setUpdating(userId);
    try {
      await updateUserRole(userId, newRole);
      toast.success('Role updated');
      const data = await getOrganizationMembers();
      setMembers(data || []);
      await refreshProfile();
    } catch (err) {
      console.error('Failed to update role', err);
      toast.error('Failed to update role');
    } finally {
      setUpdating(null);
      setPendingChange({ userId: null, newRole: null });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between">
          <div>
            <div className="font-medium">{m.full_name || '—'}</div>
            <div className="text-sm text-gray-500">{m.email}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48">
              {isOwner && m.id !== profile?.id ? (
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={m.role}
                  onChange={(e) => handleChangeRole(m.id, e.target.value)}
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              ) : (
                <Badge className="capitalize">{m.role}</Badge>
              )}
            </div>
            {isOwner && m.id !== profile?.id && (
              <Button 
                variant="danger" 
                size="sm" 
                onClick={() => setRemoveConfirm({ userId: m.id })}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      ))}

      <Modal.Confirm
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmChange}
        title="Change Role"
        message={`Change role to ${pendingChange.newRole}?`}
        confirmText="Change"
      />

      <Modal.Confirm
        isOpen={!!removeConfirm?.userId}
        onClose={() => setRemoveConfirm(null)}
        onConfirm={async () => {
          const uid = removeConfirm.userId;
          setRemoveConfirm(null);
          setUpdating(uid);
          try {
            await removeOrganizationMember(uid);
            toast.success('Member removed');
            const data = await getOrganizationMembers();
            setMembers(data || []);
            await refreshProfile();
          } catch (err) {
            console.error('Failed to remove member', err);
            toast.error('Failed to remove member');
          } finally {
            setUpdating(null);
          }
        }}
        title="Remove Member"
        message={`Are you sure you want to remove this member?`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}
