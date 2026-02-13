/**
 * Competitor Card Component
 * 
 * Displays a competitor with stats and quick actions.
 */

import { useState } from 'react';
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { Card, Badge, Toggle } from '../ui';
import { formatRelativeTime } from '../../lib/utils';

export default function CompetitorCard({
  competitor,
  onEdit,
  onDelete,
  onToggleActive,
  onAddSighting,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Get sighting stats
  const sightingCount = competitor.sightings?.length || 0;
  const lastSighting = competitor.sightings?.[0];
  const highPriorityCount = competitor.sightings?.filter(s => s.priority === 'high').length || 0;

  return (
    <Card padding="none" className={!competitor.is_active ? 'opacity-60' : ''}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {competitor.name}
              </h3>
              {!competitor.is_active && (
                <Badge variant="secondary" size="xs">Inactive</Badge>
              )}
            </div>
            {competitor.website && (
              <a
                href={competitor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mt-1"
              >
                <Globe className="h-3 w-3" />
                <span className="truncate">{competitor.website.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Menu */}
          <div className="relative ml-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-[var(--card)] rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onAddSighting();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                  >
                    <Eye className="h-4 w-4" />
                    Log Sighting
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-600" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-red-900/20 w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {competitor.description && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {competitor.description}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Sightings:</span>{' '}
              <span className="font-medium text-gray-900 dark:text-white">{sightingCount}</span>
            </div>
            {highPriorityCount > 0 && (
              <Badge variant="warning" size="xs">
                {highPriorityCount} high priority
              </Badge>
            )}
          </div>
        </div>

        {lastSighting && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Last seen: {formatRelativeTime(lastSighting.last_seen_at)} at {lastSighting.location_name}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 rounded-b-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={onAddSighting}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            + Log Sighting
          </button>
          <Toggle
            checked={competitor.is_active}
            onChange={onToggleActive}
            size="sm"
          />
        </div>
      </div>
    </Card>
  );
}
