/**
 * useClients Hook
 * 
 * Custom hook for managing client data with caching and optimistic updates.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getClients,
  getClient,
  createSupabaseClient,
  updateClient,
  deleteClient,
  addClientKeywords,
  removeClientKeyword,
  addClientSampleComment,
  removeClientSampleComment,
  addClientIndustrySite,
  removeClientIndustrySite,
} from '../lib/supabase';
import { getCached, setCached, clearCache } from '../lib/cache';
import { toast } from '../components/ui/Toast';

/**
 * Hook for fetching and managing multiple clients
 */
export function useClients(options = {}) {
  const { activeOnly = false, autoFetch = true } = options;
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClients = useCallback(async () => {
    try {
      // Return cached data immediately if available (no loading state)
      const cached = getCached('clients');
      if (cached) {
        setClients(cached);
        setError(null);
        // Don't set loading=true if we have cache - user sees data instantly
      } else {
        // No cache, show loading state
        setLoading(true);
        setError(null);
      }

      // Fetch fresh data in background with timeout
      try {
        const data = await Promise.race([
          getClients(activeOnly),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out while fetching clients')), 2000)),
        ]);
        
        if (data) {
          setClients(data || []);
          // Cache for 10 minutes
          setCached('clients', data, 10 * 60 * 1000);
        }
      } catch (fetchErr) {
        // Fetch failed, but we keep cached data visible if available
        if (!cached) {
          setError(fetchErr.message);
          toast.error('Failed to load clients');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    if (autoFetch) {
      fetchClients();
    }
  }, [autoFetch, fetchClients]);

  const create = async (clientData) => {
    try {
      // Optimistic update - add to UI immediately
      const optimisticClient = {
        id: `temp-${Date.now()}`,
        ...clientData,
        created_at: new Date().toISOString(),
      };
      
      setClients(prev => [...prev, optimisticClient]);

      // Then make the actual API call
      const newClient = await createSupabaseClient(clientData);
      
      // Replace optimistic with real data
      setClients(prev =>
        prev.map(c => (c.id === optimisticClient.id ? newClient : c))
      );
      
      clearCache('clients');
      toast.success('Client created successfully');
      return { data: newClient, error: null };
    } catch (err) {
      console.error('Error creating client:', err);
      
      // Rollback - remove optimistic update
      setClients(prev =>
        prev.filter(c => !c.id.startsWith('temp-'))
      );
      
      toast.error('Failed to create client');
      return { data: null, error: err };
    }
  };

  const update = async (clientId, updates) => {
    try {
      // Optimistic update - update UI immediately
      const prevClients = [...clients]; // Save current state for rollback
      setClients(prev =>
        prev.map(c => (c.id === clientId ? { ...c, ...updates } : c))
      );

      // Then make the actual API call
      const updatedClient = await updateClient(clientId, updates);
      setClients(prev =>
        prev.map(c => (c.id === clientId ? { ...c, ...updatedClient } : c))
      );
      
      clearCache('clients');
      toast.success('Client updated successfully');
      return { data: updatedClient, error: null };
    } catch (err) {
      console.error('Error updating client:', err);
      
      // Rollback to previous state on error
      setClients(prevClients);
      
      toast.error('Failed to update client');
      return { data: null, error: err };
    }
  };

  const remove = async (clientId) => {
    try {
      // Optimistic update - remove from UI immediately
      const prevClients = [...clients]; // Save for rollback
      setClients(prev => prev.filter(c => c.id !== clientId));

      // Then make the actual API call
      await deleteClient(clientId);
      
      clearCache('clients');
      toast.success('Client deleted successfully');
      return { error: null };
    } catch (err) {
      console.error('Error deleting client:', err);
      
      // Rollback on error
      setClients(prevClients);
      
      toast.error('Failed to delete client');
      return { error: err };
    }
  };

  const toggleActive = async (clientId, isActive) => {
    return update(clientId, { is_active: isActive });
  };

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    create,
    update,
    remove,
    toggleActive,
  };
}

/**
 * Hook for fetching and managing a single client
 */
export function useClient(clientId) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClient = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    try {
      // Return cached client data immediately if available
      const cacheKey = `client_${clientId}`;
      const cached = getCached(cacheKey);
      
      if (cached) {
        setClient(cached);
        setError(null);
        // Don't show loading if we have cache
      } else {
        setLoading(true);
        setError(null);
      }

      // Fetch fresh data with faster timeout (2s)
      try {
        const data = await Promise.race([
          getClient(clientId),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out while fetching client')), 2000)),
        ]);
        
        setClient(data);
        // Cache for 10 minutes
        setCached(cacheKey, data, 10 * 60 * 1000);
      } catch (fetchErr) {
        // If fetch fails but we have cache, keep showing it
        if (!cached) {
          setError(fetchErr.message);
          toast.error('Failed to load client');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const update = async (updates) => {
    try {
      const updatedClient = await updateClient(clientId, updates);
      setClient(prev => ({ ...prev, ...updatedClient }));
      toast.success('Client updated successfully');
      return { data: updatedClient, error: null };
    } catch (err) {
      console.error('Error updating client:', err);
      toast.error('Failed to update client');
      return { data: null, error: err };
    }
  };

  const remove = async () => {
    try {
      await deleteClient(clientId);
      toast.success('Client deleted successfully');
      return { error: null };
    } catch (err) {
      console.error('Error deleting client:', err);
      toast.error('Failed to delete client');
      return { error: err };
    }
  };

  // Keyword management
  const addKeywords = async (keywords) => {
    try {
      const newKeywords = await addClientKeywords(clientId, keywords);
      setClient(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), ...newKeywords],
      }));
      toast.success('Keywords added');
      return { data: newKeywords, error: null };
    } catch (err) {
      console.error('Error adding keywords:', err);
      toast.error('Failed to add keywords');
      return { data: null, error: err };
    }
  };

  const removeKeyword = async (keywordId) => {
    try {
      await removeClientKeyword(keywordId);
      setClient(prev => ({
        ...prev,
        keywords: prev.keywords.filter(k => k.id !== keywordId),
      }));
      return { error: null };
    } catch (err) {
      console.error('Error removing keyword:', err);
      toast.error('Failed to remove keyword');
      return { error: err };
    }
  };

  // Sample comment management
  const addSampleComment = async (comment) => {
    try {
      const newComment = await addClientSampleComment(clientId, comment);
      setClient(prev => ({
        ...prev,
        sample_comments: [...(prev.sample_comments || []), newComment],
      }));
      toast.success('Sample comment added');
      return { data: newComment, error: null };
    } catch (err) {
      console.error('Error adding sample comment:', err);
      toast.error('Failed to add sample comment');
      return { data: null, error: err };
    }
  };

  const removeSampleComment = async (commentId) => {
    try {
      await removeClientSampleComment(commentId);
      setClient(prev => ({
        ...prev,
        sample_comments: prev.sample_comments.filter(c => c.id !== commentId),
      }));
      return { error: null };
    } catch (err) {
      console.error('Error removing sample comment:', err);
      toast.error('Failed to remove sample comment');
      return { error: err };
    }
  };

  // Industry site management
  const addIndustrySite = async (site) => {
    try {
      const newSite = await addClientIndustrySite(clientId, site);
      setClient(prev => ({
        ...prev,
        industry_sites: [...(prev.industry_sites || []), newSite],
      }));
      toast.success('Industry site added');
      return { data: newSite, error: null };
    } catch (err) {
      console.error('Error adding industry site:', err);
      toast.error('Failed to add industry site');
      return { data: null, error: err };
    }
  };

  const removeIndustrySite = async (siteId) => {
    try {
      await removeClientIndustrySite(siteId);
      setClient(prev => ({
        ...prev,
        industry_sites: prev.industry_sites.filter(s => s.id !== siteId),
      }));
      return { error: null };
    } catch (err) {
      console.error('Error removing industry site:', err);
      toast.error('Failed to remove industry site');
      return { error: err };
    }
  };

  return {
    client,
    loading,
    error,
    refetch: fetchClient,
    update,
    remove,
    // Keywords
    addKeywords,
    removeKeyword,
    // Sample comments
    addSampleComment,
    removeSampleComment,
    // Industry sites
    addIndustrySite,
    removeIndustrySite,
  };
}

/**
 * Hook for client selection (used in generator, analyzer)
 */
export function useClientSelect(options = {}) {
  const { activeOnly = true } = options;
  const { clients, loading } = useClients({ activeOnly });

  const clientOptions = clients.map(client => ({
    value: client.id,
    label: client.name,
    industry: client.industry,
    ...client,
  }));

  const getClientById = useCallback(
    (id) => clients.find(c => c.id === id),
    [clients]
  );

  return {
    clients,
    clientOptions,
    loading,
    getClientById,
  };
}

export default useClients;
