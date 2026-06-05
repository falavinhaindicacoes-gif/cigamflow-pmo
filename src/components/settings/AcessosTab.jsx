import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ALL_PAGES } from '@/lib/access-config';
import { Plus, Pencil, Trash2, Shield, Users, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AcessosTab() {
  return (
    <Tabs defaultValue="perfis">
      <TabsList className="bg-muted/50 p-1 h-auto mb-4">
        <TabsTrigger value="perfis" className="text-xs">Perfis de Acesso</TabsTrigger>
        <TabsTrigger value="usuarios" className="text-xs">Permissões por Usuário</TabsTrigger>
      </TabsList>
      <TabsContent value="perfis"><PerfisSection /></TabsContent>
      <TabsContent value="usuarios"><UsuariosPermissaoSection /></TabsContent>
    </Tabs>
  );
}

// ─── PERFIS ────────────────────────────────────────────────────────────────────

function PerfisSection() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['accessProfiles'],
    queryFn: () => base44.entities.AccessProfile.list('name', 100),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.AccessProfile.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accessProfiles'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AccessProfile.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accessProfiles'] }); setShowForm(false); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AccessProfile.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accessProfiles'] }),
  });

  const openEdit = (p) => { setEditing(p); setShowForm(true); };
  const openNew = () => { setEditing(null); setShowForm(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{profiles.length} perfil(is) cadastrado(s)</p>
        <Button size="sm" onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Perfil
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {profiles.map(p => (
          <div key={p.id} className="bg-card border rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  {p.descricao && <p className="text-xs text-muted-foreground">{p.descricao}</p>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(p)} className="p-1.5 hover:text-primary rounded text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm(`Excluir o perfil "${p.name}"?`)) deleteMutation.mutate(p.id); }} className="p-1.5 hover:text-destructive rounded text-muted-foreground"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {(p.paginas || []).length === 0
                ? <span className="text-xs text-muted-foreground italic">Sem acesso</span>
                : (p.paginas || []).map(slug => {
                    const pg = ALL_PAGES.find(x => x.slug === slug);
                    return pg ? (
                      <span key={slug} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">{pg.label}</span>
                    ) : null;
                  })
              }
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Perfil' : 'Novo Perfil de Acesso'}</DialogTitle>
          </DialogHeader>
          <ProfileForm
            initial={editing}
            onSubmit={(data) => {
              if (editing) updateMutation.mutate({ id: editing.id, data });
              else createMutation.mutate(data);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileForm({ initial, onSubmit, isLoading, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [descricao, setDescricao] = useState(initial?.descricao || '');
  const [paginas, setPaginas] = useState(initial?.paginas || []);

  const toggle = (slug) => {
    setPaginas(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };
  const selectAll = () => setPaginas(ALL_PAGES.map(p => p.slug));
  const clearAll = () => setPaginas([]);

  return (
    <div className="space-y-4">
      <div><Label>Nome do Perfil *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Gerente de Projeto" /></div>
      <div><Label>Descrição</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição opcional..." /></div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Páginas Permitidas</Label>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-primary hover:underline">Marcar tudo</button>
            <span className="text-xs text-muted-foreground">·</span>
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:underline">Limpar</button>
          </div>
        </div>
        <div className="border rounded-lg divide-y">
          {ALL_PAGES.map(pg => (
            <label key={pg.slug} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30">
              <Checkbox
                checked={paginas.includes(pg.slug)}
                onCheckedChange={() => toggle(pg.slug)}
              />
              <span className="text-sm">{pg.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => { if (name.trim()) onSubmit({ name: name.trim(), descricao, paginas, ativo: true }); }} disabled={!name.trim() || isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}

// ─── USUÁRIOS ──────────────────────────────────────────────────────────────────

function UsuariosPermissaoSection() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [showOverride, setShowOverride] = useState(false);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['accessProfiles'],
    queryFn: () => base44.entities.AccessProfile.list('name', 100),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }) => base44.auth.updateMe ? base44.entities.User.update(id, data) : base44.entities.User.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setShowOverride(false); setSelected(null); },
  });

  const nonAdmins = users.filter(u => u.role !== 'admin');

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Configure o perfil de acesso ou as permissões individuais de cada usuário.</p>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Usuário</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Perfil Atribuído</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Override</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loadingUsers ? (
              <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : nonAdmins.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Nenhum usuário não-admin cadastrado</td></tr>
            ) : nonAdmins.map(u => {
              const profile = profiles.find(p => p.id === u.access_profile_id);
              const hasOverride = u.paginas_override && u.paginas_override.length > 0;
              return (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="py-3 px-4">
                    <p className="font-medium">{u.full_name || '-'}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    {profile
                      ? <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">{profile.name}</span>
                      : <span className="text-xs text-muted-foreground italic">Sem perfil</span>
                    }
                  </td>
                  <td className="py-3 px-4">
                    {hasOverride
                      ? <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">{u.paginas_override.length} página(s)</span>
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button size="sm" variant="outline" onClick={() => { setSelected(u); setShowOverride(true); }}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={showOverride} onOpenChange={(o) => { if (!o) { setShowOverride(false); setSelected(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Permissões — {selected?.full_name || selected?.email}</DialogTitle>
          </DialogHeader>
          {selected && (
            <UserPermissionForm
              user={selected}
              profiles={profiles}
              onSubmit={(data) => updateUser.mutate({ id: selected.id, data })}
              isLoading={updateUser.isPending}
              onCancel={() => { setShowOverride(false); setSelected(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserPermissionForm({ user, profiles, onSubmit, isLoading, onCancel }) {
  const [profileId, setProfileId] = useState(user.access_profile_id || '');
  const [useOverride, setUseOverride] = useState(user.paginas_override && user.paginas_override.length > 0);
  const [paginas, setPaginas] = useState(user.paginas_override || []);

  const toggle = (slug) => {
    setPaginas(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  const handleSubmit = () => {
    onSubmit({
      access_profile_id: profileId || null,
      paginas_override: useOverride ? paginas : [],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Perfil de Acesso Base</Label>
        <Select value={profileId} onValueChange={setProfileId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um perfil..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Nenhum perfil</SelectItem>
            {profiles.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">O perfil define o acesso padrão. O override substitui o perfil se habilitado.</p>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox checked={useOverride} onCheckedChange={setUseOverride} />
          <span className="text-sm font-medium">Usar permissões individuais (override)</span>
        </label>

        {useOverride && (
          <div className="border rounded-lg divide-y ml-2">
            {ALL_PAGES.map(pg => (
              <label key={pg.slug} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30">
                <Checkbox checked={paginas.includes(pg.slug)} onCheckedChange={() => toggle(pg.slug)} />
                <span className="text-sm">{pg.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}