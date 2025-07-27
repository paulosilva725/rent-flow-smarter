import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  cpf?: string;
  phone?: string;
  status?: string;
}

interface SystemOwnerSession {
  email: string;
  name: string;
  role: 'system_owner';
  login_time: string;
}

interface TenantSession {
  cpf: string;
  profile: UserProfile;
  role: 'tenant';
}

export const useAuthState = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for system owner session
    const systemOwnerSession = localStorage.getItem('system_owner_session');
    if (systemOwnerSession) {
      try {
        const parsed: SystemOwnerSession = JSON.parse(systemOwnerSession);
        setUser({
          id: 'system_owner',
          name: parsed.name,
          email: parsed.email,
          role: parsed.role
        });
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('system_owner_session');
      }
    }

    // Check for tenant session
    const tenantSession = localStorage.getItem('tenant_profile');
    if (tenantSession) {
      try {
        const parsed: UserProfile = JSON.parse(tenantSession);
        setUser(parsed);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('tenant_profile');
        localStorage.removeItem('tenant_cpf');
        localStorage.removeItem('userType');
      }
    }

    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error) throw error;
      
      setUser(profile);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear all session types
      localStorage.removeItem('system_owner_session');
      localStorage.removeItem('tenant_profile');
      localStorage.removeItem('tenant_cpf');
      localStorage.removeItem('userType');
      
      // Sign out from Supabase if needed
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    user,
    session,
    loading,
    error,
    logout,
    isAdmin: user?.role === 'admin',
    isTenant: user?.role === 'tenant',
    isSystemOwner: user?.role === 'system_owner'
  };
};