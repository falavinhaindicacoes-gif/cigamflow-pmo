import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAccess } from '@/lib/AccessContext';
import { useAuth } from '@/lib/AuthContext';
import { getPageByPath } from '@/lib/access-config';
import { ShieldOff } from 'lucide-react';

export default function AccessGuard({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const { canAccess } = useAccess();

  const page = getPageByPath(location.pathname);

  // Se a página não está mapeada (ex: /seed, /projects/:id), libera
  if (!page) return children;

  if (!canAccess(page.slug)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
        <ShieldOff className="w-12 h-12 opacity-30" />
        <div className="text-center">
          <p className="font-semibold text-foreground">Acesso não permitido</p>
          <p className="text-sm mt-1">Você não tem permissão para acessar esta área.</p>
          <p className="text-xs mt-1">Entre em contato com o administrador.</p>
        </div>
      </div>
    );
  }

  return children;
}