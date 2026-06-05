import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const AccessContext = createContext(null);

export function AccessProvider({ children }) {
  const { user } = useAuth();

  const { data: profiles = [] } = useQuery({
    queryKey: ['accessProfiles'],
    queryFn: () => base44.entities.AccessProfile.list('name', 100),
    staleTime: 60_000,
    enabled: !!user,
  });

  const allowedPages = useMemo(() => {
    if (!user) return [];
    // Admin sempre tem acesso a tudo
    if (user.role === 'admin') return null; // null = tudo liberado

    // Override individual tem prioridade
    if (user.paginas_override && user.paginas_override.length > 0) {
      return user.paginas_override;
    }

    // Perfil de acesso
    if (user.access_profile_id) {
      const profile = profiles.find(p => p.id === user.access_profile_id);
      if (profile) return profile.paginas || [];
    }

    // Sem perfil nem override: acesso negado a tudo
    return [];
  }, [user, profiles]);

  const canAccess = (slug) => {
    if (allowedPages === null) return true; // admin
    return allowedPages.includes(slug);
  };

  return (
    <AccessContext.Provider value={{ allowedPages, canAccess, profiles }}>
      {children}
    </AccessContext.Provider>
  );
}

export const useAccess = () => {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error('useAccess must be used within AccessProvider');
  return ctx;
};