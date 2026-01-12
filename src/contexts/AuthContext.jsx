/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the app.
 * Handles session management, user profile, and organization data.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, getUserProfile } from '../lib/supabase';

// Create the context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch user profile and organization data
   */
  const fetchProfile = useCallback(async () => {
    try {
      const data = await getUserProfile();
      setProfile(data);
      setOrganization(data?.organization || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
      setProfile(null);
      setOrganization(null);
    }
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get initial session with a single retry on AbortError (transient network)
        let session = null;
        let sessionError = null;

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const result = await supabase.auth.getSession();
            session = result.data?.session;
            sessionError = result.error;
            break;
          } catch (err) {
            // Some browsers/extensions may abort fetch; retry once after a short delay
            if (err?.name === 'AbortError' && attempt === 0) {
              console.warn('[Auth] getSession aborted; retrying once...');
              await new Promise((r) => setTimeout(r, 500));
              continue;
            }
            throw err;
          }
        }

        if (sessionError) throw sessionError;

        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile();
          } else {
            setUser(null);
            setProfile(null);
            setOrganization(null);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            // Fetch profile on sign in or token refresh
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              await fetchProfile();
            }
          } else {
            setUser(null);
            setProfile(null);
            setOrganization(null);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  /**
   * Sign in with email and password
   */
  const signIn = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email, password, fullName, organizationName) => {
    try {
      setError(null);
      
      // Create the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (authError) throw authError;

      // If email confirmation is disabled, create org and user profile
      if (authData.user && !authData.user.identities?.length === 0) {
        // Create organization
        const orgSlug = organizationName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: organizationName,
            slug: `${orgSlug}-${Date.now()}`,
          })
          .select()
          .single();

        if (orgError) throw orgError;

        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            organization_id: orgData.id,
            email: email,
            full_name: fullName,
            role: 'owner',
          });

        if (profileError) throw profileError;
      }

      return { data: authData, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  /**
   * Sign out
   */
  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setOrganization(null);
      
      return { error: null };
    } catch (err) {
      setError(err.message);
      return { error: err };
    }
  };

  /**
   * Reset password
   */
  const resetPassword = async (email) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  /**
   * Update password
   */
  const updatePassword = async (newPassword) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select(`
          *,
          organization:organizations(*)
        `)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      setOrganization(data?.organization || null);
      
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  /**
   * Refresh profile data
   */
  const refreshProfile = async () => {
    await fetchProfile();
  };

  // Context value
  const value = {
    // State
    user,
    profile,
    organization,
    loading,
    error,
    
    // Computed
    isAuthenticated: !!user,
    isOwner: profile?.role === 'owner',
    isAdmin: profile?.role === 'admin' || profile?.role === 'owner',
    
    // Methods
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
