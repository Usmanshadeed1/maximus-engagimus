/**
 * Client Card Component
 * 
 * Displays a client in grid or list view with quick actions.
 */

import { Link } from 'react-router-dom';
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MessageSquare,
  Tag,
  Users,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Badge, Toggle } from '../ui';

export default function ClientCard({
  client,
  viewMode = 'grid',
  onToggleActive,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stats
  const keywordCount = client.keywords?.length || 0;
  const sampleCount = client.sample_comments?.length || 0;
  const competitorCount = client.competitors?.length || 0;

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-[var(--card-soft)] rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Name and industry */}
            <div className="min-w-0 flex-1">
              <Link
                to={`/clients/${client.id}`}
                className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 truncate block"
              >
                {client.name}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{client.industry}</p>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1" title="Keywords">
                <Tag className="h-4 w-4" />
                {keywordCount}
              </span>
              <span className="flex items-center gap-1" title="Sample comments">
                <MessageSquare className="h-4 w-4" />
                {sampleCount}
              </span>
              <span className="flex items-center gap-1" title="Competitors">
                <Users className="h-4 w-4" />
                {competitorCount}
              </span>
            </div>

            {/* Status (textual to match grid view) */}
            <div className="text-xs text-gray-500 dark:text-gray-300">
              {client.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-4">
            <Toggle
              checked={client.is_active}
              onChange={onToggleActive}
              size="sm"
            />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                  <Link
                    to={`/clients/${client.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 hover:text-error-700 dark:hover:text-error-300 w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all dark:bg-[var(--card-soft)] dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <Link to={`/clients/${client.id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 truncate">
              {client.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{client.industry}</p>
          </Link>
          <div className="relative ml-2" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                <Link
                  to={`/clients/${client.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 w-full"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {client.description || 'No description provided.'}
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1" title="Keywords">
              <Tag className="h-3.5 w-3.5" />
              {keywordCount}
            </span>
            <span className="flex items-center gap-1" title="Sample comments">
              <MessageSquare className="h-3.5 w-3.5" />
              {sampleCount}
            </span>
            <span className="flex items-center gap-1" title="Competitors">
              <Users className="h-3.5 w-3.5" />
              {competitorCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {client.is_active ? 'Active' : 'Inactive'}
            </span>
            <Toggle
              checked={client.is_active}
              onChange={onToggleActive}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
