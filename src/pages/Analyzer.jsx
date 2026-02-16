/**
 * Analyzer Page
 * 
 * Analyze content to find matching clients and generate targeted comments.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Zap,
  AlertCircle,
  ArrowRight,
  Tag,
  Target,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import { useAnalyzer } from '../hooks/useAnalyzer';
import { useClients } from '../hooks/useClients';
import { useAIProviders } from '../hooks/useAIProviders';
import {
  Card,
  Button,
  TextArea,
  Input,
  Spinner,
  Badge,
  toast,
} from '../components/ui';

export default function Analyzer() {
  const navigate = useNavigate();
  const {
    loading,
    error,
    results,
    analyzedContent,
    analyzeLocal,
    analyzeWithAI,
    clear,
  } = useAnalyzer();

  const { clients, loading: clientsLoading } = useClients({ activeOnly: true });
  const { hasConfiguredProvider } = useAIProviders();

  // Form state
  const [content, setContent] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [fetchingContent, setFetchingContent] = useState(false);

  // Handle analyze with keywords
  const handleAnalyzeKeywords = async () => {
    await analyzeLocal(content, clients);
  };

  // Handle analyze with AI
  const handleAnalyzeAI = async () => {
    await analyzeWithAI(content, clients);
  };

  // Fetch content from URL using Jina API
  const handleFetchContent = async () => {
    if (!contentUrl.trim()) {
      toast.warning('Please enter a URL');
      return;
    }

    setFetchingContent(true);
    try {
      // Use Jina Reader API to extract content
      const response = await fetch(`https://r.jina.ai/${encodeURIComponent(contentUrl)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch (HTTP ${response.status})`);
      }

      const text = await response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('No content found at URL');
      }

      // Set the content
      setContent(text);
      toast.success('Content fetched successfully!');
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error(`Failed to fetch content: ${err.message}`);
    } finally {
      setFetchingContent(false);
    }
  };

  // Go to generator with pre-filled client
  const goToGenerator = (clientId, platform = '') => {
    // Store content in sessionStorage for generator to pick up
    sessionStorage.setItem('generator_prefill', JSON.stringify({
      clientId,
      platform,
      content: analyzedContent,
    }));
    navigate('/generator');
  };

  // Loading state
  if (clientsLoading) {
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Clients</h2>
          <p className="text-gray-600 mb-6">
            You need active clients with keywords to analyze content.
          </p>
          <Button onClick={() => navigate('/clients')}>
            Manage Clients
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Analyzer</h1>
        <p className="text-gray-600 mt-1">
          Paste content to find which clients it's relevant to
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Input */}
        <div className="space-y-4">
          <Card>
            <Card.Header>
              <Card.Title>Content to Analyze</Card.Title>
              <Card.Description>
                Paste a post, article, or any content you want to match to clients
              </Card.Description>
            </Card.Header>

            {/* URL input (optional) with fetch button */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-gray-700">Content URL (optional)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleFetchContent();
                    }
                  }}
                />
                <Button
                  onClick={handleFetchContent}
                  loading={fetchingContent}
                  disabled={!contentUrl.trim() || fetchingContent}
                  variant="secondary"
                  leftIcon={Download}
                  size="sm"
                  title="Fetch content from URL"
                  className="whitespace-nowrap"
                >
                  Fetch
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Paste a URL and click Fetch to automatically extract content (works with articles, blogs, forums, etc.)
              </p>
            </div>

            {/* Content textarea */}
            <TextArea
              label="Content"
              placeholder="Paste the content you want to analyze...

