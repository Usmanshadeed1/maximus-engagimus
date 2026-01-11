/**
 * useHistory Hook
 * 
 * Custom hook for managing comment generation history.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getGeneratedComments, getCommentStats } from '../lib/supabase';
import { toast } from '../components/ui/Toast';

/**
 * Hook for fetching generation history
 */
export function useHistory(options = {}) {
  const {
    clientId = null,
    platform = null,
    limit = 50,
    autoFetch = true,
  } = options;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchHistory = useCallback(async (offset = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getGeneratedComments({
        clientId,
        platform,
        limit: limit + 1, // Fetch one extra to check if there's more
        offset,
      });

      // Check if there are more results
      if (data.length > limit) {
        setHasMore(true);
        data.pop(); // Remove the extra item
      } else {
        setHasMore(false);
      }

      if (offset === 0) {
        setHistory(data);
      } else {
        setHistory(prev => [...prev, ...data]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [clientId, platform, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchHistory(0);
    }
  }, [autoFetch, fetchHistory]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchHistory(history.length);
    }
  }, [loading, hasMore, history.length, fetchHistory]);

  // Group by date
  const historyByDate = useMemo(() => {
    const groups = {};
    
    history.forEach(item => {
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
  }, [history]);

  // Group by client
  const historyByClient = useMemo(() => {
    const groups = {};
    
    history.forEach(item => {
      const clientName = item.client?.name || 'Unknown Client';
      
      if (!groups[clientName]) {
        groups[clientName] = [];
      }
      groups[clientName].push(item);
    });

    return Object.entries(groups)
      .map(([clientName, items]) => ({
        clientName,
        clientId: items[0]?.client_id,
        items,
        count: items.length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  return {
    history,
    loading,
    error,
    hasMore,
    refetch: () => fetchHistory(0),
    loadMore,
    historyByDate,
    historyByClient,
  };
}

/**
 * Hook for generation statistics
 */
export function useGenerationStats() {
  const [stats, setStats] = useState({
    totalGenerations: 0,
    totalCommentsGenerated: 0,
    commentsUsed: 0,
    usageRate: 0,
    generationsByClient: [],
    generationsByPlatform: [],
    recentActivity: [],
    averageOptionsPerGeneration: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getCommentStats();
      
      // Calculate derived stats
      const totalGenerations = data.total_generations || 0;
      const totalComments = data.total_comments || 0;
      const commentsUsed = data.comments_used || 0;
      
      setStats({
        totalGenerations,
        totalCommentsGenerated: totalComments,
        commentsUsed,
        usageRate: totalComments > 0 ? (commentsUsed / totalComments) * 100 : 0,
        generationsByClient: data.by_client || [],
        generationsByPlatform: data.by_platform || [],
        recentActivity: data.recent || [],
        averageOptionsPerGeneration: totalGenerations > 0 
          ? totalComments / totalGenerations 
          : 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook for dashboard data aggregation
 */
export function useDashboardData() {
  const { stats, loading: statsLoading } = useGenerationStats();
  const { history, loading: historyLoading } = useHistory({ limit: 10 });

  // Calculate streak (consecutive days with activity)
  const streak = useMemo(() => {
    if (!history.length) return 0;

    let count = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const activityDates = new Set(
      history.map(h => {
        const d = new Date(h.created_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    while (activityDates.has(currentDate.getTime())) {
      count++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return count;
  }, [history]);

  // Today's generations
  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return history.filter(h => {
      const d = new Date(h.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length;
  }, [history]);

  // This week's generations
  const weekCount = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return history.filter(h => new Date(h.created_at) >= weekAgo).length;
  }, [history]);

  return {
    stats,
    recentHistory: history,
    streak,
    todayCount,
    weekCount,
    loading: statsLoading || historyLoading,
  };
}

export default useHistory;
