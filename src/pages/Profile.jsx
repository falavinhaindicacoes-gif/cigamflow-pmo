import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Mail, Shield, Save, LogOut } from 'lucide-react';

export default function Profile() {
  const { user, logout, checkUserAuth, isLoadingAuth } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabel = {
    admin: 'Administrador',
    user: 'Usuário',
  }[user?.role] || user?.role || '—';

  const handleSave = async (e) => {
    e.preventDefault();
    const form = e.target;
    const full_name = form.full_name.value.trim();
    if (!full_name) return;
    setSaving(true);
    await base44.auth.updateMe({ full_name });
    await checkUserAuth();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie suas informações pessoais</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" /> Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" name="full_name" defaultValue={user?.full_name || ''} required />
            </div>

            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/40 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>{user?.email || '—'}</span>
              </div>
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Perfil de acesso</Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/40 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>{roleLabel}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <LogOut className="w-4 h-4" /> Sair da plataforma
          </CardTitle>
          <CardDescription>Encerra sua sessão no ERP Manager.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={logout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}