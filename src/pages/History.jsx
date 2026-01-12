/**
 * History Page
 * 
 * View and search through comment generation history.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Copy,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useHistory } from '../hooks/useHistory';
import { useClients } from '../hooks/useClients';
import {
  Card,
  Button,
  Input,
  Dropdown,
  Spinner,
  Badge,
} from '../components/ui';
import CommentOption from '../components/generator/CommentOption';
import { formatDate, formatRelativeTime, getPlatformInfo, copyToClipboard, truncate } from '../lib/utils';
import { toast } from '../components/ui/Toast';

// Platform filter options
const PLATFORM_OPTIONS = [
  { value: '', label: 'All Platforms' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'forum', label: 'Forum' },
  { value: 'houzz', label: 'Houzz' },
  { value: 'youtube', label: 'YouTube' },
];

export default function History() {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');

  // Data
  const { clients, clientOptions } = useClients({ activeOnly: false });
  const {
    history,
    loading,
    error,
    hasMore,
    loadMore,
    historyByDate,
    refetch,
  } = useHistory({
    clientId: selectedClientId || null,
    platform: selectedPlatform || null,
    limit: 25,
  });

  // Filter by search
  const filteredHistory = useMemo(() => {
    if (!searchQuery) return history;

    const query = searchQuery.toLowerCase();
    return history.filter(item =>
      item.source_content?.toLowerCase().includes(query) ||
      item.client?.name?.toLowerCase().includes(query) ||
      item.generated_options?.some(opt =>
        opt.text?.toLowerCase().includes(query)
      )
    );
  }, [history, searchQuery]);

  // Group filtered history by date
  const groupedHistory = useMemo(() => {
    const groups = {};

    filteredHistory.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    return Object.entries(groups).map(([date, items]) => ({
      date,
      items,
    }));
  }, [filteredHistory]);

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedClientId('');
    setSelectedPlatform('');
  };

  const hasFilters = searchQuery || selectedClientId || selectedPlatform;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generation History</h1>
          <p className="text-gray-600 mt-1">
            View and search your past comment generations
          </p>
        </div>
        <Link to="/generator">
          <Button leftIcon={Sparkles}>
            Generate New
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search content or comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={Search}
            />
          </div>
          <div className="w-full md:w-48">
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
          <div className="w-full md:w-44">
            <Dropdown
              placeholder="All Platforms"
              options={PLATFORM_OPTIONS}
              value={selectedPlatform}
              onChange={setSelectedPlatform}
            />
          </div>
          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {filteredHistory.length} generation{filteredHistory.length !== 1 ? 's' : ''} found
        </span>
        {hasFilters && (
          <span>Filtered from {history.length} total</span>
        )}
      </div>

      {/* Loading */}
      {loading && history.length === 0 && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredHistory.length === 0 && (
        <Card className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">No History Yet</h3>
          <p className="text-gray-500 mb-4">
            {hasFilters
              ? 'No generations match your filters.'
              : 'Your comment generations will appear here.'}
          </p>
          {hasFilters ? (
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Link to="/generator">
              <Button>Generate Your First Comments</Button>
            </Link>
          )}
        </Card>
      )}

      {/* History list grouped by date */}
      {groupedHistory.length > 0 && (
        <div className="space-y-8">
          {groupedHistory.map(({ date, items }) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-5 w-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">{date}</h2>
                <span className="text-sm text-gray-500">
                  ({items.length} generation{items.length !== 1 ? 's' : ''})
                </span>
              </div>

              {/* Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <HistoryItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="secondary"
            onClick={loadMore}
            loading={loading}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Single history item
 */
function HistoryItem({ item }) {
  const [expanded, setExpanded] = useState(false);

  const platformInfo = getPlatformInfo(item.platform);
  const usedCount = item.generated_options?.filter(o => o.isUsed)?.length || 0;
  const totalOptions = item.generated_options?.length || 0;

  // Copy option to clipboard
  const handleCopyOption = async (text) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success('Copied to clipboard');
    }
  };

  return (
    <Card padding="none">
      {/* Header - clickable to expand */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--card-soft)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Client and platform */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary" size="sm">
                {item.client?.name || 'Unknown Client'}
              </Badge>
              <Badge variant="secondary" size="sm">
                {platformInfo.name}
              </Badge>
              {item.include_cta && (
                <Badge variant="outline" size="xs">CTA</Badge>
              )}
            </div>

            {/* Source content preview */}
            <p className="text-sm text-gray-700 line-clamp-2">
              {truncate(item.source_content, 200)}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>{formatRelativeTime(item.created_at)}</span>
              <span>•</span>
              <span>{totalOptions} option{totalOptions !== 1 ? 's' : ''}</span>
              {usedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-success-600">{usedCount} used</span>
                </>
              )}
              {item.ai_provider_used && (
                <>
                  <span>•</span>
                  <span>{item.ai_provider_used}</span>
                </>
              )}
            </div>
          </div>

          {/* Expand icon */}
          <div className="ml-4">
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Source content full */}
          <div className="p-4 bg-gray-50 dark:bg-[var(--card-soft)]">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Source Content
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {item.source_content}
            </p>
          </div>

          {/* Generated options */}
          <div className="p-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">
              Generated Comments
            </h4>
            <div className="space-y-3">
              {item.generated_options?.map((option, idx) => (
                <CommentOption.Compact
                  key={idx}
                  option={option}
                  onCopy={() => handleCopyOption(option.text)}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-[var(--bg)] border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
            <Link
              to={`/generator?prefill=${item.id}`}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Regenerate →
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}
