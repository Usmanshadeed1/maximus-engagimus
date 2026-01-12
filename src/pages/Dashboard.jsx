/**
 * Dashboard Page
 * 
 * Main landing page with stats, quick actions, and recent activity.
 */

import { Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Users,
  Clock,
  TrendingUp,
  Target,
  Zap,
  ArrowRight,
  MessageSquare,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardData } from '../hooks/useHistory';
import { useClients } from '../hooks/useClients';
import { useCompetitorInsights } from '../hooks/useCompetitors';
import { Card, Button, Spinner, Badge } from '../components/ui';
import StatCard from '../components/dashboard/StatCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import { formatNumber, formatPercent } from '../lib/utils';

export default function Dashboard() {
  const { profile } = useAuth();
  const { stats, recentHistory, streak, todayCount, weekCount, loading } = useDashboardData();
  const { clients, loading: clientsLoading } = useClients({ activeOnly: true });
  const competitorInsights = useCompetitorInsights();

  // Loading state — show skeleton layout for perceived performance
  if (loading || clientsLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="sm" className="h-28">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="mt-3 h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
          </Card>
          <Card padding="sm" className="h-28">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="mt-3 h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
          </Card>
          <Card padding="sm" className="h-28">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="mt-3 h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <div className="p-4 space-y-4">
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="p-4">
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                <div className="mt-4 h-6 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Get greeting based on time of day
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
          {greeting}, {firstName}!
        </h1>

        {/* Decorative accent */}
        <div className="mt-3 h-1 w-24 rounded bg-gradient-to-r from-primary-400 to-primary-600" aria-hidden="true" />

        <p className="mt-4 text-lg text-gray-600">
          Here's what's happening with your engagement efforts.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/generator">
          <Card
            padding="sm"
            hover
            className="h-full bg-primary-50 border-primary-200 dark:bg-[var(--bg)] dark:border-transparent quick-card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-500 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-900 dark:text-[var(--text)]">Generate Comments</h3>
                <p className="text-sm text-primary-700 dark:text-[var(--muted)]">Create AI-powered comments</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/analyzer">
          <Card
            padding="sm"
            hover
            className="h-full bg-success-50 border-success-200 dark:bg-[var(--bg)] dark:border-transparent quick-card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success-500 rounded-lg">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-success-900 dark:text-[var(--text)]">Analyze Content</h3>
                <p className="text-sm text-success-700 dark:text-[var(--muted)]">Match content to clients</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/competitors">
          <Card
            padding="sm"
            hover
            className="h-full bg-warning-50 border-warning-200 dark:bg-[var(--bg)] dark:border-transparent quick-card"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-warning-900 dark:text-[var(--text)]">Track Competitors</h3>
                <p className="text-sm text-warning-700 dark:text-[var(--muted)]">Monitor competitor activity</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Today"
          value={todayCount}
          icon={Zap}
          color="primary"
        />
        <StatCard
          title="This Week"
          value={weekCount}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Comments Used"
          value={formatNumber(stats.commentsUsed)}
          subtitle={`${formatPercent(stats.usageRate / 100)} usage rate`}
          icon={CheckCircle}
          color="info"
        />
        <StatCard
          title="Active Streak"
          value={`${streak} day${streak !== 1 ? 's' : ''}`}
          icon={Target}
          color="warning"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity - takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header
              actions={
                <Link to="/history">
                  <Button variant="ghost" size="sm" rightIcon={ArrowRight}>
                    View All
                  </Button>
                </Link>
              }
            >
              <Card.Title className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </Card.Title>
            </Card.Header>

            <RecentActivity items={recentHistory} />
          </Card>
        </div>

        {/* Sidebar stats */}
        <div className="space-y-6">
          {/* Clients summary */}
          <Card>
            <Card.Header
              actions={
                <Link to="/clients">
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                </Link>
              }
            >
              <Card.Title>Active Clients</Card.Title>
            </Card.Header>

            {clients.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-3">No active clients yet</p>
                <Link to="/clients">
                  <Button size="sm">Add Client</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {clients.slice(0, 5).map((client) => (
                  <Link
                    key={client.id}
                    to={`/clients/${client.id}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-[var(--bg)] rounded-md transition-colors"
                  >
                    <span className="font-medium text-gray-900 truncate">
                      {client.name}
                    </span>
                    <Badge variant="secondary" size="xs">
                      {client.industry}
                    </Badge>
                  </Link>
                ))}
                {clients.length > 5 && (
                  <p className="text-xs text-gray-500 pt-2">
                    +{clients.length - 5} more clients
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Platform breakdown */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                By Platform
              </Card.Title>
            </Card.Header>

            {stats.generationsByPlatform.length === 0 ? (
              <p className="text-gray-500 text-sm">No data yet</p>
            ) : (
              <div className="space-y-3">
                {stats.generationsByPlatform.slice(0, 5).map((item) => (
                  <div key={item.platform} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">
                      {item.platform === 'x' ? 'X (Twitter)' : item.platform}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{
                            width: `${(item.count / stats.totalGenerations) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">
                        {item.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Competitor insights */}
          <Card>
            <Card.Header
              actions={
                <Link to="/competitors">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              }
            >
              <Card.Title>Competitor Intel</Card.Title>
            </Card.Header>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Sightings</span>
                <span className="font-semibold">{competitorInsights.totalSightings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Locations Tracked</span>
                <span className="font-semibold">{competitorInsights.totalLocations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">High Priority</span>
                <Badge variant="warning" size="sm">
                  {competitorInsights.highPriorityCount}
                </Badge>
              </div>
              {competitorInsights.staleLocations.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-warning-600">
                    ⚠️ {competitorInsights.staleLocations.length} location{competitorInsights.staleLocations.length !== 1 ? 's' : ''} need attention
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Tips section */}
      <Card className="bg-primary-50 border-primary-100">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary-100 rounded-lg">
            <MessageSquare className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-900">Pro Tip</h3>
            <p className="text-sm text-primary-700 mt-1">
              Add sample comments to your client profiles to help the AI match your preferred tone and style.
              The more examples you provide, the better the generated comments will be.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
