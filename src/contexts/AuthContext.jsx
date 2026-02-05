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
   * Sign in with email and password
   */
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Development shortcut: if dev mock auth is enabled, skip real Supabase calls
        if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && localStorage.getItem('dev:mockAuth') === 'true') {
          const mockUser = { id: 'dev-user', email: 'dev@local' };
          const mockProfile = {
            id: 'dev-user',
            full_name: 'Developer',
            role: 'owner',
            organization: { id: 'org-dev', name: 'Dev Org', slug: 'dev-org' },
          };
          setUser(mockUser);
          setProfile(mockProfile);
          setOrganization(mockProfile.organization);
          setLoading(false);
          return;
        }

        // Get initial session with a single retry on AbortError (transient network)
        let session = null;
        let sessionError = null;

        const getSessionWithRetry = async () => {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const result = await supabase.auth.getSession();
              return { session: result.data?.session, error: result.error };
            } catch (err) {
              if (err?.name === 'AbortError' && attempt === 0) {
                console.warn('[Auth] getSession aborted; retrying once...');
                await new Promise((r) => setTimeout(r, 500));
                continue;
              }
              throw err;
            }
          }
          return { session: null, error: null };
        };

        // Add a longer timeout (8 seconds) as fallback
        const timeoutPromise = new Promise((_, rej) => 
          setTimeout(() => rej(new Error('auth-init-timeout')), 8000)
        );

        try {
          const { session: s, error: se } = await Promise.race([getSessionWithRetry(), timeoutPromise]);
          session = s;
          sessionError = se;
          if (sessionError) throw sessionError;
        } catch (err) {
          // Timeout is not fatal - just means session check took too long
          if (err?.message === 'auth-init-timeout') {
            console.warn('[Auth] Session check timed out, continuing...');
          } else {
            throw err;
          }
        }

        if (mounted) {
          if (session?.user) {
            // Fetch profile FIRST before setting user, so avatar shows correctly immediately
            try {
              const profileData = await Promise.race([
                getUserProfile(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Profile fetch timeout')), 20000)
                ),
              ]);
              
              if (mounted) {
                // Now set both user and profile together so UI renders complete data
                setUser(session.user);
                if (profileData) {
                  setProfile(profileData);
                  setOrganization(profileData?.organization || null);
                }
              }
            } catch (profileErr) {
              console.error('Error fetching profile:', profileErr);
              if (mounted) {
                // Fall back to just setting user if profile fails
                setUser(session.user);
                setProfile(null);
                setOrganization(null);
              }
            }
          } else {
            setUser(null);
            setProfile(null);
            setOrganization(null);
          }
          setLoading(false);
        }
      } catch (err) {
        console.warn('Auth initialization fallback triggered:', err?.message || err);
        // On timeout or other errors, ensure loading is cleared and allow UI to show login
        if (mounted) {
          setError(err?.message || 'Auth initialization failed');
          setUser(null);
          setProfile(null);
          setOrganization(null);
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
            // Fetch profile FIRST before setting user (for all session states)
            // This includes SIGNED_IN, TOKEN_REFRESHED, and restored sessions
            try {
              const profileData = await Promise.race([
                getUserProfile(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Profile fetch timeout')), 20000)
                ),
              ]);
              
              if (mounted) {
                // Set user and profile together so UI renders complete data
                setUser(session.user);
                if (profileData) {
                  setProfile(profileData);
                  setOrganization(profileData?.organization || null);
                }
              }
            } catch (profileErr) {
              console.error('Error fetching profile on session change:', profileErr);
              if (mounted) {
                // Fall back to just setting user if profile fails
                setUser(session.user);
                setProfile(null);
                setOrganization(null);
              }
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
  }, []);

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
      
      // Clear dev mock auth flag if it exists
      localStorage.removeItem('dev:mockAuth');
      
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
    try {
      const profileData = await Promise.race([
        getUserProfile(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 20000)
        ),
      ]);
      
      if (profileData) {
        setProfile(profileData);
        setOrganization(profileData?.organization || null);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
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
