/**
 * Comment Option Component
 * 
 * Displays a single generated comment option with copy and use actions.
 */

import { useState } from 'react';
import {
  Copy,
  Check,
  CheckCircle,
  MessageSquare,
  Briefcase,
  HelpCircle,
  Lightbulb,
  Zap,
  Plus,
} from 'lucide-react';
import { Card, Badge, Button } from '../ui';
import { COMMENT_STYLE_INFO } from '../../lib/prompts';

// Style icons mapping
const STYLE_ICONS = {
  conversational: MessageSquare,
  professional: Briefcase,
  question: HelpCircle,
  'value-add': Lightbulb,
  brief: Zap,
};

// Style colors
const STYLE_COLORS = {
  conversational: 'primary',
  professional: 'info',
  question: 'warning',
  'value-add': 'success',
  brief: 'secondary',
};

export default function CommentOption({
  option,
  index,
  onCopy,
  onMarkUsed,
  onSave,
}) {
  const [copied, setCopied] = useState(false);

  // Get style info
  const styleInfo = COMMENT_STYLE_INFO[option.style] || {
    name: option.style || 'Comment',
    description: '',
  };
  const StyleIcon = STYLE_ICONS[option.style] || MessageSquare;
  const styleColor = STYLE_COLORS[option.style] || 'secondary';

  // Handle copy
  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      padding="none"
      className={`
        overflow-hidden transition-all
        ${option.isUsed ? 'ring-2 ring-success-200 bg-success-50/30' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Badge variant={styleColor} size="sm">
            <StyleIcon className="h-3 w-3 mr-1" />
            {styleInfo.name}
          </Badge>
          {option.isUsed && (
            <Badge variant="success" size="xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Used
            </Badge>
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {option.charCount || option.text?.length || 0} chars
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
          {option.text}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          leftIcon={copied ? Check : Copy}
          className={copied ? 'text-success-600' : ''}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          leftIcon={Plus}
        >
          Save
        </Button>
        {!option.isUsed && (
          <Button
            variant="primary"
            size="sm"
            onClick={onMarkUsed}
            leftIcon={CheckCircle}
          >
            Use & Copy
          </Button>
        )}
      </div>
    </Card>
  );
}

/**
 * Skeleton loader for comment options
 */
CommentOption.Skeleton = function CommentOptionSkeleton() {
  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
      </div>
    </Card>
  );
};

/**
 * Compact version for history view
 */
CommentOption.Compact = function CommentOptionCompact({ option, onCopy }) {
  const styleInfo = COMMENT_STYLE_INFO[option.style] || { name: option.style };
  const StyleIcon = STYLE_ICONS[option.style] || MessageSquare;

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 mt-0.5">
        <StyleIcon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 line-clamp-2">{option.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">{styleInfo.name}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">{option.charCount || option.text?.length} chars</span>
        </div>
      </div>
      <button
        onClick={onCopy}
        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
        title="Copy"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
};
