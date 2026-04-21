import React from 'react';
import { Settings as SettingsIcon, Building2, Users, Shield } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

export default function Settings() {
  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Configurações" description="Configurações do sistema" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">Empresas</h3>
          <p className="text-xs text-muted-foreground mt-1">Gerenciar empresas do sistema</p>
        </div>
        <div className="bg-card border rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">Usuários</h3>
          <p className="text-xs text-muted-foreground mt-1">Gerenciar perfis e permissões</p>
        </div>
        <div className="bg-card border rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">Permissões</h3>
          <p className="text-xs text-muted-foreground mt-1">Configurar regras de acesso</p>
        </div>
      </div>
    </div>
  );
}