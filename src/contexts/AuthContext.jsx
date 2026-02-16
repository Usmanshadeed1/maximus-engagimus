/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the app.
 * Handles session management, user profile, and organization data.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, getUserProfile } from '../lib/supabase';
import { getCached, setCached, clearCache } from '../lib/cache';

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

  // Ensure user has an organization AND correct role
  const ensureOrganization = async (currentProfile, sessionUser) => {
    if (!currentProfile) return null;

    // If user already has organization but role is not 'owner', fix it
    if (currentProfile?.organization) {
      if (currentProfile.role !== 'owner') {
        console.warn('User has organization but role is not owner, fixing...');
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'owner' })
          .eq('id', currentProfile.id);
        
        if (!updateError) {
          currentProfile.role = 'owner';
        }
      }
      return currentProfile;
    }

    // User doesn't have organization yet, create one
    try {
      const orgName = `${currentProfile.full_name || sessionUser?.email || 'User'}'s Organization`;
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

      // Update user with organization_id and set as owner
      const { error: updateError } = await supabase
        .from('users')
        .update({ organization_id: org.id, role: 'owner' })
        .eq('id', currentProfile.id);

      if (updateError) throw updateError;

      // Wait a bit for replication
      await new Promise(r => setTimeout(r, 300));

      // Update profile object with complete organization data
      currentProfile.organization_id = org.id;
      currentProfile.organization = org;
      currentProfile.role = 'owner';
      return currentProfile;
    } catch (err) {
      console.error('Error ensuring organization:', err);
      return currentProfile;
    }
  };

  // Track last session check time to avoid over-checking
  const lastSessionCheckRef = useCallback(() => {
    const key = 'lastSessionCheck';
    const now = Date.now();
    const last = parseInt(localStorage.getItem(key) || '0', 10);
    
    // Only check if 1 hour has passed
    if (now - last > 3600000) {
      localStorage.setItem(key, now.toString());
      return true;
    }
    return false;
  }, []);

  /**
   * Sign in with email and password
   */
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Clear old cached profiles with 'member' role (from before fix)
        const cached = getCached('userProfile');
        if (cached && cached.role === 'member' && cached.organization) {
          console.warn('Clearing invalid cached profile with member role');
          clearCache('userProfile');
        }

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
                await new Promise((r) => setTimeout(r, 100));
                continue;
              }
              throw err;
            }
          }
          return { session: null, error: null };
        };

        // Add a timeout (2 seconds) as fallback - fast fail for login page speed
        const timeoutPromise = new Promise((_, rej) => 
          setTimeout(() => rej(new Error('auth-init-timeout')), 2000)
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
              // Try cache first, then fetch fresh in background
              const cached = getCached('userProfile');
              if (cached) {
                // Show cached profile immediately
                setUser(session.user);
                setProfile(cached);
                setOrganization(cached?.organization || null);
              }

              // Fetch fresh profile with timeout
              let profileData = await Promise.race([
                getUserProfile(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
                ),
              ]);
              
              // Ensure organization is set up
              profileData = await ensureOrganization(profileData, session.user);
              
              if (mounted && profileData) {
                // Cache for 10 minutes
                setCached('userProfile', profileData, 10 * 60 * 1000);
                setUser(session.user);
                setProfile(profileData);
                setOrganization(profileData?.organization || null);
              }
            } catch (profileErr) {
              if (profileErr?.code === 'PGRST116' || profileErr?.message?.includes('No rows')) {
                // Insert user profile
                const { error: insertError } = await supabase
                  .from('users')
                  .insert({
                    id: session.user.id,
                    organization_id: null,
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || '',
                    role: 'owner',
                  });
                if (insertError) throw insertError;

                // Wait a bit for the insert to replicate
                await new Promise(r => setTimeout(r, 500));

                // Fetch profile
                let profileData = null;
                try {
                  profileData = await Promise.race([
                    getUserProfile(),
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
                    ),
                  ]);
                } catch (fetchErr) {
                  // If fetch still fails, use the data we inserted
                  profileData = {
                    id: session.user.id,
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || '',
                    role: 'owner',
                    organization_id: null,
                    organization: null,
                  };
                }

                // Ensure organization is set up
                profileData = await ensureOrganization(profileData, session.user);

                if (mounted && profileData) {
                  // Cache for 10 minutes
                  setCached('userProfile', profileData, 10 * 60 * 1000);
                  setUser(session.user);
                  setProfile(profileData);
                  setOrganization(profileData?.organization || null);
                }
              } else {
                console.error('Error fetching profile:', profileErr);
                if (mounted) {
                  // Fall back to cached profile if fetch fails
                  const cached = getCached('userProfile');
                  if (!cached) {
                    // No cache available, set user without profile
                    setUser(session.user);
                  } else {
                    setUser(session.user);
                    setProfile(cached);
                    setOrganization(cached?.organization || null);
                  }
                }
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

    // Listen for auth changes, but be smart about session validation
    // Only fetch profile on explicit auth events (SIGNED_IN, TOKEN_REFRESHED)
    // Don't re-fetch on visibility changes to avoid unnecessary server calls
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (session?.user) {
            // Only fetch profile on explicit sign-in (fresh login)
            // Skip TOKEN_REFRESHED and visibility changes - just use cached profile
            if (event === 'SIGNED_IN') {
              try {
                const profileData = await Promise.race([
                  getUserProfile(),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
                  ),
                ]);
                
                if (mounted) {
                  setUser(session.user);
                  if (profileData) {
                    setCached('userProfile', profileData, 10 * 60 * 1000);
                    setProfile(profileData);
                    setOrganization(profileData?.organization || null);
                  }
                }
              } catch (profileErr) {
                console.error('Error fetching profile on sign in:', profileErr);
                if (mounted) {
                  setUser(session.user);
                  // Keep existing profile on failure
                }
              }
            } else {
              // For all other events (INITIAL_SESSION, TOKEN_REFRESHED, visibility changes, etc)
              // Just restore from cache without fetching
              const cached = getCached('userProfile');
              if (cached) {
                setUser(session.user);
                setProfile(cached);
                setOrganization(cached?.organization || null);
              } else {
                setUser(session.user);
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
      
      // Clear cached profile
      clearCache('userProfile');
      
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
          setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
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
