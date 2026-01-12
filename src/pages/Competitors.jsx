/**
 * Competitors Page
 * 
 * Track competitors and log their sightings across platforms.
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Users,
  MapPin,
  AlertCircle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { useCompetitors, useSightings, useCompetitorInsights } from '../hooks/useCompetitors';
import {
  Card,
  Button,
  Input,
  Dropdown,
  Spinner,
  Modal,
  Badge,
} from '../components/ui';
import CompetitorCard from '../components/competitors/CompetitorCard';
import CompetitorForm from '../components/competitors/CompetitorForm';
import SightingCard from '../components/competitors/SightingCard';
import SightingForm from '../components/competitors/SightingForm';
import { formatRelativeTime } from '../lib/utils';

// View tabs
const VIEWS = [
  { id: 'competitors', label: 'Competitors', icon: Users },
  { id: 'sightings', label: 'Sightings', icon: Eye },
  { id: 'insights', label: 'Insights', icon: TrendingUp },
];

export default function Competitors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClientId = searchParams.get('client') || '';
  
  // State
  const [activeView, setActiveView] = useState('competitors');
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [showSightingModal, setShowSightingModal] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState(null);
  const [editingSighting, setEditingSighting] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ type: null, id: null });
  const [sightingForCompetitor, setSightingForCompetitor] = useState(null);

  // Data hooks
  const { clients, clientOptions, loading: clientsLoading } = useClients({ activeOnly: false });
  const {
    competitors,
    loading: competitorsLoading,
    create: createCompetitor,
    update: updateCompetitor,
    remove: removeCompetitor,
    toggleActive: toggleCompetitorActive,
  } = useCompetitors(selectedClientId);
  
  const {
    sightings,
    loading: sightingsLoading,
    add: addSighting,
    update: updateSighting,
    remove: removeSighting,
    markSeen,
  } = useSightings();

  const insights = useCompetitorInsights();

  // Filter competitors
  const filteredCompetitors = useMemo(() => {
    if (!searchQuery) return competitors;
    const query = searchQuery.toLowerCase();
    return competitors.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.website?.toLowerCase().includes(query)
    );
  }, [competitors, searchQuery]);

  // Filter sightings
  const filteredSightings = useMemo(() => {
    let filtered = sightings;
    
    // Filter by client if selected
    if (selectedClientId) {
      filtered = filtered.filter(s =>
        s.competitor?.client?.id === selectedClientId
      );
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.location_name.toLowerCase().includes(query) ||
        s.competitor?.name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [sightings, selectedClientId, searchQuery]);

  // Get all competitors for sighting form
  const allCompetitors = useMemo(() => {
    if (selectedClientId) {
      return competitors;
    }
    // If no client selected, we need to get all competitors
    // For now, return empty - user should select a client first
    return [];
  }, [competitors, selectedClientId]);

  // Handlers
  const handleCreateCompetitor = async (data) => {
    const { error } = await createCompetitor(data);
    if (!error) {
      setShowCompetitorModal(false);
    }
  };

  const handleUpdateCompetitor = async (data) => {
    const { error } = await updateCompetitor(editingCompetitor.id, data);
    if (!error) {
      setEditingCompetitor(null);
    }
  };

  const handleDeleteCompetitor = async () => {
    if (deleteConfirm.type === 'competitor') {
      await removeCompetitor(deleteConfirm.id);
    }
    setDeleteConfirm({ type: null, id: null });
  };

  const handleCreateSighting = async (data) => {
    const { error } = await addSighting(data);
    if (!error) {
      setShowSightingModal(false);
      setSightingForCompetitor(null);
    }
  };

  const handleUpdateSighting = async (data) => {
    const { error } = await updateSighting(editingSighting.id, data);
    if (!error) {
      setEditingSighting(null);
    }
  };

  const handleDeleteSighting = async () => {
    if (deleteConfirm.type === 'sighting') {
      await removeSighting(deleteConfirm.id);
    }
    setDeleteConfirm({ type: null, id: null });
  };

  const openSightingForCompetitor = (competitor) => {
    setSightingForCompetitor(competitor);
    setShowSightingModal(true);
  };

  // Loading
  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competitor Tracking</h1>
          <p className="text-gray-600 mt-1">
            Monitor competitors and track where they engage
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={Eye}
            onClick={() => setShowSightingModal(true)}
            disabled={!selectedClientId && activeView === 'competitors'}
          >
            Log Sighting
          </Button>
          <Button
            leftIcon={Plus}
            onClick={() => setShowCompetitorModal(true)}
            disabled={!selectedClientId}
          >
            Add Competitor
          </Button>
        </div>
      </div>

      {/* View tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 -mb-px">
          {VIEWS.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`
                flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeView === view.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <view.icon className="h-4 w-4" />
              {view.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <Dropdown
            placeholder="All Clients"
            options={[
              { value: '', label: 'All Clients' },
              ...clientOptions.map(c => ({ value: c.value, label: c.label })),
            ]}
            value={selectedClientId}
            onChange={setSelectedClientId}
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={Search}
          />
        </div>
      </div>

      {/* No client selected warning */}
      {!selectedClientId && activeView === 'competitors' && (
        <Card className="bg-warning-50 border-warning-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning-600" />
            <p className="text-warning-800">
              Select a client to view and manage their competitors.
            </p>
          </div>
        </Card>
      )}

      {/* Competitors View */}
      {activeView === 'competitors' && selectedClientId && (
        <CompetitorsView
          competitors={filteredCompetitors}
          loading={competitorsLoading}
          onEdit={setEditingCompetitor}
          onDelete={(id) => setDeleteConfirm({ type: 'competitor', id })}
          onToggleActive={toggleCompetitorActive}
          onAddSighting={openSightingForCompetitor}
        />
      )}

      {/* Sightings View */}
      {activeView === 'sightings' && (
        <SightingsView
          sightings={filteredSightings}
          loading={sightingsLoading}
          onEdit={setEditingSighting}
          onDelete={(id) => setDeleteConfirm({ type: 'sighting', id })}
          onMarkSeen={markSeen}
        />
      )}

      {/* Insights View */}
      {activeView === 'insights' && (
        <InsightsView insights={insights} />
      )}

      {/* Create Competitor Modal */}
      <Modal
        isOpen={showCompetitorModal}
        onClose={() => setShowCompetitorModal(false)}
        title="Add Competitor"
        size="md"
      >
        <CompetitorForm
          onSubmit={handleCreateCompetitor}
          onCancel={() => setShowCompetitorModal(false)}
        />
      </Modal>

      {/* Edit Competitor Modal */}
      <Modal
        isOpen={!!editingCompetitor}
        onClose={() => setEditingCompetitor(null)}
        title="Edit Competitor"
        size="md"
      >
        <CompetitorForm
          initialData={editingCompetitor}
          onSubmit={handleUpdateCompetitor}
          onCancel={() => setEditingCompetitor(null)}
          isEdit
        />
      </Modal>

      {/* Create Sighting Modal */}
      <Modal
        isOpen={showSightingModal}
        onClose={() => {
          setShowSightingModal(false);
          setSightingForCompetitor(null);
        }}
        title="Log Competitor Sighting"
        size="md"
      >
        <SightingForm
          competitors={allCompetitors}
          preselectedCompetitor={sightingForCompetitor}
          onSubmit={handleCreateSighting}
          onCancel={() => {
            setShowSightingModal(false);
            setSightingForCompetitor(null);
          }}
        />
      </Modal>

      {/* Edit Sighting Modal */}
      <Modal
        isOpen={!!editingSighting}
        onClose={() => setEditingSighting(null)}
        title="Edit Sighting"
        size="md"
      >
        <SightingForm
          initialData={editingSighting}
          competitors={allCompetitors}
          onSubmit={handleUpdateSighting}
          onCancel={() => setEditingSighting(null)}
          isEdit
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal.Confirm
        isOpen={deleteConfirm.type !== null}
        onClose={() => setDeleteConfirm({ type: null, id: null })}
        onConfirm={deleteConfirm.type === 'competitor' ? handleDeleteCompetitor : handleDeleteSighting}
        title={`Delete ${deleteConfirm.type === 'competitor' ? 'Competitor' : 'Sighting'}`}
        message={`Are you sure you want to delete this ${deleteConfirm.type}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

/**
 * Competitors list view
 */
function CompetitorsView({ competitors, loading, onEdit, onDelete, onToggleActive, onAddSighting }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <Card className="text-center py-12">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-medium text-gray-900 mb-2">No Competitors Yet</h3>
        <p className="text-gray-500">Add competitors to start tracking them.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {competitors.map((competitor) => (
        <CompetitorCard
          key={competitor.id}
          competitor={competitor}
          onEdit={() => onEdit(competitor)}
          onDelete={() => onDelete(competitor.id)}
          onToggleActive={(active) => onToggleActive(competitor.id, active)}
          onAddSighting={() => onAddSighting(competitor)}
        />
      ))}
    </div>
  );
}

/**
 * Sightings list view
 */
function SightingsView({ sightings, loading, onEdit, onDelete, onMarkSeen }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (sightings.length === 0) {
    return (
      <Card className="text-center py-12">
        <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-medium text-gray-900 mb-2">No Sightings Yet</h3>
        <p className="text-gray-500">Log sightings when you spot competitors engaging online.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sightings.map((sighting) => (
        <SightingCard
          key={sighting.id}
          sighting={sighting}
          onEdit={() => onEdit(sighting)}
          onDelete={() => onDelete(sighting.id)}
          onMarkSeen={() => onMarkSeen(sighting.id)}
        />
      ))}
    </div>
  );
}

/**
 * Insights view
 */
function InsightsView({ insights }) {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Sightings</p>
          <p className="text-2xl font-bold text-gray-900">{insights.totalSightings}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Locations Tracked</p>
          <p className="text-2xl font-bold text-gray-900">{insights.totalLocations}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">High Priority</p>
          <p className="text-2xl font-bold text-warning-600">{insights.highPriorityCount}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Recent (7 days)</p>
          <p className="text-2xl font-bold text-success-600">{insights.recentCount}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most active locations */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Most Active Locations
            </Card.Title>
          </Card.Header>
          {insights.mostActiveLocations.length > 0 ? (
            <div className="space-y-3">
              {insights.mostActiveLocations.map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{loc.location_name}</p>
                    <p className="text-sm text-gray-500">
                      {loc.competitors.size} competitor(s) • {loc.sightings.length} sighting(s)
                    </p>
                  </div>
                  <Badge variant="secondary">{loc.location_type}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No locations tracked yet.</p>
          )}
        </Card>

        {/* Most active competitors */}
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Most Active Competitors
            </Card.Title>
          </Card.Header>
          {insights.mostActiveCompetitors.length > 0 ? (
            <div className="space-y-3">
              {insights.mostActiveCompetitors.map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{comp.name}</p>
                  <Badge variant="primary">{comp.count} sightings</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No competitor activity tracked yet.</p>
          )}
        </Card>

        {/* Stale locations */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Needs Attention (No activity in 14+ days)
            </Card.Title>
          </Card.Header>
          {insights.staleLocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.staleLocations.slice(0, 6).map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[var(--bg)] rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{loc.location_name}</p>
                    <p className="text-xs text-gray-500">
                      Last seen: {loc.lastSeen ? formatRelativeTime(loc.lastSeen) : 'Never'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">All locations are up to date!</p>
          )}
        </Card>
      </div>
    </div>
  );
}