Example: A LinkedIn post about digital marketing trends, a forum discussion about home renovation, or an industry article."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              required
            />

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button
                onClick={handleAnalyzeKeywords}
                loading={loading}
                disabled={!content.trim()}
                variant="secondary"
                leftIcon={Zap}
                className="flex-1"
              >
                Quick Match (Keywords)
              </Button>
              
              <Button
                onClick={handleAnalyzeAI}
                loading={loading}
                disabled={!content.trim() || !hasConfiguredProvider}
                leftIcon={Sparkles}
                className="flex-1"
                title={!hasConfiguredProvider ? 'Requires AI provider' : ''}
              >
                AI Analysis
              </Button>
            </div>

            {!hasConfiguredProvider && (
              <p className="text-xs text-gray-500 mt-2">
                AI Analysis requires a configured AI provider.{' '}
                <Link to="/settings/ai-providers" className="text-primary-600 hover:underline">
                  Add one in Settings
                </Link>
              </p>
            )}
          </Card>

          {/* Tips */}
          <Card padding="sm" className="bg-primary-50 border-primary-100">
            <h4 className="font-medium text-primary-900 mb-2">Analysis Tips</h4>
            <ul className="text-sm text-primary-700 space-y-1">
              <li>• <strong>Quick Match</strong> uses client keywords for fast matching</li>
              <li>• <strong>AI Analysis</strong> provides deeper semantic matching</li>
              <li>• Add more keywords to clients for better matches</li>
              <li>• Works best with industry-specific content</li>
            </ul>
          </Card>
        </div>

        {/* Right column: Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Matching Clients
              {results.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({results.length} found)
                </span>
              )}
            </h2>
            {results.length > 0 && (
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
                <p className="mt-4 text-gray-600">Analyzing content...</p>
              </div>
            </Card>
          )}

          {/* Error state */}
          {error && !loading && (
            <Card className="bg-error-50 border-error-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-error-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-error-800">Analysis Failed</h3>
                  <p className="text-sm text-error-700 mt-1">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Empty state */}
          {!loading && !error && results.length === 0 && (
            <Card className="py-12">
              <div className="text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p className="text-sm text-gray-500">
                  Paste content and click analyze to find matching clients
                </p>
              </div>
            </Card>
          )}

          {/* Results list */}
          {!loading && results.length > 0 && (
            <div className="space-y-3">
              {results.map((result, index) => (
                <MatchResult
                  key={result.client_id || index}
                  result={result}
                  onGenerateComment={() => goToGenerator(result.client_id)}
                />
              ))}
            </div>
          )}

          {/* No matches message */}
          {!loading && !error && results.length === 0 && analyzedContent && (
            <Card className="bg-gray-50 dark:bg-[var(--bg)]">
              <div className="text-center py-4">
                <p className="text-gray-600">No matching clients found.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try adding more keywords to your clients or use AI Analysis.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Single match result card
 */
function MatchResult({ result, onGenerateComment }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--bg)]"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{result.client_name}</h3>
              <Badge.Relevance level={result.relevance} className="self-center" />
            </div>
            <p className="text-sm text-gray-500">{result.industry}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="xs"
            className="ml-2 self-center h-8 leading-none"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateComment();
            }}
            rightIcon={ArrowRight}
          >
            Generate Comment
          </Button>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
          {/* Matched keywords */}
          {result.matched_keywords && result.matched_keywords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4" />
                Matched Keywords
              </div>
              <div className="flex flex-wrap gap-1">
                {result.matched_keywords.map((keyword, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    size="sm"
                    className="border border-gray-200 dark:bg-[var(--card-soft)] dark:text-gray-200 dark:border-gray-700"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reasons */}
          {result.reasons && result.reasons.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Target className="h-4 w-4" />
                Why It Matches
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {result.reasons.map((reason, idx) => (
                  <li key={idx}>• {reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested angle */}
          {result.angle && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="h-4 w-4" />
                Suggested Approach
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 dark:bg-[var(--bg)] dark:text-gray-200 rounded-md p-3">
                {result.angle}
              </p>
            </div>
          )}

          {/* Client link */}
          <div className="pt-2">
            <Link
              to={`/clients/${result.client_id}`}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View Client Profile →
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}
