/**
 * Clients Page
 * 
 * Lists all clients with search, filter, and management actions.
 */

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Grid, List } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { Button, Input, Dropdown, Spinner, Modal } from '../components/ui';
import ClientCard from '../components/clients/ClientCard';
import ClientForm from '../components/clients/ClientForm';

export default function Clients() {
  const navigate = useNavigate();
  const { clients, loading, error, create, remove, toggleActive, refetch } = useClients();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Get unique industries for filter
  const industries = useMemo(() => {
    const unique = [...new Set(clients.map(c => c.industry))].filter(Boolean);
    return unique.sort().map(industry => ({ value: industry, label: industry }));
  }, [clients]);

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = client.name.toLowerCase().includes(query);
        const matchesIndustry = client.industry?.toLowerCase().includes(query);
        const matchesDescription = client.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesIndustry && !matchesDescription) {
          return false;
        }
      }

      // Industry filter
      if (industryFilter && client.industry !== industryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'active' && !client.is_active) {
        return false;
      }
      if (statusFilter === 'inactive' && client.is_active) {
        return false;
      }

      return true;
    });
  }, [clients, searchQuery, industryFilter, statusFilter]);

  // Handle client creation
  const handleCreate = async (clientData) => {
    const { data, error } = await create(clientData);
    if (!error && data) {
      setShowCreateModal(false);
      navigate(`/clients/${data.id}`);
    }
  };

  // Handle client deletion
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await remove(deleteConfirm);
    setDeleteConfirm(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600 mb-4">Failed to load clients</p>
        <Button onClick={refetch}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">
            Manage your client profiles and engagement settings
          </p>
        </div>
        <Button
          leftIcon={Plus}
          onClick={() => setShowCreateModal(true)}
        >
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={Search}
          />
        </div>

        {/* Industry filter */}
        <div className="w-full sm:w-48">
          <Dropdown
            placeholder="All Industries"
            options={[{ value: '', label: 'All Industries' }, ...industries]}
            value={industryFilter}
            onChange={setIndustryFilter}
          />
        </div>

        {/* Status filter */}
        <div className="w-full sm:w-40">
          <Dropdown
            placeholder="All Status"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>

        {/* View toggle */}
        <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${
              viewMode === 'grid'
                ? 'bg-primary-50 text-primary-600'
                : 'bg-white dark:bg-[var(--bg)] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[var(--bg)]'
            }`}
            title="Grid view"
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 border-l border-gray-300 dark:border-gray-600 ${
              viewMode === 'list'
                ? 'bg-primary-50 text-primary-600'
                : 'bg-white dark:bg-[var(--bg)] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[var(--bg)]'
            }`}
            title="List view"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Showing {filteredClients.length} of {clients.length} clients
      </p>

      {/* Clients grid/list */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[var(--bg)] rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 dark:text-gray-300 mb-4">
            <Filter className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No clients found
          </h3>
          <p className="text-gray-500 dark:text-gray-300 mb-4">
            {clients.length === 0
              ? "You haven't added any clients yet."
              : 'Try adjusting your search or filters.'}
          </p>
          {clients.length === 0 && (
            <Button onClick={() => setShowCreateModal(true)} leftIcon={Plus}>
              Add Your First Client
            </Button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              viewMode={viewMode}
              onToggleActive={(isActive) => toggleActive(client.id, isActive)}
              onDelete={() => setDeleteConfirm(client.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Client"
        size="lg"
      >
        <ClientForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal.Confirm
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone and will remove all associated data."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
