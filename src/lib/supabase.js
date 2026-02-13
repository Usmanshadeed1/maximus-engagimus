/**
 * Supabase Client Configuration
 * 
 * This module initializes the Supabase client and provides
 * helper functions for common database operations.
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables (safe access for test envs)
const supabaseUrl = (import.meta && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = (import.meta && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Some operations may fail in tests without them.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ============================================
// AUTH HELPERS
// ============================================

/**
 * Sign up a new user with email and password
 */
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  
  if (error) throw error;
  return data;
}

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Reset password for email
 */
export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) throw error;
  return data;
}

/**
 * Update user password
 */
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) throw error;
  return data;
}

// ============================================
// USER & ORGANIZATION HELPERS
// ============================================

/**
 * Get current user's profile with organization
 */
export async function getUserProfile() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      organization:organizations(*)
    `)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates) {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get organization members
 */
export async function getOrganizationMembers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

/**
 * Update a user's role (owner/admin/member)
 */
export async function updateUserRole(userId, role) {
  const allowed = ['owner', 'admin', 'member'];
  if (!allowed.includes(role)) throw new Error('Invalid role');

  // Update role
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  // Try to log the change; don't block the main flow if logging fails
  try {
    // Get current auth user id (if available)
    const { data: authUser } = await supabase.auth.getUser();
    const actorId = authUser?.user?.id || null;

    // Insert log with organization from the updated user record
    await supabase
      .from('role_change_logs')
      .insert({
        organization_id: data.organization_id,
        user_id: userId,
        actor_id: actorId,
        action: 'role_change',
        details: { new_role: role },
      });
  } catch (logErr) {
    console.warn('Failed to log role change', logErr);
  }

  return data;
}

/**
 * Log a role change or removal explicitly
 */
export async function logRoleChange(organizationId, userId, actorId, action, details = {}) {
  const { data, error } = await supabase
    .from('role_change_logs')
    .insert({ organization_id: organizationId, user_id: userId, actor_id: actorId, action, details })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove a member from the organization (deletes from users table)
 */
export async function removeOrganizationMember(userId) {
  // Fetch user to know their org for logging
  const { data: userData, error: userErr } = await supabase
    .from('users')
    .select('id, email, organization_id')
    .eq('id', userId)
    .single();
  if (userErr) throw userErr;

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;

  // Log removal
  try {
    const { data: authUser } = await supabase.auth.getUser();
    const actorId = authUser?.user?.id || null;

    await supabase
      .from('role_change_logs')
      .insert({
        organization_id: userData.organization_id,
        user_id: userId,
        actor_id: actorId,
      });
  } catch (logErr) {
    console.warn('Failed to log member removal', logErr);
  }

  return { success: true };
} 

// ============================================
// CLIENT HELPERS
// ============================================

/**
 * Get all clients for organization
 */
export async function getClients(activeOnly = false) {
  // Fetch just the clients first (fast)
  let query = supabase
    .from('clients')
    .select(`*`)
    .order('name');
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Add empty arrays for nested data by default
  // Data can be fetched on-demand when viewing individual client
  return data.map(client => ({
    ...client,
    keywords: [],
    sample_comments: [],
    industry_sites: [],
    platforms: [],
  }));
}

/**
 * Get a single client by ID
 */
export async function getClient(clientId) {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      keywords:client_keywords(id, keyword),
      sample_comments:client_sample_comments(id, platform, comment_text, notes),
      industry_sites:client_industry_sites(id, site_name, site_url, site_type, notes),
      platforms:client_platforms(id, platform, handle, profile_url, notes),
      competitors(id, name, website, is_active)
    `)
    .eq('id', clientId)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Create a new client
 */
export async function createSupabaseClient(clientData) {
  const profile = await getUserProfile();
  
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...clientData,
      organization_id: profile.organization_id,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Update a client
 */
export async function updateClient(clientId, updates) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Delete a client
 */
export async function deleteClient(clientId) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);
  
  if (error) throw error;
}

// ============================================
// CLIENT RELATED DATA HELPERS
// ============================================

/**
 * Add keywords to a client
 */
export async function addClientKeywords(clientId, keywords) {
  const inserts = keywords.map(keyword => ({
    client_id: clientId,
    keyword: keyword.trim(),
  }));
  
  const { data, error } = await supabase
    .from('client_keywords')
    .insert(inserts)
    .select();
  
  if (error) throw error;
  return data;
}

/**
 * Remove a keyword from a client
 */
export async function removeClientKeyword(keywordId) {
  const { error } = await supabase
    .from('client_keywords')
    .delete()
    .eq('id', keywordId);
  
  if (error) throw error;
}

/**
 * Add sample comment to a client
 */
