/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { insforge } from '../lib/insforge';

const AuthContext = createContext();

const normalizeRole = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'farmer' || normalized === 'former') return 'farmer';
  return 'customer';
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  // Store the raw auth user (id, email) so updateProfile always has access to it
  const sessionUserRef = useRef(null);

  const mapProfileToUser = (profile, authUser) => ({
    id: authUser?.id,
    name: profile?.full_name || authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'User',
    email: profile?.email || authUser?.email || '',
    role: normalizeRole(profile?.role || authUser?.user_metadata?.role),
    phone: profile?.phone || '',
    location: profile?.district || '',
    avatarUrl: profile?.avatar_url || '',
    bio: profile?.bio || '',
  });

  const upsertProfile = async (authUser, profileData = {}) => {
    if (!authUser?.id) return null;

    const payload = {
      id: authUser.id,
      full_name: profileData.name || profileData.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
      email: profileData.email || authUser.email || '',
      phone: profileData.phone || '',
      role: normalizeRole(profileData.role || authUser.user_metadata?.role),
      district: profileData.location || profileData.district || '',
      avatar_url: profileData.avatarUrl || profileData.avatar_url || '',
      bio: profileData.bio || '',
      updated_at: new Date().toISOString(),
    };

    const { error } = await insforge.database.from('profiles').upsert([payload]);
    if (error) throw error;
    return payload;
  };

  const getProfileForUser = async (authUser) => {
    if (!authUser?.id) return null;
    const { data, error } = await insforge.database
      .from('profiles')
      .select('*')
      .eq('id', authUser.id);

    if (error) return null;
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  };

  const hydrateUser = async (authUser) => {
    if (!authUser?.id) {
      sessionUserRef.current = null;
      setUser(null);
      return;
    }

    // Keep a ref to the raw auth user for later profile saves
    sessionUserRef.current = authUser;

    let profile = await getProfileForUser(authUser);
    if (!profile) {
      profile = await upsertProfile(authUser, {
        role: normalizeRole(authUser.user_metadata?.role),
      });
    }

    setUser(mapProfileToUser(profile, authUser));
  };

  /* ── Auth actions ── */

  const login = async (email, password) => {
    setLoading(true);
    setAuthError('');
    const { data, error } = await insforge.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      if (error.message?.includes('Email not verified') || error.message?.includes('email not confirmed')) {
        throw new Error('Please verify your email before signing in. Check your inbox for a verification code.');
      }
      throw error;
    }

    await hydrateUser(data?.user || null);
    setLoading(false);
  };

  const signup = async (formData) => {
    setLoading(true);
    setAuthError('');
    const { data: signupData, error } = await insforge.auth.signUp({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      setLoading(false);
      throw error;
    }

    if (signupData?.requireEmailVerification) {
      setLoading(false);
      throw new Error('Please check your email for a verification code to complete signup.');
    }

    let authUser = signupData?.user || null;
    if (!authUser) {
      const currentUser = await insforge.auth.getCurrentUser();
      if (currentUser.error) {
        setLoading(false);
        throw currentUser.error;
      }
      authUser = currentUser.data?.user || null;
    }

    if (authUser) {
      await upsertProfile(authUser, formData);
    }
    await hydrateUser(authUser);
    setLoading(false);
  };

  const requestPasswordReset = async (email) => {
    setAuthError('');
    const { data, error } = await insforge.auth.sendResetPasswordEmail({
      email,
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) throw error;
    return data;
  };

  const resendVerificationEmail = async (email) => {
    setAuthError('');
    const { data, error } = await insforge.auth.resendVerificationEmail({
      email,
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) throw error;
    return data;
  };

  const verifyEmail = async (email, otp, preferredRole) => {
    setLoading(true);
    setAuthError('');
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });
    if (error) {
      setLoading(false);
      throw error;
    }

    const verifiedUser = data?.user || null;
    if (verifiedUser?.id && preferredRole) {
      const existingProfile = await getProfileForUser(verifiedUser);
      await upsertProfile(verifiedUser, {
        ...(existingProfile || {}),
        email: existingProfile?.email || verifiedUser.email || email,
        role: normalizeRole(preferredRole),
      });
    }
    await hydrateUser(verifiedUser);
    setLoading(false);
    return data;
  };

  /**
   * updateProfile — saves profile changes to DB and updates local state.
   * Uses sessionUserRef so it always has the auth user available, even if
   * the session object is stale.
   */
  const updateProfile = async (updates) => {
    const authUser = sessionUserRef.current;
    if (!authUser?.id) return;

    // Merge current user state with the incoming updates for a full upsert
    const merged = {
      name:     updates.name     ?? user?.name     ?? '',
      email:    updates.email    ?? user?.email    ?? authUser.email ?? '',
      phone:    updates.phone    ?? user?.phone    ?? '',
      location: updates.location ?? user?.location ?? '',
      avatarUrl:updates.avatarUrl?? user?.avatarUrl?? '',
      bio:      updates.bio      ?? user?.bio      ?? '',
      role:     updates.role     ?? user?.role     ?? 'customer',
    };

    await upsertProfile(authUser, merged);
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const logout = async () => {
    sessionUserRef.current = null;
    setUser(null);
    // signOut invalidates the token server-side; the SDK may try one
    // more refresh before realising the session is gone — that 401 is expected.
    try { await insforge.auth.signOut(); } catch (_) { /* intentionally silent */ }
  };

  /* ── Bootstrap: restore session on page load / refresh ── */
  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await insforge.auth.getCurrentUser();

        // A 401 simply means no valid session — treat as logged-out, not an error
        if (error) {
          const is401 =
            error?.status === 401 ||
            String(error?.message || '').includes('401') ||
            String(error?.message || '').toLowerCase().includes('unauthorized') ||
            String(error?.message || '').toLowerCase().includes('no session');

          if (is401) {
            if (active) { setUser(null); setLoading(false); }
            return;
          }
          throw error;
        }

        if (!active) return;
        await hydrateUser(data?.user || null);
      } catch (err) {
        if (active) {
          setAuthError(err?.message || 'Failed to load session.');
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    bootstrap();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    loading,
    authError,
    login,
    signup,
    logout,
    updateProfile,
    requestPasswordReset,
    resendVerificationEmail,
    verifyEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