export async function addClientSampleComment(clientId, comment) {
  const { data, error } = await supabase
    .from('client_sample_comments')
    .insert({
      client_id: clientId,
      ...comment,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Remove a sample comment
 */
export async function removeClientSampleComment(commentId) {
  const { error } = await supabase
    .from('client_sample_comments')
    .delete()
    .eq('id', commentId);
  
  if (error) throw error;
}

/**
 * Add industry site to a client
 */
export async function addClientIndustrySite(clientId, site) {
  const { data, error } = await supabase
    .from('client_industry_sites')
    .insert({
      client_id: clientId,
      ...site,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Remove an industry site
 */
export async function removeClientIndustrySite(siteId) {
  const { error } = await supabase
    .from('client_industry_sites')
    .delete()
    .eq('id', siteId);
  
  if (error) throw error;
}

// ============================================
// COMPETITOR HELPERS
// ============================================

/**
 * Get competitors for a client
 */
export async function getCompetitors(clientId) {
  const { data, error } = await supabase
    .from('competitors')
    .select(`
      *,
      sightings:competitor_sightings(*)
    `)
    .eq('client_id', clientId)
    .order('name');
  
  if (error) throw error;
  return data;
}

/**
 * Create a competitor
 */
export async function createCompetitor(competitorData) {
  const { data, error } = await supabase
    .from('competitors')
    .insert(competitorData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Update a competitor
 */
export async function updateCompetitor(competitorId, updates) {
  const { data, error } = await supabase
    .from('competitors')
    .update(updates)
    .eq('id', competitorId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Delete a competitor
 */
export async function deleteCompetitor(competitorId) {
  const { error } = await supabase
    .from('competitors')
    .delete()
    .eq('id', competitorId);
  
  if (error) throw error;
}

// ============================================
// COMPETITOR SIGHTING HELPERS
// ============================================

/**
 * Get all sightings for organization
 */
export async function getAllSightings() {
  const { data, error } = await supabase
    .from('competitor_sightings')
    .select(`
      *,
      competitor:competitors(
        id,
        name,
        client:clients(id, name)
      )
    `)
    .order('last_seen_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

/**
 * Add a competitor sighting
 */
export async function addCompetitorSighting(sightingData) {
  const { data, error } = await supabase
    .from('competitor_sightings')
    .insert(sightingData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Update a sighting
 */
export async function updateCompetitorSighting(sightingId, updates) {
  const { data, error } = await supabase
    .from('competitor_sightings')
    .update(updates)
    .eq('id', sightingId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Delete a sighting
 */
export async function deleteCompetitorSighting(sightingId) {
  const { error } = await supabase
    .from('competitor_sightings')
    .delete()
    .eq('id', sightingId);
  
  if (error) throw error;
}

/**
 * Get predefined sighting notes
 */
export async function getPredefinedSightingNotes() {
  const { data, error } = await supabase
    .from('predefined_sighting_notes')
    .select('*')
    .order('note_text');
  
  if (error) throw error;
  return data;
}

// ============================================
// AI PROVIDER HELPERS
// ============================================

/**
 * Get all AI providers for organization
 */
export async function getAIProviders() {
  const { data, error } = await supabase
    .from('ai_providers')
    .select('*')
    .order('fallback_order');
  
  if (error) throw error;
  return data;
}

/**
 * Get the default AI provider
 */
export async function getDefaultAIProvider() {
  const { data, error } = await supabase
    .from('ai_providers')
    .select('*')
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('fallback_order')
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // Ignore no rows error
  return data;
}

/**
 * Create an AI provider
 */
export async function createAIProvider(providerData) {
  let profile = await getUserProfile();
  
  // If organization_id is missing, create the organization
  if (!profile.organization_id) {
    console.log('[AI Provider] Organization missing, creating one...');
    
    try {
      const orgName = `${profile.full_name || 'User'}'s Organization`;
      const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: `${orgSlug}-${Date.now()}`,
        })
        .select()
        .single();
      
      if (orgError) throw orgError;
      
      console.log('[AI Provider] Organization created:', org.id);
      
      // Update user with the new organization
      const { error: updateError } = await supabase
        .from('users')
        .update({ organization_id: org.id })
        .eq('id', profile.id);
      
      if (updateError) throw updateError;
      
      console.log('[AI Provider] User updated with organization');
      
      // Update the profile object
      profile.organization_id = org.id;
      profile.organization = org;
    } catch (err) {
      console.error('[AI Provider] Failed to create organization:', err);
      throw new Error(`Failed to set up organization: ${err.message}`);
    }
  }
  
  if (!profile.organization_id) {
    throw new Error('Organization ID is still not set. Please refresh and try again.');
  }
  
  const { data, error } = await supabase
    .from('ai_providers')
    .insert({
      ...providerData,
      organization_id: profile.organization_id,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Update an AI provider
 */
export async function updateAIProvider(providerId, updates) {
  const { data, error } = await supabase
    .from('ai_providers')
    .update(updates)
    .eq('id', providerId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Delete an AI provider
 */
export async function deleteAIProvider(providerId) {
  const { error } = await supabase
    .from('ai_providers')
    .delete()
    .eq('id', providerId);
  
  if (error) throw error;
}

/**
 * Set a provider as default (and unset others)
 */
export async function setDefaultAIProvider(providerId) {
  const profile = await getUserProfile();
  
  // First, unset all defaults
  await supabase
    .from('ai_providers')
    .update({ is_default: false })
    .eq('organization_id', profile.organization_id);
  
  // Then set the new default
  const { data, error } = await supabase
    .from('ai_providers')
    .update({ is_default: true })
    .eq('id', providerId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// AI CHAT LINKS HELPERS
// ============================================

/**
 * Get all AI chat links
 */
export async function getAIChatLinks() {
  const { data, error } = await supabase
    .from('ai_chat_links')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  
  if (error) throw error;
  return data;
}

// ============================================
// PLATFORM PROMPT HELPERS
// ============================================

/**
 * Get all platform prompts
 */
export async function getPlatformPrompts() {
  const { data, error } = await supabase
    .from('platform_prompts')
    .select('*')
    .order('platform');
  
  if (error) throw error;
  return data;
}

/**
 * Get platform prompt for a specific platform
 */
export async function getPlatformPrompt(platform) {
  const { data, error } = await supabase
    .from('platform_prompts')
    .select('*')
    .eq('platform', platform)
    .order('is_system') // Org prompts first
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Update or create a platform prompt
 */
export async function upsertPlatformPrompt(platform, promptData) {
  const profile = await getUserProfile();
  
  const { data, error } = await supabase
    .from('platform_prompts')
    .upsert({
      organization_id: profile.organization_id,
      platform,
      ...promptData,
      is_system: false,
    }, {
      onConflict: 'organization_id,platform',
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// GENERATED COMMENTS HELPERS
// ============================================

/**
 * Save generated comments
 */
export async function saveGeneratedComments(commentData) {
  const profile = await getUserProfile();
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('generated_comments')
    .insert({
      ...commentData,
      organization_id: profile.organization_id,
      user_id: user.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Mark a comment as used
 */
export async function markCommentAsUsed(commentId, optionIndex, optionStyle) {
  const { data, error } = await supabase.rpc('mark_comment_used', {
    comment_id: commentId,
    option_index: optionIndex,
    option_style: optionStyle,
  });
  
  if (error) throw error;
  return data;
}

/**
 * Get generated comments history
 */
export async function getGeneratedComments(options = {}) {
  const { clientId, platform, usedOnly, limit = 50, offset = 0 } = options;
  
  let query = supabase
    .from('generated_comments')
    .select(`
      *,
      client:clients(id, name)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  
  if (platform) {
    query = query.eq('platform', platform);
  }
  
  if (usedOnly) {
    query = query.eq('is_used', true);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Get comment generation stats
 */
export async function getCommentStats() {
  const { data, error } = await supabase
    .from('generated_comments')
    .select('id, is_used, platform, client_id, selected_option_index')
    .order('created_at', { ascending: false })
    .limit(1000);
  
  if (error) throw error;
  
  // Calculate stats
  const stats = {
    total: data.length,
    used: data.filter(c => c.is_used).length,
    byPlatform: {},
    byClient: {},
    preferredOptionIndex: {},
  };
  
  data.forEach(comment => {
    // By platform
    stats.byPlatform[comment.platform] = (stats.byPlatform[comment.platform] || 0) + 1;
    
    // By client
    if (comment.client_id) {
      stats.byClient[comment.client_id] = (stats.byClient[comment.client_id] || 0) + 1;
    }
    
    // Preferred option index (for used comments)
    if (comment.is_used && comment.selected_option_index !== null) {
      stats.preferredOptionIndex[comment.selected_option_index] = 
        (stats.preferredOptionIndex[comment.selected_option_index] || 0) + 1;
    }
  });
  
  return stats;
}

// ============================================
// CONTENT ANALYSIS HELPER
// ============================================

/**
 * Analyze content and find matching clients
 */
export async function analyzeContentForClients(content) {
  const profile = await getUserProfile();
  
  const { data, error } = await supabase.rpc('analyze_content_for_clients', {
    org_id: profile.organization_id,
    content_text: content,
  });
  
  if (error) throw error;
  return data;
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to changes on a table
 */
export function subscribeToTable(table, callback) {
  return supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      callback
    )
    .subscribe();
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribe(subscription) {
  return supabase.removeChannel(subscription);
}

// ============================================
// SYSTEM PROMPT TEMPLATES
// ============================================

/**
 * Get custom system prompt template for organization
 */
export async function getSystemPromptTemplate(organizationId) {
  const { data, error } = await supabase
    .from('organizations')
    .select('system_prompt_template')
    .eq('id', organizationId)
    .single();
  
  if (error) return null;
  return data?.system_prompt_template || null;
}

/**
 * Save system prompt template for organization
 */
export async function saveSystemPromptTemplate(organizationId, template) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({ system_prompt_template: template })
      .eq('id', organizationId)
      .select();
    
    if (error) {
      console.error('Supabase error saving template:', error);
      throw new Error(error.message || 'Failed to save template');
    }
    
    return data;
  } catch (err) {
    console.error('Error in saveSystemPromptTemplate:', err);
    throw err;
  }
}

export default supabase;
